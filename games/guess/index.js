export default function (config, savedState) {
  var state = savedState || {}
  return {
    start: function () {
      state = Math.floor(Math.random() * 6)
    },

    stop: function () {

    },

    serialize: function () {
    }
  }
}
