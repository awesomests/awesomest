import fs from 'fs'
import { resolve } from 'path'

export function ensureFolderExists (path) {
  if (folderExists(path)) {
    return Promise.resolve()
  }

  return mkdir(path)
}

export function folderExists (path) {
  return fs.existsSync(path)
}

export function mkdir (path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, 0o777, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export function parentPath (path) {
  return resolve(path, '../')
}