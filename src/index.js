// @flow

import * as repo from './repo'
import * as commit from './commit'
import * as markdown from './markdown'

import type MarkdownItT from 'markdown-it'
import type Token from 'markdown-it/lib/token'
import type { GitHubRepository } from './repo'

const awesome : GitHubRepository = {
  user: 'sindresorhus',
  name: 'awesome'
}

repo.getRepository(awesome)
  .then(repo => repo.getHeadCommit())
  .then(commit.getReadme)
  .then(markdown.parseMarkdown)
  .then(markdown.getLists)
  .then(t => {
    console.log(t)
  })
  .catch(console.error)
