import { isAuthorized } from "../config/authCheck.js";
import {
    loginUser,
    registerUser,
    resetPassword,
    sendResetPasswordEmail,
    sendVolunteerData,
    updatePassword,
    verifyAndRedirect,
} from "../controllers/userController.js";
import { RouteDefinition } from "./routes.js";

export const AuthRoutes: RouteDefinition = {
    path: '/auth',
    children: [
        {
            path: '/register',
            method: 'post',
            action: registerUser
        },
        {
            path: '/login',
            method: 'post',
            action: loginUser
        },
        {
            path: '/send-reset-password-email',
            method: 'post',
            action: sendResetPasswordEmail
        },
        {
            path: '/forgot-password/:id/:token',
            method: 'get',
            action: verifyAndRedirect
        },
        {
            path: '/reset-password',
            method: 'post',
            action: resetPassword
        },
        {
            path: '/update-password',
            method: 'post',
            middleware: [isAuthorized],
            action: updatePassword
        },
        {
            path: '/is-authenticated',
            method: 'post',
            middleware: [isAuthorized],
            action: sendVolunteerData
        },
    ]
};
