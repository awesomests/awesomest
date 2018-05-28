// @flow

import * as repo from './repo'
import * as commit from './commit'

import type { GitHubRepository } from './repo'

const awesome : GitHubRepository = {
  user: 'sindresorhus',
  name: 'awesome'
}

repo.getRepository(awesome)
  .then(repo => repo.getHeadCommit())
  .then(commit.getReadme)
  .then(console.log)
  .catch(console.error)