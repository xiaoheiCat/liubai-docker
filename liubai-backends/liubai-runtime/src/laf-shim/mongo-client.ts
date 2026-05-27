import { MongoClient, type Db } from "mongodb"

let client: MongoClient | null = null
let connectPromise: Promise<MongoClient> | null = null

export function getMongoUri(): string {
  return process.env.MONGODB_URI ?? "mongodb://db:27017/liubai"
}

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client
  if (!connectPromise) {
    connectPromise = MongoClient.connect(getMongoUri(), {
      serverSelectionTimeoutMS: 10_000,
    }).then((c) => {
      client = c
      return c
    })
  }
  return connectPromise
}

export async function getMongoDb(): Promise<Db> {
  const c = await getMongoClient()
  const dbName = process.env.MONGODB_DB ?? "liubai"
  return c.db(dbName)
}

export async function closeMongoClient(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    connectPromise = null
  }
}
