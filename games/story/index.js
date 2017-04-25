import _ from 'lodash'

export default function ({ bot, channel, users }, onFinish, savedState) {
  const state = savedState || {}
  return {
    start: function () {
      state.story = ''
      state.words = 0
      state.user = 0
      state.userCount = _.size(users)
      bot.say({ channel, text: `Contribute to a story with 3 words. ${this.getCurrentUserName()} starts` })
    },

    getCurrentUserName () {
      return users[state.user].name
    },

    nextUser () {
      const nextUser = ((state.user + 1) > (_.size(users) - 1)) ? 0 : state.user + 1
      state.user = nextUser
    },

    processMessage: function (message) {
      if (message.text === 'THE END') {
        return this.finish()
      }

      const words = message.text.split(/\s+/)
      if (words.length === 3) {
        const currentUserId = users[state.user].id
        if (currentUserId !== message.user) {
          bot.reply(message, `Not you! ${this.getCurrentUserName()}`)
        } else {
          state.story += message.text.trim() + ' '
          state.words += 3
          this.nextUser()

          if (state.words > 100) {
            return this.finish()
          } else {
            bot.reply(message, `cool. next is ${this.getCurrentUserName()}!`)
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
