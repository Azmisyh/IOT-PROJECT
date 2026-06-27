require('dotenv').config({ override: true });
const dns = require('dns');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Prefer full MONGO_URI from .env. If not present, build from components.
const dnsResolvers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (dnsResolvers.length) {
  dns.setServers(dnsResolvers);
}

const envUri = process.env.MONGO_URI && process.env.MONGO_URI.trim();
let uri = envUri;

if (!uri) {
  const user = process.env.MONGO_USER || '<username>';
  const pass = process.env.MONGO_PASS || '<password>';
  const host = process.env.MONGO_HOST || 'cluster0.mongodb.net';
  const dbName = process.env.MONGO_DB || 'iot';
  uri = `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${dbName}?retryWrites=true&w=majority`;
}

console.log('Using MongoDB URI:', uri.replace(/:(.*)@/, ':<redacted>@'));

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message || err);
    process.exit(2);
  } finally {
    try { await client.close(); } catch(e){}
  }
}

run();
