import type { FunctionContext } from "../types/function-context.ts"
import { getStorageBackend } from "./config.ts"
import { handleMinioFileSet } from "./minio-file-set.ts"

export async function handleFileSetRequest(
  ctx: FunctionContext,
): Promise<unknown | null> {
  if(getStorageBackend() !== "minio") {
    return null
  }

  return handleMinioFileSet(ctx)
}
