var sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/tasklist.db', (err) => {
  if(err) {console.log(err.message); return;}
  console.log("Connect to database");
});

db.each("SELECT * FROM tasklist", function(err, row) {
      console.log("task: " + row.taskname + "folder: " + row.folder);
  });
