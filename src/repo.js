// @flow

import git from 'nodegit'
import { resolve } from 'path'
import {
  ensureFolderExists,
  folderExists,
  parentPath
} from './fs'

import type Git from 'nodegit'

export type GitHubRepository = {
  user: string,
  name: string
}

export function getRepository (repo : GitHubRepository) : Promise<Git.Repository> {
  const folder = repoFolder(repo)

  return ensureFolderExists(parentPath(folder))
    .then(() =>
      folderExists(folder)
        ? git.Repository.open(folder)
        : git.Clone(repoUrl(repo), folder)
    )
}

export function repoFolder ({ user, name }: GitHubRepository) : string {
  return resolve(parentPath(__dirname), 'repos', user, name)
}

export function repoUrl ({ user, name }: GitHubRepository) : string {
  return `https://github.com/${user}/${name}`
}