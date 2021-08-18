const express = require('express');
const expressLayouts = require('express-ejs-layouts');


const flash = require('connect-flash');
const session = require('express-session');
const bodyparser = require("body-parser");
const fileupload = require('express-fileupload');
const path = require('path');
const multer = require('multer');
const cors = require("cors");
const https = require("https");
const qs = require("querystring");
const checksum_lib = require("./Paytm/checksum");
const config = require("./Paytm/config");


const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });


const accountSid = 'AC915bfbdb9aa1692c0971a8e32f9ed15a';
const authToken = '[AuthToken]';
const client = require('twilio')(accountSid, authToken);


const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'attachments');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

var db =require("./models/db");


const app = express();
app.use(cors());
//ejs

app.set('view engine', 'ejs');


//bodyparser
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/attachments', express.static(path.join(__dirname, 'attachments')));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('file')
);

//fileupload
app.use(fileupload());


//session
app.use(session({
  secret: 'thisismysecretdonttellthisanyone',
  name: 'sid',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 10000 * 6 * 20,
    sameSite: true,
    secure: false
  }

}));


app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');

  res.locals.error_msg = req.flash('error_msg');

  res.locals.error = req.flash('error');
  next();
})

app.use('/', require('./routes/index'));
app.use('/users', require('./routes/user'));




 

const PORT = 7000;

app.listen(PORT, console.log("listening on port "));