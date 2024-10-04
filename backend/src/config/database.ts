import {PoolOptions} from "mysql2";
import mysql from "mysql2/promise";
import {config} from "dotenv";


config();

const configuration: PoolOptions = {
  host: process.env.RDS_HOSTNAME || '',
  user: process.env.RDS_USERNAME || '',
  password: process.env.RDS_PASSWORD || '',
  database: process.env.RDS_DB || '',
  port: process.env.RDS_PORT ? parseInt(process.env.RDS_PORT, 10) : 3306, // Default to port 3306 if not specified
};

const connectionPool: mysql.Pool = mysql.createPool(configuration)

export default connectionPool;
