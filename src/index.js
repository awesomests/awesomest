// @flow

import fs from 'fs'
import { resolve } from 'path'
import git from 'nodegit'

import type Git from 'nodegit'

type GitHubUrl = string
type Path = string
type RepoUrl = {
  user: string,
  name: string
}

const awesome : RepoUrl = {
  user: 'sindresorhus',
  name: 'awesome'
}

function getRepository (repo : RepoUrl) : Promise<Git.Repository> {
  const folder = repoFolder(repo)

  return ensureFolderExists(parentPath(folder))
    .then(() =>
      folderExists(folder)
        ? git.Repository.open(folder)
        : git.Clone(repoUrl(repo), folder)
    )
}

function repoFolder (repo: RepoUrl) : Path {
  return resolve(parentPath(__dirname), 'repos', repo.user, repo.name)
}

function repoUrl (repo: RepoUrl) : GitHubUrl {
  return `https://github.com/${repo.user}/${repo.name}`
}

function ensureFolderExists (path : string) : Promise<void> {
  if (folderExists(path)) {
    return Promise.resolve()
  }

  return mkdir(path)
}

function folderExists (path: string) : boolean {
  return fs.existsSync(path)
}

function mkdir (path: string) : Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, 0o777, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

function parentPath(path : string) : string {
  return resolve(path, '../')
}

getRepository(awesome)
  .then(repo => repo.getHeadCommit())
  .then(commit => commit.getTree())
  .then(tree => tree.entries().map(e => e.name()))
  .then(console.log)
  .catch(console.error)