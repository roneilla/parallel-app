var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

const mongodb = require('mongodb');
const port = 8888;
const url = 'mongodb://localhost:27017/parallel';

var client_id = 'b7b0dc3656af41c79fc04d7aac97dc1e'; // Your client id
var client_secret = '420b080e54f84a63b70730125b2e34e9'; // Your secret
var redirect_uri = 'http://10.2.45.87:8888/callback'; // Your redirect uri

var generateRandomString = function (length) {
  var text = '';
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var generateServerID = function () {
  var text = '';
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app
  .use(express.static(__dirname + '/public'))
  .use(cors())
  .use(express.json())
  .use(cookieParser());

app.get('/login', function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  var scope =
    'user-read-private user-read-email user-read-currently-playing user-modify-playback-state';
  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

app.get('/callback', function (req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      '/#' +
        querystring.stringify({
          error: 'state_mismatch',
        })
    );
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
      },
      headers: {
        Authorization:
          'Basic ' +
          new Buffer(client_id + ':' + client_secret).toString('base64'),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me/player',
          headers: { Authorization: 'Bearer ' + access_token },
          json: true,
        };
        request.get(options, function (error, response, body) {
          console.log(body);
        });
        res.redirect(
          '/#' +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
            })
        );
      } else {
        res.redirect(
          '/#' +
            querystring.stringify({
              error: 'invalid_token',
            })
        );
      }
    });
  }
});

app.get('/refresh_token', function (req, res) {
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization:
        'Basic ' +
        new Buffer(client_id + ':' + client_secret).toString('base64'),
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        access_token: access_token,
      });
    }
  });
});

mongodb.MongoClient.connect(url, (error, client) => {
  if (error) return console.log(error);
  const db = client.db();

  app.get('/', (req, res) => {
    res.send("<a href='/partyRooms'>VIEW CURRENTLY PLAYED SONGS HERE!!</a>");
  });

  // GET method
  app.get('/partyRooms', (req, res) => {
    const _id = new mongodb.ObjectID(req.params.id);
    db.collection('partyRooms')
      .find({})
      .toArray(function (err, item) {
        if (err) {
          res.send({
            error: 'An error has occured',
          });
        } else {
          res.send(item);
        }
      });
  });

  // POST method
  app.post('/partyRooms', (req, res) => {
    console.log(req);
    const entry = {
      serverId: req.body.serverId,
      serverName: req.body.serverName,
      hostName: req.body.hostName,
      songName: req.body.songName,
      position: req.body.position,
      duration: req.body.duration,
    };
    db.collection('partyRooms').insertOne(entry, (err, result) => {
      if (err) {
        res.send({
          error: 'An error has occured',
        });
      } else {
        res.send(result.ops[0]);
      }
    });
  });

  // PUT REQUESTS
  app.put('/partyRooms/:id', (req, res) => {
    const _id = new mongodb.ObjectID(req.params.id); // Mongo wants _id to be an "ObjectID" (not just a "string").
    const entry = {
      songName: req.body.songName,
      position: req.body.position,
      duration: req.body.duration,
    };
    db.collection('partyRooms').update({ _id: _id }, entry, (err, item) => {
      if (err) {
        res.send({ error: 'An error has occured' });
      } else {
        res.send(item);
      }
    });
  });
});

console.log('Listening on ' + port);
app.listen(port);
