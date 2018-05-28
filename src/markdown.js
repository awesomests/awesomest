// @flow

import MarkdownIt from 'markdown-it'

import type Token from 'markdown-it/lib/token'

const markdownIt = new MarkdownIt()

export function parseMarkdown (src: string) : Token[] {
  return markdownIt.parse(src)
}