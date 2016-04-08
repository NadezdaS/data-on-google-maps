<?php
include 'functions.php';
session_start();
$username = "";
$password = "";

if(!isset($_SESSION["token"]) && isset($_POST['submit'])) {
	if (empty($_POST['username']) || empty($_POST['password'])) {
			echo "Username or Password is empty.";
		}
		else {
			$username = $_POST['username'];
			$password = $_POST['password'];
			$_SESSION["url"] = "https://zabbix.vcp.ivi.ru/api_jsonrpc.php";
			//get auth token
			$_SESSION["token"] = zabbix_auth($_SESSION["url"], $username, $password);
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
