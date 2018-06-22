var util  = require('util');
var spawn = require('child_process').spawn;
var php   = spawn('php', ['get_device_token.php']); // $ php get_device_token.php と同じ意味

var data = {
    'foo': 'something',
    'bar': 'something',
};

php.stdin.write(JSON.stringify(data)); // 標準入力としてPHPに渡す
php.stdin.end(); // PHPさん、標準入力終わったよ

php.stdout.on('data', function (data) {
    console.log('stdout: ', JSON.parse(data));
});

php.stderr.on('data', function (data) {
    console.log('stderr: ', JSON.parse(data));
});

php.on('exit', function (code) {
    console.log('phpプロセスが終了しました: ステータスコード: ' + code);
});

