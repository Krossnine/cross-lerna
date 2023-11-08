import { ensureFile, openJsonFile, createJsonFile, deleteFile } from './file'
import { executeCommand } from './command'
import { glob } from 'glob'
import path from 'path'

const COMPOSER_FILENAME = 'composer.json'
const LERNA_FILENAME = 'lerna.json'
const PACKAGE_FILENAME = 'package.json'

async function initContext(directory: string) {
  const lernaFilePath = path.join(directory, LERNA_FILENAME)
  const rootPackageFilePath = path.join(directory, PACKAGE_FILENAME)
  await ensureFile(lernaFilePath)
  await ensureFile(rootPackageFilePath)

  const rootPackage = await openJsonFile(rootPackageFilePath)
  const globPatterns = rootPackage?.workspaces?.packages
  const findPhpPackage = (globPattern: string) => glob(`/${globPattern}/${COMPOSER_FILENAME}`, { root: directory })
  const composerFilePaths = await Promise.all(globPatterns.map(findPhpPackage)).then((x) => x.flat(Infinity))

  return {
    composerFilePaths,
  }
}

export async function lerna(directory: string) {
  const context = await initContext(directory)

  async function preparePhpPackage(composerFilePath: string) {
    const composerContent = await openJsonFile(composerFilePath)
    const composerPackageDirectory = path.dirname(composerFilePath)
    const fakePackage = {
      name: composerContent.name.startsWith('@') ? composerContent.name : `@${composerContent.name}`,
      version: composerContent.version,
      private: true,
      scripts: composerContent.scripts || {},
    }
    const fakePackagePath = path.join(composerPackageDirectory, PACKAGE_FILENAME)
    await createJsonFile(fakePackagePath, fakePackage)
  }

  async function preparePhpPackages() {
    for (const composerFilePath of context.composerFilePaths) {
      await preparePhpPackage(composerFilePath)
    }
  }

  async function cleanPhpPackages() {
    for (const composerFilePath of context.composerFilePaths) {
      const packageFilePath = composerFilePath.replace(COMPOSER_FILENAME, PACKAGE_FILENAME)
      await deleteFile(packageFilePath)
    }
  }

  async function exec(args: Array<string>) {
    await preparePhpPackages()
    const lernaCommand = `cd ${directory} && npx lerna ${args.join(' ')}`
    await executeCommand(lernaCommand)
    await cleanPhpPackages()
  }

  async function install() {
    for (const composerFilePath of context.composerFilePaths) {
      const composerPackageDirectory = path.dirname(composerFilePath)
      const lernaCommand = `cd ${composerPackageDirectory} && composer install`
      await executeCommand(lernaCommand)
    }
  }

  return {
    exec,
    install,
    cleanPhpPackages,
  }
}
