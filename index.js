const Slapp = require('slapp')
const BeepBoopContext = require('slapp-context-beepboop')

const commands = require('./commands')

if (!process.env.PORT) throw Error('PORT missing but required')

var slapp = Slapp({
  context: BeepBoopContext(),
  log: process.env.DEV ? true : false,
  colors: process.env.DEV ? true : false
})

slapp.command('/nextrace',          (msg) => commands.f1.nextRace(msg))
slapp.command('/lastrace',          (msg) => commands.f1.getRace(false, msg))
slapp.command('/race', '(.*) (.*)', (msg, text, year, round) => commands.f1.getRace([year, round], msg))
slapp.command('/weather', '(.*)',   (msg, text, location) => commands.weather.getWeather(location, msg))

slapp.attachToExpress(require('express')()).listen(process.env.PORT)