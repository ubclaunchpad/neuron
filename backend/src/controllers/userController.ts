import UserModel from "../models/userModel";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Request, Response } from "express";
import {
    deleteVolunteer,
    getVolunteerByUserId,
    insertVolunteer,
    updateVolunteer,
} from "../controllers/volunteerController";

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

async function getUserById(user_id: string): Promise<any> {
    return new Promise((resolve, reject) => {
        userModel
            .getUserById(user_id)
            .then((user: any) => {
                resolve(user);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}

async function getUserByEmail(email: string): Promise<any> {
    return new Promise((resolve, reject) => {
        userModel
            .getUserByEmail(email)
            .then((user: any) => {
                resolve(user);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}

async function insertUser(user: any): Promise<any> {
    return new Promise((resolve, reject) => {
        userModel
            .insertUser(user)
            .then((results: any) => {
                resolve(results);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}

async function updateUser(user_id: string, userData: any): Promise<any> {
    return new Promise((resolve, reject) => {
        userModel
            .updateUser(user_id, userData)
            .then((results: any) => {
                resolve(results);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}

async function deleteUser(user_id: string): Promise<any> {
    return new Promise((resolve, reject) => {
        userModel
            .deleteUser(user_id)
            .then((results: any) => {
                resolve(results);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}

async function registerUser(req: Request, res: Response): Promise<any> {
    // Get the user details from the request body
    let { firstName, lastName, email, password, role } = req.body;

    // Validate the user details
    if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({
            error: "Please fill in all the required fields",
        });
    }

    if (!TOKEN_SECRET) {
        return res.status(500).json({
            error: "Server configuration error: TOKEN_SECRET is not defined",
        });
    }

    // Trim the user details
    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim();
    role = role.trim();

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log(hashedPassword);

    // User Id
    const user_id = uuidv4();

    // Token Secret
    const secret = TOKEN_SECRET;
    const payload = {
        user_id: user_id,
    };

    // Create User
    try {
        await insertUser({
            user_id: user_id,
            email: email,
            password: hashedPassword,
            role: role.toUpperCase(),
        });

        if (role == "volun") {
            try {
                await insertVolunteer({
                    volunteer_id: uuidv4(),
                    fk_user_id: user_id,
                    f_name: firstName,
                    l_name: lastName,
                    email: email,
                    active: 0,
                });

                // Create a token that expires in 24 hours
                const token = jwt.sign(payload, secret, {
                    expiresIn: "24h",
                });

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
                    async function (mailError, info) {
                        if (mailError) {
                            // Delete the volunteer before deleting the user because volunteer has a foreign key constraint
                            // Delete the volunteer if the mail is not sent successfully
                            try {
                                await deleteVolunteer(user_id);

                                // Delete the user if the mail is not sent successfully
                                try {
                                    await deleteUser(user_id);

                                    return res.status(500).json({
                                        error: `Mail not sent: ${mailError}`,
                                    });
                                } catch (error: any) {
                                    res.status(error.status).json({
                                        error: error.message,
                                    });
                                }
                            } catch (error: any) {
                                res.status(error.status).json({
                                    error: error.message,
                                });
                            }
                        } else {
                            // If the mail is sent successfully, return a success message
                            return res.status(200).json({
                                message: "User created successfully",
                            });
                        }
                    }
                );
            } catch (error: any) {
                // Delete the user if the volunteer is not created successfully
                try {
                    await deleteUser(user_id);
                    res.status(error.status).json({
                        error: error.message,
                    });
                } catch (error: any) {
                    res.status(error.status).json({
                        error: error.message,
                    });
                }
            }
        }
    } catch (error: any) {
        res.status(error.status).json({
            error: error.message,
        });
    }
}

async function loginUser(req: Request, res: Response): Promise<any> {
    // Get the user details from the request body
    let { email, password } = req.body;

    // Validate the user details
    if (!email || !password) {
        return res.json({
            status: false,
            error: "Please fill in all fields",
        });
    }

    // Trim the user details
    email = email.trim();

    // Get the user from the database
    try {
        const user = await getUserByEmail(email);

        // console.log(user.password);

        // If the password is incorrect, return an error
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({
                error: "Incorrect password",
            });
        }

        // If the TOKEN_SECRET is not defined, return an error
        if (!TOKEN_SECRET) {
            return res.status(500).json({
                error: "Server configuration error: TOKEN_SECRET is not defined",
            });
        }

        const secret = TOKEN_SECRET + user.password;
        const payload = {
            user_id: user.user_id,
        };

        // Create a token that expires in 24 hours
        const token = jwt.sign(payload, secret, { expiresIn: "24h" });

        return res.status(200).json({
            token: token,
        });
    } catch (error: any) {
        res.status(error.status).json({
            error: error.message,
        });
    }
}

async function verifyUser(req: Request, res: Response): Promise<any> {
    // Get the token from the request parameters
    const volunteer_id = req.body.volunteer_id;

    // If the token is not provided, return an error
    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'",
        });
    }

    // Update the user's active status
    try {
        await updateVolunteer(volunteer_id, { active: 1 });

        return res.status(200).json({
            message: "User verified successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            error: error.message,
        });
    }
}

async function sendResetPasswordEmail(
    req: Request,
    res: Response
): Promise<any> {
    // Get the email from the request body
    let { email } = req.body;

    // If the email is not provided, return an error
    if (!email) {
        return res.status(400).json({
            error: "Missing required parameter: 'email",
        });
    }

    try {
        const user = await getUserByEmail(email);

        try {
            const volunteer = await getVolunteerByUserId(user.user_id);

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
                    return res.status(500).json({
                        error: `Mail not sent: ${mailError}`,
                    });
                }

                return res.status(200).json({
                    message: `Mail sent successfully`,
                });
            });
        } catch (error: any) {
            res.status(error.status).json({
                error: error.message,
            });
        }
    } catch (error: any) {
        res.status(error.status).json({
            error: error.message,
        });
    }
}

async function verifyUserWithIdAndToken(
    id: string,
    token: string
): Promise<any> {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await getUserById(id);

            if (!TOKEN_SECRET) {
                return reject({
                    status: 500,
                    message: "Server configuration error: TOKEN is not defined",
                });
            }

            // Verify if token is valid
            const secret = TOKEN_SECRET + user.password;

            try {
                jwt.verify(token, secret);

                if (!FRONTEND_HOST) {
                    return reject({
                        status: 500,
                        message:
                            "Server configuration error: FRONTEND_HOST is not defined",
                    });
                }

                return resolve("Verified");
            } catch (error: any) {
                return reject({
                    status: 500,
                    message: error,
                });
            }
        } catch (error: any) {
            return reject({
                status: error.status,
                message: error.message,
            });
        }
    });
}

async function verifyAndRedirect(req: Request, res: Response): Promise<any> {
    const { id, token } = req.params;

    if (!id) {
        return res.status(400).json({
            error: "Missing required parameter: 'id",
        });
    }

    if (!token) {
        return res.status(400).json({
            error: "Missing required parameter: 'token",
        });
    }

    try {
        await verifyUserWithIdAndToken(id, token);

        return res.redirect(`${FRONTEND_HOST}/forgot-password/${id}/${token}`);
    } catch (error: any) {
        return res.status(error.status).json({
            error: error.message,
        });
    }
}

async function resetPassword(req: Request, res: Response): Promise<any> {
    // Get the id, token, and password from the request
    const { id, token } = req.params;
    const { password } = req.body;

    try {
        // Verify if the id and token are valid
        await verifyUserWithIdAndToken(id, token);

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            await updateUser(id, {
                password: hashedPassword,
            });

            return res.status(200).json({
                message: "Password updated successfully",
            });
        } catch (error: any) {
            return res.status(error.status).json({
                error: error.message,
            });
        }
    } catch (error: any) {
        return res.status(error.status).json({
            error: error.message,
        });
    }
}

export {
    registerUser,
    loginUser,
    verifyUser,
    sendResetPasswordEmail,
    verifyAndRedirect,
    resetPassword,
};
