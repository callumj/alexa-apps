/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

var AlexaSkill = require('./AlexaSkill');

var http = require('http');
var xml = require("xml2js");

/**
 * Muni is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var Muni = function () {
    AlexaSkill.call(this, APP_ID);
};

var httpGet = function(url, callback) {
  console.log(url);
  http.get(url, function(res) {
      var body = '';

      res.on('data', function (chunk) {
          body += chunk;
      });

      res.on('end', function () {
        xml.parseString(body, function (err, result) {
          callback(result);
        });
      });
  }).on('error', function (e) {
      console.log("Got error: ", e);
  });
};

var nextMuniIntent = function(intent, session, response) {
  httpGet("http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=sf-muni&r=N&s=5122", function(data) {
    console.log(data);
    var predictions = data.body.predictions;
    if (!predictions || predictions.length == 0) {
      response.tell("N may not be in service right now");
      return;
    }

    var predict = predictions[0];
    var direction = predict.direction[0];
    var title = direction.$.title.split(" ")[0];
    var times = [];
    direction.prediction.forEach(function(pre, index, ary) {
      if (times.length == 3) {
        return;
      }
      times.push(pre.$.minutes);
    });

    var cardOuput = "Departs in " + times.join(", ") + " minutes";
    var text = "<p>Times for " + title + "</p><p>Departs in ";
    text = text + times.join(" <break strength=\"weak\" /> or <break strength=\"weak\" />") + " minutes.</p>";

    console.log(text);
    var speechOutput = {
        speech: "<speak>" + text + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    response.tellWithCard(speechOutput, "Muni", cardOuput)
    response.tell(speechOutput);
  });
};

// Extend AlexaSkill
Muni.prototype = Object.create(AlexaSkill.prototype);
Muni.prototype.constructor = Muni;

Muni.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("Muni onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

Muni.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Muni onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to Muni, you can ask me your next train.";
    var repromptText = "You can say next train.";
    response.ask(speechOutput, repromptText);
};

Muni.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("Muni onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

Muni.prototype.intentHandlers = {
    // register custom intent handlers
    "NextMuniIntent": function (intent, session, response) {
      nextMuniIntent(intent, session, response);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say hello to me!", "You can say hello to me!");
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the Muni skill.
    var inst = new Muni();
    inst.execute(event, context);
};
