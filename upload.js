//Start of Image Uploader
const path = require('path');
const os = require('os');
const fs = require('fs');

var http = require('http');
var formidable = require('formidable');
var Busboy = require('busboy');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
// Creates a client from a Google service account key
// const storage = new Storage({keyFilename: 'key.json'});

const uuidv1 = require('uuidv1');

// http.createServer(function (req, res) {
//   if (req.url == '/fileupload') {
//     var form = new formidable.IncomingForm();
//     form.parse(req, function (err, fields, files) {
//       var oldpath = files.filetoupload.path;
//       var newpath = 'C:\Users\User\Desktop' + files.filetoupload.name;
//       fs.rename(oldpath, newpath, function (err) {
//         if (err) throw err;
//         res.write('File uploaded and moved!');
//         res.end();
//       });
//  });
//   } else {
//     res.writeHead(200, {'Content-Type': 'text/html'});
//     res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
//     res.write('<input type="file" name="filetoupload"><br>');
//     res.write('<input type="submit">');
//     res.write('</form>');
//     return res.end();
//   }
// }).listen(8080);

exports.uploadFile = (req, res) => {
  if (req.method === 'POST') {
    var busboy = new Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();
    const fields = {};
    const uploads = {};

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on('file', (fieldname, file, filename) => {
      if (fieldname === 'image') {
        console.log(`Processed file ${filename}`);
        const filepath = path.join(tmpdir, filename);
        uploads[fieldname] = filepath;
        file.pipe(fs.createWriteStream(filepath));
      }
    });

    busboy.on('error', (error) => {
      console.log(error)
    })

    busboy.on('finish', () => {

      const userId = fields["user_id"];
      const imageId = uuidv1();

      if (userId === undefined) {
        res.status(400);
        res.send({error: 'user_id is not provided'});
        console.log(new Error('user_id is not provided'))
      }

      // for (const name in uploads) {
      const file = uploads["image"];
      if (file === undefined) {
        res.status(400);
        res.send({error: 'image is not provided'});
        console.log(new Error('image is not provided'))
      }

      var fileExtensionArr = file.split(".");
      var fileExtension = fileExtensionArr[fileExtensionArr.length-1];

      const destination = `${userId}/${imageId}.${fileExtension}`;
      const options = {
        destination: destination
      };
      //uploading to cloud storage
      const bucketName = "image-upload-capstone-project"
      storage
      .bucket(bucketName)
      .upload(file, options)
      .then(() => {
        // console.log(`${file} uploaded to gs://image-upload-capstone-project`);
        console.log(`${file} uploaded to gs://${bucketName}/${destination}`);
        fs.unlinkSync(file);
        const data = {
          operation_id: imageId,
          path: `gs://${bucketName}/${destination}`
        };
        res.send(data);
      })
      .catch(err => {
        console.error('ERROR:', err);
        res.status(500).send(err)
      });
    });

    busboy.end(req.rawBody)
    req.pipe(busboy);
  } else {
    res.status(405).end();
  }
};
//End of Image Uploader