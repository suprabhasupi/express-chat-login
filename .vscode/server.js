const express = require('express');
const app = express();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const cors = require('cors');
const bodyParser = require('body-parser')
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

handleLogin = (username, cb) => {
  db.query(`select * from newusers where username = "${username}"`, function (err, result) {
    if (err) cb(err, {});
    if (result[0]) return cb(null, { registered: true });
    // if (!result[0]) {
    const secret = speakeasy.generateSecret({ name: 'ZC_Chat', length: 20 });
    db.query(`insert into newusers (username, secret) values ("${username}", "${secret.base32}")`, function (err, result) {
      if (err) throw err;
      QRCode.toDataURL(secret.otpauth_url, function (err, image_data) {
        cb(null, { img: image_data }); // A data URI for the QR code image
      });
    });
    // }
    // else {
    //   QRCode.toDataURL(`otpauth://totp/ZCChat?secret=${result[0].secret}`, function (err, image_data) {
    //     res.json({'img': image_data}); // A data URI for the QR code image
    //   });
    // }
  });
}
handleOtp = (req, res) => {
  const { username, otp } = req.body;
  console.log('helo helo')
  if (!username) return res.status(400).json({
    status: 0,
    message: 'username required',
  });

  if (!otp) return handleLogin(username, (err, data) => {
    if (err) throw err;
    res.json(data);
  });

  db.query(`select secret from newusers where username = "${username}"`, (err, result) => {
    if (err) throw err;
    if (!result[0]) throw new Error("no user found");
    res.json({
      loggedIn: speakeasy.totp.verify({
        secret: result[0].secret,
        encoding: 'base32',
        token: otp
      })
      // message: 
    })
  });
}

app.use(bodyParser.json());
app.use(cors())

app.get('/', (req, res) => res.send('Hello World!'))
// app.get('/speakeasy', (req, res) => res.send(secret))
// app.get('/qrcode', (req, res) => res.send(qrcode))
app.post('/otp', handleOtp)
// send query ?mobile=345678987 
// app.get('/verify-otp', verifyToken);
// send query ?mobile=345678987 

app.listen(3000, () => console.log('Example app listening on port 3000!'))