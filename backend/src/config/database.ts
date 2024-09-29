import mysql, { PoolConfig, Pool } from 'mysql';
import { config } from "dotenv";

config();

const configuration: PoolConfig = {
  host: process.env.RDS_HOSTNAME || '',
  user: process.env.RDS_USERNAME || '',
  password: process.env.RDS_PASSWORD || '',
  database: process.env.RDS_DB || '',
  port: process.env.RDS_PORT ? parseInt(process.env.RDS_PORT, 10) : 3306, // Default to port 3306 if not specified
};

const connectionPool: Pool = mysql.createPool(configuration);

export default connectionPool;
