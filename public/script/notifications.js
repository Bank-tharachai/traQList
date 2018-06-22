/*Push.Permission.request();

Push.create('notifications success')*/
//var NCMB = require('ncmb');
//var ncmb = new NCMB("759c906b0f0b02a5def955853100ed3c0af8650c810cd24045acee735949647f", "971141ddababb57ee3b59ba7c0a3e4e6e9472522bf6fc4e551bb9ff8d1ca4e72");

var push = new ncmb.Push();
push.set("immediateDeliveryFlag", true)
    .set("message", "push success")
    .set("target", ["ios"]);

push.send()
    .then(function(push){
      // 送信後処理
     })
    .catch(function(err){
       // エラー処理
     });
