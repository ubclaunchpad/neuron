import knex from "knex";

const queryBuilder = knex({ client: 'mysql' });

export default queryBuilder;