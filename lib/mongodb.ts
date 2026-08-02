import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    // Returns null if no MongoDB URI is set yet, allowing file/memory fallback
    return null;
  }

  if (global.mongooseCache.conn) {
    return global.mongooseCache.conn;
  }

  if (!global.mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
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
