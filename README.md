# Awesomest

To get everything working:

```sh
# install dependencies
npm install

# compile the database CLI files
npm run build

# run the CLI
node build/main.js --generate-db # generates database.sqlite (takes a while)
node build/main.js --query --all # generate JSON files based on the database at `data` folder

# compile the front end
npm run build-front
```

The `dist` folder will have the static website ready to use.

If you don't want to wait for the database to be generated [download it here](http://www.mediafire.com/file/56bvk6eu1ud8fse/database.sqlite/file) and put it at the repo root folder.
