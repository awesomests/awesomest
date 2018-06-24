import program from 'commander'

import generateDb from './commands/generate-db'
import query from './commands/query'

program
  .option('-g, --generate-db', 'Generate DB')
  .option('-q, --query [name]', 'Query')
  .parse(process.argv)

async function main () {
  if (program.generateDb) {
    console.info('Generating Database')
    return generateDb()
  }

  if (program.query) {
    return query(program.query)
  }
}


main()
