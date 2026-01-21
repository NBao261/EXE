import { MongoClient, Db } from "mongodb";
import { config } from "./index.js";

let db: Db | null = null;
let client: MongoClient | null = null;

export const connectDatabase = async (): Promise<Db> => {
  if (db) return db;

  try {
    client = new MongoClient(config.mongoUri);
    await client.connect();
    db = client.db();

    // Create indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });

    console.log("✅ MongoDB connected");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDatabase() first.");
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log("📦 MongoDB connection closed");
  }
};
