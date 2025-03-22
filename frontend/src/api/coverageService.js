import api from "./api";

const requestAbsence = async (shift_id, body) => {
  try {
    const response = await api.post(`/shifts/${shift_id}/absence`, body);

    return response.data;
  } catch (error) {
    console.error("Error requesting absence:", error);
    throw error;
  }
};

const withdrawAbsenceRequest = async (request_id) => {
  try {
    const response = await api.delete(`/absence/${request_id}/withdraw`);

    return response.data;
  } catch (error) {
    console.error("Error withdrawing absence request:", error);
    throw error;
  }
};

const requestCoverage = async (request_id, volunteer_id) => {
  try {
    const response = await api.post(`/absence/${request_id}/coverage`, {
      volunteer_id: volunteer_id
    });

    return response.data;
  } catch (error) {
    console.error("Error requesting coverage for shift:", error);
    throw error;
  }
};

const withdrawCoverageRequest = async (request_id, volunteer_id) => {
  try {
    const response = await api.delete(`/absence/${request_id}/coverage/${volunteer_id}`);

    return response.data;
  } catch (error) {
    console.error("Error withdrawing coverage for shift: ", error);
    throw error;
  }
}

const approveAbsenceRequest = async (request_id, signoff) => {
  try {
    const response = await api.put(`/absence/${request_id}/approve`, { signoff });

    return response.data;
  } catch (error) {
    console.error("Error approving coverage for shift: ", error);
    throw error;
  }
};

const rejectAbsenceRequest = async (request_id, signoff) => {
  try {
    const response = await api.delete(`/absence/${request_id}/reject`, { data: { signoff } });

    return response.data;
  } catch (error) {
    console.error("Error rejecting coverage for shift: ", error);
    throw error;
  }
};

const approveCoverageRequest = async (request_id, volunteer_id, signoff) => {
  try {
    const response = await api.put(
      `/absence/${request_id}/coverage/${volunteer_id}/approve`,
      { signoff }
    );

    return response.data;
  } catch (error) {
    console.error("Error approving coverage for shift: ", error);
    throw error;
  }
};

const rejectCoverageRequest = async (request_id, volunteer_id, signoff) => {
  try {
    const response = await api.delete(
      `/absence/${request_id}/coverage/${volunteer_id}/reject`, 
      { data: { signoff } }
    );

    return response.data;
  } catch (error) {
    console.error("Error rejecting coverage for shift: ", error);
    throw error;
  }
}

export {
  approveAbsenceRequest, approveCoverageRequest, rejectAbsenceRequest, rejectCoverageRequest, requestAbsence, requestCoverage, withdrawAbsenceRequest, withdrawCoverageRequest
};

