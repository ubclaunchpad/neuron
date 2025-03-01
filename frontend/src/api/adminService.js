import api from "./api";

// Get all volunteers
const getVolunteers = async () => {
    const authToken = localStorage.getItem("neuronAuthToken");

    if (!authToken) {
        return {
            volunteers: null,
        };
    } else {
        try {
            const response = await api.post("/admin/all-volunteers", {
                token: authToken,
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Get all unverified volunteers
const getUnverifiedVolunteers = async () => {
    const authToken = localStorage.getItem("neuronAuthToken");

    if (!authToken) {
        return {
            volunteers: null,
        };
    } else {
        try {
            const response = await api.post("/admin/unverified-volunteers", {
                token: authToken,
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

const verifyVolunteer = async (volunteerId) => {
    const authToken = localStorage.getItem("neuronAuthToken");

    if (!authToken) {
        return {
            error: "Unauthorized",
        };
    } else {
        try {
            const response = await api.post("/admin/verify-volunteer", {
                token: authToken,
                volunteer_id: volunteerId,
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export { getVolunteers, getUnverifiedVolunteers, verifyVolunteer };
