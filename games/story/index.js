import _ from 'lodash'
import colors from '../../utils/colors'

const TIME_LIMIT = 40000

export default function (config, { sendMessage, onFinish }, { maxIterations=3 }) {
  const { bot, channel, users, savedState } = config

  const state = savedState || {}
  return {
    start: function () {
      if (users.length < 2) {
        sendMessage(config, 'At least two users are needed.')
        return onFinish(channel)
      }

      state.story = ''
      state.words = 0
      state.user = 0
      state.userCount = _.size(users)
      state.timeout = setTimeout(this.skipUser.bind(this), TIME_LIMIT)
      state.playCount = 0
      state.iterationCount = 0
      state.maxIterations = maxIterations
      sendMessage(config, `Contribute to a story with 3 words. *${this.getCurrentUserName()}* starts`)
    },

    getCurrentUserName () {
      return users[state.user].name
    },

    nextUser () {
      const nextUser = ((state.user + 1) > (_.size(users) - 1)) ? 0 : state.user + 1
      state.user = nextUser
      state.timeout = setTimeout(this.skipUser.bind(this), TIME_LIMIT)
    },

    skipUser () {
      this.nextUser()
      sendMessage(config, `You snooze you lose! Next is *${this.getCurrentUserName()}*`)
    },

    processMessage: function (message) {
      if (message.text === 'THE END') {
        return this.finish()
      }

      const words = message.text.split(/\s+/)
      if (words.length !== 3) return

      const currentUserId = users[state.user].id
      if (currentUserId !== message.user) {
        sendMessage(config, `I appreciate your enthusiasm but it's not your turn yet. It is *${this.getCurrentUserName()}*'s turn.`, colors.error)
        return
      }

      clearTimeout(state.timeout)
      state.playCount += 1
      if (state.playCount % state.userCount === 0) state.iterationCount += 1
      state.story += message.text.trim() + ' '
      state.words += 3
      this.nextUser()

      if (state.iterationCount == state.maxIterations) {
        return this.finish()
      } else {
        sendMessage(config, `Cool. Next is *${this.getCurrentUserName()}*!`)
      }
    },

    abort: function () {
      this.cleanup()
    },

    serialize: function () {
    },

    finish: function () {
      let authors = _.map(users, (user) => '@' + user.name).join(', ')
      const lastComma = authors.lastIndexOf(', ')
      authors = authors.substring(0, lastComma) + ' and ' + authors.substring(lastComma + 2)

      const pretext = 'Here\'s the complete story:'
      const text = `${state.story}\n\nby ${authors}`
      const fallback = `${pretext}\n${text}`
      sendMessage(config, {
        attachments: [
          {
            pretext,
            text,
            color: colors.success
          }
        ]
      })

      this.cleanup()
      onFinish(channel)
    },

    cleanup: function () {
      clearTimeout(state.timeout)
    }
  }
}
