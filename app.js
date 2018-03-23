const express = require('express');
const app = express();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const mysql = require('mysql');

const secret = speakeasy.generateSecret({ name: 'ZC_Chat', length: 20 });

var db = mysql.createConnection({
  host: "0.0.0.0",
  user: "root",
  password: "",
  database: 'ZC_CHAT'
});

db.connect(function (err) {
  if (err) throw err;
  console.log("Connected to DB!");
});

handleOtp = (req, res) => {
  db.query('select * from newusers where number = ' + req.query.mobile, function (err, result) {
    if (err) throw err;
    if (!result[0]) {
      const secret = speakeasy.generateSecret({ name: 'ZC_Chat', length: 20 });
      db.query(`insert into newusers (number, secret) values ("${req.query.mobile}", "${secret.base32}")`, function (err, result) {
        if (err) throw err;
        QRCode.toDataURL(secret.otpauth_url, function (err, image_data) {
          res.send(image_data); // A data URI for the QR code image
        });
      })
    }
    else {
      QRCode.toDataURL(`otpauth://totp/ZCChat?secret=${result[0].secret}`, function (err, image_data) {
        res.send(image_data); // A data URI for the QR code image
      });
    }
  });
}

verifyToken = (req,res) => {
  db.query('select * from newusers where number = ' + req.query.mobile, function (err, result) {
    if (err) throw err;
    const secret = result[0].secret
    const otp = req.query.otp
    var token = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });
    var verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: otp
    });
    console.log('***Token*****', token)
    console.log('***verified*****', verified)
  });
}

app.get('/', (req, res) => res.send('Hello World!'))
app.get('/speakeasy', (req, res) => res.send(secret))
app.get('/qrcode', (req, res) => res.send(qrcode))

app.get('/otp', handleOtp)
// send query ?mobile=345678987 
app.get('/verify-otp', verifyToken);
// send query ?mobile=345678987 

app.listen(3000, () => console.log('Example app listening on port 3000!'))