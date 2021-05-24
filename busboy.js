var GAPI = require('unggah').gapitoken;
var GCS = require('unggah');
var fs = require('fs');
var path = require('path');
var format = require('util').format;
var config = require('../res/config.js').GCS;

const STATIC_URL = "gs://image-upload-capstone-project";
const BUCKET = config.BUCKET_NAME;
const FILENAME = "rock-cloud.png";
const KEY_PATH = "../res/key.pem";
const FILE_PATH = "/tmp/test.png";

var gapi = new GAPI({
  iss: config.ISS,
  scope: config.SCOPE,
  keyFile: path.join(__dirname, KEY_PATH)
}, function(err) {
  if (err) {
    console.error(err);
  } else {
    var gcs = new GCS(gapi);

    fs.stat(FILE_PATH, function(err, stats) {
      if (err) {
        console.error(err);
      } else {
        var file = fs.createReadStream(FILE_PATH);

        var headers = {
          'Content-Length': stats.size,
          'Content-Type': 'image/png',
          'x-goog-acl': 'public-read'
        };

        gcs.putStream(file, config.BUCKET_NAME, '/' + FILENAME, headers, function(err, res, body) {
          if (err) {
            console.error(err);
          } else {
            console.log(res);
            console.log(format("Your file is here: %s/%s/%s", STATIC_URL, BUCKET, FILENAME));
          }
        });
      }
    });
  }
});