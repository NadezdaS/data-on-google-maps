<?php
include 'functions.php';
session_start();

if(!isset($_SESSION["token"]) && isset($_POST['submit'])) {
	if (empty($_POST['username']) || empty($_POST['password'])) {
			echo "Username or Password is empty.";
		}
		else {
			$username = $_POST['username'];
			$password = $_POST['password'];
			//$_SESSION["url"] = "https://zabbix.vcp.ivi.ru/api_jsonrpc.php";
			//get auth token
			//$_SESSION["token"] = zabbix_auth($_SESSION["url"], $username, $password); //previous version when there was access to zabbiz server
			if ($username == "admin" && $password == "admin") {
			    $_SESSION["token"] = "12345678901234567-abcdef0123456789";
			}
			if (isset($_SESSION["token"])) {
				echo "You have successfully logged in.";
				}
			else {
				echo "Wrong username or password!";
				// remove all session variables
				session_unset();
				// destroy the session
				session_destroy();
			}
		}
	}
else {
      echo "Permission denied";
}

?>
