// This file groups all the API calls related to getting shift information page.
import api from "./api";

const getShift = async (shift_id) => {
  try {
    const response = await api.get(`/shifts/${shift_id}`);

    const res = response.data;
    return res;
  } catch (error) {
    console.error("Error fetching shift info:", error);
    throw error;
  }
};

/**
 * Retrieves shifts from the database with optional filtering.
 *
 * @param {string} [params.volunteer_id] - The ID of the volunteer.
 *   - When omitted or when `type` is not 'coverage', returns only shifts assigned to the volunteer.
 *   - When `type` is 'coverage', excludes shifts assigned to the volunteer (i.e., returns shifts available for coverage).
 * @param {Date} [params.before] - Upper bound for the shift date. Shifts with a shift_date less than or equal to this date are included.
 * @param {Date} [params.after] - Lower bound for the shift date. Shifts with a shift_date greater than or equal to this date are included.
 * @param {'coverage'|'absence'} [params.type] - The type of filtering for coverage requests:
 *   - `'coverage'`: Only include shifts with an associated absence request not belonging to the specified volunteer.
 *   - `'absence'`: Only include shifts with an associated absence request belonging to the volunteer.
 * @param {'absence-pending'|'open'|'coverage-pending'|'resolved' or []} [params.status] - The status for coverage requests either as a single string  or string array.
 * This is only checked when params.type is coverage or requesting, and includes all when not set:
 *   - `'open'`: Include open coverage shifts
 *   - `'pending'`: Include coverage shifts which have a pending coverage request associated
 *   - `'resolved'`: Include coverage shifts which have been resolved.
 *
 * @returns {Promise<any[]>} A promise that resolves to an array of shift records.
 */
const getShifts = async (params) => {
  try {
    const response = await api.get("/shifts", {
      params: params,
      paramsSerializer: {
        indexes: null, // no brackets at all
      }
    });

    return response.data;
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
  console.error("getVolunteerShiftsForMonth is deprecated: switch to using getShifts in shiftService.js");

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

const getAllShiftsByMonth = async (body) => {
    try {
        const response = await api.post('shifts/admin-shift-month', {
            shift_date: body.shiftDate 
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching shift info:', error);
        throw error;  
    }
}

// Creates a request to check in for a shift
const checkInShift = async (shift_id) => {
  try {
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
  cancelCoverRequest, cancelCoverShift, checkInShift, getShift, getShifts,
  getVolunteerShiftsForMonth, requestShiftCoverage, requestToCoverShift
};

