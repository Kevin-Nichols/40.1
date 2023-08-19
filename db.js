/** Database setup for BizTime. */

const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = "biztime_test";
} else {
  DB_URI = "biztime";
}

const db = new Client({
  user: 'postgres',
  host: 'localhost',
  database: DB_URI,
  password: '3210',
  port: 5432,
  // connectionString: DB_URI
});

db.connect();

module.exports = db;