import api from "./api";

const request = async (path, props) => {
    const authToken = localStorage.getItem("neuronAuthToken");

    if (!authToken) {
        return {
            volunteers: null,
        };
    } else {
        try {
            let response = {};
            if (props) {
                response = await api.post(path, {
                    token: authToken,
                    ...props,
                });
            } else {
                response = await api.post(path, {
                    token: authToken,
                });
            }
            

            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

// Get all volunteers
const getVolunteers = async () => await request("/admin/all-volunteers");

// Get all instructors
const getInstructors = async () => await request("/admin/all-instructors");

// Add an instructor
const addInstructor = async (instructor) => await request("/admin/add-instructor", instructor);

// Edit an instructor
const editInstructor = async (instructor) => await request("/admin/edit-instructor", instructor);

// Delete an instructor
const deleteInstructor = async (instructor_id) => await request("/admin/delete-instructor", instructor_id);

// Get all unverified volunteers
const getUnverifiedVolunteers = async () => await request("/admin/unverified-volunteers");

// Verify/Activate a volunteer
const verifyVolunteer = async (volunteerId) => await request("/admin/verify-volunteer", volunteerId);

// Deactivate a volunteer
const deactivateVolunteer = async ({volunteer_id: volunteerId}) => await request("/admin/deactivate-volunteer", volunteerId);

export { getVolunteers, getInstructors, addInstructor, editInstructor, deleteInstructor, getUnverifiedVolunteers, verifyVolunteer, deactivateVolunteer };
