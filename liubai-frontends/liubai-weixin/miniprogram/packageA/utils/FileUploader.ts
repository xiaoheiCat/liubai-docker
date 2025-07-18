import APIs from "~/requests/APIs"
import { LiuReq } from "~/requests/LiuReq"
import { createFileNonce } from "~/utils/basic/ider"
import { LiuTime } from "~/utils/LiuTime"
import valTool from "~/utils/val-tool"
import { envData } from "~/config/env-data"
import { LiuApi } from "~/utils/LiuApi"
import type { DataPass, DataPass_A } from "~/types/index"
import type { FilePurpose } from "~/types/types-atom"
import type { FileSetAPI } from "~/requests/req-types"

export type ImageUploaderResult = DataPass<string>
export type ImageUploaderResolver = (res: ImageUploaderResult) => void

export class FileUploader {

  private static async getQiniuToken(purpose: FilePurpose) {
    const body: FileSetAPI.Param = {
      operateType: "get-upload-token",
      purpose,
    }
    const url = APIs.UPLOAD_FILE
    const res = await LiuReq.request<FileSetAPI.Res_UploadToken>(
      url, 
      body,
    )
    console.log("tokenRes: ", res)
    return res
  }

  static async uploadViaQiniu(
    localPath: string, 
    purpose: FilePurpose,
  ): Promise<ImageUploaderResult> {
    // 0. get upload url
    const failResult: DataPass_A = {
      pass: false, 
      errMsg: "",
    }
    const uploadUrl = envData.LIU_QINIU_UPLOAD
    if(!uploadUrl) {
      console.warn("fail to get upload url")
      failResult.errMsg = "fail to get upload url"
      return valTool.getPromise(failResult)
    }

    // 1. get token
    const tokenRes = await this.getQiniuToken(purpose)
    if (tokenRes.code !== "0000" || !tokenRes.data) {
      console.warn("fail to get token for uploading", tokenRes)
      failResult.errMsg = "fail to get token for uploading"
      return valTool.getPromise(failResult)
    }

    // 2. get required params
    const dataForUpload = tokenRes.data
    const token = dataForUpload.uploadToken
    const prefix = dataForUpload?.prefix ?? ""
    const suffix = valTool.getSuffix(localPath)
    const now = LiuTime.getTime()
    const nonce = createFileNonce()
    const key = `${prefix}-${now}-${nonce}.${suffix}`

    // 3. to upload
    const _wait = (a: ImageUploaderResolver) => {
      LiuApi.uploadFile({
        url: uploadUrl,
        filePath: localPath,
        name: "file",
        formData: {
          token,
          key,
        },
        success(res) {
          console.log("upload success: ", res)

          if(res.statusCode === 200 && res.data) {
            const result = valTool.strToObj(res.data)
            const cloud_url = result?.data?.cloud_url
            if(result.code === "0000" && cloud_url) {
              a({ pass: true, data: cloud_url })
              return
            }
          }

          failResult.errMsg = "fail to upload"
          failResult.errData = res
          a(failResult)
        },
        fail(err) {
          console.warn("upload failed: ", err)
          failResult.errMsg = "upload failed"
          a(failResult)
        }
      })
    }
    
    return new Promise(_wait)
  }

}