import { config } from "dotenv";
import { readSecretFromFile } from "../utils/configUtils.js";

config();

export const PORT: number = parseInt(process.env.PORT || "3001", 10);
export const NEURON_ENV: string = process.env.NEURON_ENV || 'development';
export const HOST = process.env.HOST;
export const FRONTEND_HOST = process.env.FRONTEND_HOST;
export const GMAIL_ID = process.env.GMAIL_ID;

let host, user, password, database, port, token_secret, gmail_password;
if (NEURON_ENV === 'development') {
    host = process.env.RDS_HOSTNAME!;
    user = process.env.RDS_USERNAME!;
    password = process.env.RDS_PASSWORD!;
    database = process.env.RDS_DB!;
    port = process.env.RDS_PORT || 3306;
    token_secret = process.env.TOKEN_SECRET;
    gmail_password = process.env.GMAIL_PASSWORD;
} 
else if (NEURON_ENV === 'production') {
    host = process.env.RDS_HOSTNAME!;
    user = process.env.RDS_USERNAME!;
    database = process.env.RDS_DB!;
    port = parseInt(process.env.RDS_PORT || "3306", 10);
    password = readSecretFromFile(process.env.RDS_PASSWORD_FILE!);
    token_secret = readSecretFromFile(process.env.TOKEN_SECRET_FILE!);
    gmail_password = readSecretFromFile(process.env.GMAIL_PASSWORD_FILE!);
}

if (!host || !user || !password || !database || !port || !token_secret || !gmail_password) {
    console.error('Missing configuration');
    process.exit(1);
}

export const DB_URI = `mysql://${user}:${password}@${host}:${port}/${database}`;
export const TOKEN_SECRET = token_secret;
export const GMAIL_PASSWORD = gmail_password;
