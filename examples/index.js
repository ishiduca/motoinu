const {start, html} = require('../')
const missi = require('mississippi')
const main = html`<div id="main"></div>`

document.body.appendChild(main)

const sources = start(require('./clock'))

missi.pipe(
  sources.views(),
  missi.through.obj((view, _, done) => {
    html.update(main, view)
    done()
  }),
  err => (err && console.error(err))
)
