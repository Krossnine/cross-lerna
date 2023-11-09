#! /usr/bin/env node
import { Command } from '@commander-js/extra-typings'
import { lerna } from './lerna'

const program = new Command()

program
  .name('cross-lerna')
  .argument('<command>', 'Execute a lerna command for npm and php packages')
  .option('--current-dir <currentDir>', 'Where to run lerna hybrid', '.')
  .allowUnknownOption()
  .action(async (command, options) => {
    const lernaInstance = await lerna(options.currentDir)
    try {
      if (command === 'install') {
        await lernaInstance.install()
      } else {
        await lernaInstance.exec(program.args)
      }
    } catch (e) {
      console.error(e)
      await lernaInstance.cleanPhpPackages()
    }
  })

program.parse()
