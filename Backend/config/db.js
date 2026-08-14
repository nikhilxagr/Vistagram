import dns from "node:dns";
import mongoose from "mongoose";

const getMongoDnsServers = () => {
  const configuredServers = process.env.MONGO_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (configuredServers?.length) {
    return configuredServers;
  }

  // Only apply local fallback DNS in non-production environments
  if (process.env.NODE_ENV !== "production") {
    try {
      const currentServers = dns.getServers();
      const usesLocalDnsProxy = currentServers.some((server) =>
        ["127.0.0.1", "::1"].includes(server),
      );
      return usesLocalDnsProxy ? ["8.8.8.8", "1.1.1.1"] : [];
    } catch {
      return [];
    }
  }

  return [];
};

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;

    if (!mongoUri) {
      throw new Error("MONGO_URI or MONGODB_URL is missing in .env");
    }

    if (mongoUri.startsWith("mongodb+srv://")) {
      const mongoDnsServers = getMongoDnsServers();

      if (mongoDnsServers.length) {
        dns.setServers(mongoDnsServers);
        // console.log(`MongoDB DNS servers: ${mongoDnsServers.join(", ")}`);
      }
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default connectDB;
