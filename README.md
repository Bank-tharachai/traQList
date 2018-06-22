# Status
```
"Load web" : OK,
"GET,POST" : OK,
"DATABASE" : OK
```
About database, as we going to use SQL so which package should we choose? there are several such as
1. sqlite3 https://github.com/mapbox/node-sqlite3
2. PostgreSQL https://github.com/brianc/node-postgres
3. etc.

/* CLEAR */
Another maybe data structure? (<--- Important)
Use sqlite3?.(Bank)

データベースについて、SQL採用するつもりなので、どっちのpackage選べばいいかな。。。<br>
↑の通り。もう一つはデータの構造どうしましょう（大事）？

# Database
This may help... [DB Browser for SQLite](http://sqlitebrowser.org/)<br>
I will update db_helper later
# LocalStorage (注)
After you clear the database, as this is not complete, I recommend to clear the localStorage through your browser.<br>
Find someway to open up the console (i.e. Window Google Chrome F12 botton) then run
```
> localStorage.clear()
<<< undefined (response)
```
you are done!
# Node.js
Please clone this and from this folder,
```
> npm install
> npm start
```
if any problem occur, please check whether node.js is installed<br>
The packages which maybe useful to study right now are
```
    "express": "^4.15.4",
    "hbs": "~4.0.1",
    "body-parser": "~1.17.1"
```
For the longlist, please take a look at package.JSON.<br>
<br>
# How to
There is an easy way to build up this structure, using *express generator*<br>
After you confirm the installation of node.js, run the following command
```
> npm install express-generator -g
```
then wait..........<br>
Next, in my case, run
```
> express --view=hbs --hbs todolist
```
then follow the above commands.<br>
*REF*:https://expressjs.com/en/starter/generator.html
