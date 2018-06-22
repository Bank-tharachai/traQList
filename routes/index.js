var express = require('express');
var router = express.Router();
var apn = require('apn');
var schedule = require('node-schedule');
var sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/tasklist.db', (err,row) => {
  if(err){
    console.log(err.message);
    return;
  }
})


function isAuthenticated(req, res, next){
  if (!req.session.authenticated) {
    res.redirect("/login")
  }
  next()
}


/* GET home page. */
router.get('/', isAuthenticated, function(req, res, next) {
  console.log('open site');
  // if (req.session.authenticated != true) {
  //   res.redirect("/login")
  // }
  res.render('index', { title: 'home'});
});

router.post('/getTask', (req,res) => {
  var data = {};
  db.each("SELECT * FROM tasklist WHERE user_id = ?", req.session.user_id ,(err, row) => {
    if(data[row.folder] == undefined) data[row.folder] = [];
    data[row.folder].push({name:row.taskname, date:row.date, alarm:row.alarm, descrip:row.descrip, id:row.id, prior:row.prior});
  }, () => {
    res.json(data);
    res.end();
  })
})

router.post('/', (req,res) => {
  text = req.body.load;
  lists = [];
  db.each('SELECT * FROM tasklist WHERE folder=? AND user_id = ?', text, req.session.user_id, (err, row) => {
    console.log(row);
    lists.push({'name': row.taskname, 'date': row.date, 'alarm': row.alarm, 'descrip':row.descrip, 'id':row.id, 'prior':row.prior});
  }, () => {
    res.send(lists);
    res.end();
  });
})

router.post('/add', function(req,res){
  var task= req.body;
  var num;
  db.run('INSERT INTO tasklist (folder, taskname, date, alarm, descrip, done, prior, user_id) VALUES (?,?,?,?,?,0,0,?)', task.folder, task.taskname, task.date, task.alarm, task.descrip, req.session.user_id);
  db.each('SELECT last_insert_rowid()', (err, row) => {
    num = row['last_insert_rowid()'];
  }, () => {
    console.log(num)
    res.send({num:num});
    res.end();
  });
})

router.post('/del', function(req,res){
  var todel = req.body.lists;
  console.log(todel);
  for(var i = 0; i < todel.length; i++){
    db.run('DELETE FROM tasklist WHERE id=? AND user_id=?', todel[i], req.session.user_id);
  }
  res.end();
})

router.post('/addFolder', (req,res) => {
  var name = req.body.name;
  console.log(name);
  db.run('INSERT INTO folder (name, user_id) VALUES (?,?)', name, req.session.user_id);
  res.end();
})

router.post('/delfolder', (req,res) => {
  var delf = req.body.folder;
  db.run('DELETE FROM tasklist WHERE folder=? AND user_id=?', delf, req.session.user_id);
  db.run('DELETE FROM folder WHERE name=? AND user_id=?', delf, req.session.user_id);
  res.end();
})

router.get('/requestFolder', (req,res) => {
  var folder_list = [];
  db.each('SELECT * FROM folder WHERE user_id=?', req.session.user_id, (err, row)=>{
    folder_list.push(row.name);
    console.log(row.name, folder_list);
  }, () => {
    res.send(folder_list);
    res.end();
  })
})


// TODO link with
router.post('/moveTo', (req,res) => {
  var transfer = req.body.move_id;
  var folder = req.body.folder;
  console.log("move to" + transfer + folder);
  db.serialize(() => {
    var prep = db.prepare("UPDATE tasklist SET folder=? WHERE id = ? AND user_id = ?");
    for(var i = 0; i < transfer.length; i++){
      prep.run(folder, transfer[i], req.session.user_id);
    }
  })
  res.end();
})

router.post('/test', (req,res) => {
  console.log(req.body);
  res.end();
})

router.post('/edit', (req,res) => {
  //console.log(req);
  var data = req.body;
  console.log(data);
  var prev_alarm = ''
  var save_alarm = []
  db.each('SELECT * FROM tasklist WHERE id = ? AND user_id=?', data.dataid, req.session.user_id, (err, row) => {
    console.log(row);
    prev_alarm = row['alarm']
  }, () => {
    if(prev_alarm === ''){
      save_alarm.push(data.alarm)
      console.log("1",save_alarm);
      save_alarm = JSON.stringify(save_alarm)
    }
    else {
      save_alarm = JSON.parse(prev_alarm)
      console.log("2",save_alarm);
      save_alarm.push(data.alarm)
      save_alarm = JSON.stringify(save_alarm)
    }
    db.run('UPDATE tasklist SET taskname = ?, date = ?, alarm = ?, descrip = ?, prior=?' +
    'WHERE id = ? AND user_id=?', data.taskname, data.date, save_alarm, data.descrip, data.prior,data.dataid, req.session.user_id);
    res.end();
  })
})
router.post('/addShortcut', (req,res) => {
  var name = req.body.name;
  var num;
  db.run('INSERT INTO shortcut (name, user_id) VALUES (?, ?)', name, req.session.user_id);
  db.each('SELECT last_insert_rowid()', (err, row) => {
    num = row['last_insert_rowid()'];
  }, () => {
    console.log(num)
    res.send({num:num});
    res.end();
  });
})

router.post('/loadShortcut', (req,res) => {
  var shortlist = [];
  db.each('SELECT * FROM shortcut WHERE user_id =?', req.session.user_id ,(err, row) => {
    shortlist.push({name:row.name, id:row.id});
  }, () => {
    res.send(shortlist);
    res.end();
  })
})

// receive device token
router.post('/devicetoken', (req,res) =>{
  var devicetoken = req.body;
  console.log("devicetoken : %s", devicetoken);
  res.end();
})

// set alarm
router.post('/alarm', (req,res) => {
  var taskname = req.body.taskname;
  var alarmdate = new Date(req.body.alarm);
  console.log("alarm set");
  console.log("taskname = %s, alarmdate = %s", taskname, alarmdate);

  var alarm = schedule.scheduleJob(taskname, alarmdate, function(){
    console.log("%s is alarmed", taskname);

    // TODO : send notification to browser

  });

  //send taskname & alarmdate to iOS using silent push notification

  var alarmbody = {
    name : taskname,
    date : alarmdate
  };
  console.log("alarmbody = ",alarmbody);

  var options = {
    cert : "./apnskeys/apns-dev-cert.pem",
    key : "./apnskeys/apns-dev-key-noenc.pem",
    production : false
  };
  var apnProvider = new apn.Provider(options);
  let deviceToken = "a368c3550994857a2e94b4b72920950ff65691d32109c17854deb88913052add"; //後でデバイスから送るようにする
  var note = new apn.Notification();
  note.contentAvailable = 1;  //silent push notification
  note.alert = alarmbody;

  apnProvider.send(note, deviceToken).then( (result) => {
    console.log("result");
    console.log(result.failed);
  });

  res.end();
})

router.post('/delShortcut', (req,res) => {
  id = req.body.id;
  db.run('DELETE FROM shortcut WHERE id=? AND user_id=?',id, req.session.user_id);
  res.end();
})
module.exports = router;
