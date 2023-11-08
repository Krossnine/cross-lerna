import * as child from 'child_process'

export async function executeCommand(cmd: string) {
  return new Promise((resolve, reject) => {
    child.exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      }
      console.log(stdout)
      console.log(stderr)
      resolve({ stdout, stderr })
    })
  })
}
