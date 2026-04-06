function normalizeModuleId(id: string) {
  return id.replace(/[\\]/g, "/")
}

function normalizePackageName(name: string) {
  return name
    .replace(/^@/, "")
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
}

function getPackageName(id: string) {
  const normalizedId = normalizeModuleId(id)
  const parts = normalizedId.split("node_modules/")
  const modulePath = parts.at(-1)
  if (!modulePath) return null

  const segments = modulePath.split("/")
  const first = segments[0]
  if (!first) return null

  if (first.startsWith("@")) {
    const second = segments[1]
    if (!second) return normalizePackageName(first)
    return normalizePackageName(`${first}/${second}`)
  }

  return normalizePackageName(first)
}

const vendorChunkRules: { patterns: string[]; chunk: string }[] = [
  { patterns: ["/vue/", "/vue-router/", "/pinia/"], chunk: "vue-core" },
  { patterns: ["/vue-i18n/", "/@intlify/"], chunk: "vue-i18n" },
  { patterns: ["/floating-vue/", "/@floating-ui/", "/vue-slicksort/", "/vue-draggable-resizable/"], chunk: "ui-vendor" },
  { patterns: ["/dexie/", "/flexsearch/"], chunk: "search-vendor" },
]

function getVendorChunkName(moduleId: string) {
  const id = normalizeModuleId(moduleId)
  if (!id.includes("node_modules")) return null

  for (const rule of vendorChunkRules) {
    if (rule.patterns.some((p) => id.includes(p))) {
      return rule.chunk
    }
  }

  const packageName = getPackageName(id)
  if (packageName) {
    return `vendor-${packageName}`
  }

  return "vendor"
}

export const vendorCodeSplitting = {
  groups: [
    {
      test: "node_modules",
      minSize: 12 * 1024,  // 12 KB
      name: getVendorChunkName,
    },
  ],
}
