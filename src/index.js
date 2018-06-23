import program from 'commander'

import generateDb from './commands/generate-db'

program
  .option('-g, --generate-db', 'Generate DB')
  .parse(process.argv)

async function main () {
  if (program.generateDb) {
    console.info('Generating Database')
    return generateDb()
  }
}


main()
