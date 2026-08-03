import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI?.trim() || "";

function isPlaceholderUri(uri: string) {
  return /<[^>]+>/.test(uri);
}

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured. Set it in Vercel Environment Variables or your local .env file.");
  }

  if (isPlaceholderUri(MONGODB_URI)) {
    throw new Error("MONGODB_URI still contains placeholder values. Replace <username> and <password> with real MongoDB Atlas credentials.");
  }

  if (global.mongooseCache.conn) {
    return global.mongooseCache.conn;
  }

  if (!global.mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    global.mongooseCache.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    global.mongooseCache.conn = await global.mongooseCache.promise;
  } catch (e) {
    global.mongooseCache.promise = null;
    throw e;
  }

  return global.mongooseCache.conn;
}

// Global declaration for TypeScript
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}
