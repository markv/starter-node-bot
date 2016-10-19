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
})

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

controller.setupWebserver(process.env.PORT, function(err, webserver) {
    controller.createWebhookEndpoints(webserver);
});

controller.on('slash_command', function(bot, message) {
  switch(message.command) {
    case 'nextrace': 
      return nextRace(bot, message);
  }
});

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

function nextRace(bot, message) {
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
}

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


controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
})
