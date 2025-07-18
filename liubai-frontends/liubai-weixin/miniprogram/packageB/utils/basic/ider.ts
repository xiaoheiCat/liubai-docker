
/******************** constants ***************/
const NUMS = "123456789"
const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const abc = "abcdefghijkmnopqrstuvwxyz"


/********************* utils ****************/
type LimitType = "allowUppercase" | "onlyUppercase" | "onlyNumber" | "UppercaseAndNumber" | "onlyLowercase"

interface CreateRandomOpt {
  no_l_o?: boolean
  custom_alphabet?: string
}

// 创建随机字符串
export function createRandom(
  digits: number = 30,
  limitType?: LimitType,
  opt?: CreateRandomOpt,
) {
  let alphabet = NUMS + abc
  if(limitType === "allowUppercase") {
    alphabet += ABC
  }
  else if(limitType === "onlyNumber") {
    alphabet = NUMS
  }
  else if(limitType === "onlyUppercase") {
    alphabet = ABC
  }
  else if(limitType === "UppercaseAndNumber") {
    alphabet = ABC + NUMS
  }
  else if(limitType === "onlyLowercase") {
    alphabet = abc
  }
  
  if(opt?.custom_alphabet) {
    alphabet = opt.custom_alphabet
  }

  if(opt?.no_l_o) {
    alphabet = alphabet.replace("l", "").replace("o", "")
  }

  const charset = alphabet.length
  let randomString = ""
  for(let i=0; i<digits; i++) {
    const r = Math.floor(Math.random() * charset)
    randomString += alphabet[r]
  }
  return randomString
}


export function createFileNonce() {
  return createRandom(4)
}