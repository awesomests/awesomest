import Git from 'nodegit'
import { resolve } from 'path'
import {
  ensureFolderExists,
  folderExists,
  parentPath
} from './fs'

export function getRepository (repoId) {
  const folder = repoFolder(repoId)

  return ensureFolderExists(parentPath(folder))
    .then(() =>
      // TODO: check if folder is not a repo with only a .git folder
      folderExists(folder)
        ? Git.Repository.open(folder)
        : Git.Clone(repoUrl(repoId), folder)
    )
}

export function getAllCommits (repo) {
  return repo.getMasterCommit()
    .then(commit => new Promise((resolve, reject) => {
      const history = commit.history(Git.Revwalk.SORT.REVERSE)
      history.on('end', resolve)
      history.on('error', reject)
      history.start()
    }))
}

export function repoFolder ({ owner, name }) {
  return resolve(parentPath(__dirname), 'repos', owner, name)
}

export function repoUrl ({ owner, name }) {
  return `https://github.com/${owner}/${name}`
}