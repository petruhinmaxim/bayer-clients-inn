import fs from 'fs'

export function ensureDir(path: string) {
  if (fs.existsSync(path)) {
    const stat = fs.statSync(path)
    if (stat.isFile()) {
      fs.rmSync(path)
      fs.mkdirSync(path, { recursive: true })
    }
  } else {
    fs.mkdirSync(path, { recursive: true })
  }
  return path
}
