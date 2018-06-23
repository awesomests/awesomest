import * as repositories from '../repo'
import { getCommitData } from '../commit'
import * as markdown from '../markdown'
import * as utils from '../utils'

export default class List {
  owner = ''
  name = ''
  title = ''
  description = ''
  category = null
  links = []

  constructor (owner, name, title, description) {
    this.owner = owner
    this.name = name
    this.title = title
    this.description = description
  }

  async getLinks () {
    const commits = await repositories.getRepository(this)
      .then(repositories.getAllCommits)
      .then(commits => Promise.all(commits.map(getCommitData)))

    const links = this.links = []

    for (let commit of commits) {
      for (let diff of commit.diffs) {
        for (let line of diff.lines) {
          const { origin } = line
          const urls = utils.findAllUrls(line.content)

          for (let url of urls) {
            if (!url.startsWith('http')) {
              continue
            }

            links.push({
              origin,
              url,
              commit,
            })
          }
        }
      }
    }
  }

  // static fromUrl (url) {
  //   const parsed = utils.parseRepoUrl(url)

  //   if (!parsed) {
  //     throw new Error(`Could not infer repo from ${url}`)
  //   }

  //   const [, owner, name] = parsed

  //   return new List(owner, name)
  // }
}