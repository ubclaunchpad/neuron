import api from "./api";

// Sign up a new user
const signUp = (data) =>
    api
        .post("/auth/register", data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            throw error;
        });

// Login a user
const login = (data) =>
    api
        .post("/auth/login", data)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            throw error;
        });

export { signUp, login };
