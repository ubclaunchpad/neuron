import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { UserDB, VolunteerDB } from "../common/databaseModels.js";
import { Role } from "../common/interfaces.js";
import { AuthenticatedRequest } from "../common/types.js";
import connectionPool from "../config/database.js";
import { FRONTEND_HOST, GMAIL_ID, GMAIL_PASSWORD, HOST, TOKEN_SECRET } from "../config/environment.js";
import { userModel, volunteerModel } from "../config/models.js";
import { newVolunteerToBeVerifiedByAdmins, volunteerAccountCreated } from "../utils/emailUtil.js";

//Mail Config
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: GMAIL_ID,
        pass: GMAIL_PASSWORD,
    },
});

async function checkAuthorization(
    req: AuthenticatedRequest,
    res: Response
): Promise<any> {
    const user = req.user;
    
    // If the volunteer is not verified, return an error
    let volunteer;
    if (user && user.role === Role.volunteer) {
        volunteer = await volunteerModel.getVolunteerByUserId(user.user_id);
        
        if (volunteer.status !== 'active') {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
    }

    return res.status(200).json({
        user: {
            ...user,
            volunteer: volunteer,
        },
    });
}

async function registerUser(
    req: Request, 
    res: Response
): Promise<any> {
    // Get the user details from the request body
    let { firstName, lastName, email, password, role } = req.body;

    // Trim the user details
    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim();
    role = role.trim();

    // Hash Password with salt
    const digest = await bcrypt.hash(password, 10);

    // User Id
    const user_id = uuidv4();

    const transaction = await connectionPool.getConnection();
    try {
        await transaction.beginTransaction();

        // Create User
        await userModel.insertUser({
            user_id: user_id,
            f_name: firstName,
            l_name: lastName,
            email: email,
            password: digest,
            role: role,
        } as UserDB, transaction);

        switch (role) {
            case Role.volunteer:
                await volunteerModel.insertVolunteer({
                    volunteer_id: uuidv4(),
                    fk_user_id: user_id,
                    status: 'unverified',
                } as VolunteerDB, transaction);
        
                // Send a confirmation email to the user
                await volunteerAccountCreated(firstName, lastName, email);

                // Send a notification email to the admins
                await newVolunteerToBeVerifiedByAdmins(firstName, lastName);

                break;

            default: // Cant create admin/instructor currently
                return res.status(401).json({
                    error: "Unauthorized",
                });
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
    const user = await userModel.getUserByEmail(email, true);

    // If the password is incorrect, return an error
    if (!(await bcrypt.compare(password, user.password))) {
        return res.status(403).json({
            error: "Incorrect password",
        });
    }

    // If the volunteer is not verified, return an error
    if (user.role === Role.volunteer) {
        const volunteer = await volunteerModel.getVolunteerByUserId(user.user_id);

        if (volunteer.status !== 'active') {
            return res.status(403).json({
                error: "Waiting for an admin to verify your account.\nYou can reach out to us at bwp@gmail.com",
            });
        }
        // } else if (!volunteer.existing) {
        //     return res.status(403).json({
        //         error: "Your account has been deactivated.\nYou can reach out to us at bwp@gmail.com",
        //     });
        // }
    }

    // If the TOKEN_SECRET is not defined, return an error
    if (!TOKEN_SECRET) {
        return res.status(500);
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

    const user = await userModel.getUserByEmail(email, true);
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
        html: `Hello ${volunteer.p_name || volunteer.f_name} ${volunteer.l_name},<br><br>
            Please use the following link to reset your account's password:<br>
            <a href="${forgotPasswordLink}">${forgotPasswordLink}</a><br><br>
            Please note that this link will expire in 2 hours.<br><br>
            Thank you!<br>
            Best,<br>
            Team Neuron`,
    };

    // Send the mail
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
        message: `Mail sent successfully`,
    });
}

async function verifyUserWithIdAndToken(
    id: string,
    token: string
): Promise<any> {
    const users = await userModel.getUsersByIds(id, true);

    if (!TOKEN_SECRET || !FRONTEND_HOST || users.length === 0) {
        throw {
            status: 500
        };
    }

    // Verify if token is valid
    const secret = TOKEN_SECRET + users[0].password;

    // Throw if verify fails
    try {   
        jwt.verify(token, secret);
    } catch {
        throw {
            status: 401,
            message: "Unauthorized"
        }
    }

    return "Verified";
}

async function verifyAndRedirect(
    req: Request, 
    res: Response
): Promise<any> {
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

    await userModel.updateUserPassword(id, hashedPassword);

    return res.status(200).json({
        message: "Password updated successfully",
    });
}

async function updatePassword(
    req: AuthenticatedRequest,
    res: Response
): Promise<any> {
    // Get the current and new password from the request
    const { currentPassword, newPassword } = req.body;

    // User coming from the isAuthorized middleware, query auth info
    const user = req.user;
    const authInfo = await userModel.getUserByEmail(user.email, true);

    // If the password is incorrect, return an error
    if (!(await bcrypt.compare(currentPassword, authInfo.password))) {
        return res.status(403).json({
            error: "Incorrect password",
        });
    }

    // Hash the new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updateUserPassword(user.user_id, hashedPassword);

    return res.status(200).json({
        message: "Password updated successfully",
    });
}

export {
    checkAuthorization, loginUser, registerUser, resetPassword, sendResetPasswordEmail,
    updatePassword, verifyAndRedirect
};

