// This file groups all the API calls related to getting shift information page.
import api from "./api";

const getShiftInfo = async (volunteerID, scheduleID, shiftDate) => {
  try {
    const response = await api.post("/shifts", {
      volunteerID,
      scheduleID,
      shiftDate,
    });

    const res = response.data;
    return res;
  } catch (error) {
    console.error("Error fetching shift info:", error);
    throw error;
  }
};

// Retrieves all shifts for the volunteer monthly schedule view.
// The shift data includes the following shift_type values:
// -- 1. 'my-shifts' - shifts assigned to the volunteer.
// -- 2. 'coverage' - shifts available for coverage by other volunteers.
// -- 3. 'my-coverage-requests' - coverage requests made by the volunteer.
// -- Returns shift details such as date, time, class, duration, and coverage status.
const getVolunteerShiftsForMonth = async (body) => {
  try {
    const response = await api.post("/shifts/volunteer-month", {
      fk_volunteer_id: body.volunteer_id,
      shift_date: body.shiftDate,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching shift info:", error);
    throw error;
  }
};

// Creates a request to check in for a shift
const checkInShift = async (shift_id) => {
  try {
    // console.log("checkInShift shift_id param:", shift_id);
    const response = await api.patch(`/shifts/check-in/${shift_id}`);

    return response.data;
  } catch (error) {
    console.error("Error checking in for shift: ", error);
    throw error;
  }
};

// Creates a request to cover a shift by a volunteer.
const requestToCoverShift = async (body) => {
  try {
    // console.log("requestToCoverShift body:", body);
    const response = await api.post("/shifts/cover-shift", {
      request_id: body.request_id,
      volunteer_id: body.volunteer_id,
    });

    return response.data;
  } catch (error) {
    console.error("Error generating request to cover shift:", error);
    throw error;
  }
};

// Cancels a request to cover a shift from another volunteer. An error is thrown if the request is not found or already approved
const cancelCoverShift = async (body) => {
  try {
    // console.log("cancelCoverShift body:", body);
    const response = await api.delete("/shifts/cover-shift", { 
      data: {
        request_id: body.request_id,
        volunteer_id: body.volunteer_id,
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error cancelling shift coverage:", error);
    throw error;
  }
};

// Creates a request for shift coverage
const requestShiftCoverage = async (body) => {
  try {
    // console.log("requestShiftCoverage body:", body);
    const response = await api.put(`/shifts/shift-coverage-request`, {
      shift_id: body.shift_id
    });

    return response.data;
  } catch (error) {
    console.error("Error requesting coverage for shift: ", error);
    throw error;
  }
}

// Cancels a shift coverage request. An error is thrown if we try to cancel a request that has already been fulfilled or isn't found
const cancelCoverRequest = async (body) => {
  try {
    // console.log("cancelCoverRequest body:", body);
    const response = await api.delete("/shifts/shift-coverage-request", {
      data: {
        request_id: body.request_id,
        shift_id: body.shift_id,
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error cancelling shift coverage request:", error);
    throw error;
  }
}

export {
  getShiftInfo,
  getVolunteerShiftsForMonth,
  requestToCoverShift,
  requestShiftCoverage,
  cancelCoverShift,
  cancelCoverRequest,
  checkInShift,
};
