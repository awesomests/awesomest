import * as database from '../database'
import path from 'path'
import fs from 'fs'

const querys = {
  counts,
  commitsOverTheTime,
  linksOverTime,

  contributorsByCategory,
  activeLinksByCategory,
  inactiveLinksByCategory,

  contributorsByList,
  activeLinksByList,
  inactiveLinksByList,

  commitsByUser,
  activeLinksByUser,
  inactiveLinksByUser,

  topListByContributors,
  topListByCommits,
  topListByLinks,

  topUserByLists,
  topUserByCommits,
  topUserByLinks,

  topLink,
}

export default async function query (name, shouldRunAll) {
  console.log('Query', name)

  const db = await database.getDb()

  if (shouldRunAll) {
    return Promise.all(
      Object.values(querys)
        .map(query => query(db))
    )
  }

  if (querys[name]) {
    return querys[name](db)
  }
}

/* General */

async function counts (db) {
  const count = table => db.get(`select count(*) as count from ${table}`)
    .then(({ count }) => count)

  const [
    categories,
    commits,
    links,
    lists,
    users
  ] = await Promise.all([
    count('Category'),
    count('GitCommit'),
    count('Link'),
    count('List'),
    count('User')
  ])

  write('counts.json', {
    categories,
    commits,
    links,
    lists,
    users
  })
}

async function commitsOverTheTime (db) {
  const query = `
    select 
        strftime("%Y-%m", createdAt) as monthYear , count(*) as commits
    from GitCommit
    group by monthYear
    order by monthYear asc
  `

  return write('commitsOverTheTime.json', await db.all(query))
}

async function linksOverTime (db) {
  const query = `
    select 
        strftime("%Y-%m", C.createdAt) as monthYear,
        count(*) as links
    from 
        ListLink as LL
    inner join
        GitCommit as C
    on
        C.sha = LL.commitSha
    group by monthYear
  `

  return write('linksOverTime.json', await db.all(query))
}

/* By Category */

async function contributorsByCategory (db) {
  const query = `
    select
        Category.name, (
            select
                count(distinct ( userId ))
            from
                GitCommit
            inner join
                List on List.owner = GitCommit.listOwner and List.name = GitCommit.listName
            where
                List.categoryId = Category.id
        ) as contributors
    from
        Category
    order by
        contributors asc
  `

  return write('contributorsByCategory.json', await db.all(query))
}

async function activeLinksByCategory (db) {
  const query = `
    select
        Category.name, count(*) as links
    from
        ListLink
    inner join
        List on List.owner = ListLink.listOwner and List.name = ListLink.listName
    inner join
        Category on Category.id = List.categoryId
    where
        active = 1
    group by
        List.categoryId
    order by
        links
  `

  return write('activeLinksByCategory.json', await db.all(query))
}

async function inactiveLinksByCategory (db) {
  const query = `
    select
        Category.name, count(*) as links
    from
        ListLink
    inner join
        List on List.owner = ListLink.listOwner and List.name = ListLink.listName
    inner join
        Category on Category.id = List.categoryId
    where
        active = 0
    group by
        List.categoryId
    order by
        links
  `

  return write('inactiveLinksByCategory.json', await db.all(query))
}

/* By List */

async function contributorsByList (db) {
  const query = `
    select
        L.name, (
            select
                count(distinct ( userId ))
            from
                GitCommit as C
            where
                C.listOwner = L.owner
                and C.listName = L.name
        ) as contributors
    from
        List as L
    order by
        contributors asc
  `

  const all = (await db.all(query))
    // lists with bugs
    .filter(({ contributors }) => contributors !== 0)

  const groups = groupper(all, ({ contributors }) => {
    if (contributors === 1) return '1'
    if (contributors > 1 && contributors <= 10) return '2 ~ 10'
    if (contributors > 10 && contributors <= 50) return '11 ~ 50'
    if (contributors > 50 && contributors <= 100) return '51 ~ 100'
    if (contributors > 100 && contributors <= 250) return '101 ~ 250'
    if (contributors > 250 && contributors <= 1000) return '251 ~ 1000'
    if (contributors > 100) return '> 1000'
  })

  return write('contributorsByList.json', countGroups(groups))
}

async function activeLinksByList (db) {
  const query = `
    select
        listOwner, listName, count(*) as links
    from
        ListLink
    where
        active = 1
    group by
        listOwner, listName
    order by
        links
  `

  const all = (await db.all(query))
    // lists with bugs
    .filter(({ links }) => links !== 0)

  const groups = groupper(all, ({ links }) => {
    if (links === 1) return '1'
    if (links > 1 && links <= 10) return '2 ~ 10'
    if (links > 10 && links <= 50) return '11 ~ 50'
    if (links > 50 && links <= 100) return '51 ~ 100'
    if (links > 100 && links <= 250) return '101 ~ 250'
    if (links > 250 && links <= 1000) return '251 ~ 1000'
    if (links > 100) return '> 1000'
  })

  return write('activeLinksByList.json', countGroups(groups))
}

async function inactiveLinksByList (db) {
  const query = `
    select
        listOwner, listName, count(*) as links
    from
        ListLink
    where
        active = 0
    group by
        listOwner, listName
    order by
        links
  `

  const all = (await db.all(query))
    // lists with bugs
    .filter(({ links }) => links !== 0)

  const groups = groupper(all, ({ links }) => {
    if (links === 1) return '1'
    if (links > 1 && links <= 10) return '2 ~ 10'
    if (links > 10 && links <= 50) return '11 ~ 50'
    if (links > 50 && links <= 100) return '51 ~ 100'
    if (links > 100 && links <= 250) return '101 ~ 250'
    if (links > 250 && links <= 1000) return '251 ~ 1000'
    if (links > 100) return '> 1000'
  })

  return write('inactiveLinksByList.json', countGroups(groups))
}

/* By User */

async function commitsByUser (db) {
  const query = `
    select
        userId, count(*) as contributions
    from
        GitCommit
    group by
        userId
    order by contributions asc
  `

  const all = (await db.all(query))
    // lists with bugs
    .filter(({ contributions }) => contributions !== 0)

  const groups = groupper(all, ({ contributions }) => {
    if (contributions === 1) return '1'
    if (contributions > 1 && contributions <= 10) return '2 ~ 10'
    if (contributions > 10 && contributions <= 50) return '11 ~ 50'
    if (contributions > 50 && contributions <= 100) return '51 ~ 100'
    if (contributions > 100 && contributions <= 250) return '101 ~ 250'
    if (contributions > 250 && contributions <= 1000) return '251 ~ 1000'
    if (contributions > 100) return '> 1000'
  })

  return write('commitsByUser.json', countGroups(groups))
}

async function activeLinksByUser (db) {
  const query = `
    select
        userId, count(*) as links
    from
        ListLink
    where
        active = 1
    group by
        userId
    order by
        links
  `

  const all = (await db.all(query))
    // lists with bugs
    .filter(({ links }) => links !== 0)

  const groups = groupper(all, ({ links }) => {
    if (links === 1) return '1'
    if (links > 1 && links <= 10) return '2 ~ 10'
    if (links > 10 && links <= 50) return '11 ~ 50'
    if (links > 50 && links <= 100) return '51 ~ 100'
    if (links > 100 && links <= 250) return '101 ~ 250'
    if (links > 250 && links <= 1000) return '251 ~ 1000'
    if (links > 100) return '> 1000'
  })

  return write('activeLinksByUser.json', countGroups(groups))
}

async function inactiveLinksByUser (db) {
  const query = `
    select
        userId, count(*) as links
    from
        ListLink
    where
        active = 0
    group by
        userId
    order by
        links
  `

  const all = (await db.all(query))
    // lists with bugs
    .filter(({ links }) => links !== 0)

  const groups = groupper(all, ({ links }) => {
    if (links === 1) return '1'
    if (links > 1 && links <= 10) return '2 ~ 10'
    if (links > 10 && links <= 50) return '11 ~ 50'
    if (links > 50 && links <= 100) return '51 ~ 100'
    if (links > 100 && links <= 250) return '101 ~ 250'
    if (links > 250 && links <= 1000) return '251 ~ 1000'
    if (links > 100) return '> 1000'
  })

  return write('inactiveLinksByUser.json', countGroups(groups))
}

/* Top List */

async function topListByContributors (db) {
  const query = `
    select
        L.owner, L.name, (
            select
                count(distinct ( userId ))
            from
                GitCommit as C
            where
                C.listOwner = L.owner
                and C.listName = L.name
        ) as contributors
    from
        List as L
    order by
        contributors desc
    limit 20
  `

  return write('topListByContributors.json', await db.all(query))
}

async function topListByCommits (db) {
  const query = `
    select
        L.owner, L.name, (
            select
                count(*)
            from
                GitCommit as C
            where
                C.listOwner = L.owner
                and C.listName = L.name
        ) as commits
    from
        List as L
    order by
        commits desc
    limit 20
  `

  return write('topListByCommits.json', await db.all(query))
}

async function topListByLinks (db) {
  const query = `
    select
        listOwner as owner, listName as name, count(*) as links
    from
        ListLink
    where
        active = 1
    group by
        listOwner, listName
    order by
        links desc
    limit 20
  `

  return write('topListByLinks.json', await db.all(query))
}

/* Top User */

async function topUserByLists (db) {
  const query = `
    select
        U.name, count(*) as lists
    from
        User as U
    inner join
        (
            select distinct ListLink.listOwner, ListLink.listName, ListLink.userId
            from
                ListLink
        ) as LL on U.id = LL.userId
    group by
        U.id
    order by
        lists desc
    limit 20
  `

  /* Alt:
  select
      User.name, count(*) as lists
  from
      (
          select distinct listOwner, listName, userId
          from
              ListLink
      )
  inner join
      User on User.id = userId
  group by
      userId
  order by
      lists desc
  limit 20
  */

  return write('topUserByLists.json', await db.all(query))
}

async function topUserByCommits (db) {
  const query = `
    select
        User.name, count(*) as commits
    from
        GitCommit
    inner join
        User on User.id = userId
    group by
        userId
    order by
        commits desc
    limit 20
  `

  return write('topUserByCommits.json', await db.all(query))
}

async function topUserByLinks (db) {
  const query = `
    select
        User.name, count(*) as links
    from
        ListLink
    inner join
        User on User.id = ListLink.userId
    group by
        userId
    order by
        links desc
    limit 20
  `

  return write('topUserByLinks.json', await db.all(query))
}

/* Top Link */

async function topLink (db) {
  const query = `
    select
        L.url, count(*) as times
    from
        ListLink as LL
    inner join
        Link as L
    on
        L.id = LL.linkId
    where
      LL.active = 1
    group by
        LL.linkId
    order by
        times desc
    limit 50
  `

  const all = (await db.all(query))
    .filter(({ url }) => !/\.(png|jpg|jpeg|svg)$/.test(url))
    .slice(0, 20)

  return write('topLink.json', all)
}

function write (filename, data) {
  return fs.writeFileSync(
    path.resolve(__dirname, '../../data', filename),
    JSON.stringify(data, undefined, 2)
  )
}

function groupper (xs, f) {
  return xs.reduce((acc, x) => {
    const key = f(x)

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push(x)

    return acc
  }, {})
}

function countGroups (groups) {
  return Object.entries(groups)
    .reduce((acc, [key, group]) => {
      acc[key] = group.length
      return acc
    }, {})
}