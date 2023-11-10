import { createJsonFile, deleteFile, ensureFile, fileExists, openJsonFile } from './file'
import { executeCommand } from './command'
import { glob } from 'glob'
import path from 'path'

const COMPOSER_FILENAME = 'composer.json'
const LERNA_FILENAME = 'lerna.json'
const PACKAGE_FILENAME = 'package.json'

enum PackageType {
  PHP = 'PHP',
  NODE = 'NODE',
}

interface PackageDescriptor {
  name: string
  version: string
  scripts: object
  workspaces: {
    packages: Array<string>
  }
}

interface PackageInfo {
  name: string
  version: string
  scripts: object
  path: string
  descriptorFilePath: string
  packageFilePath: string
  type: PackageType
}

async function openPackageDescriptor(descriptorFilePath: string): Promise<PackageDescriptor> {
  const descriptorContent = (await openJsonFile(descriptorFilePath)) as PackageDescriptor
  return {
    name: descriptorContent.name || '',
    version: descriptorContent.version || '',
    scripts: descriptorContent.scripts || {},
    workspaces: descriptorContent.workspaces?.packages ? descriptorContent.workspaces : { packages: [] },
  }
}

async function parsePackage(packagePath: string): Promise<PackageInfo> {
  const composerFilePath = path.join(packagePath, COMPOSER_FILENAME)
  const packageFilePath = path.join(packagePath, PACKAGE_FILENAME)
  const composerExists = await fileExists(composerFilePath)
  const type = composerExists ? PackageType.PHP : PackageType.NODE
  const descriptorFilePath = type === PackageType.PHP ? composerFilePath : packageFilePath
  const descriptorFileContent = (await openPackageDescriptor(descriptorFilePath)) as PackageDescriptor

  return {
    name: descriptorFileContent.name,
    version: descriptorFileContent.version,
    scripts: descriptorFileContent.scripts,
    path: packagePath,
    descriptorFilePath,
    packageFilePath,
    type,
  }
}

async function parseGlobPackages(directory: string, globPattern: string): Promise<Array<PackageInfo>> {
  const descriptorFilePaths = await glob(`/${globPattern}`, { root: directory })
  return Promise.all(descriptorFilePaths.map(parsePackage))
}

async function parsePackages(directory: string): Promise<Array<PackageInfo>> {
  const lernaFilePath = path.join(directory, LERNA_FILENAME)
  const rootPackageFilePath = path.join(directory, PACKAGE_FILENAME)
  await ensureFile(lernaFilePath)
  await ensureFile(rootPackageFilePath)

  const rootPackage = (await openPackageDescriptor(rootPackageFilePath)) as PackageDescriptor
  const globPatterns = rootPackage.workspaces.packages
  let packages: Array<PackageInfo> = []
  for (const globPattern of globPatterns) {
    packages = packages.concat(await parseGlobPackages(directory, globPattern))
  }
  return packages
}

export interface LernaExecScope {
  nodeScope: boolean
  phpScope: boolean
}

export async function lerna(directory: string) {
  const packages = await parsePackages(directory)
  const phpPackages = packages.filter((packageInfo: PackageInfo) => packageInfo.type === PackageType.PHP)
  const nodePackages = packages.filter((packageInfo: PackageInfo) => packageInfo.type === PackageType.NODE)

  async function preparePhpPackage(packageInfo: PackageInfo) {
    const fakePackage = {
      name: packageInfo.name.startsWith('@') ? packageInfo.name : `@${packageInfo.name}`,
      version: packageInfo.version,
      private: true,
      scripts: packageInfo.scripts || {},
    }
    await createJsonFile(packageInfo.packageFilePath, fakePackage)
  }

  async function preparePhpPackages() {
    for (const packageInfo of phpPackages) {
      await preparePhpPackage(packageInfo)
    }
  }

  async function cleanPhpPackages() {
    for (const packageInfo of phpPackages) {
      await deleteFile(packageInfo.packageFilePath)
    }
  }

  async function installPhpPackages() {
    for (const packageInfo of phpPackages) {
      const lernaCommand = `cd ${packageInfo.path} && composer install --ansi`
      await executeCommand(lernaCommand)
    }
  }

  async function exec(args: Array<string>, lernaScope: LernaExecScope) {
    try {
      if (lernaScope.phpScope) {
        await preparePhpPackages();
        await installPhpPackages()
      } else {
        await cleanPhpPackages();
      }
      const filterPackagesArgs = lernaScope.nodeScope
        ? []
        : nodePackages.map((nodePackage) => `--ignore ${nodePackage.name}`)
      const lernaCommand = `cd ${directory} && npx lerna ${args.concat(filterPackagesArgs).join(' ')}`
      await executeCommand(lernaCommand)
      await cleanPhpPackages()
    } catch(err) {
      await cleanPhpPackages()
    }
  }

  return {
    exec,
  }
}
