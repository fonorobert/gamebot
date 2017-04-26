import _ from 'lodash'
import colors from '../../utils/colors'

const TIME_LIMIT = 40000
const STORY_CHANNEL = "ex-machina"

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
      clearTimeout(state.timeout)
      if (message.text === 'THE END') {
        return this.askForTitle()
      }

      if (state.processingTitles) return this.processTitle(message)

      const words = message.text.split(/\s+/)
      if (words.length !== 3) return

      const currentUserId = users[state.user].id
      if (currentUserId !== message.user) {
        sendMessage(config, `I appreciate your enthusiasm but it's not your turn yet. It is *${this.getCurrentUserName()}*'s turn.`, colors.error)
        return
      }

      state.playCount += 1
      if (state.playCount % state.userCount === 0) state.iterationCount += 1
      state.story += message.text.trim() + ' '
      state.words += 3
      this.nextUser()

      if (state.iterationCount == state.maxIterations) {
        return this.askForTitle()
      } else {
        sendMessage(config, `Cool. Next is *${this.getCurrentUserName()}*!`)
      }
    },

    abort: function () {
      this.cleanup()
    },

    serialize: function () {
    },

    askForTitle: function() {
      state.processingTitles = true
      state.titles = {}
      sendMessage(config, `Nice one! Now all I need is the title. Anyone?`)
      state.titleTimeout = setTimeout(this.handleTitleTimeout.bind(this), TIME_LIMIT)
    },

    processTitle: function(message) {
      if (state.titles[message.user]) return sendMessage(config, 'I mean... Anyone ELSE?')
      state.titles[message.user] = message.text.trim()
      clearTimeout(state.titleTimeout)
      if (Object.keys(state.titles).length >= users.length) {
        sendMessage(config, `Great! I'll just choose one of these. I'll post this story to #${STORY_CHANNEL}.`)
        return this.finish()
      }
      state.titleTimeout = setTimeout(this.handleTitleTimeout.bind(this), TIME_LIMIT)
      return sendMessage(config, 'Good. Anyone else?')
    },

    handleTitleTimeout: function() {
      if (Object.keys(state.titles).length === 0) {
        sendMessage(config, 'Still need that title, guys!')
        state.titleTimeout = setTimeout(this.handleTitleTimeout.bind(this), TIME_LIMIT)
        return
      }
      sendMessage(config, `I think that\'s enough titles, then. I'll post this story to <#${STORY_CHANNEL}|${STORY_CHANNEL}>.`)
      this.finish()
    },

    finish: function () {
      let authors = _.map(users, (user) => '@' + user.name).join(', ')
      const lastComma = authors.lastIndexOf(', ')
      authors = authors.substring(0, lastComma) + ' and ' + authors.substring(lastComma + 2)

      const title = _.shuffle(state.titles)[0]
      const pretext = `*${title}*\n_a story by ${authors}_`
      const text = `${state.story}`
      const fallback = `${pretext}\n${text}`
      sendMessage(_.assign({}, config, {channel: STORY_CHANNEL}), {
        attachments: [
          {
            fallback,
            pretext,
            text,
            color: colors.success,
            mrkdwn_in: ["pretext", "text"],
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
