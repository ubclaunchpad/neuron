import api from "./api";

const getAllInstructors = () => 
    api
        .get("instructors")
        .then((response) => response.data)
        .catch((error) => {
            console.error(error);
        });

export {
    getAllInstructors
}