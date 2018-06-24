import * as repositories from '../repo'
import * as git from '../git'
import * as markdown from '../markdown'
import * as utils from '../utils'
import * as database from '../database'

import List from '../models/List'

const APROXIMATE_SQLITE_VAR_MAX = 500

const listBlacklist = [
  'awesome-macos-command-line',
  'Awesome-Swift-Education',
  'awesome-kotlin',

  // wont clone:
  'awesome-ios-ui', 
  'awesome-android-ui',
  'awesome-leading-and-managing',
  
  // readme.rst damn:
  'speech-language-processing',
  'awesome-public-datasets',
  'awesome-sqlalchemy',

  // readme.org (wonder why...)
  'awesome-emacs', 

  // readme.textile
  'awesome-textpattern', 
]


export default async function generateDb () {
  const db = await database.getDb().then(database.migrate)

  const awesome = await repositories.getRepository({ owner: 'sindresorhus', name: 'awesome'})
  const categories = await getAwesomeCategories(awesome)

  const lists = utils.flatten(
    Object.values(categories)
      .map(category => category.lists)
  )

  await insertCategoriesOnDb(db, categories)
  await insertListsOnDb(db, lists)

  const results = []
  const batchTime = 0
  const batchSize = 50

  const urlsTimerLabel = 'Got URLs'
  console.info('Getting URLs')
  console.time(urlsTimerLabel)

  await utils.batchAll(
    lists.map(list => ({
      label: list.title,
      promise: () => getListLinks(list).then(links => insertLinksOnDb(db, list, links))
    }))
  )

  const urls = utils.flatten(results)

  console.timeEnd(urlsTimerLabel)
}

async function insertCategoriesOnDb (db, categories) {
  const categoryNames = Object.keys(categories)

  await db.exec(`
    insert into Category(name) values
      ${categoryNames
        .map(name => `('${name}')`)
        .join(', ')
      }
  `)

  for (let { id, name } of await db.all('select * from Category')) {
    categories[name].id = id
  }
}

async function insertListsOnDb (db, lists) {
  return await db.exec(`
    insert into List (owner, name, categoryId) values
      ${lists
        .map(({owner, name, category}) => `('${owner}', '${name}', ${category.id})`)
        .join(', ')
      }
  `)
}

async function insertLinksOnDb (db, list, links) {
  const commits = Array.from(new Map(
    links.map(link =>
      [link.commit.sha, link.commit]
    )
  ).values())

  const authors = Array.from(new Map(
    commits.map(commit =>
      [commit.author.email, commit.author]
    )
  ).values())

  const userIdByEmail = await insertUsersOnDb (db, authors)
  await insertCommitsOnDb(db, list, commits, userIdByEmail)

  const uniqueUrls = Array.from(new Map(
    links.map(link =>
      [link.url, link]
    )
  ).values())

  const chunkSize = Math.floor(APROXIMATE_SQLITE_VAR_MAX / 1) // Too many SQL variables crash SQLite
  const chunks = utils.chunksOf(uniqueUrls, chunkSize)
  
  await Promise.all(
    chunks.map(chunk => {
      const fields = Array(chunk.length).fill(`(?)`).join(', ')

      const sql = `
        insert or ignore into Link (url)
        values ${fields}
      `
      const variables = utils.flatten(chunk.map(({ url }) => [url]))

      return db.run(sql, ...variables)
    })
  )

  const insertedLinks = await db.all(`
    select id, url from Link
    where url in (${uniqueUrls.map(({url}) => `'${url}'`).join(', ')})
  `)

  const linkIdByUrl = new Map(
    insertedLinks
      .map(({ id, url }) => [url, id])
  )

  const activeLinkByUrl = new Map(
    // '+' is new link
    // '-' means the link was removed
    // If link appears more than once, use the lastest
    links
      .map(({ url, line }) => [url, line.origin === '+' || line.origin === ' '])
  )

  const listLinkChunkSize = Math.floor(APROXIMATE_SQLITE_VAR_MAX / 6) // Too many SQL variables crash SQLite
  const listLinkChunks = utils.chunksOf(uniqueUrls, listLinkChunkSize)
  
  await Promise.all(
    listLinkChunks.map(chunk => {
      const fields = Array(chunk.length).fill(`(?, ?, ?, ?, ?, ?)`).join(', ')

      const sql = `
        insert or ignore into ListLink (linkId, listOwner, listName, userId, commitSha, active)
        values ${fields}
      `
      const variables = utils.flatten(chunk.map(({ url, commit }) => [
        linkIdByUrl.get(url),
        list.owner,
        list.name,
        userIdByEmail.get(commit.author.email),
        commit.sha,
        activeLinkByUrl.get(url)
      ]))

      return db.run(sql, ...variables)
    })
  )

  commits
}

async function insertUsersOnDb (db, users) {
  const chunkSize = Math.floor(APROXIMATE_SQLITE_VAR_MAX / 2) // Too many SQL variables crash SQLite
  const chunks = utils.chunksOf(users, chunkSize)
  
  await Promise.all(
    chunks.map(chunk => {
      const fields = Array(chunk.length).fill(`(?, ?)`).join(', ')

      const sql = `
        insert or ignore into User (name, email)
        values ${fields}
      `
      const variables = utils.flatten(chunk.map(({ name, email }) => [name, email]))

      return db.run(sql, ...variables)
    })
  )

  const insertedUsers = await db.all(`
    select id, email from User
    where email in (${users.map(user => `'${user.email}'`).join(', ')})
  `)

  return new Map(
    insertedUsers
      .map(({ id, email }) => [email, id])
  )
}

async function insertCommitsOnDb (db, list, commits, userIdByEmail) {
  const chunkSize = Math.floor(APROXIMATE_SQLITE_VAR_MAX / 7) // Too many SQL variables crash SQLite
  const chunks = utils.chunksOf(commits, chunkSize)
  
  await Promise.all(
    chunks.map(chunk => {
      const fields = Array(chunk.length).fill(`(?, ?, ?, ?, ?, ?, ?)`).join(', ')

      const sql = `
        insert into GitCommit (sha, userId, listOwner, listName, summary, message, createdAt)
        values ${fields}
      `
      const variables = utils.flatten(chunk.map(commit => 
        [
          commit.sha,
          userIdByEmail.get(commit.author.email),
          list.owner,
          list.name,
          commit.summary,
          commit.message,
          commit.date.toISOString().slice(0, 19).replace('T', ' ')
        ]
      ))

      return db.run(sql, ...variables)
        .catch(err => {
          if (err.message !== 'SQLITE_CONSTRAINT: UNIQUE constraint failed: User.email') {
            throw err
          }
        })
    })
  )
}

async function getListLinks (list) {
  const commits = await repositories.getRepository(list)
    .then(repositories.getAllCommits)
    .then(commits => Promise.all(commits.map(git.getCommitData)))

  const links = []

  for (let commit of commits) {
    for (let diff of commit.diffs) {
      if (!utils.seemsLikeReadme(diff.name)) {
        continue
      }

      for (let line of diff.lines) {
        const { origin } = line
        const urls = utils.findAllUrls(line.content)

        for (let url of urls) {
          if (!url.startsWith('http')) {
            continue
          }

          links.push({
            list,
            commit,
            diff,
            line,
            url,
          })
        }
      }
    }
  }

  return links
}

function getAwesomeCategories (awesomeRepo) {
  return awesomeRepo.getHeadCommit()
    .then(git.getReadme)
    .then(markdown.getCategories)
}