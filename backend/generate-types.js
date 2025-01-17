import { Client } from '@rmp135/sql-ts';
import { config as envConfig } from 'dotenv';
import { writeFile } from 'fs';

envConfig();

const config = {
    "client": "mysql2",
    "connection": {
        "host": process.env.RDS_HOSTNAME,
        "port": process.env.RDS_PORT,
        "user": process.env.RDS_USERNAME,
        "password": process.env.RDS_PASSWORD,
        "database" : process.env.RDS_DB
    },
    "tableNameCasing": "pascal",
    "interfaceNameFormat": "${table}",
    "singularTableNames": true,
    "filename": "./src/common/generated.ts",
    "typeMap": {
        "Buffer": ["longblob", "mediumblob"],
        "string": ["time", "date"]
    }
};

let contents = await Client
    .fromConfig(config)
    .fetchDatabase()
    .mapTables((t) => {
        t.extends = "RowDataPacket"
        return t;
    })
    .toTypescript();

contents = `import { RowDataPacket } from "mysql2";

${contents}`

writeFile(config.filename, contents, err => {
    if (err) console.error(err)
});