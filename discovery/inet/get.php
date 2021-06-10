<?php
	header("Access-Control-Allow-Origin: *");
	header("Content-Type: text/plain");
	$ip = file_get_contents($_GET["HOST"]);
	$ip = strip_tags($ip);
	echo $ip;
?>
