export function getCategories (rawMarkdown) {
  const categories = {}

  const lines = rawMarkdown.split('\n')
  let currentHeading = ''
  let links = []

  while (lines.length) {
    const currentLine = lines.shift()

    if (
      (isHeading(currentLine) || !lines.length) && 
      currentHeading !== '' &&
      links.length
    ) {
      categories[currentHeading] = new Category(currentHeading, links)
      currentHeading = ''
      links = []
    }

    if (isHeading(currentLine)) {
      currentHeading = getHeadingTitle(currentLine)
    } else if (isListItem(currentLine)) {
      if (isNested(currentLine) && links.length) {
        const lastUnnestedLink = links[links.length - 1]
        lastUnnestedLink.children.push(getListItemLink(currentLine))
      } else {
        links.push(getListItemLink(currentLine))
      }
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
const listItemRegex = /^\s*-\s+\[(.*)\]\((.*)\)(.+)?$/

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
  const match = /#+\s+(.*)/.exec(line)
  return match[1]
}

function getListItemLink (line) {
  const [_, label, link, description] = listItemRegex.exec(line)
  return new Link(label, link, description)
}

class Category {
  name = ''
  links = []

  constructor (name, children) {
    this.name = name
    this.links = children
  }
}

class Link {
  label = ''
  url = ''
  description = ''
  children = []

  constructor (label, url, description) {
    this.label = label
    this.url = url
    /*
     * In awesome lists we often see this format:
     *    `- [Label](Link) - Description`
     * The token for description comes with ` - Description` (if present at all).
     * So I just remove ` - ` at the start.
     */
    this.description = description ? description.replace(/^(\s*-\s*)/, '') : ''
  }
}