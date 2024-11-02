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

// Check if the user is logged in with a valid token
const isAuthenticated = async () => {
    const authToken = localStorage.getItem("neuronAuthToken");

    if (!authToken) {
        return false;
    } else {
        try {
            const response = await api.post("/auth/is-authenticated", { token: authToken });
            if (response.status === 200) {
                return true;
            }
        } catch (error) {
            return false;
        }
    }
}

export { signUp, login, sendResetPasswordInstructions, resetPassword, isAuthenticated };
