// Load environment variables from `.env` file (optional)
require('dotenv').config();

const slackEventsApi = require('@slack/events-api');
const SlackClient = require('@slack/client').WebClient;
const passport = require('passport');
const SlackStrategy = require('@aoberoi/passport-slack').default.Strategy;
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

var googleTTS = require('google-tts-api');

var fs = require('fs'),
request = require('request');

const spawn = require("child_process").spawn;
const py = spawn('python', ['/Users/mahmed/Documents/GitHub/Accessbility-App/tts.py']);

// *** Initialize event adapter using verification token from environment variables ***
const slackEvents = slackEventsApi.createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN, {
  includeBody: true
});

// use web in place of slack for future transactions
const web = new SlackClient(process.env.SLACK_AUTHORIZATION_TOKEN);

// Initialize a data structures to store team authorization info (typically stored in a database)
const botAuthorizations = {}

// Helpers to cache and lookup appropriate client
// NOTE: Not enterprise-ready. if the event was triggered inside a shared channel, this lookup
// could fail but there might be a suitable client from one of the other teams that is within that
// shared channel.
const clients = {};
function getClientByTeamId(teamId) {

  // console.log(botAuthorizations)

  if (!clients[teamId] && botAuthorizations[teamId]) {

    clients[teamId] = client;
    return client;
  }

  return null;
}

// Initialize an Express application
const app = express();
app.use(bodyParser.json());

// Plug the Add to Slack (OAuth) helpers into the express app
app.get('/', (req, res) => {
  res.send('<a href="/auth/slack"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>');
});

// *** Plug the event adapter into the express app as middleware ***
app.use('/slack/events', slackEvents.expressMiddleware());

// *** Attach listeners to the event adapter ***

// *** Greeting any user that says "hi" ***
slackEvents.on('message', (message, body) => {
  // Only deal with messages that have no subtype (plain messages) and contain 'hi'
  console.log(body);

  if ((!message.subtype && message.text.indexOf('hi') >= 0) && message.user !== 'UBPPK0M5E') {
    // console.log('current info: ');
    // console.log(web.users.info);
    // Initialize a client
    // const slack = we;
    // // Handle initialization failure
    if (!web) {
      return console.error('No authorization found for this team. Did you install this app again after restarting?');
    }
    // Respond to the message back in the same channel
    web.chat.postMessage({channel: message.channel, text: `Hello <@${message.user}>! :tada:`})
      .then((res) =>{
        console.log(res);
      }).catch(console.error);
  }
});

// end of play event func

// *** Handle errors ***
slackEvents.on('error', (error) => {
  if (error.code === slackEventsApi.errorCodes.TOKEN_VERIFICATION_FAILURE) {
    // This error type also has a `body` propery containing the request body which failed verification.
    console.error(`An unverified request was sent to the Slack events Request URL. Request body: \
${JSON.stringify(error.body)}`);
  } else {
    console.error(`An error occurred while handling a Slack event: ${error.message}`);
  }
});

// Start the express application
const port = process.env.PORT || 5000;
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});
