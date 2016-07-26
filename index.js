var Botkit = require('botkit')
var Request = require('request')
var Moment = require('moment')

var token = process.env.SLACK_TOKEN

var controller = Botkit.slackbot({
  // reconnect to Slack RTM when connection goes bad
  retry: Infinity,
  debug: false
})

controller.on('rtm_close', function() {
  process.exit();
});

// Assume single team mode if we have a SLACK_TOKEN
if (token) {
  console.log('Starting in single-team mode')
  controller.spawn({
    token: token
  }).startRTM(function (err, bot, payload) {
    if (err) {
      throw new Error(err)
    }

    console.log('Connected to Slack RTM')
  })
// Otherwise assume multi-team mode - setup beep boop resourcer connection
} else {
  console.log('Starting in Beep Boop multi-team mode')
  require('beepboop-botkit').start(controller, { debug: true })
}

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "I'm here!")
})

controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
  bot.reply(message, 'Hello.')
})

controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
  bot.reply(message, 'Hello.')
})

controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
  bot.reply(message, 'Hello.')
  bot.reply(message, 'It\'s nice to talk to you directly.')
})

controller.hears('.*', ['mention'], function (bot, message) {
  bot.reply(message, 'You really do care about me. :heart:')
})

controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`bot hi` for a simple message.\n' +
      '`bot attachment` to see a Slack attachment message.\n' +
      '`@<your bot\'s name>` to demonstrate detecting a mention.\n' +
      '`bot help` to see this again.'
  bot.reply(message, help)
})

controller.hears(['attachment'], ['direct_message', 'direct_mention'], function (bot, message) {
  var text = 'Beep Beep Boop is a ridiculously simple hosting platform for your Slackbots.'
  var attachments = [{
    fallback: text,
    pretext: 'We bring bots to life. :sunglasses: :thumbsup:',
    title: 'Host, deploy and share your bot in seconds.',
    image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
    title_link: 'https://beepboophq.com/',
    text: text,
    color: '#7CD197'
  }]

  bot.reply(message, {
    attachments: attachments
  }, function (err, resp) {
    console.log(err, resp)
  })
})

controller.hears('!weather (.*)', ['direct_message', 'direct_mention', 'mention', 'ambient'], function(bot, message){
  if(!message.match.length)
    return;

  var location = message.match[1];
  var locationQuery = escape("select item from weather.forecast where woeid in (select woeid from geo.places where text='" + location + "') and u='c'");
  var locationUrl = "https://query.yahooapis.com/v1/public/yql?q=" + locationQuery + "&format=json";

  Request.get(locationUrl, function(error, response, body) {
    var result = JSON.parse(body);
    var channel = result.query.results.channel;

    if (Array.isArray(result.query.results.channel))
      channel = result.query.results.channel[0]

    var reply = channel.item.title + '\n`Current` ' + channel.item.condition.temp + ' degrees, ' + channel.item.condition.text + '\n`' + channel.item.forecast[0].day + '` High: ' + channel.item.forecast[0].high + ' Low: ' + channel.item.forecast[0].low + ', ' + channel.item.forecast[0].text + '\n`' + channel.item.forecast[1].day + '` High: ' + channel.item.forecast[1].high + ' Low: ' + channel.item.forecast[1].low + ', ' + channel.item.forecast[1].text;

    return bot.reply(message, reply);
  })

})

controller.hears('!nextrace', ['direct_message', 'direct_mention', 'mention', 'ambient'], function(bot, message){
  var url = 'http://ergast.com/api/f1/current/next.json';

  Request.get(url, function(error, response, body) {
    var result = JSON.parse(body);
    var races = result.MRData.RaceTable.Races;
    var race = races.pop();

    var raceDate = Moment(race.date + ' ' + race.time);
    var reply = {
      text: '',
      attachments: [{
        fields: [{
          title: 'Race',
          value: race.raceName,
          short: true
        },{
          title: 'Round',
          value: race.round,
          short: true
        },{
          title: 'Circuit',
          value: '<' + race.Circuit.url + '|' + race.Circuit.circuitName + '>',
          short: true
        },{
          title: 'Date/Time',
          value: raceDate.fromNow(),
          short: true
        }],
        text: '',
        thumb_url: 'https://www.formula1.com/etc/designs/fom-website/icon128x128.png',
        footer: 'Formula 1',
        footer_icon: 'https://www.formula1.com/etc/designs/fom-website/icon128x128.png'
      }],
    };

    return bot.reply(message, reply);
  })

})

controller.hears(['!lastrace', '!race (.*) (.*)'], ['direct_message', 'direct_mention', 'mention', 'ambient'], function(bot, message){
  var year = message.match[1];
  var round = message.match[2];

  if(!year || !round) {
    year = 'current';
    round = 'last';
  }
  var url = 'http://ergast.com/api/f1/' + year + '/' + round + '/results.json';


  Request.get(url, function(error, response, body) {
    var result = JSON.parse(body);
    var races = result.MRData.RaceTable.Races;
    var race = races.pop();

    var raceDate = Moment(race.date + ' ' + race.time);
    var results = {
      title: 'Results',
      value: '',
    };

    for (var i = 0; i < race.Results.length; i++) {
      var result = race.Results[i];
      results.value += result.positionText + ' - ';
      results.value += result.Driver.givenName + ' ';
      results.value += result.Driver.familyName + ' - ';
      results.value += result.Driver.nationality + ' - ';
      results.value += result.Constructor.name + ' ';
      result.Time
        ? results.value += result.Time.time
        : '';
      results.value += '\n';
    }

    var reply = {
      text: '',
      attachments: [{
        fields: [{
          title: 'Race',
          value: race.raceName,
          short: true
        },{
          title: 'Round',
          value: race.round,
          short: true
        },{
          title: 'Circuit',
          value: '<' + race.Circuit.url + '|' + race.Circuit.circuitName + '>',
          short: true
        },{
          title: 'Date/Time',
          value: raceDate.fromNow(),
          short: true
        },
          results
        ],
        text: '',
        thumb_url: 'https://www.formula1.com/etc/designs/fom-website/icon128x128.png',
        footer: 'Formula 1',
        footer_icon: 'https://www.formula1.com/etc/designs/fom-website/icon128x128.png'
      }],
    };

    return bot.reply(message, reply);
  })

})

controller.hears('another_keyword','direct_message,direct_mention',function(bot,message) {
  var reply_with_attachments = {
    'username': 'My bot' ,
    'text': 'This is a pre-text',
    'attachments': [
      {
        'fallback': 'To be useful, I need you to invite me in a channel.',
        'title': 'How can I help you?',
        'text': 'To be useful, I need you to invite me in a channel ',
        'color': '#7CD197'
      },{
        'fallback': 'To be useful, I need you to invite me in a channel.',
        'title': 'How can I help you?',
        'text': 'To be useful, I need you to invite me in a channel ',
        'color': '#7CD197'
      }
    ],
    'icon_url': 'http://lorempixel.com/48/48'
    }

  bot.reply(message, reply_with_attachments);
});

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
})
