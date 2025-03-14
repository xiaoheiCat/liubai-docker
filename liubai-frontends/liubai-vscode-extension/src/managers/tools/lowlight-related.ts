

function showProgrammingLanguages() {
  const list = [
    'Arduino', 
    'Bash', 
    'C', 'cpp', 'Csharp', 'CSS', 
    'Dart', 'Diff', 
    'Go', 'GraphQL', 
    'HTML', 
    'ini', 
    'Java', 'JavaScript', 'JSON', 
    'Kotlin', 
    'less', 'Lua', 
    'Makefile', 'Markdown', 
    'Objective-C', 
    'Perl', 'PHP', 'php-template', 'Plain Text', 'Python', 'Python-repl', 
    'R', 'Ruby', 'Rust', 
    'scss', 'Shell', 'SQL', 'Swift', 
    'TypeScript', 
    'Vbnet', 
    'WASM', 
    'XML', 
    'YAML',
  ]
  return list
}

export function languageIdToSupported(id: string) {
  // 1. special cases
  if(id === "plaintext") {
    return id
  }
  if(id === "objective-c") {
    return "objectivec"
  }

  // 2. normalize
  const list = showProgrammingLanguages()
  const list2 = list.map(v => v.toLowerCase())
  const v2 = list2.find(v => v === id)
  return v2
}