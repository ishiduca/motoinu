# motoinu

`motoinu` is __"元犬"__.

implementation of `inu` using `nodejs.stream` instead of `pull-stream`.

```js
const {start, html} = require('motoinu')
const {pipe, through} = require('mississippi')

const app = {
  init () {
    return {
      model: 0,
      effect: 'SCHEDULE_TICK'
    }
  },
  update (model, action) {
    if (action === 'TICK') {
      return {
        model: (model + 1) % 60,
        effect: 'SCHEDULE_TICK'
      }
    }
    return {model}
  },
  view (model, dispatch) {
    return html`
      <div class="clock">
        Seconds Elapsed: ${model}
      </div>
    `
  },
  run (effect, sources) => {
    if (effect === 'SCHEDULE_TICK') {
      var pass = through.obj()
      setTimeout(() => pass.end('TICK'), 1000)
      return pass
    }
  }
}

const main = document.querySelector('.main')
const {views} = start(app)

pipe(
  views(),
  through.obj((view, _, done) => {
    html.update(main, view)
    done()
  },
  err => {
    if (err) console.error(err)
    else console.log('stop application')
  }
)
```
