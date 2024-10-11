import express from "express";
const { requiresAuth } = require("express-openid-connect");
// import {verify} from "@node-rs/argon2";
// import {auth} from "../lib/auth.js";
// import connectionPool from "../config/database.js";
// import { hash } from "@node-rs/argon2";
// import { generateId } from "lucia";

export const authRouter = express.Router();

authRouter.get("/getUser", requiresAuth(), (req, res) => {
  res.json(req.oidc.user);
});

authRouter.get("/isAuthenticated", (req, res) => {
  res.json(req.oidc.isAuthenticated());
});

// authRouter.get("/login", async (_, res) => {
//     if (res.locals.session) {
//         return res.redirect("/");
//     }
//     res.setHeader("Content-Type", "application/json").status(200).json({message: "Please login"});
// });

// authRouter.post("/login", async (req, res) => {
//     const email: string | null = req.body.email ?? null;
//     if (!email || email.length < 3 || email.length > 255) {
//         res.setHeader("Content-Type", "application/json").status(400).json({error: "Incorrect username or password"});
//         return;
//     }

//     const password: string | null = req.body.password ?? null;
//     if (!password || password.length < 6 || password.length > 255) {
//         res.setHeader("Content-Type", "application/json").status(400).json({error: "Incorrect username or password"});
//         return;
//     }

//     const [rows] = await connectionPool.query<any[]>("SELECT * FROM users WHERE email = ?", [email]);
//     const user = rows[0];

//     if (!user) {
//         res.setHeader("Content-Type", "application/json").status(400).json({error: "Incorrect username or password"});
//         return;
//     }

//     if (!user) {
//         res.setHeader("Content-Type", "application/json").status(400).json({error: "Incorrect username or password"});
//         return;
//     }

//     const validPassword = await verify(user.password_hash, password, {
//         memoryCost: 19456,
//         timeCost: 2,
//         outputLen: 32,
//         parallelism: 1
//     });
//     if (!validPassword) {
//         res.setHeader("Content-Type", "application/json").status(400).json({error: "Incorrect username or ///password"});
//     }

//     const session = await auth.createSession(user.id, {});
//     res.appendHeader("Set-Cookie", auth.createSessionCookie(session.id).serialize())
//         .appendHeader("Location", "/")
//         .redirect("/");
// });

// authRouter.get("/logout", async (_, res) => {
//     if (!res.locals.session) {
//          res.status(401).end();
//     }
//     await auth.invalidateSession(res.locals.session.id);
//      res
//         .setHeader("Set-Cookie", auth.createBlankSessionCookie().serialize())
//         .redirect("/login");
// });

// authRouter.post("/signup", async (req, res) => {
//     const email: string | null = req.body.email ?? null;
//     if (!email || email.length < 3) {
//         res.setHeader("Content-Type", "application/json").status(400).json({error: "Invalid email"});
//         return;
//     }
//     const password: string | null = req.body.password ?? null;
//     if (!password || password.length < 6 || password.length > 255) {
//          res.setHeader("Content-Type", "application/json").status(400).json({error: "Invalid password"});
//         return;
//     }

//     const passwordHash = await hash(password, {
//         memoryCost: 19456,
//         timeCost: 2,
//         outputLen: 32,
//         parallelism: 1
//     });
//     const userId = generateId(15);

//     try {
//         // TODO: How to decide the role of the user?
//         await connectionPool.execute(
//             "INSERT INTO users (id, email, password_hash, role) VALUES(?, ?, ?, ?)",
//             [userId, email, passwordHash, 'VOLUN']
//         );

//         const session = await auth.createSession(userId, {});
//         return res
//             .appendHeader("Set-Cookie", auth.createSessionCookie(session.id).serialize())
//             .redirect("/");
//     } catch (e) {
//         console.error(e);
//         res.setHeader("Content-Type", "application/json").status(400).json({error: "User already exists"});
//     }
// });
