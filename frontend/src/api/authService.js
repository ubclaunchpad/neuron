import api from './api';

export const changePassword = async (volunteerData) => {
    try {
        console.log("sending login")
        const loginResponse = await api.post("/auth/login", {
            email: volunteerData.email,
            password: volunteerData.currentPassword
        });
        const data = loginResponse.data;
        const token = data.token;
        const resetResponse = await api.post("/auth/update-password", {
            token: token,
            password: volunteerData.newPassword
        });
        return resetResponse.data;
    } catch (error) {
        console.error('Error updating volunteer data:', error);
        throw error;
    }
};