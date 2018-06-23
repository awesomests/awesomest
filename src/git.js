import * as utils from './utils'

export async function getReadme (commit) {
  if (!commit) {
    throw new Error('Trying to get README from null commit')
  }

  const tree = await commit.getTree()
  const entries = tree.entries()
  // https://github.com/Awesome-Windows/Awesome has `README-cn.md`
  const re = /readme(.md)?$/i
  const filtered = entries.filter(entry => 
    re.test(entry.name())
  )

  if (filtered.length > 1) {
    throw Error('Multiple possible READMEs')
  }

  if (filtered.length === 0) {
    throw Error('No READMEs found')
  }

  const blob = await filtered[0].getBlob()

  return String(blob)
}

export async function getCommitData (commit) {
  const sha = commit.sha()
  const summary = commit.summary()
  const message = commit.message()
  const date = commit.date()
  const parents = (await commit.getParents())
    .map(parent => parent.sha())

  const signature = commit.author()
  const author = {
    name: signature.name(),
    email: signature.email()
  }

  const diffList = await Promise.all(
    (await commit.getDiff())
      .map(async diff => {
        const convenientPatches = await diff.patches()
        // const oldFile = convenientPatches[0].oldFile()
        return Promise.all(convenientPatches.map(async convenientPatch => {
          const oldFileName = convenientPatch.oldFile().path()
          const newfileName = convenientPatch.newFile().path()

          if (oldFileName !== newfileName) {
            throw new Error('Expected ConvenientPatch old and new names to be the same')
          }

          const name = oldFileName
          const hunks = await convenientPatch.hunks()

          const lines = utils.flatten(
            await Promise.all(
              hunks.map(async hunk => {
                const diffLines = await hunk.lines()

                return diffLines
                  .map(diffLine => ({
                    origin: String.fromCharCode(diffLine.origin()),
                    newLineNo: diffLine.newLineno(),
                    oldLineNo: diffLine.oldLineno(),
                    content: diffLine.content()
                  }))
              })
            )
          )

          return {
            name,
            lines
          }
        }))
      })
  )

  /*
    We have an interesting case here.

    'Merge pull request' and 'Merged branch' commits have multiple diffList
    entries and each entry represents a parent commit.

    Since I don't want to quantify duplicate additions/deletions I'll ignore those later.

    The check below is just to make sure I didn't assumed the explanation above wrongly.
   */
  const isMergeCommit = diffList.length > 1 && parents.length > 1 && parents.length === diffList.length

  if (diffList.length > 1 && parents.length > 1 && parents.length !== diffList.length) {
    throw new Error('Commit diffList has length different from the parent count')
  }

  if (!isMergeCommit && diffList.length > 1) {
    throw new Error('Commit that !isMergeCommit should have only one entry on diffList')
  }

  const diffs = diffList[0]
  
  return {
    sha,
    summary,
    message,
    date,
    parents,
    author,
    isMergeCommit,
    diffs,
  }
}