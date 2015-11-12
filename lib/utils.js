'use strict'

exports.promisify = function (o, fn) {
  if (fn == null) {
    fn = o
    o = null
  } else if (o != null) {
    fn = o[fn]
  }

  return function () {
    let args = Array.from(arguments)
    return new Promise((resolve, reject) => {
      args.push((err, value) => {
        if (err) reject(err)
        else resolve(value)
      })
      fn.apply(o, args)
    })
  }
}
