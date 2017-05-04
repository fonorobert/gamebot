import _ from 'lodash'
import { sendMessage } from '../../utils/chat'
import colors from '../../utils/colors'

const TIME_LIMIT = 40000
const STORY_CHANNEL = "ex-machina"

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

export default function (config, { saveState, onFinish }, { maxIterations = 3 } = {}) {
  const { bot, channel, users } = config
  let state = {}

  return {
    start () {
      if (users.length < 2) {
        sendMessage(config, 'At least two users are needed.')
        return onFinish(channel)
      }

      state.story = ''
      state.words = 0
      state.user = getRandomInt(0, users.length - 1)
      state.userCount = _.size(users)
      state.timeout = setTimeout(this.skipUser.bind(this), TIME_LIMIT)
      state.playCount = 0
      state.iterationCount = 0
      state.maxIterations = maxIterations
      sendMessage(config, `Contribute to a story with 3 words. *${this.getCurrentUserName()}* starts`)
    },

    recover (recoveredState) {
      state = recoveredState
      sendMessage(config, `I'm online again, sorry for the hiccup. It is still *${this.getCurrentUserName()}*'s turn.`)
    },

    getCurrentUserName () {
      return users[state.user].name
    },

    nextUser () {
      const nextUser = ((state.user + 1) > (_.size(users) - 1)) ? 0 : state.user + 1
      state.user = nextUser
      state.timeout = setTimeout(this.skipUser.bind(this), TIME_LIMIT)
      saveState()
    },

    skipUser () {
      this.nextUser()
      sendMessage(config, `You snooze you lose! Next is *${this.getCurrentUserName()}*`)
    },

    processMessage (message) {
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

    abort () {
      this.cleanup()
      sendMessage(config, `Oh, okay. No problem. It's fine. :simple_smile: I'll cancel the game. ʸᵒᵘ ᵖᵃʳᵗʸ ᵖᵒᵒᵖᵉʳ`, colors.error)
    },

    getGameId () {
      return 'story'
    },

    serialize () {
      return { state: _.omit(state, 'timeout'), users }
    },

    askForTitle () {
      state.processingTitles = true
      state.titles = {}
      sendMessage(config, `Nice one! Now all I need is the title. Anyone?`)
      state.titleTimeout = setTimeout(this.handleTitleTimeout.bind(this), TIME_LIMIT)
    },

    processTitle (message) {
      if (state.titles[message.user]) return sendMessage(config, 'I mean... Anyone ELSE?')
      state.titles[message.user] = message.text.trim()
      clearTimeout(state.titleTimeout)
      if (Object.keys(state.titles).length >= users.length) {
        sendMessage(config, `Great! I'll also post this story to #${STORY_CHANNEL}.`)
        return this.finish()
      }
      state.titleTimeout = setTimeout(this.handleTitleTimeout.bind(this), TIME_LIMIT)
      return sendMessage(config, 'Good. Anyone else?')
    },

    handleTitleTimeout () {
      if (Object.keys(state.titles).length === 0) {
        sendMessage(config, 'Still need that title, guys!')
        state.titleTimeout = setTimeout(this.handleTitleTimeout.bind(this), TIME_LIMIT)
        return
      }
      sendMessage(config, `I'll also post this story to <#${STORY_CHANNEL}|${STORY_CHANNEL}>.`)
      this.finish()
    },

    finish () {
      let authors = _.map(users, (user) => '@' + user.name).join(', ')
      const lastComma = authors.lastIndexOf(', ')
      authors = authors.substring(0, lastComma) + ' and ' + authors.substring(lastComma + 2)

      const title = _.shuffle(state.titles)[0]
      const pretext = `*${title}*\n_a story by ${authors}_`
      const text = `${state.story}`
      const fallback = `${pretext}\n${text}`
      const messageObject = {
        attachments: [
          {
            fallback,
            pretext,
            text,
            color: colors.success,
            mrkdwn_in: ["pretext", "text"],
          }
        ]
      }
      sendMessage(config, messageObject)
      sendMessage(_.assign({}, config, {channel: STORY_CHANNEL}), messageObject)

      this.cleanup()
      onFinish(channel)
    },

    cleanup () {
      clearTimeout(state.timeout)
    }
  }
}
