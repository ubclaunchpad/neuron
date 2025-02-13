import { config } from "dotenv";
import mysql, { Pool, PoolOptions } from 'mysql2/promise';

config();

const configuration: PoolOptions = {
  host: process.env.RDS_HOSTNAME || '',
  user: process.env.RDS_USERNAME || '',
  password: process.env.RDS_PASSWORD || '',
  database: process.env.RDS_DB || '',
  port: process.env.RDS_PORT ? parseInt(process.env.RDS_PORT, 10) : 3306, // Default to port 3306 if not specified
  typeCast: (_, next) => {
    // Turn null columns into undefined
    const value = next();
    return value === null ? undefined : value;
  },
};

const connectionPool: Pool = mysql.createPool(configuration);

export default connectionPool;
