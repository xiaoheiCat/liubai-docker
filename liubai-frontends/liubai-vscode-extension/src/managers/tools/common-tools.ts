import type { LiuSpaceAndMember } from "~/types/types-cloud"
import liuUtil from "~/utils/liu-util"


/** 拿到 RSA Public Key 之后，去生成的 AES key，并对其加密 */
export async function createClientKey(
  pem_public_key: string
) {
  const aesKey = await liuUtil.crypto.createKeyWithAES()
  if(!aesKey) {
    console.warn("fail to create aes key")
    return {}
  }

  const client_key = `client_key_${aesKey}`
  const pk = await liuUtil.crypto.importRsaPublicKey(pem_public_key)
  if(!pk) {
    console.warn("fail to import rsa key")
    return {}
  }
  const cipher = await liuUtil.crypto.encryptWithRSA(pk, client_key)
  return { aesKey, cipher }
}

export function getMyDataFromSpaceMemberList(
  spaceMemberList: LiuSpaceAndMember[],
) {
  const personalMember = spaceMemberList.find(v => v.spaceType === "ME")
  if(!personalMember) return {}

  return {
    personal_space_id: personalMember.spaceId,
    nickname: personalMember.member_name,
  }
}