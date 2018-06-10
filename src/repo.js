import git from 'nodegit'
import { resolve } from 'path'
import {
  ensureFolderExists,
  folderExists,
  parentPath
} from './fs'

export function getRepository (repo) {
  const folder = repoFolder(repo)

  return ensureFolderExists(parentPath(folder))
    .then(() =>
      folderExists(folder)
        ? git.Repository.open(folder)
        : git.Clone(repoUrl(repo), folder)
    )
}

export function repoFolder ({ user, name }) {
  return resolve(parentPath(__dirname), 'repos', user, name)
}

export function repoUrl ({ user, name }) {
  return `https://github.com/${user}/${name}`
}