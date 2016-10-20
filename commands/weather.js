const Request = require('request')

module.exports.getWeather = (location, msg) => {
  var locationQuery = escape("select item from weather.forecast where woeid in (select woeid from geo.places where text='" + location + "') and u='c'")
  var locationUrl = "https://query.yahooapis.com/v1/public/yql?q=" + locationQuery + "&format=json"

  if(!location.length) return;

  Request.get(locationUrl, function(error, response, body) {
    var result = JSON.parse(body)
    var channel = result.query.results.channel

    if (Array.isArray(result.query.results.channel))
      channel = result.query.results.channel[0]

    var text = channel.item.title + '\n`Current` ' + channel.item.condition.temp + ' degrees, ' + channel.item.condition.text + '\n`' + channel.item.forecast[0].day + '` High: ' + channel.item.forecast[0].high + ' Low: ' + channel.item.forecast[0].low + ', ' + channel.item.forecast[0].text + '\n`' + channel.item.forecast[1].day + '` High: ' + channel.item.forecast[1].high + ' Low: ' + channel.item.forecast[1].low + ', ' + channel.item.forecast[1].text

    var reply = {
      as_user: true,
      response_type: 'in_channel',
      attachments: [{
        text: text,
        mrkdwn_in: ['text']
      }]
    }
    return msg.respond(reply)
  })
}