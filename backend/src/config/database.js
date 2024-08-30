import mysql from "mysql";
import { config } from "dotenv";

config();

const configuration = {
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB,
  port: process.env.RDS_PORT,
};

const connectionPool = mysql.createPool(configuration);

export default connectionPool;
