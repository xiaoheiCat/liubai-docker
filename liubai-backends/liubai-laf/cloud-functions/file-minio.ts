// MinIO / S3-compatible storage for self-hosted Docker deployments

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import cloud from "@lafjs/cloud"
import { getNowStamp } from "@/common-time"
import type {
  FileSetAPI,
  LiuRqReturn,
  Table_User,
} from "@/common-types"
import {
  checkIfUserSubscribed,
  LiuDateUtil,
} from "@/common-util"
import { createFileRandom } from "@/common-ids"

const MB = 1024 * 1024
const MB_10 = 10 * MB
const MB_100 = 100 * MB

const db = cloud.database()

export function isMinioConfigured(): boolean {
  const e = process.env
  const storage = e.LIU_STORAGE?.trim().toLowerCase()

  if(storage === "qiniu") {
    return false
  }

  const hasMinioVars = Boolean(
    e.LIU_MINIO_ENDPOINT &&
    e.LIU_MINIO_ACCESS_KEY &&
    e.LIU_MINIO_SECRET_KEY &&
    e.LIU_MINIO_BUCKET,
  )

  if(storage === "minio") {
    return hasMinioVars
  }

  return hasMinioVars
}

export function preCheckForMinio(): LiuRqReturn | undefined {
  if(!isMinioConfigured()) {
    return {
      code: "E5001",
      errMsg: "minio endpoint, access_key, secret_key, and bucket are required",
    }
  }

  if(!process.env.LIU_MINIO_PUBLIC_URL) {
    return {
      code: "E5001",
      errMsg: "LIU_MINIO_PUBLIC_URL is required",
    }
  }
}

function getMinioConfig() {
  return {
    endpoint: process.env.LIU_MINIO_ENDPOINT ?? "",
    publicEndpoint: process.env.LIU_MINIO_PUBLIC_URL ?? "",
    accessKey: process.env.LIU_MINIO_ACCESS_KEY ?? "",
    secretKey: process.env.LIU_MINIO_SECRET_KEY ?? "",
    bucket: process.env.LIU_MINIO_BUCKET ?? "",
    region: process.env.LIU_MINIO_REGION ?? "us-east-1",
  }
}

function createS3Client(endpoint: string) {
  const cfg = getMinioConfig()
  return new S3Client({
    endpoint,
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKey,
      secretAccessKey: cfg.secretKey,
    },
    forcePathStyle: true,
  })
}

export function buildMinioUploadPrefix(
  user: Table_User,
  purpose?: FileSetAPI.Param["purpose"],
): string {
  const _env = process.env
  const isDev = _env.LIU_ENV_STATE === "dev"
  const folderPrefix = isDev ? "dev" : "prod"
  let folder = _env.LIU_MINIO_FOLDER || "users"
  const dateStr = LiuDateUtil.getYYYYMMDD()

  if(purpose === "avatar") {
    folder = `${folderPrefix}/avatars/${dateStr}`
  }
  else if(purpose === "coupon-upload") {
    folder = `${folderPrefix}/c1/${dateStr}`
  }
  else if(purpose === "coupon-tmp") {
    folder = `${folderPrefix}/c2/${dateStr}`
  }

  const r = createFileRandom()
  return `${folder}/${user._id}-${r}`
}

function buildCloudUrl(key: string): string {
  const cfg = getMinioConfig()
  const publicBase = cfg.publicEndpoint.replace(/\/$/, "")
  return `${publicBase}/${cfg.bucket}/${key}`
}

function keyBelongsToUser(key: string, userId: string): boolean {
  return key.includes(`/${userId}-`) || key.startsWith(`${userId}-`)
}

export function getUploadTokenViaMinio(
  user: Table_User,
  body: FileSetAPI.Param,
): LiuRqReturn<FileSetAPI.Res_UploadToken> {
  const prefix = buildMinioUploadPrefix(user, body.purpose)

  return {
    code: "0000",
    data: {
      cloudService: "minio",
      uploadToken: "",
      prefix,
    },
  }
}

export async function minioPresign(
  user: Table_User,
  body: FileSetAPI.Param_MinioPresign,
): Promise<LiuRqReturn<FileSetAPI.Res_MinioPresign>> {
  const { key, contentType, fsize } = body

  if(!keyBelongsToUser(key, user._id)) {
    return { code: "E4003", errMsg: "invalid object key" }
  }

  const hasSubscribed = checkIfUserSubscribed(user)
  const maxSize = hasSubscribed ? MB_100 : MB_10
  if(typeof fsize === "number" && fsize > maxSize) {
    return { code: "E4010", errMsg: "file too large" }
  }

  const cfg = getMinioConfig()
  const client = createS3Client(cfg.publicEndpoint)
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  })
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })

  return {
    code: "0000",
    data: {
      uploadUrl,
      key,
    },
  }
}

export async function minioConfirm(
  user: Table_User,
  body: FileSetAPI.Param_MinioConfirm,
): Promise<LiuRqReturn<FileSetAPI.Res_MinioConfirm>> {
  const { key, fsize } = body

  if(!keyBelongsToUser(key, user._id)) {
    return { code: "E4003", errMsg: "invalid object key" }
  }

  if(!fsize || fsize < 1) {
    return { code: "E4000", errMsg: "fsize is required" }
  }

  const hasSubscribed = checkIfUserSubscribed(user)
  const maxSize = hasSubscribed ? MB_100 : MB_10
  if(fsize > maxSize) {
    return { code: "E4010", errMsg: "file too large" }
  }

  const cfg = getMinioConfig()
  const client = createS3Client(cfg.endpoint)

  try {
    await client.send(new HeadObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
    }))
  }
  catch(err) {
    console.warn("minio confirm: object not found")
    console.log(err)
    return { code: "E4004", errMsg: "object not found" }
  }

  await recordMinioQuota(user._id, fsize)

  return {
    code: "0000",
    data: {
      cloud_url: buildCloudUrl(key),
    },
  }
}

async function recordMinioQuota(
  userId: string,
  fsizeBytes: number,
) {
  let theSize = Math.round(fsizeBytes / 1024)
  if(theSize < 1) theSize = 1

  const col_user = db.collection("User")
  const res1 = await col_user.doc(userId).get<Table_User>()
  const theUser = res1.data
  if(!theUser) {
    console.warn(`cannot find the user: ${userId}`)
    return false
  }

  let total_size = theUser.total_size ?? 0
  let upload_size = theUser.upload_size ?? 0
  total_size += theSize
  upload_size += theSize

  const cfg: Partial<Table_User> = {
    total_size,
    upload_size,
    updatedStamp: getNowStamp(),
  }
  const q2 = col_user.where({ _id: userId })
  await q2.update(cfg)

  return true
}
