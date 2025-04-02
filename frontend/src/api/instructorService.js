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

const addInstructor = (instructor, signoff) => 
    api
        .post("instructor", {
            ...instructor,
            signoff
        })
        .then((response) => response.data)
        .catch((error) => {
            console.error(error);
        });

const editInstructor = (instructor_id, instructor, signoff) => 
    api
        .put(`instructor/${instructor_id}`, {
            ...instructor,
            signoff
        })
        .then((response) => response.data)
        .catch((error) => {
            console.error(error);
        });

const deleteInstructor = (instructor_id, signoff) => 
    api
        .delete(`instructor/${instructor_id}`, {
            data: { signoff }
        })
        .then((response) => response.data)
        .catch((error) => {
            console.error(error);
        });

export {
    addInstructor, deleteInstructor, editInstructor, getAllInstructors,
    getInstructor
};

