import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import { RDS_DB, RDS_HOSTNAME, RDS_PASSWORD, RDS_PORT, RDS_USERNAME } from "./environment.js";

const configuration: PoolOptions = {
  host: RDS_HOSTNAME,
  user: RDS_USERNAME,
  password: RDS_PASSWORD,
  database: RDS_DB,
  port: RDS_PORT, 
  timezone: 'Z',
  dateStrings: true,
  typeCast: (_, next) => {
    // Turn null columns into undefined
    const value = next();
    return value === null ? undefined : value;
  },
};

const connectionPool: Pool = mysql.createPool(configuration);

export default connectionPool;
