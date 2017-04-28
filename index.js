import _ from 'lodash'
import gameLibrary from './games'
import { sendMessage } from './utils/chat'
import colors from './utils/colors'

/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */
function onInstallation(bot, installer) {
  if (installer) {
    bot.startPrivateConversation({user: installer}, function (err, convo) {
      if (err) {
        console.log(err);
      } else {
        convo.say('I am a bot that has just joined your team');
        convo.say('You must now /invite me to a channel so that I can be of use!');
      }
    });
  }
}

/**
 * Configure the persistence options
 */
var config = {};
if (process.env.MONGOLAB_URI) {
  var BotkitStorage = require('botkit-storage-mongo');
  config = {
    storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
  };
} else {
  config = {
    json_file_store: ((process.env.TOKEN)?'./db_slack_bot_ci/':'./db_slack_bot_a/'), //use a different name if an app or CI
  };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */
if (process.env.TOKEN || process.env.SLACK_TOKEN) {
  //Treat this as a custom integration
  var customIntegration = require('./lib/custom_integrations');
  var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
  var controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
  //Treat this as an app
  var app = require('./lib/apps');
  var controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
  console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
  process.exit(1);
}

/**
 * Hook game library to the bot controller and try to recover game state
 */
gameLibrary.setController(controller)

/**
 * Connection related stuff
 */
controller.on('rtm_open', function (bot) {
  console.log('** The RTM api just opened');

  controller.storage.teams.get('gamebot', (err, recoveredState) => {
    if (err) {
      console.log(err)
      return
    }

    if (recoveredState && recoveredState.gameLibrary && _.keys(recoveredState.gameLibrary).length) {
      _.each(recoveredState.gameLibrary, (recoveredGame, channel) => {
        const { id, data } = recoveredGame
        const { state, users } = data
        gameLibrary.continue(id, state, { bot, channel, users })
      })
    }
  })
});

controller.on('rtm_close', function (bot) {
  console.log('** The RTM api just closed');
  // TODO: try to reconnect with exponential back-off
});


/**
 * Core bot logic goes here!
 */
controller.on('bot_channel_join', function (bot, message) {
  //bot.reply(message, "I'm here!")
});

controller.hears('abort all current games yes i am sure', 'direct_message', function (bot, message) {
  gameLibrary.abortAll()
});

/*
controller.hears('create room with (.*)', 'direct_message', function (bot, message) {
  const players = message.match[1].split(/[,\s]+/)
  //players = validate(players)
  bot.reply(message, 'creating game room with ' + players.join(', '))
  // invite users to group chat
  // send message to chat telling how to start game
});
*/

controller.hears('help', 'direct_mention,direct_message', function (bot, message) {
  let help = ''
  _.each(gameLibrary.listGames(), (game) => {
    help += `*play ${game}* - starts a ${game} game\n`
  })
  help += '*game over* - aborts current game\n'

  bot.reply(message, help)
})

controller.hears('play (.*)', 'direct_mention,direct_message', function (bot, message) {
  var params = message.match[1].split(/[,\s]+/)
  var game = _.trim(params[0])
  var maxIterations = params[1]

  if (!_.includes(gameLibrary.listGames(), game)) {
    return sendMessage({ bot, channel: message.channel }, `Game not found: *${game}*.`, colors.error);
  }

  getMpimMembers(bot, message.channel).then((users) => {
    gameLibrary.start(game, { bot, channel: message.channel, users }, { maxIterations })
  })
});

controller.hears('game over', 'direct_mention,direct_message', function (bot, message) {
  gameLibrary.abort({ bot, channel: message.channel })
})

controller.on('ambient', (bot, message) => {
  const game = gameLibrary.findRunningGame(message.channel)
  if (!game) return

  game.processMessage(message)
});

controller.on('slash_command', (bot, message) => {
  const game = gameLibrary.findRunningGame(message.channel)
  const printCards = (cards) => {
    return cards.reduce((result, card, index) => {
      return result += `${index + 1}. ${card.description} \n`
    }, 'Your cards are:\n')
  }

  if (game) {
    if (message.text === 'show cards') {
      const player = game.getPlayer(message.user_id)
      bot.replyPrivate(message, printCards(player.cards))
    }
  }
})

const getMpimMembers = (bot, channel) => {
  return new Promise((resolve, reject) => {
    bot.api.mpim.list({}, (err, resp) => {
      const mpim = _.find(resp.groups, { id: channel })
      if (!mpim) return resolve([])

      const userPromises = mpim.members
        .filter((member) => member !== bot.identity.id)
        .map((member) => getUserInfo(bot, member))

      Promise.all(userPromises).then(resolve).catch(reject)
    })
  })
}

const getUserInfo = (bot, userId) => {
  return new Promise((resolve, reject) => {
    bot.api.users.info({ user: userId }, (err, resp) => {
      if (!resp || !resp.ok) return reject()
      const { id, name } = resp.user
      resolve({ id, name })
    })
  })
}
