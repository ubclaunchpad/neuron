import { body, param } from "express-validator";
import { Role } from "../common/interfaces.js";
import { RouteDefinition } from "../common/types.js";
import { isAuthorized } from "../config/authCheck.js";
import {
    checkAuthorization,
    loginUser,
    registerUser,
    resetPassword,
    sendResetPasswordEmail,
    updatePassword,
    verifyAndRedirect
} from "../controllers/authController.js";

export const AuthRoutes: RouteDefinition = {
    path: '/auth',
    children: [
        {
            path: '/register',
            method: 'post',
            validation: [
                body('firstName').isString(),
                body('lastName').isString(),
                body('email').isEmail(),
                body('password').isString(),
                body('role').isIn(Role.values),
            ],
            action: registerUser
        },
        {
            path: '/login',
            method: 'post',
            validation: [
                body('email').isEmail(),
                body('password').isString(),
            ],
            action: loginUser
        },
        {
            path: '/send-reset-password-email',
            method: 'post',
            validation: [
                body('email').isEmail(),
            ],
            action: sendResetPasswordEmail
        },
        {
            path: '/forgot-password/:id/:token',
            method: 'get',
            validation: [
                param('id').isUUID('4'),
                param('token').isJWT(),
            ],
            action: verifyAndRedirect
        },
        {
            path: '/reset-password',
            method: 'post',
            validation: [
                body('token').isJWT(),
                body('id').isUUID('4'),
                body('password').isString(),
            ],
            action: resetPassword
        },
        {
            path: '/update-password',
            method: 'post',
            middleware: [isAuthorized],
            validation: [
                body('currentPassword').isString(),
                body('newPassword').isString(),
            ],
            action: updatePassword
        },
        {
            path: '/is-authenticated',
            method: 'get',
            middleware: [isAuthorized],
            action: checkAuthorization
        },
    ]
};
