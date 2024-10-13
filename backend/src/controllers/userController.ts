import UserModel from "../models/userModel";

const userModel = new UserModel();

async function getUserByEmail(email: string): Promise<any> {
    return new Promise((resolve, reject) => {
        userModel
            .getUserByEmail(email)
            .then((user: any) => {
                resolve(user);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}

async function insertUser(user: any): Promise<any> {
    return new Promise((resolve, reject) => {
        userModel
            .insertUser(user)
            .then((results: any) => {
                resolve(results);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}

async function deleteUser(user_id: string): Promise<any> {
    return new Promise((resolve, reject) => {
        userModel
            .deleteUser(user_id)
            .then((results: any) => {
                resolve(results);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}

export { getUserByEmail, insertUser, deleteUser };
