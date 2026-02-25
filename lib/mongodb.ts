import { MongoClient, type Db } from "mongodb"

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let clientPromise: Promise<MongoClient> | null = null

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
  }
  return uri
}

function getMongoClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    // Reuse one client in dev across HMR reloads.
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }
    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(getMongoUri(), options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    return globalWithMongo._mongoClientPromise
  }

  if (!clientPromise) {
    const client = new MongoClient(getMongoUri(), options)
    clientPromise = client.connect()
  }
  return clientPromise
}

// Backward-compatible default export for any legacy imports.
const lazyClientPromise = {
  then: (...args: Parameters<Promise<MongoClient>["then"]>) => getMongoClientPromise().then(...args),
  catch: (...args: Parameters<Promise<MongoClient>["catch"]>) => getMongoClientPromise().catch(...args),
  finally: (...args: Parameters<Promise<MongoClient>["finally"]>) => getMongoClientPromise().finally(...args),
} as Promise<MongoClient>

export default lazyClientPromise

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClientPromise()
  return client.db("temade_ecommerce")
}
