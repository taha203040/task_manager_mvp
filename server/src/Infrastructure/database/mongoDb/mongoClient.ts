import { MongoClient, Db } from "mongodb";
let db: Db



export async function connectMongodb(uri: string, dbName: string) {
    // client setup 
    const client = new MongoClient(uri)
    // connect to db
    await client.connect()
    db = client.db(dbName)
    console.log('connected to mongodb')
    return db
}
export function getDb(): Db {
    if (!db) throw new Error("Database not initialized. Call connectMongo first.");
    return db;
} 