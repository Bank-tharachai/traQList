<?php
// バッファリング開始
ob_start();
?>
 
 <?php

$stdin = file_get_contents('php://stdin');

$data = json_decode($stdin, true);

// var_dump($data);

?>
 
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title></title>
</head>
<body>
<br>
<br>
Device Token =
<?php
echo $_POST['DeviceToken'];
?>
<br><br><br><br>
</body>
</html>
 
<?php
// 同階層の display_device_token.html にphp実行結果を出力
file_put_contents( 'display_device_token.html', ob_get_contents() );
 
// 出力用バッファをクリアしてオフ
ob_end_clean();
?>

<?php
if ( is_array($data) === false )
{
    echo json_encode(array(
        'status'  => 'error',
        'message' => 'フォーマットに誤りがあります。JSONの配列で送ってこいｺﾞﾙｧ',
    ));
    exit(1);
}
else
{
    echo json_encode(array(
        'status'  => 'success',
        'message' => 'OKです',
    ));
    exit(0);
}
?>