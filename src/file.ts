import fs from 'fs/promises'

export async function ensureFile(filepath: string) {
  try {
    return await fs.access(filepath, fs.constants.F_OK)
  } catch (e) {
    return console.error(`Could not find ${filepath}`)
  }
}

export async function openJsonFile(filepath: string) {
  return JSON.parse(await fs.readFile(filepath, 'utf-8'))
}

export async function createJsonFile(filepath: string, content: object) {
  await fs.writeFile(filepath, JSON.stringify(content, null, 2))
}

export async function deleteFile(filePath: string) {
  await fs.unlink(filePath)
}
