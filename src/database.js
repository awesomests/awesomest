import sqlite from 'sqlite'
import * as fs from './fs'

const file = fs.resolve(fs.parentPath(__dirname), 'database.sqlite')
const prepareDb = sqlite.open(file, { Promise })
  .then(migrate)

export async function getDb ()  {
  return await prepareDb
}

export async function migrate(db) {
  return db.migrate({ force: 'last' })
    .then(db => {
      db.get('PRAGMA foreign_keys = ON;')
      return db
    })
}