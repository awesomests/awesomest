export default class Link {
  label = ''
  url = ''
  description = ''
  children = []
  category = null

  constructor (label, url, description) {
    this.label = label
    this.url = url
    this.description = description
  }

  isRepo () {
    return this.isAbsolute() && utils.parseRepoUrl(this.url) && ![
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
    ].some(invalidListName => this.url.includes(invalidListName))
  }

  isAbsolute () {
    return !this.isRelative()
  }

  isRelative () {
    return !this.url.startsWith('http')
  }
}