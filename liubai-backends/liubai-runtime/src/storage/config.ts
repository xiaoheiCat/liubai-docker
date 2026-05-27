const MINIO_DEFAULTS: Record<string, string> = {
  LIU_STORAGE: "minio",
  LIU_MINIO_ENDPOINT: "http://minio:9000",
  LIU_MINIO_PUBLIC_URL: "http://localhost:19000",
  LIU_MINIO_ACCESS_KEY: "minioadmin",
  LIU_MINIO_SECRET_KEY: "minioadmin",
  LIU_MINIO_BUCKET: "liubai",
  LIU_MINIO_REGION: "us-east-1",
}

function envValue(key: string): string {
  return process.env[key]?.trim() ?? ""
}

export function applyDockerStorageDefaults(): void {
  const dockerOn = envValue("LIU_DOCKER") === "01"
  const storage = envValue("LIU_STORAGE")

  if(!dockerOn && storage !== "minio") {
    return
  }

  if(!storage) {
    process.env.LIU_STORAGE = "minio"
  }

  for(const [key, value] of Object.entries(MINIO_DEFAULTS)) {
    if(!envValue(key)) {
      process.env[key] = value
    }
  }
}

export function getStorageBackend(): "minio" | "qiniu" | "other" {
  const storage = envValue("LIU_STORAGE").toLowerCase()
  if(storage === "qiniu") {
    return "qiniu"
  }
  if(storage === "minio" || isMinioConfigured()) {
    return "minio"
  }
  return "other"
}

export function isMinioConfigured(): boolean {
  return Boolean(
    envValue("LIU_MINIO_ENDPOINT") &&
    envValue("LIU_MINIO_ACCESS_KEY") &&
    envValue("LIU_MINIO_SECRET_KEY") &&
    envValue("LIU_MINIO_BUCKET") &&
    envValue("LIU_MINIO_PUBLIC_URL"),
  )
}

export function getStorageHealthInfo() {
  return {
    backend: getStorageBackend(),
    liu_storage: envValue("LIU_STORAGE") || null,
    liu_docker: envValue("LIU_DOCKER") || null,
    minio_configured: isMinioConfigured(),
    minio_endpoint: envValue("LIU_MINIO_ENDPOINT") || null,
    minio_public_url: envValue("LIU_MINIO_PUBLIC_URL") || null,
    minio_bucket: envValue("LIU_MINIO_BUCKET") || null,
  }
}
