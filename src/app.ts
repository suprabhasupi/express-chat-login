import express from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import uuid from 'uuid/v4';
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors({
  credentials: true,
  origin: 'http://localhost:8080'
}));


const secret = speakeasy.generateSecret({ name: 'ZC_Chat', length: 20 });

var db = mysql.createConnection({
  host: "0.0.0.0",
  port: 3307,
  user: "root",
  password: "password",
  database: 'ZC_CHAT'
});

db.connect(function (err: Error) {
  if (err) throw err;
  console.log("Connected to DB!");
});

const handleLogin = (username: String, email: String, cb: Function) => {
  db.query(`select * from newusers where username = "${username}"`, function (err, result) {
    if (err) cb(err, {});
    if (result[0]) return cb(null, { registered: true });
    // if (!result[0]) {
    const secret = speakeasy.generateSecret({ name: 'ZC_Chat', length: 20 });
    db.query(`insert into newusers (username, email, secret) values ("${username}", "${email}", "${secret.base32}")`, function (err, result) {
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
const handleOtp = (req: express.Request, res: express.Response) => {
  const { username, email, otp } = req.body;
  console.log('helo helo')
  if (!username) return res.status(400).json({
    status: 0,
    message: 'username required',
  });

  if (!otp) return handleLogin(username, email, (err: Error, data: Object) => {
    if (err) throw err;
    res.json(data);
  });

  db.query(`select id, secret from newusers where username = "${username}"`, (err, result) => {
    if (err) throw err;
    const user = result[0];
    if (!user) throw new Error("no user found");
    const verified = speakeasy.totp.verify({
      secret: user.secret,
      encoding: 'base32',
      token: otp
    })
    if (verified) {
      const token = uuid();
      db.query(`insert into userToken (token, userId) values ("${token}", "${user.id}")`, function (err, result) {
        console.log('lplpl');
        if (err) throw err;
        res.cookie('token', token, { path: '/' }).json({ loggedIn: verified });
        // res.cookie('token', token, {
        //   path: '/'
        // }).json({
        //   loggedIn: verified
        // })
      })
    } else {
      res.json({
        loggedIn: false
      })
    }
  });
}

const handleLoginStatus = (req: express.Request, res: express.Response) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ status: 0 })
  }
  db.query(`select id from userToken where token = "${token}"`, (err, result) => {
    if (err) throw err;
    res.json({
      status: !!result[0],
      cookie: 'req.cookies'
    })
  })
}

app.use(bodyParser.json());

app.use(cookieParser());


app.get('/', (req, res) => res.send('Hello World!'))
// app.get('/speakeasy', (req, res) => res.send(secret))
// app.get('/qrcode', (req, res) => res.send(qrcode))
app.post('/otp', handleOtp)
app.get('/is-logged-in', handleLoginStatus)
// app.get('/cookie', (req, res) => {
//   res.cookie('name', 'express')
//   res.cookie('name', 'express', { domain: 'localhost', path: '/cookie', secure: true }).send('cookie set');
// })

// send query ?mobile=345678987 
// app.get('/verify-otp', verifyToken);
// send query ?mobile=345678987 

app.listen(3000, () => console.log('Example app listening on port 3000!'))

export const add = (a: number, b: number) => {
  return a + b;
}