import crypto from "node:crypto"

function trimPemContents(str: string, direction: 1 | -1) {
  let initNum = direction === 1 ? 0 : str.length - 1
  for (let i = initNum; i < str.length && i >= 0; i += direction) {
    const v = str[i]
    if (v === "-" || v === "\n") {
      if (direction > 0) {
        str = str.substring(1)
        i--
      } else {
        str = str.substring(0, str.length - 1)
      }
      continue
    }
    break
  }
  return str
}

function getPemContents(pem: string, pemHeader: string, pemFooter: string) {
  let pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length)
  pemContents = trimPemContents(pemContents, 1)
  pemContents = trimPemContents(pemContents, -1)
  return pemContents
}

async function importRsaPublicKey(pem: string) {
  const pemHeader = "-----BEGIN PUBLIC KEY-----"
  const pemFooter = "-----END PUBLIC KEY-----"
  const pemContents = getPemContents(pem, pemHeader, pemFooter)
  const binaryDer = Buffer.from(pemContents, "base64")
  return crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  )
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  return Buffer.from(arrayBuffer).toString("base64")
}

async function createKeyWithAES() {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  )
  const res = await crypto.subtle.exportKey("raw", key)
  return arrayBufferToBase64(res)
}

async function encryptWithRSA(publicKey: NonNullable<Awaited<ReturnType<typeof importRsaPublicKey>>>, plainText: string) {
  const encoded = new TextEncoder().encode(plainText)
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey as unknown as CryptoKey,
    encoded,
  )
  return arrayBufferToBase64(cipherBuffer)
}

export async function createClientKey(pemPublicKey: string) {
  const aesKey = await createKeyWithAES()
  if (!aesKey) return {}

  const clientKey = `client_key_${aesKey}`
  const pk = await importRsaPublicKey(pemPublicKey)
  if (!pk) return {}

  const cipher = await encryptWithRSA(pk, clientKey)
  return { aesKey, cipher }
}
