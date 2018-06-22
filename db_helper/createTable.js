var sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/tasklist.db', (err) => {
  if(err) {console.log(err.message); return;}
  console.log("Connect to database");
});

db.serialize(() => {
  db.run('CREATE TABLE tasklist(folder TEXT, taskname TEXT, date TEXT)');
  db.run('CREATE TABLE folder(name TEXT)');
  db.run('INSERT INTO folder (name) VALUES ("Main")');
  db.each('SELECT name FROM sqlite_master WHERE type="table"', (err, row) => {
    console.log(row);
  })
})
