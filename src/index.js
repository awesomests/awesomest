// @flow

import {
  getRepository
} from './repo'

import type { GitHubRepository } from './repo'

const awesome : GitHubRepository = {
  user: 'sindresorhus',
  name: 'awesome'
}

getRepository(awesome)
  .then(repo => repo.getHeadCommit())
  .then(commit => commit.getTree())
  .then(tree => tree.entries().map(e => e.name()))
  .then(console.log)
  .catch(console.error)