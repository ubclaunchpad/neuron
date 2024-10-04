
import express from "express";
import {auth} from "../lib/auth.js";

export const authMiddleware = express.Router()

authMiddleware.use(async (req, res, next) => {
    const sessionId = auth.readSessionCookie(req.headers.cookie ?? "");
    if (!sessionId) {
        res.locals.user = null;
        res.locals.session = null;
        if (req.originalUrl.startsWith("/login") || req.originalUrl.startsWith("/sigunp")) {
            next();
            return
        }
        res.redirect("/login");
        return;
    }

    const { session, user } = await auth.validateSession(sessionId);
    if (session && session.fresh) {
        res.appendHeader("Set-Cookie", auth.createSessionCookie(session.id).serialize());
    }
    if (!session) {
        res.appendHeader("Set-Cookie", auth.createBlankSessionCookie().serialize());
    }
    res.locals.session = session;
    res.locals.user = user;
    return next();
});