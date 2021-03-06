const Request = require('request')
const Moment = require('moment')

module.exports.nextRace = (msg) => {
  var url = 'http://ergast.com/api/f1/current/next.json'

  Request.get(url, function(error, response, body) {
    var result = JSON.parse(body)
    var races = result.MRData.RaceTable.Races
    var race = races.pop()

    var raceDate = Moment(race.date + ' ' + race.time)
    var reply = {
      as_user: true,
      response_type: 'in_channel',
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
    }

    return msg.respond(reply)
  })
}

module.exports.getRace = (options, msg) => {
  
  var year = 'current'
  var round = 'last'

  if(options) {
    if(!options.length)
      return

    year = options[0]
    round = options[1]
  }

  var url = 'http://ergast.com/api/f1/' + year + '/' + round + '/results.json'

  Request.get(url, function(error, response, body) {
    var result = JSON.parse(body)
    var races = result.MRData.RaceTable.Races
    var race = races.pop()

    var raceDate = Moment(race.date + ' ' + race.time)
    var results = {
      title: 'Results',
      value: '',
    }

    for (var i = 0; i < race.Results.length; i++) {
      var result = race.Results[i]
      results.value += result.positionText + ' - '
      results.value += result.Driver.givenName + ' '
      results.value += result.Driver.familyName + ' - '
      results.value += result.Driver.nationality + ' - '
      results.value += result.Constructor.name + ' '
      result.Time
      ? results.value += result.Time.time
      : ''
      results.value += '\n'
    }

    var reply = {
      as_user: true,
      response_type: 'in_channel',
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
    }

    return msg.respond(reply)
  })
}