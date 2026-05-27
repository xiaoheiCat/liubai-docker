import type { Db as LafDb } from "database-proxy"
import { getDb } from "database-proxy/dist/dbi/index.js"
import { MongoAccessor } from "database-proxy/dist/accessor/mongo.js"
import type { MongoClient } from "mongodb"
import { sharedStore } from "./shared.ts"
import { getMongoClient, getMongoDb } from "./mongo-client.ts"
import type { FunctionContext } from "../types/function-context.ts"

export type { FunctionContext }

let lafDb: LafDb | null = null
let mongoAccessor: MongoAccessor | null = null
let mongoDriver: { client: MongoClient; db: Awaited<ReturnType<typeof getMongoDb>> } | null = null

async function ensureAccessor(): Promise<MongoAccessor> {
  if (mongoAccessor) return mongoAccessor
  const client = await getMongoClient()
  mongoAccessor = new MongoAccessor(client)
  return mongoAccessor
}

async function ensureMongoDriver() {
  if (mongoDriver) return mongoDriver
  const client = await getMongoClient()
  const db = await getMongoDb()
  mongoDriver = { client, db }
  return mongoDriver
}

const cloud = {
  database(): LafDb {
    if (!lafDb) {
      throw new Error("cloud.database() called before MongoDB init. Call initCloudShim() first.")
    }
    return lafDb
  },

  get shared(): Map<string, unknown> {
    return sharedStore
  },

  get mongo() {
    if (!mongoDriver) {
      throw new Error("cloud.mongo accessed before MongoDB init. Call initCloudShim() first.")
    }
    return mongoDriver
  },

  get env() {
    return process.env
  },

  get appid() {
    return process.env.APPID ?? "liubai"
  },

  get sockets() {
    return new Set<unknown>()
  },

  async invoke(_name: string, _param?: FunctionContext) {
    throw new Error("cloud.invoke is not supported in liubai-runtime")
  },

  getToken(_payload: unknown, _secret?: string) {
    return ""
  },

  parseToken(_token: string, _secret?: string) {
    return null
  },
}

export async function initCloudShim(): Promise<void> {
  const accessor = await ensureAccessor()
  lafDb = getDb(accessor)
  await ensureMongoDriver()
}

export default cloud
