#! /usr/bin/env node
import { Command } from '@commander-js/extra-typings'
import { lerna } from './lerna'

const program = new Command()

program
  .name('cross-lerna')
  .argument('<command>', 'Execute a lerna command for npm and php packages')
  .option('--current-dir <currentDir>', 'Where to run lerna hybrid', '.')
  .option('--node-scope <nodeScope>', 'Run command accross node packages', 'true')
  .option('--php-scope <onlyPhp>', 'Run command accross php packages', 'true')
  .allowUnknownOption()
  .action(async (command, options) => {
    const lernaInstance = await lerna(options.currentDir)
    const lernaExecScope = {
      nodeScope: /true/i.test(options.nodeScope),
      phpScope: /true/i.test(options.phpScope),
    }
    console.log(lernaExecScope)
    try {
      if (command === 'install') {
        await lernaInstance.install()
      } else {
        await lernaInstance.exec(program.args, lernaExecScope)
      }
    } catch (e) {
      console.error(e)
      await lernaInstance.cleanPhpPackages()
    }
  })

program.parse()
