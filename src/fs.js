// @flow

import fs from 'fs'
import { resolve } from 'path'

export function ensureFolderExists (path : string) : Promise<void> {
  if (folderExists(path)) {
    return Promise.resolve()
  }

  return mkdir(path)
}

export function folderExists (path: string) : boolean {
  return fs.existsSync(path)
}

export function mkdir (path: string) : Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, 0o777, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export function parentPath(path : string) : string {
  return resolve(path, '../')
}