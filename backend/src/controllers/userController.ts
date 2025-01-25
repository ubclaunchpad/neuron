import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { UserDB, VolunteerDB } from "../common/generated.js";
import { AuthenticatedUserRequest } from "../common/types.js";
import connectionPool from "../config/database.js";
import UserModel from "../models/userModel.js";
import VolunteerModel from "../models/volunteerModel.js";

// Load environment variables
dotenv.config();

// Define environment variables
const HOST = process.env.HOST;
const TOKEN_SECRET = process.env.TOKEN_SECRET;
const FRONTEND_HOST = process.env.FRONTEND_HOST;

//Mail Config
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PASSWORD,
    },
});

const userModel = new UserModel();
const volunteerModel = new VolunteerModel();

async function getUserById(req: Request, res: Response) {
    const { user_id } = req.params;

    const user = await userModel.getUserById(user_id);
    res.status(200).json(user);
}

async function insertProfilePicture(req: Request, res: Response) {
    const { user_id } = req.params;
    const image = req.file!.buffer;

    const imageId = await userModel.upsertUserProfileImage(user_id, image);
    return res.status(201).json(imageId);
}

async function sendVolunteerData(
    req: AuthenticatedUserRequest,
    res: Response
): Promise<any> {
    const user = req.user;
    
    const volunteer = await volunteerModel.getVolunteerByUserId(user!.user_id);

    // remove password from user
    delete (user as any).password;

    return res.status(200).json({
        user: user,
        volunteer: volunteer,
    });
}

async function registerUser(req: Request, res: Response): Promise<any> {
    // Get the user details from the request body
    let { firstName, lastName, email, password, role } = req.body;

    // Trim the user details
    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim();
    role = role.trim();

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // User Id
    const user_id = uuidv4();

    const transaction = await connectionPool.getConnection();
    try {
        // Create User
        await userModel.insertUser({
            user_id: user_id,
            email: email,
            password: hashedPassword,
            role: role.toUpperCase(),
        } as UserDB, transaction);

        if (role == "volun") {
            await volunteerModel.insertVolunteer({
                volunteer_id: uuidv4(),
                fk_user_id: user_id,
                f_name: firstName,
                l_name: lastName,
                email: email,
                active: false,
            } as VolunteerDB, transaction);
    
            // Send a confirmation email
            const mailOptions = {
                from: '"Team Neuron" <neuronbc@gmail.com>',
                to: email,
                subject: "Neuron - Account Created",
                html: `Hello ${firstName} ${lastName},<br><br>
                        Your Neuron account has been created successfully.<br>
                        Please wait for the team to verify your account. This usually takes around 3-4 hours.<br><br>
                        Thank you!<br>
                        Best,<br>
                        Team Neuron`,
            };
    
            // Send the mail
            transporter.sendMail(
                mailOptions,
                function (mailError) {
                    throw mailError;
                }
            );
        }

        transaction.commit();

        return res.status(200).json({
            message: "User created successfully",
        });
    } catch (error) {
        // Rollback
        await transaction.rollback();
        throw error;
    }
}

async function loginUser(req: Request, res: Response): Promise<any> {
    // Get the user details from the request body
    let { email, password } = req.body;

    // Trim the user details
    email = email.trim();
    password = password.trim();

    // Get the user from the database
    const user = await userModel.getUserByEmail(email);

    // If the password is incorrect, return an error
    if (!(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({
            error: "Incorrect password",
        });
    }

    // If the volunteer is not verified, return an error
    if (user.role === 'volun') {
        const volunteer = await volunteerModel.getVolunteerByUserId(user.user_id);
        if (!volunteer.active) {
            return res.status(400).json({
                error: "Your account is not verified yet",
            });
        }
    }

    // If the TOKEN_SECRET is not defined, return an error
    if (!TOKEN_SECRET) {
        return res.status(500).json({
            error: "Server configuration error: TOKEN_SECRET is not defined",
        });
    }

    const secret = TOKEN_SECRET;
    const payload = {
        user_id: user.user_id,
    };

    // Create a token that expires in 24 hours
    const token = jwt.sign(payload, secret, { expiresIn: "24h" });

    return res.status(200).json({
        token: token,
    });
}

async function sendResetPasswordEmail(
    req: Request,
    res: Response
): Promise<any> {
    // Get the email from the request body
    let { email } = req.body;

    const user = await userModel.getUserByEmail(email);
    const volunteer = await volunteerModel.getVolunteerByUserId(user.user_id);

    if (!TOKEN_SECRET) {
        return res.status(500).json({
            error: "Server configuration error: TOKEN_SECRET is not defined",
        });
    }

    // Generate a secret for the token
    const secret = TOKEN_SECRET + user.password;
    const payload = {
        user_id: user.user_id,
    };

    // Create a token that expires in 24 hours
    const token = jwt.sign(payload, secret, { expiresIn: "2h" });

    if (!HOST) {
        return res.status(500).json({
            error: "Server configuration error: HOST is not defined",
        });
    }

    const forgotPasswordLink = `${HOST}/auth/forgot-password/${user.user_id}/${token}`;

    const mailOptions = {
        from: '"Team Neuron" <neuronbc@gmail.com>',
        to: email,
        subject: "Neuron - Reset Password",
        html: `Hello ${volunteer.f_name} ${volunteer.l_name},<br><br>
            Please use the following link to reset your account's password:<br>
            <a href="${forgotPasswordLink}">${forgotPasswordLink}</a><br><br>
            Please note that this link will expire in 2 hours.<br><br>
            Thank you!<br>
            Best,<br>
            Team Neuron`,
    };

    // Send the mail
    transporter.sendMail(mailOptions, async function (mailError, info) {
        if (mailError) {
            throw mailError;
        }

        return res.status(200).json({
            message: `Mail sent successfully`,
        });
    });
}

async function verifyUserWithIdAndToken(
    id: string,
    token: string
): Promise<any> {
    const user = await userModel.getUserById(id);

    if (!TOKEN_SECRET || !FRONTEND_HOST) {
        throw {
            status: 500        
        };
    }

    // Verify if token is valid
    const secret = TOKEN_SECRET + user.password;

    jwt.verify(token, secret);

    return "Verified";
}

async function verifyAndRedirect(req: Request, res: Response): Promise<any> {
    const { id, token } = req.params;

    await verifyUserWithIdAndToken(id, token);

    return res.redirect(
        `${FRONTEND_HOST}/auth/reset-password?id=${id}&token=${token}`
    );
}

async function resetPassword(req: Request, res: Response): Promise<any> {
    // Get the id, token, and password from the request body
    const { password, id, token } = req.body;

    // Verify if the id and token are valid
    await verifyUserWithIdAndToken(id, token);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.updateUser(id, {
        password: hashedPassword,
    } as UserDB);

    return res.status(200).json({
        message: "Password updated successfully",
    });
}

async function updatePassword(
    req: AuthenticatedUserRequest,
    res: Response
): Promise<any> {
    // Get the user and password from the request
    const { password } = req.body;

    // User coming from the isAuthorized middleware
    const user = req.user;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.updateUser(user!.user_id, {
        password: hashedPassword,
    } as UserDB);

    return res.status(200).json({
        message: "Password updated successfully",
    });
}

export {
    getUserById, insertProfilePicture, loginUser, registerUser, resetPassword, sendResetPasswordEmail, sendVolunteerData, updatePassword, verifyAndRedirect
};

