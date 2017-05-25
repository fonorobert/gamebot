import _ from 'lodash'
import { sendMessage } from '../../utils/chat'
import colors from '../../utils/colors'

const SKIP_USER_TIMEOUT = 80000
const TITLE_TIMEOUT = 30000
const STORY_CHANNEL = process.env.PRODUCTION ? "toggl-stories" : "ex-machina"

const getRandomInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

export default function (config, { saveState, onFinish }, { maxIterations = 3 } = {}) {
  const { bot, channel, users } = config
  let state = {}
  let timeouts = {}

  const say = (message) => { sendMessage(config, message) }
  const complain = (message) => { sendMessage(config, message, colors.error) }

  return {
    getGameId () {
      return 'story'
    },

    start () {
      if (users.length < 2) {
        complain('At least two users are needed.')
        return onFinish(channel)
      }

      state.story = ''
      state.words = 0
      state.user = getRandomInt(0, users.length)
      state.userCount = _.size(users)
      state.playCount = 0
      state.iterationCount = 0
      state.maxIterations = maxIterations
      state.processingTitles = false

      const text = [
        `- Once it's your turn you'll have 1min 20sec to contribute with 3 words, otherwise you'll be skipped.`,
        `- Say _GAME OVER_ at any point to interrupt and *cancel* the game.`,
        `- Say _THE END_ at any point to *finish* the story as it is.`
      ]

      say({
        attachments: [
          {
            fallback: `Contribute to a story with 3 words.`,
            color: `#36a64f`,
            pretext: `Contribute to a story with 3 words. *${this.getCurrentUserName()}* starts`,
            title: `Rules, tips and tricks`,
            text: text.join('\n'),
            mrkdwn_in: ['pretext', 'text']
          }
        ]
      })
      this.setSkipUserTimeout()
    },

    recover (recoveredState) {
      state = recoveredState

      if (state.processingTitles) {
        say(`I'm online again, sorry for the hiccup. So, what should be the story title?`)
        this.setTitleTimeout()
      } else {
        say(`I'm online again, sorry for the hiccup. It is still *${this.getCurrentUserName()}*'s turn.`)
        this.setSkipUserTimeout()
      }
    },

    abort () {
      this.resetTimeouts()
      complain(`Oh, okay. No problem. It's fine. :simple_smile: I'll cancel the game. ʸᵒᵘ ᵖᵃʳᵗʸ ᵖᵒᵒᵖᵉʳ`)
    },

    serialize () {
      return { state, users }
    },

    processMessage (message) {
      if (state.processingTitles) return this.processTitle(message)

      if (message.text === 'THE END' && state.words > 0) return this.askForTitle()

      const words = message.text.split(/\s+/)
      if (words.length !== 3) return

      const currentUserId = users[state.user].id
      if (currentUserId !== message.user) {
        if (state.complained) return
        state.complained = true
        return complain(`I appreciate your enthusiasm but it's not your turn yet. It is *${this.getCurrentUserName()}*'s turn.`)
      }
      delete state.complained

      state.playCount += 1
      if (state.playCount % state.userCount === 0) state.iterationCount += 1
      state.story += message.text.trim() + ' '
      state.words += 3
      this.nextUser()

      if (state.iterationCount == state.maxIterations) {
        return this.askForTitle()
      } else {
        say(`Cool. Next is *${this.getCurrentUserName()}*! ${this.getGameProgressMessage()}`)
      }
    },

    nextUser () {
      const nextUser = ((state.user + 1) > (_.size(users) - 1)) ? 0 : state.user + 1
      state.user = nextUser
      saveState()

      this.setSkipUserTimeout()
    },

    handleSkipUserTimeout () {
      this.nextUser()
      say(`You snooze you lose! Next is *${this.getCurrentUserName()}*. ${this.getGameProgressMessage()}`)
    },

    askForTitle () {
      this.resetTimeouts()

      state.processingTitles = true
      state.titles = {}
      saveState()

      say(`Nice one! Now all I need is the title. Anyone?`)
      this.setTitleTimeout()
    },

    processTitle (message) {
      if (message.text === 'THE END' && this.getTitleCount() > 0) return this.finish()

      if (state.titles[message.user]) {
        if (state.complained) return
        state.complained = true
        return complain('I mean... Anyone ELSE?')
      }
      delete state.complained

      state.titles[message.user] = message.text.trim()
      if (this.getTitleCount() >= users.length) return this.finish()

      saveState()

      say('Good. Anyone else? You can also say "THE END" if you think there are enough titles.')
      this.setTitleTimeout()
    },

    handleTitleTimeout () {
      if (this.getTitleCount() > 0) return this.finish()

      say('Still need that title, guys!')
      this.setTitleTimeout()
    },

    finish () {
      this.resetTimeouts()

      const formattedStory = this.getFormattedStory()
      say(formattedStory)
      say(`I'll also post this story to <#${STORY_CHANNEL}|${STORY_CHANNEL}>.`)

      const storyChannelConfig = _.assign({}, config, { channel: STORY_CHANNEL })
      sendMessage(storyChannelConfig, formattedStory)

      onFinish(channel)
    },

    calculateProgress () {
      const { playCount, maxIterations } = state
      const maximumPlayCount = maxIterations * users.length
      const progress = (playCount * 100) / maximumPlayCount

      return progress.toFixed(1)
    },

    calculateRemainingTurns () {
      const { playCount, maxIterations } = state
      const maximumPlayCount = maxIterations * users.length
      return maximumPlayCount - playCount
    },

    getTitleCount () {
      return Object.keys(state.titles).length
    },

    getCurrentUserName () {
      return users[state.user].name
    },

    getGameProgressMessage() {
      let hurryMessage = ''
      const remainingTurns = this.calculateRemainingTurns()
      if (remainingTurns === 1) {
        hurryMessage = 'No pressure, but this is kind of the last turn.'
      } else if (remainingTurns === 4) {
        hurryMessage = 'Start leading to a conclusion, there are only 3 more turns after this!'
      }

      const gameProgress = `Game progress: ${this.calculateProgress()}%.`

      return `${hurryMessage} ${gameProgress}`
    },

    getHurryMessage () {
      return `Start leading to a conclusion, there are only 3 more turns after this!`
    },

    getFormattedStory () {
      let authors = _.map(users, (user) => '@' + user.name).join(', ')
      const lastComma = authors.lastIndexOf(', ')
      authors = authors.substring(0, lastComma) + ' and ' + authors.substring(lastComma + 2)

      const title = _.shuffle(state.titles)[0]
      const pretext = `*${title}*\n_a story by ${authors}_`
      const text = `${state.story}`
      const fallback = `${pretext}\n${text}`
      const formattedStory = {
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
      return formattedStory
    },

    setSkipUserTimeout () {
      if (timeouts.skipUser) clearTimeout(timeouts.skipUser)
      timeouts.skipUser = setTimeout(this.handleSkipUserTimeout.bind(this), SKIP_USER_TIMEOUT)
    },

    setTitleTimeout () {
      if (timeouts.title) clearTimeout(timeouts.title)
      timeouts.title = setTimeout(this.handleTitleTimeout.bind(this), TITLE_TIMEOUT)
    },

    resetTimeouts () {
      _.each(timeouts, (timeout) => { clearTimeout(timeout) })
      timeouts = {}
    }
  }
}
