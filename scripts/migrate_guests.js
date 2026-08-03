#!/usr/bin/env node
const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Please set it before running this script.");
    process.exit(1);
  }

  const sourceDbName = process.env.SOURCE_DB || "test";
  let targetDbName = process.env.TARGET_DB;

  if (!targetDbName) {
    const m = uri.match(/\/([a-zA-Z0-9_\-]+)(\?|$)/);
    targetDbName = m ? m[1] : "thumoivotnghiep";
  }

  console.log(`Source DB: ${sourceDbName}`);
  console.log(`Target DB: ${targetDbName}`);

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();

    const sourceCol = client.db(sourceDbName).collection("guests");
    const targetCol = client.db(targetDbName).collection("guests");

    const docs = await sourceCol.find({}).toArray();
    console.log(`Found ${docs.length} documents in ${sourceDbName}.guests`);
    if (docs.length === 0) {
      console.log("Nothing to migrate.");
      return;
    }

    // Prepare bulk upserts into target collection using `id` as unique key
    const ops = docs.map((d) => ({
      replaceOne: {
        filter: { id: d.id },
        replacement: d,
        upsert: true,
      },
    }));

    const res = await targetCol.bulkWrite(ops, { ordered: false });
    console.log("Migration result:", res.result || res);
    console.log("Migration complete. Please verify in Atlas.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 2;
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  console.log("Usage: set MONGODB_URI and optionally SOURCE_DB/TARGET_DB, then run: node scripts/migrate_guests.js");
  main();
}
