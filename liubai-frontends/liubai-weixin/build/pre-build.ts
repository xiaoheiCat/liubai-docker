import fs from "fs"
import path from "path"
import dotenv from "dotenv"

const isProduction = process.argv.includes('--production');

function handleEnv() {

  // 1. load .env
  const path1 = path.resolve(__dirname, "../.env")
  const cfg1 = dotenv.config({ path: path1 }).parsed ?? {}

  // 2. load .env.local
  const path2 = path.resolve(__dirname, "../.env.local")
  const cfg2 = dotenv.config({ path: path2 }).parsed ?? {}

  // 3. load .env.production or .env.development
  const proOrDev = isProduction ? "production" : "development"
  const path3 = path.resolve(__dirname, `../.env.${proOrDev}`)
  const cfg3 = dotenv.config({ path: path3 }).parsed ?? {}

  // 4. load .env.development.local or .env.production.local
  const path4 = path.resolve(__dirname, `../.env.${proOrDev}.local`)
  const cfg4 = dotenv.config({ path: path4 }).parsed ?? {}

  // 5. merge environment variables
	const mergedEnvConfig = { ...cfg1, ...cfg2, ...cfg3, ...cfg4 }
  return mergedEnvConfig
}


function main() {
  const envCfg = handleEnv()
  const strEnvCfg = JSON.stringify(envCfg, null, 2)
  const preCfgStr = `export default ${strEnvCfg}`
  const preCfgPath = path.resolve(__dirname, "../miniprogram/config/pre_config.ts")
  fs.writeFileSync(preCfgPath, preCfgStr)
}

main()


