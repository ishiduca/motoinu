const {start, html} = require('../')
const {through, pipe} = require('mississippi')
const compose = require('./compose')

const apps = [
  require('./form'),
  require('./todos')
]

const sources = start(compose(apps))

const main = html`<main></main>`
document.body.appendChild(main)

pipe(
  sources.views(),
  through.obj((view, _, done) => {
    html.update(main, view)
    done()
  }),
  err => (err && console.error(err))
)
