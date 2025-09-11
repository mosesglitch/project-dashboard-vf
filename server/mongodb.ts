import { MongoClient, Db, Collection } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://felixjdawn:MMPvV2w5IJXyY9we@gikoshcluster.r6qxd.mongodb.net/?retryWrites=true&w=majority&appName=gikoshCluster";

const DB_NAME = "project_dashboard_demo";

if (!MONGODB_URI) {
  throw new Error("❌ MongoDB URI is not defined in environment variables!");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return {
      client: cachedClient,
      db: cachedDb,
      ProjectCollection: cachedDb.collection("project_data"),
      PortfolioCollection: cachedDb.collection("portfolio"),
    };
  }

  const client = new MongoClient(MONGODB_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
  });

  await client.connect();
  cachedClient = client;
  cachedDb = client.db(DB_NAME);

  console.log("✅ Connected to MongoDB");

  return {
    client,
    db: cachedDb,
    ProjectCollection: cachedDb.collection("project_data"),
    PortfolioCollection: cachedDb.collection("portfolio"),
  };
}
