// backend/src/database/connection.ts

import mysql from 'mysql';

const connectionPool = mysql.createPool({
  host: 'neuron-db.c7wsycei6kbt.us-east-2.rds.amazonaws.com',
  port: 3306,
  user: 'neuron',
  password: 'Launchpad2024!',
//   database: 'neuron_db' // Replace with your actual database name if known
});

export { connectionPool };