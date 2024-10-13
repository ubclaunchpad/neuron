import connectionPool from "../config/database.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import e, { Router, Request, Response } from "express";
import {
    deleteUser,
    getUserByEmail,
    insertUser,
} from "../controllers/userController";
import {
    deleteVolunteer,
    insertVolunteer,
} from "../controllers/volunteerController.js";

// Load environment variables
dotenv.config();

export const authRouter = Router();

// The host of the server
const HOST = process.env.HOST;

//Mail Config
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PASSWORD,
    },
});

authRouter.post(
    "/register",
    async (req: Request, res: Response): Promise<any> => {
        // Get the user details from the request body
        let { firstName, lastName, email, password, role } = req.body;

        // Validate the user details
        if (!firstName || !lastName || !email || !password || !role) {
            return res.status(400).json({
                error: "Please fill in all the required fields",
            });
        }

        if (!process.env.TOKEN_SECRET) {
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
        const secret = process.env.TOKEN_SECRET + hashedPassword;
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
                    });

                    // Create a token that expires in 24 hours
                    const token = jwt.sign(payload, secret, {
                        expiresIn: "24h",
                    });
                    const verificationLink = `${HOST}/auth/verify/${token}`;

                    // Send a verification email with a link that includes the token
                    const mailOptions = {
                        from: '"Team Neuron" <neuronbc@gmail.com>',
                        to: email,
                        subject: "Neuron - Account Created",
                        html: `Hello ${firstName} ${lastName},<br><br>
          Your Neuron account has been created successfully.<br>
          Please click the link below to verify your account:<br>
          <a href="${verificationLink}">${verificationLink}</a><br><br>
          Please note that this link will expire in 24 hours. If you fail to verify your account within this time, you will need to create a new account.<br><br>
          Thank you!<br>
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
                                            error: mailError,
                                        });
                                    } catch (error: any) {
                                        return res.status(500).json({
                                            error: error.message,
                                        });
                                    }
                                } catch (error: any) {
                                    return res.status(500).json({
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
                        return res.status(500).json({
                            error: error.message,
                        });
                    } catch (error: any) {
                        return res.status(500).json({
                            error: error.message,
                        });
                    }
                }
            }
        } catch (error: any) {
            return res.status(500).json({
                error: error.message,
            });
        }
    }
);

authRouter.post("/login", async (req: Request, res: Response): Promise<any> => {
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
        if (!process.env.TOKEN_SECRET) {
            return res.status(500).json({
                error: "Server configuration error: TOKEN_SECRET is not defined",
            });
        }

        const secret = process.env.TOKEN_SECRET + user.password;
        const payload = {
            user_id: user.user_id,
        };

        // Create a token that expires in 24 hours
        const token = jwt.sign(payload, secret, { expiresIn: "24h" });

        return res.status(200).json({
            token: token,
        });
    } catch (error: any) {
        if (error.message.includes("Incorrect email: User not found")) {
            return res.status(400).json({
                error: error.message,
            });
        } else if (error.message.includes("Error logging in")) {
            return res.status(500).json({
                error: error.message,
            });
        }
    }
});

// authRouter.get("/login", async (_, res) => {
//   if (res.locals.session) {
//     return res.redirect("/");
//   }
//   res
//     .setHeader("Content-Type", "application/json")
//     .status(200)
//     .json({ message: "Please login" });
// });

// authRouter.post("/login", async (req, res) => {
//   const email: string | null = req.body.email ?? null;
//   if (!email || email.length < 3 || email.length > 255) {
//     res
//       .setHeader("Content-Type", "application/json")
//       .status(400)
//       .json({ error: "Incorrect username or password" });
//     return;
//   }

//   const password: string | null = req.body.password ?? null;
//   if (!password || password.length < 6 || password.length > 255) {
//     res
//       .setHeader("Content-Type", "application/json")
//       .status(400)
//       .json({ error: "Incorrect username or password" });
//     return;
//   }

//   const [rows] = await connectionPool.query<any[]>(
//     "SELECT * FROM users WHERE email = ?",
//     [email]
//   );
//   const user = rows[0];

//   if (!user) {
//     res
//       .setHeader("Content-Type", "application/json")
//       .status(400)
//       .json({ error: "Incorrect username or password" });
//     return;
//   }

//   if (!user) {
//     res
//       .setHeader("Content-Type", "application/json")
//       .status(400)
//       .json({ error: "Incorrect username or password" });
//     return;
//   }

//   const validPassword = await verify(user.password_hash, password, {
//     memoryCost: 19456,
//     timeCost: 2,
//     outputLen: 32,
//     parallelism: 1,
//   });
//   if (!validPassword) {
//     res
//       .setHeader("Content-Type", "application/json")
//       .status(400)
//       .json({ error: "Incorrect username or ///password" });
//   }

//   const session = await auth.createSession(user.id, {});
//   res
//     .appendHeader(
//       "Set-Cookie",
//       auth.createSessionCookie(session.id).serialize()
//     )
//     .appendHeader("Location", "/")
//     .redirect("/");
// });

// authRouter.get("/logout", async (_, res) => {
//   if (!res.locals.session) {
//     res.status(401).end();
//   }
//   await auth.invalidateSession(res.locals.session.id);
//   res
//     .setHeader("Set-Cookie", auth.createBlankSessionCookie().serialize())
//     .redirect("/login");
// });

// authRouter.post("/signup", async (req, res) => {
//   const email: string | null = req.body.email ?? null;
//   if (!email || email.length < 3) {
//     res
//       .setHeader("Content-Type", "application/json")
//       .status(400)
//       .json({ error: "Invalid email" });
//     return;
//   }
//   const password: string | null = req.body.password ?? null;
//   if (!password || password.length < 6 || password.length > 255) {
//     res
//       .setHeader("Content-Type", "application/json")
//       .status(400)
//       .json({ error: "Invalid password" });
//     return;
//   }

//   const passwordHash = await hash(password, {
//     memoryCost: 19456,
//     timeCost: 2,
//     outputLen: 32,
//     parallelism: 1,
//   });
//   const userId = generateId(15);

//   try {
//     // TODO: How to decide the role of the user?
//     await connectionPool.execute(
//       "INSERT INTO users (id, email, password_hash, role) VALUES(?, ?, ?, ?)",
//       [userId, email, passwordHash, "VOLUN"]
//     );

//     const session = await auth.createSession(userId, {});
//     return res
//       .appendHeader(
//         "Set-Cookie",
//         auth.createSessionCookie(session.id).serialize()
//       )
//       .redirect("/");
//   } catch (e) {
//     console.error(e);
//     res
//       .setHeader("Content-Type", "application/json")
//       .status(400)
//       .json({ error: "User already exists" });
//   }
// });
