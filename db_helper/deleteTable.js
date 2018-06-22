var sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/tasklist.db', (err) => {
  if(err) {console.log(err.message); return;}
  console.log("Connect to database");
});

db.serialize(() => {
  /*db.run('DROP TABLE tasklist',(err) => {
    if(err) console.log(err.message);
  })*/
  db.each('SELECT name FROM sqlite_master WHERE type="table"', (err,row) => {
    db.run('DROP TABLE ' + row.name, (err) => {
      if(err) console.log(err.message);
    });
  });
})
