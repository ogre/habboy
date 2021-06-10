<html>
<body>
<?php
  $host = $_GET["HOST"];
  $ip = $_GET["IP"];
  file_put_contents($host, $ip);

  $ips_str = file_get_contents("ip.json");
  $ips_str = strip_tags($ips_str);
  $ips = json_decode($ips_str, true);
  $ips[$host] = $ip;
  file_put_contents( "ip.json", json_encode($ips) );
?>
</body>
</html>