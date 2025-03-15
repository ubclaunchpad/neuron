import api from "./api";

const approveAbsenceRequest = (requestId) => {
    return api
        .patch(`/absence/${requestId}/approve`)
        .then((response) => {
        return response.data;
        })
        .catch((error) => {
        console.error(error);
        throw error;
        });
}

const declineAbsenceRequest = (requestId) => {
    return api
        .delete(`/absence/${requestId}/reject`)
        .then((response) => {
        return response.data;
        })
        .catch((error) => {
        console.error(error);
        throw error;
        });
}

const approveCoverageRequest = (requestId, volunteerId) => {
    return api
        .patch(`/absence/${requestId}/coverage/${volunteerId}/approve`)
        .then((response) => {
        return response.data;
        })
        .catch((error) => {
        console.error(error);
        throw error;
        });
}

const declineCoverageRequest = (requestId, volunteerId) => {
    return api
        .delete(`/absence/${requestId}/coverage/${volunteerId}/approve`)
        .then((response) => {
        return response.data;
        })
        .catch((error) => {
        console.error(error);
        throw error;
        });
}

export {
    approveAbsenceRequest,
    declineAbsenceRequest,
    approveCoverageRequest,
    declineCoverageRequest,
}