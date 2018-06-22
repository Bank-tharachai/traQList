var express = require('express');
var router = express.Router();
var apn = require('apn');
var passwordHash = require('password-hash')
var schedule = require('node-schedule');
var sqlite3 = require('sqlite3').verbose();
//const { body,validationResult } = require('express-validator/check');
//const { sanitizeBody } = require('express-validator/filter');
let db = new sqlite3.Database('./db/tasklist.db', (err,row) => {
  if(err){
    console.log(err.message);
    return;
  }
})

const errorList = {username:'This username has been used already',
    email:'This email address has been used already',
    pass:'Passwords are different'
  }

/* GET register page. */

router.get('/register', function(req, res, next) {
  console.log('open register');
  res.render('register', { title: 'Register'});
});

router.post('/register', function(req, res, next) {
  data = req.body
  //Errors Collection, to be used for warning
  error = {username:0, email:0, pass:0}

  db.serialize(() => {
    var error_count = 0
    db.each ("SELECT * FROM users WHERE username=?", data.username, (err,row) => {
      error_count++;
      error.username = 1;
    })
    db.each ("SELECT * FROM users WHERE email=?", data.email, (err,row) => {
      error_count++;
      error.email = 1
    }, () => {
      if(data.password!==data.confirm_password){
        error_count++;
        error.pass = 1
      }
      if(!error_count){
        res.redirect("/");
        pass_hash = passwordHash.generate(data.password);
        db.run("INSERT INTO users (username, email, pass_hash) VALUES (?,?,?)",data.username,data.email,pass_hash);
      }
      else{
        outerrors = []
        console.log(error);
        for (var key in error){
          if(error[key] == 1) outerrors.push(errorList[key])
        }
        console.log(outerrors);
        res.render('register', { title: 'Register',errors: outerrors})
      }
    })
  })
});

module.exports = router;
