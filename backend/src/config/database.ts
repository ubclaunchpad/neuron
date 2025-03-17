import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import { DB_URI } from "./environment.js";

const configuration: PoolOptions = {
  uri: DB_URI, // from config.ts
  typeCast: (_, next) => {
    // Turn null columns into undefined
    const value = next();
    return value === null ? undefined : value;
  },
};

const connectionPool: Pool = mysql.createPool(configuration);

export default connectionPool;
