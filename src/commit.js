// @flow

import type Git from 'nodegit'

export async function getReadme (commit: Git.Commit) : Promise<string> {
  const tree = await commit.getTree()
  const entries = tree.entries()
  const re = /readme(.md)?/i
  const filtered = entries.filter(entry => 
    re.test(entry.name())
  )

  if (filtered.length !== 1) {
    throw Error('Multiple possible READMEs')
  }

  const blob = await filtered[0].getBlob()

  return String(blob)
}