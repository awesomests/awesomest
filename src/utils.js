import Gauge from 'gauge'

export function seemsLikeReadme (fileName) {
  return /readme\.md/i.test(fileName)
}

export function flatten (xs) {
  return xs.reduce((a, b) => a.concat(b), [])
}

export function chunksOf (xs, n) {
  return Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, (i * n) + n))
}

export function parseRepoUrl (url) {
  const re = /^https:\/\/github\.com\/([a-zA-Z-0-9]+)\/([a-zA-Z-0-9.]+)/
  return re.exec(url)
}

export function findAllUrls (rawString) {
  const re = /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/g
  return rawString.match(re) || []
}

export function timeout (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export async function batchAll (tasks, time = 2000, minBatchSize = 4) {
  const gauge = new Gauge({
    theme: 'colorBrailleSpinner',
    updateInterval: 50
  })

  setInterval(() => gauge.pulse(''), 110)

  const queue = tasks
    // .filter(({ dest }) => !fs.existsSync(path.resolve(assetsFolder, dest)))

  const totalLength = tasks.length
  let finished = totalLength - queue.length

  while (queue.length) {
    const size = Math.min(queue.length, minBatchSize)
    const batch = Array.from(Array(size), () => queue.shift())

    await Promise.all(
      batch.map(task => {
        const { label, promise } = task

        return promise()
          .then(() => {
            finished++
            gauge.show(`[${finished}/${totalLength}] ${label}`, finished / totalLength)
          })
          .catch(err => {
            console.error('Failed to load', label, err)
            // throw err
          })
          // .catch(err => {
          //   console.error('Failed to load', label, err)
          //   queue.push(task)
          // })
      })
    )

    await timeout(time)
  }

  gauge.hide()
}