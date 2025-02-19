import { body, param } from "express-validator";
import { RouteDefinition } from "../common/types.js";
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
                body('role').isIn([ "admin", "volunteer", "instructor" ]),
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
                body('password').isString(),
                param('id').isUUID('4'),
                param('token').isJWT(),
            ],
            action: resetPassword
        },
        {
            path: '/update-password',
            method: 'post',
            middleware: [isAuthorized],
            validation: [
                body('password').isString(),
            ],
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