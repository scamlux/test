const { MongoClient } = require("mongodb");

const MONGO_URL =
  process.env.MONGO_URL || "mongodb://admin:admin@localhost:27017";
const MONGO_DB = process.env.MONGO_DB || "agri-logs";

let client = null;
let db = null;

async function connect() {
  if (db) return db;

  try {
    client = new MongoClient(MONGO_URL, {
      retryWrites: true,
      w: "majority",
    });
    await client.connect();
    db = client.db(MONGO_DB);

    // Create indexes for better query performance
    await db
      .collection("request_logs")
      .createIndex({ service_name: 1, created_at: -1 });
    await db.collection("request_logs").createIndex({ created_at: -1 });
    await db.collection("request_logs").createIndex({ status_code: 1 });

    console.log("Connected to MongoDB for logging");
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

module.exports = { connect };
