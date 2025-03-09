import api from "./api";

const getAllInstructors = () => 
    api
        .get("instructors")
        .then((response) => response.data)
        .catch((error) => {
            console.error(error);
        });

const getInstructor = (instructor_id) => 
    api
        .get("instructors/" + instructor_id)
        .then((response) => response.data)
        .catch((error) => {
            console.error(error);
        });

export {
    getAllInstructors,
    getInstructor
}