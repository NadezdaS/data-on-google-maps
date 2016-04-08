<?php
include 'functions.php';
session_start(); 

if(!isset($_SESSION["token"])) return;
else {
	//освобождаем authtoken и выходим из сессии
	if(isset($_GET['logout'])){		
    		$authrelease = zabbix_logout($_SESSION["url"], $_SESSION["token"]);
		session_unset(); 
		session_destroy();
	}
}

?>
