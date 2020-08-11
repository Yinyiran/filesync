module.exports = {
  cssPreprocessOptions: {
    less: {
      modifyVars: {
        'preprocess-custom-color': 'green'
      }
    }
  },
  proxy: {
    "/api": {
      target: 'http://127.0.0.1:6000',
      changeOrigin: true
    }
  }
}