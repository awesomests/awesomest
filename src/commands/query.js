import * as database from '../database'



export default async function query (name) {
  console.log('Query', name)

  const db = await database.getDb()


}