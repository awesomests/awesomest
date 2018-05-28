// @flow

import MarkdownIt from 'markdown-it'

import type Token from 'markdown-it/lib/token'

type ListMap = { [string]: BulletList }

const TOKEN_HEADING_OPEN = 'heading_open'
const TOKEN_BULLET_LIST_OPEN = 'bullet_list_open'
const TOKEN_BULLET_LIST_CLOSE = 'bullet_list_close'
const TOKEN_LIST_ITEM_OPEN = 'list_item_open'
const TOKEN_LIST_ITEM_CLOSE = 'list_item_close'
const TOKEN_PARAGRAPH_OPEN = 'paragraph_open'
const TOKEN_PARAGRAPH_CLOSE = 'paragraph_close'
const TOKEN_INLINE = 'inline'
const TOKEN_LINK_OPEN = 'link_open'
const TOKEN_LINK_CLOSE = 'link_close'
const TOKEN_TEXT = 'text'

const markdownIt = new MarkdownIt()

export function parseMarkdown (src: string) : Token[] {
  return markdownIt.parse(src)
}

export function getLists (tokens: Token[]) {
  return getBulletLists(new Tokens(tokens))
}

export function getBulletLists (tokens : Tokens) : ListMap {
  const lists : ListMap = {}
  let currentHeading = ''

  while (tokens.length) {
    const token = tokens.consume()

    if (token.type === TOKEN_HEADING_OPEN) {
      const inlineToken = tokens.consume()

      if (inlineToken.type !== TOKEN_INLINE) {
        throw new Error('Heading open token isn\'t proceded by inline')
      }

      currentHeading = inlineToken.content
    } else if (token.type === TOKEN_BULLET_LIST_OPEN) {
      lists[currentHeading] = consumeBulletList(tokens)
    }
  }

  return lists
}

export function consumeBulletList (tokens : Tokens) : BulletList {
  const children = []

  while (tokens.length) {
    const token = tokens.consume()

    if (token.type === TOKEN_BULLET_LIST_CLOSE) {
      break
    } else if (token.type === TOKEN_BULLET_LIST_OPEN) {
      children.push(consumeBulletList(tokens))
    } else if (token.type === TOKEN_LIST_ITEM_OPEN) {
      children.push(consumeListItem(tokens))
    } else {
      children.push(token)
    }
  }

  return new BulletList(children)
}

export function consumeListItem (tokens : Tokens) : ListItem {
  const children = []

  while (tokens.length) {
    const token = tokens.consume()

    if (token.type === TOKEN_LIST_ITEM_CLOSE) {
      break
    } else if (token.type === TOKEN_PARAGRAPH_OPEN) {
      children.push(...consumeParagraph(tokens))
    } else if (token.type === TOKEN_BULLET_LIST_OPEN) {
      children.push(consumeBulletList(tokens))
    } else {
      children.push(token)
    }
  }

  return new ListItem(children)
}

export function consumeParagraph (tokens : Tokens) : mixed[] {
  const children = []

  while (tokens.length) {
    const token = tokens.consume()

    if (token.type === TOKEN_PARAGRAPH_CLOSE) {
      break
    } else if (token.type === TOKEN_INLINE) {
      children.push(consumeInline(token))
    } else {
      children.push(token)
    }
  }

  return children
}

export function consumeInline (token : Token) {
  if (token.children.length === 3 || token.children.length === 4) {
    const [
      linkOpenToken,
      textToken,
      linkCloseToken,
      descriptionToken
    ] = token.children

    if ([
      [linkOpenToken, TOKEN_LINK_OPEN],
      [textToken, TOKEN_TEXT],
      [linkCloseToken, TOKEN_LINK_CLOSE]
    ].some(([token, expectedType]) => token.type !== expectedType)) {
      throw new Error('Unexpected token type')
    }

    return new Link(textToken.content, linkOpenToken.attrGet('href'), descriptionToken && descriptionToken.content || '')
  }
}


class Tokens {
  idx : number = 0 
  tokens : Token[] = []

  constructor (tokens : Token[]) {
    this.tokens = tokens
  }

  get length () : number {
    return this.tokens.length - this.idx
  }

  get current () : Token {
    return this.tokens[this.idx]
  }

  peek (next = 1) : Token {
    return this.tokens[this.idx + next]
  }

  consume () : Token  {
    return this.tokens[this.idx++]
  }
}

class BulletList {
  children = []

  constructor (children) {
    this.children = children
  }
}

class ListItem {
  children = []

  constructor (children) {
    this.children = children
  }
}

class Link {
  label : string = ''
  url : string = ''
  description : string = ''

  constructor (label: string, url: string, description: string) {
    this.label = label
    this.url = url
    this.description = description
  }
}