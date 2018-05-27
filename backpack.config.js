module.exports = {
  webpack (config, options, webpack) {
    config.module.rules.push({
      test: /\.node$/,
      loader: 'file-loader'
    })
    return config
  }
}