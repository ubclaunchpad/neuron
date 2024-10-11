// import { Lucia } from "lucia";
// import { Mysql2Adapter } from "@lucia-auth/adapter-mysql";
// import connectionPool from "../config/database.js";

// export interface DatabaseUser {
//     id: string;
//     password_hash: string;
//     email: string;
// }

// const adapter = new Mysql2Adapter(connectionPool, {
//     user: "users", // which table to use for user data
//     session: "user_session" // which table to use for session data
// });

// export const auth =  new Lucia(adapter,{
//     sessionCookie: {
//         attributes: {
//             // set to `true` when using HTTPS
//             secure: process.env.NODE_ENV === "production"
//         }
//     },
//     getUserAttributes: (attributes) => {
//         return {
//             email: attributes.email
//     }
//     }
// });

// // Do not remove this line
// declare module "lucia" {
//     interface Register {
//         Lucia: typeof auth;
//         DatabaseUserAttributes: Omit<DatabaseUser, "id">;

//     }
// }
