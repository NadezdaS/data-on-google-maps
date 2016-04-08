<?php

//the request to zabbix server
function json_request($url, $data){
	$json_data = json_encode($data);
	$connect_handler = curl_init();
	curl_setopt($connect_handler, CURLOPT_URL, $url);
	curl_setopt($connect_handler, CURLOPT_CUSTOMREQUEST, "POST");
	curl_setopt($connect_handler, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($connect_handler, CURLOPT_VERBOSE, true);
	curl_setopt($connect_handler, CURLOPT_POST, $json_data);
	curl_setopt($connect_handler, CURLOPT_POSTFIELDS, $json_data);
	curl_setopt($connect_handler, CURLOPT_HTTPHEADER,
		array
		(
		'Content-Type: application/json',
		'Content-Length: ' . strlen($json_data))
		);
	curl_setopt($connect_handler, CURLOPT_SSL_VERIFYHOST, 0);
	curl_setopt($connect_handler, CURLOPT_SSL_VERIFYPEER, 0);
	$result = curl_exec($connect_handler);

	return json_decode($result, true);
}

//connect to zabbix
function zabbix_auth($url, $username, $password){
	$data = array(
		'jsonrpc' => "2.0",
		'method' => "user.login",
		'params' => array(
			'user' => $username,
			'password' => $password

		),
		'id' => "1"
	);
	$response = json_request($url, $data);
	return $response['result'];
}

//release $authtoken
function zabbix_logout($url, $authtoken){
	$data = array(
		'jsonrpc' => "2.0",
		'method' => "user.logout",
		'params' => array(),
		'id' => "1",
		'auth' => $authtoken
	);
	$response = json_request($url, $data);
	return $response['result'];
}

//get data from zabbix
function zabbix_get_items($url, $authtoken, $app){
	$data = array(
		'jsonrpc' => "2.0",
		'method' => "item.get",
		'params' => array(
			'output' => array('key_', 'name', 'lastvalue', 'lastclock'),
			'host' => "Anycast 91.233.218.254",
			'application' => $app,
		),
		'id' => "2",
		'auth' => $authtoken
	);
	$response = json_request($url, $data);
	return $response['result'];
}

//get last time update form zabbix
function zabbix_get_last_update($url, $authtoken){
	$data = array(
		'jsonrpc' => "2.0",
		'method' => "item.get",
		'params' => array(
			'output' => array('lastclock'),
			'host' => "Anycast 91.233.218.254",
			'application' => "region1",
			"search" => array (
            			"key_" => "to[linx]"
        			),
			),
		'id' => "2",
		'auth' => $authtoken
		);
	$response = json_request($url, $data);
	return $response['result'];
}

?>
