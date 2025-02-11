import api from "./api";

// Update a user's password
export const changePassword = async (passwordUpdateData) => {
    const { currentPassword, newPassword } = passwordUpdateData
    const token = localStorage.getItem("neuronAuthToken");

    if (!token) {
        return "No token found"; //TODO: update with bearer
    }

    try {
        const resetResponse = await api.post("/auth/update-password", {
            token: token,
            currentPassword: currentPassword,
            newPassword: newPassword
        });
        return resetResponse.data;
    } catch (error) {
        console.error('Error updating volunteer data:', error);
        throw error;
    }
};

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
const checkAuth = async () => {
    const authToken = localStorage.getItem("neuronAuthToken");

    if (!authToken) {
        return {
            isAuthenticated: false,
            user: null,
        };
    } else {
        try {
            const response = await api.post("/auth/is-authenticated", {
                token: authToken,
            });
            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {
            return {
                isAuthenticated: false,
                user: null,
            };
        }
    }
};

export {
    checkAuth, resetPassword, sendResetPasswordInstructions, signUp
};
