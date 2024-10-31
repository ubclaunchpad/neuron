import api from "./api";

// Sign up a new user
const signUp = (data) =>
    api
        .post("/auth/register", data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            throw error;
        });

// Login a user
const login = (data) =>
    api
        .post("/auth/login", data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            throw error;
        });

// Send reset password instructions
const sendResetPasswordInstructions = (data) =>
    api
        .post("/auth/send-reset-password-email", data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            throw error;
        });

// Reset password
const resetPassword = (data) =>
    api
        .post("/auth/reset-password", data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            throw error;
        });

export { signUp, login, sendResetPasswordInstructions, resetPassword };
