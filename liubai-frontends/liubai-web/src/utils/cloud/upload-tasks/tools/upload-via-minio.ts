import ider from "~/utils/basic/ider"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import fileHelper from "~/utils/files/file-helper"
import type { FileSetAPI } from "~/requests/req-types"
import type { LiuFileAndImage } from "~/types"
import type {
  UploadResolver,
  FileReqReturn,
  WhenAFileCompleted,
  UploadFileRes,
} from "./types"
import liuConsole from "~/utils/debug/liu-console"
import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"


async function _presign(
  key: string,
  contentType: string,
  fsize: number,
): Promise<FileSetAPI.Res_MinioPresign | null> {
  const url = APIs.UPLOAD_FILE
  const param: FileSetAPI.Param_MinioPresign = {
    operateType: "minio-presign",
    key,
    contentType,
    fsize,
  }
  const res = await liuReq.request<FileSetAPI.Res_MinioPresign>(url, param)
  if(res.code !== "0000" || !res.data) {
    console.warn("minio presign failed")
    console.log(res)
    return null
  }
  return res.data
}

async function _confirm(
  key: string,
  fsize: number,
): Promise<FileReqReturn | null> {
  const url = APIs.UPLOAD_FILE
  const param: FileSetAPI.Param_MinioConfirm = {
    operateType: "minio-confirm",
    key,
    fsize,
  }
  const res = await liuReq.request<FileSetAPI.Res_MinioConfirm>(url, param)
  if(!res.code) return null
  return res as FileReqReturn
}

async function _upload(
  f: File,
  uploadUrl: string,
) {
  const _wait = async (a: UploadResolver) => {
    try {
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: f,
      })
      if(!res.ok) {
        console.warn("minio PUT failed")
        console.log(res.status, res.statusText)
        a(null)
        return
      }
      a({ code: "0000" })
    }
    catch(err) {
      console.warn("minio PUT error")
      console.log(err)
      liuConsole.addBreadcrumb({
        category: "minio.upload",
        message: "upload file to minio error",
        level: "error",
      })
      liuConsole.sendException(err)
      a(null)
    }
  }

  return new Promise(_wait)
}


export async function uploadViaMinio(
  resUploadToken: FileSetAPI.Res_UploadToken,
  files: LiuFileAndImage[],
  aFileCompleted: WhenAFileCompleted,
): Promise<UploadFileRes> {
  const prefix = resUploadToken?.prefix ?? ""

  let tryTimes = 0
  let allHasCloudUrl = true

  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const f = fileHelper.storeToFile(v)
    if(!f) {
      console.warn("failed to convert store to file")
      return "other_err"
    }

    const suffix = valTool.getSuffix(f.name)
    const now = time.getTime()
    const nonce = ider.createFileNonce()
    const key = `${prefix}-${now}-${nonce}.${suffix}`

    const presign = await _presign(key, f.type, f.size)
    if(!presign) {
      tryTimes++
      if(tryTimes >= 3) return "network_err"
      i--
      continue
    }

    const putRes = await _upload(f, presign.uploadUrl)
    if(!putRes) {
      tryTimes++
      if(tryTimes >= 3) return "network_err"
      i--
      continue
    }

    const confirmRes = await _confirm(key, f.size)
    if(!confirmRes) {
      tryTimes++
      if(tryTimes >= 3) return "network_err"
      i--
      continue
    }

    aFileCompleted(v.id, confirmRes)

    const { code } = confirmRes
    if(code === "E4003") {
      return "too_frequent"
    }
    if(code === "E4010") {
      return "no_space"
    }

    const cloud_url = confirmRes.data?.cloud_url
    if(!cloud_url) {
      allHasCloudUrl = false
      liuConsole.addBreadcrumb({
        category: "upload.file",
        message: "there is no cloud_url in uploadViaMinio",
        level: "warning",
      })
      liuConsole.sendException(confirmRes)
    }
  }

  return allHasCloudUrl ? "completed" : "partial_success"
}
