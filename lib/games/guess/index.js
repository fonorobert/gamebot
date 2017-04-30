export default function ({ bot, channel }, onFinish, savedState) {
  const state = savedState || {}
  return {
    start: function () {
      const limit = 10
      state.number = Math.floor(Math.random() * limit) + 1
      bot.say({ channel, text: 'Guess a number from 1 to ' + limit })
    },

    processMessage: function (message) {
      if (message.text.match(/\d+/)) {
        const guess = parseInt(message.text)
        if (guess < state.number) {
          bot.reply(message, 'higher')
        } else if (guess > state.number) {
          bot.reply(message, 'lower')
        } else {
          bot.reply(message, 'congratz')

          onFinish(channel)
        }
      }
    },

    stop: function () {
    },

    serialize: function () {
    }
  }
}
