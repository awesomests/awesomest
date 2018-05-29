// @flow

type CategoryMap = { [string]: Category }

export function getCategories (rawMarkdown : string) : CategoryMap {
  const categories : CategoryMap = {}

  const lines : string[] = rawMarkdown.split('\n')
  let currentHeading : string = ''
  let links : Link[] = []

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

function isHeading (line: string) : boolean {
  return line.trim().startsWith('#')
}

function isListItem (line: string) : boolean {
  return listItemRegex.test(line)
}

function isNested (line: string) : boolean {
  return /^\s+/.test(line)
}

function getHeadingTitle (line : string) : string {
  const match = /#+\s+(.*)/.exec(line)
  return match[1]
}

function getListItemLink (line : string) : Link {
  const [_, label, link, description] = listItemRegex.exec(line)
  return new Link(label, link, description)
}

class Category {
  name : string = ''
  links : Link[] = []

  constructor (name: string, children) {
    this.name = name
    this.links = children
  }
}

class Link {
  label : string = ''
  url : string = ''
  description : string = ''
  children : Link[] = []

  constructor (label: string, url: string, description: string) {
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