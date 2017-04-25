export default function ({ bot, channel }, onFinish, savedState) {
  const state = savedState || {}
  return {
    start: function () {
      state.story = ''
      state.words = 0
      state.user = null
      bot.say({ channel, text: 'Contribute to a story with 3 words' })
    },

    processMessage: function (message) {
      if (message.text === 'THE END') {
        return this.finish()
      }

      const words = message.text.split(/\s+/)
      if (words.length === 3) {
        if (state.user === message.user) {
          bot.reply(message, 'but not you')
        } else {
          state.story += message.text.trim() + ' '
          state.words += 3
          state.user = message.user

          if (state.words > 100) {
            return this.finish()
          } else {
            bot.reply(message, 'cool. next!')
          }
        }
      }
    },

    abort: function () {
    },

    serialize: function () {
    },

    finish: function () {
      bot.say({ channel, text: 'here\'s your stupid story:' })
      bot.say({ channel, text: state.story })
      onFinish(channel)
    }
  }
}
