export default class Category {
  id = -1 /* this is assigned later */
  name = ''
  lists = []

  constructor (name, lists = []) {
    this.name = name
    this.lists = lists
  }
}