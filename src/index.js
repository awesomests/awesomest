// @flow

import * as repo from './repo'
import * as commit from './commit'
import * as markdown from './markdown'

import type { GitHubRepository } from './repo'

const awesome : GitHubRepository = {
  user: 'sindresorhus',
  name: 'awesome'
}

repo.getRepository(awesome)
  .then(repo => repo.getHeadCommit())
  .then(commit.getReadme)
  .then(markdown.getCategories)
  .then(t => {
    console.log(t)
  })
  .catch(console.error)
