import api from "./api";

const getAllInstructors = () => 
    api
        .get("instructor")
        .then((response) => response.data)
        .catch((error) => {
            console.error(error);
        });

const getInstructor = (instructor_id) => 
    api
        .get(`instructor/${instructor_id}`)
        .then((response) => response.data)
        .catch((error) => {
            console.error(error);
        });

coexport {
    getAllInstructors,
    getInstructor
};

