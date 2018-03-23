const express = require('express')
const app = express()
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const mysql = require('mysql');

const secret = speakeasy.generateSecret({ name: 'ZCChat', length: 20 });

const db = mysql.createConnection({
  host: "0.0.0.0",
  user: "root",
  password: "",
  database: 'ZC_CHAT'
});

db.connect(function (err) {
  if (err) throw err;
});

handleHomeIndex = (req, res) => {
  res.send('Hello World!');
}

handleOtp = (req, res) => {
  db.query('select * from users where number = ' + req.query.mobile, function (err, result) {
    if (err) throw err;
    if (!result[0]) {
      const secret = speakeasy.generateSecret({ name: 'ZCChat', length: 20 });
      db.query(`insert into users (number, secret) values ("${req.query.mobile}", "${secret.base32}")`, function (err, result) {
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

verifyOtp = (req, res) => {
  var token = speakeasy.totp({
    secret: secret,
    encoding: 'base32'
  });


  db.query('select * from users where number = ' + req.query.mobile, function (err, result) {
    if (err) throw err;
    if (!result[0]) {
      res.json({ error: 'No User Found' });
      const secret = speakeasy.generateSecret({ name: 'ZCChat', length: 20 });
      db.query(`insert into users (number, secret) values ("${req.query.mobile}", "${secret.base32}")`, function (err, result) {
        if (err) throw err;
        QRCode.toDataURL(secret.otpauth_url, function (err, image_data) {
          res.send(image_data); // A data URI for the QR code image
        });
      })
    }
    else {
      var verified = speakeasy.totp.verify({
        secret: result.secret,
        encoding: 'base32',
        token: req.query.otp
      });
    }
  });
}

handleLogin = (req, res) => {
  const secret = speakeasy.generateSecret({ name: 'ZCChat', length: 20 });
}

app.get('/', handleHomeIndex);
app.get('/login', (req, res) => res.json({ otp: parseInt(Math.random() * 1000000) }));
app.get('/speakeasy', (req, res) => res.json(secret));
app.get('/otp', handleOtp);
// app.get('/verify-otp', handleOtp);


app.listen(3000, () => console.log('Example app listening on port 3000!'))