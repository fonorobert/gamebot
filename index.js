import _ from 'lodash'
import games from './games'

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
 * Connection related stuff
 */
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

controller.hears('hello', 'direct_message', function (bot, message) {
  console.log(message)
  bot.reply(message, 'Hello!');
});

controller.hears('create room with (.*)', 'direct_message', function (bot, message) {
  const players = message.match[1].split(/[,\s]+/)
  //players = validate(players)
  bot.reply(message, 'creating game room with ' + players.join(', '))
  // invite users to group chat
  // send message to chat telling how to start game
});

controller.hears('start (.*)', 'direct_mention', function (bot, message) {
  var game = message.match[1]
  bot.reply(message, `starting *${game}*`);
  games.start(game, { message })
});
