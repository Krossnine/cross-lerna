import fs from 'fs/promises'

export async function ensureFile(filepath: string) {
  try {
    return await fs.access(filepath, fs.constants.F_OK)
  } catch (e) {
    return console.error(`Could not find ${filepath}`)
  }
}

export async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath, fs.constants.F_OK)
    return true
  } catch (e) {
    return false
  }
}

export async function openJsonFile(filepath: string): Promise<object> {
  return JSON.parse(await fs.readFile(filepath, 'utf-8'))
}

export async function createJsonFile(filepath: string, content: object) {
  await fs.writeFile(filepath, JSON.stringify(content, null, 2))
}

export async function deleteFile(filePath: string) {
  try {
    await fs.unlink(filePath)
  } catch {
    return
  }
}
