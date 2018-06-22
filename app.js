/*
    Run on mac : SET DEBUG=app:* & npm start
*/

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var flash = require('connect-flash');
var session = require('express-session');
var crypto = require('crypto');
var hash = require('pbkdf2-password')();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
var fs = require('fs');
var hbs = require('hbs');
var favicon = require('serve-favicon');
var sqlinjection = require('sql-injection');// to prevent sql injections
var apn = require("apn");//var apns = require("apns"), options, connection, notification;

var index = require('./routes/index');
var users = require('./routes/users');
var day = require('./routes/day');
var week = require('./routes/week');
var register = require('./routes/register');
var login = require('./routes/login');
var info = require('./routes/info');
var aboutus = require('./routes/aboutus');



var app = express();

var router = express.Router();

//for security reasons https://expressjs.com/en/advanced/best-practice-security.html
app.disable('x-powered-by');

//var NCMB = require('ncmb');
//var ncmb = new NCMB("759c906b0f0b02a5def955853100ed3c0af8650c810cd24045acee735949647f", "971141ddababb57ee3b59ba7c0a3e4e6e9472522bf6fc4e551bb9ff8d1ca4e72");
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false
}));

app.use('/', index);
app.use('/', register);
app.use('/', login);
app.use('/info', info);
app.use('/aboutus', aboutus);
app.use('/users', users);
app.use('/day', day);
app.use('/week', week);

app.get('/logout',
  function(req, res){
    delete req.session.authenticated;
    delete req.session.user_id
    res.redirect('/');
  });

app.use(sqlinjection);  // add sql-injection middleware here to preven sql injection attacks
// app.configure(function() {
//     app.use(sqlinjection);  // add sql-injection middleware here
// });
//mount the sub app to the request handling chain. other js app in "routes"


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/*let db = new sqlite3.Database('./db/tasklist.db', (err) => {
  if (err) {
    console.log(err);
  }
  console.log("Connect to database tasklist");
});*/

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




module.exports = app;
