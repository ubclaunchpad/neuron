import api from "./api";

// Update a user's password
export const changePassword = async (passwordUpdateData) => {
    const { currentPassword, newPassword } = passwordUpdateData

    try {
        const resetResponse = await api.post("/auth/update-password", {
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
const checkAuth = () => 
    api.get("/auth/is-authenticated")
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                throw error;
            });

export {
    checkAuth, resetPassword, sendResetPasswordInstructions, signUp
};
