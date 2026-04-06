type VConsoleCtor = new (options?: Record<string, unknown>) => {
  destroy?: () => void
}

const VCONSOLE_SCRIPT_ID = "liu-vconsole-script"
const VCONSOLE_URL = "/vendor/vconsole.min.js"
const VCONSOLE_TIMEOUT = 4000

export async function getVConsole() {
  if(typeof window === "undefined") return null

  const vConsoleFromWindow = (window as any).VConsole as VConsoleCtor | undefined
  if(vConsoleFromWindow) {
    return vConsoleFromWindow
  }

  try {
    const ctor = await loadVConsoleScript(VCONSOLE_URL)
    if(ctor) return ctor
  }
  catch(err) {
    console.warn("failed to load vconsole from local asset", err)
  }

  return null
}

function loadVConsoleScript(url: string): Promise<VConsoleCtor | null> {
  return new Promise((resolve, reject) => {
    const vConsoleFromWindow = (window as any).VConsole as VConsoleCtor | undefined
    if(vConsoleFromWindow) {
      resolve(vConsoleFromWindow)
      return
    }

    const existing = document.getElementById(VCONSOLE_SCRIPT_ID) as HTMLScriptElement | null
    if(existing) {
      existing.addEventListener("load", () => {
        resolve((window as any).VConsole ?? null)
      }, { once: true })
      existing.addEventListener("error", () => {
        reject(new Error("existing vconsole script failed to load"))
      }, { once: true })
      return
    }

    const script = document.createElement("script")
    script.id = VCONSOLE_SCRIPT_ID
    script.src = url
    script.async = true
    const timer = window.setTimeout(() => {
      cleanup()
      script.remove()
      reject(new Error(`loading vconsole timed out: ${url}`))
    }, VCONSOLE_TIMEOUT)
    const cleanup = () => {
      window.clearTimeout(timer)
      script.onload = null
      script.onerror = null
    }
    script.onload = () => {
      cleanup()
      resolve((window as any).VConsole ?? null)
    }
    script.onerror = () => {
      cleanup()
      script.remove()
      reject(new Error(`failed to load script: ${url}`))
    }
    document.head.appendChild(script)
  })
}
