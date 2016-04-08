<?php
session_start(); 
if(isset($_SESSION["token"])) echo "token is set";
	else echo "token is not set";
?>
