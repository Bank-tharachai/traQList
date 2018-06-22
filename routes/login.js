var express = require('express')
var session = require('express-session');
var router = express.Router();
var apn = require('apn');
var passwordHash = require('password-hash')
var session = require('express-session');
var schedule = require('node-schedule');
var sqlite3 = require('sqlite3').verbose();
var loggedin = false;
//const { body,validationResult } = require('express-validator/check');
//const { sanitizeBody } = require('express-validator/filter');
let db = new sqlite3.Database('./db/tasklist.db', (err,row) => {
  if(err){
    console.log(err.message);
    return;
  }
})

/*const errorList = {username:'This username has been used already',
    email:'This email address has been used already',
    pass:'Passwords are different'
  }*/

/* GET login page. */

router.get('/login', function(req, res, next) {
  console.log('open login');
  res.render('login', { title: 'Login'});
});

router.post("/login", function(req, res, next){
  data = req.body;
  console.log(data);

  //Errors collection
  error = {email:0, password:0};

  //console.log(data);
  db.serialize(() => {
      /* query password with unique email*/
    user_data = db.get("SELECT * FROM users WHERE email=?", data.email, (err, row) => {
       /* TODO work on error
        error.email = 1;
       */
      if (err || row==undefined){
        error.email = 1;
        console.error("Email not found");
        res.render("login", { title: "Login", errors: ["Wrong email or password"]});
      }else{
        console.log(row);
         //console.log(passwordHash.verify(data.password, row.pass_hash));
        if(passwordHash.verify(data.password, row.pass_hash) == false){
          console.log("Wrong email or password");
          error.password = 1;
          res.render("login", { title: "Login", errors: ["Wrong email or password"]});
        }else{
          req.session.authenticated = true;
          req.session.user_id = row.id;
          req.session.cookie.maxAge = 2592000000;
          res.redirect("/");
        }
      }
    })
  });
});
/*
router.post('/login', function(req, res, next) {
  data = req.body
  error = {username:0, email:0, pass:0}
  db.serialize(() => {
    var count = 0
    db.each ("SELECT * FROM users WHERE username=?", data.username, (err,row) => {
      count++;
      error.user = 1
    })
    db.each ("SELECT * FROM users WHERE email=?", data.email, (err,row) => {
      count++;
      error.user = 1
    }, () => {
      if(data.password!==data.confirm_password){
        count++;
        error.pass = 1
      }
      //res.send(error);
      if(!count){
        res.redirect("/");
        pass_hash = passwordHash.generate(data.password);
        db.run("INSERT INTO users (username, email, pass_hash) VALUES (?,?,?)",data.username,data.email,pass_hash);
      }
      else{
        res.redirect("/login")
      }
      res.end()
    })
  })
});*/

module.exports = router;
