import * as utils from './utils'
import Category from './models/Category'
import List from './models/List'

export function getCategories (rawMarkdown) {
  const categories = {}

  const lines = rawMarkdown.split('\n')
  let currentHeading = ''
  
  // Sometimes nested lists have titles that doesn't describe it all. Example:
  // - Linux
  //   - Containers*
  // * Title becomes "Linux - Containers"
  let lastUnnestedList
  
  let lists = []

  while (lines.length) {
    const currentLine = lines.shift()

    if (
      (isHeading(currentLine) || !lines.length) && 
      currentHeading !== '' &&
      lists.length
    ) {
      const category = categories[currentHeading] = new Category(currentHeading)

      category.lists = lists.map(list => {
        list.category = category
        return list
      })

      currentHeading = ''
      lastUnnestedList = null
      lists = []
    }

    if (isHeading(currentLine)) {
      currentHeading = getHeadingTitle(currentLine)
    } else if (isListItem(currentLine)) {
      const link = parseListItemLink(currentLine)

      if (!utils.parseRepoUrl(link.url)) { // Table of Contents have relative URLs like "#big-data"
        continue
      }

      const [, owner, name] = utils.parseRepoUrl(link.url)

      const list = new List(owner, name, link.label, link.description)

      if (isNested(currentLine) && lastUnnestedList) {
        list.label = `${lastUnnestedList.title} - ${list.title}`
      } else {
        lastUnnestedList = list
      }

      lists.push(list)
    }
  }

  return categories
}

/*
 * listItemRegex
 *
 * Examples:
 *    Complete:
 *      `- [Recursion Schemes](https://github.com/passy/awesome-recursion-schemes) - Traversing nested data structures.`
 *
 *    No description:
 *      `- [Math](https://github.com/rossant/awesome-math)`
 *
 *    Nested:
 *      `	- [Browser Extensions](https://github.com/stefanbuck/awesome-browser-extensions-for-github)`
 */
const listItemRegex = /^\s*-\s+\[(.*)\]\((.*)\)\s*(-)?\s*(.+)?$/

function isHeading (line) {
  return line.trim().startsWith('#')
}

function isListItem (line) {
  return listItemRegex.test(line)
}

function isNested (line) {
  return /^\s+/.test(line)
}

function getHeadingTitle (line) {
  const match = /#+\s*(.*)/.exec(line)

  if (!match) {
    throw new Error('Failed to match heading')
  }

  return match[1]
}

function parseListItemLink (line) {
  const [_, label, url, _slash,  description] = listItemRegex.exec(line)
  return { label, url, description: description && description.trim() }
}
