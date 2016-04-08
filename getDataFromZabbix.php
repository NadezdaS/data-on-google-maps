<?php
include 'functions.php';
session_start(); 

if(isset($_SESSION["token"]) /*&& isset($_GET['request'])*/){
$result_array = array(array ("key" => "", "provider_name" => "", "city_name" => "", "rtt1_value" => 0.0, "point1_value" => "", "rtt2_value" => 0.0, "point2_value" => "", "unicast_value" => 0.0, "lat" =>0.0, "lon" =>0.0, "lastclock1" => 0, "lastclock2" => 0, "IP_address"=>""));
$app_name = "";
$location_array = file("locations.csv");//база maxmind - координаты русских городов
$nodes_array = file("nodes.csv", FILE_IGNORE_NEW_LINES);//файл соответствия узла названию города

//соответствие названия point и городов
$points_abbr = array();

//координаты для point1 и point2
$points_LatLon = array(array("key" => "", "lat" =>0.0, "lon" =>0.0));
//количество точек для каждого узла
$points_numbers = array(array("key" => "", "point1" =>0, "point2" =>0));

//список провайдеров
$provaiders = array();
//количество точек для каждого провайдера
$provaider_numbers = array(array("key" => "", "point" =>0));

function fill_result_arr($array, &$result_array, $app_name, $abbr_array, $index) {
	foreach ($array as $key => $value) {
		if (is_array($value)) {	
			//исключаем записи с name==Magistral			
			$str2 = preg_split("/[:]+/", $value['name']);
			if ($str2[1] != 'Magistral') {		
				fill_result_arr($value, $result_array, $app_name, $abbr_array, $index);
				$index= $index+1;
				}					
		}
		else {
			switch ($key) {
				case "key_":				
					if ($result_array[$index]['key'] == "") {
						 preg_match('/\[(.+?)\]/', $value, $str);
						 $result_array[$index]['key'] = $str[1];
						} else {
							$index = 0;
							preg_match('/\[(.+?)\]/', $value, $str);
        						while ($result_array[$index]['key'] != "") {
								if ($result_array[$index]['key'] == $str[1]) {
									 break;	
									}
									else $index++;  						
								}
							}
					
					break;
				case "name":
					if ($result_array[$index]['provider_name'] == "") {
						$flag_city_repeat = false;
						preg_match('/(.+?):/', $value, $str);
						$result_array[$index]['provider_name'] = $str[1];

						preg_match('/:(.+?):/', $value, $str_city);
						$str = $str_city[1];
						

						//проверка для неправильно написанных городов
						preg_match('/[CFO|SFO|YFO|DFO|SKFO|DVFO|UFO|SPB|PFO|SZFO]\-(.+)/', $str, $str_city2);
						if ($str_city2[1] != "") $str = $str_city2[1];						
						
						if ($str == 'ABAKAN') $str = 'Abakan';
						if ($str == 'Habarovsk') $str = 'Khabarovsk';
						if ($str == 'St.Peterburg' || $str == 'St.Petersburg') $str = 'Sanktpeterburg';
						if ($str == 'Saratov/Syizran') $str = 'Saratov';
						if ($str == 'S.Peterburg' || $str == 'Len.obl') $str = 'Sanktpeterburg';
						if ($str == 'RostovDon' || $str == 'Rostov-na-Dony' || $str == 'Rostov-na-Donu' || $str == 'Rostov-on-Don') $str = 'Rostov-on-don';
						if ($str == 'Cheboksaryi') $str = 'Cheboksary';
						if ($str == 'Astrahan') $str = 'Astrakhan';
						if ($str == 'Sakhalin' || $str == 'Yuzhno-Sahalinsk') $str = 'Yuzhno-sakhalinsk';
						if ($str == 'NNovgorod' || $str == 'N.Novgorod') $str = 'Nizhniy Novgorod';
						if ($str == 'Ekaterinburg') $str = 'Yekaterinburg';
						if ($str == 'Salehard') $str = 'Salekhard';
						if ($str == 'Nab.Chelnyi') $str = 'Naberezhnyye Chelny';
						if ($str == 'Goronaltaysk') $str = 'Gorno-altaysk';
						if ($str == 'Hantyi-Mansiysk') $str = 'Khanty-mansiysk';
						if ($str == 'Kalinigrad') $str = 'Kaliningrad';
						if ($str == 'Syktivkar') $str = 'Syktyvkar';
						if ($str == 'Mahachkala') $str = 'Makhachkala';
						if ($str == 'Belaya-Kalitva') $str = 'Belaya Kalitva';
						if ($str == 'Anadyir') $str = 'Anadyr';
						if ($str == 'Arhangelsk') $str = 'Arkhangelsk';
						if ($str == 'Ulan-Ude') $str = 'Ulan-ude';
						if ($str == 'Amurskaya(Yakutsk)') $str = 'Yakutsk';
						if ($str == 'Cherkesk') $str = 'Cherkessk';
						if ($str == 'Yoshkar-Ola') $str = 'Yoshkar-ola';
						if ($str == 'Tumen') $str = 'Tyumen';
						if ($str == 'Novgorod') $str = 'Velikiy Novgorod';
						if ($str == 'Petropavlovsk-Kamchatskiy') $str = 'Petropavlovsk-kamchatskiy';
					
						$result_array[$index]['city_name'] = $str;

						//заполняем IP адрес						
						$str = preg_split('/:/', $value);
						$result_array[$index]['IP_address'] = $str[3];

						//проверка, есть ли уже такой город в массиве
						for ($j=0; $j<$index; $j++){
							if ($result_array[$j]['city_name'] == $result_array[$index]['city_name']){
								$flag_city_repeat = true;
								break;
								}							
						}

						//проверка, есть ли уже узел в данном городе
						foreach ($abbr_array as $key => $value){
							if ($result_array[$index]['city_name'] == $value){
								$flag_city_repeat = true;
								break;
								}							
						}						

						//заполняем широту и долготу для города
						//данные берем из базы locations.csv   						
						if($GLOBALS['location_array'])
    							{
							 $result_array[$index]['lat'] = 0.0;
							 $result_array[$index]['lon'] =0.0;
							 $i = 0;
        						 while ($result_array[$index]['lat'] == 0){
								$line = $GLOBALS['location_array'][$i];
								preg_match('/[0-9]*,"RU","[0-9]*","(.+)","*",*/', $line, $str_res);
																					           
            							if ($str_res[1] == $result_array[$index]['city_name']) {
									//latitude
									preg_match('/[0-9]*,"RU","[0-9]*","(.+)","*",([0-9]+.[0-9]+),*/', $line, $str_lat);
									if ($flag_city_repeat) {
										$result_array[$index]['lat'] = $str_lat[2]+(rand(0,1000)/1000-0.5);
										}
										else $result_array[$index]['lat'] = $str_lat[2];

									//longitude
									preg_match('/[0-9]*,"RU","[0-9]*","(.+)","*",[0-9]+.[0-9]+,([0-9]+.[0-9]+),,*/', $line, $str_lon);
									if ($flag_city_repeat) {
										$result_array[$index]['lon'] = $str_lon[2]+(rand(0,1000)/1000-0.5);
										}
										else $result_array[$index]['lon'] = $str_lon[2];
									break;
									}
								$i++;
								}							
    							}
    						
						}
					break;
				case "lastvalue":
					switch ($app_name) {
						case "point1":
							$result_array[$index]['point1_value'] = $value;
							break;
						case "point2":
							$result_array[$index]['point2_value'] = $value;
							break;
						case "rtt1":
							$result_array[$index]['rtt1_value'] = round($value,1);
							break;
						case "rtt2":
							$result_array[$index]['rtt2_value'] = round($value,1);
							break;
						case "unicast":
							$result_array[$index]['unicast_value'] = round($value,1);
							break;
					}					
					break;
				case "lastclock":
					switch ($app_name) {
						case "rtt1":
							$result_array[$index]['lastclock1'] = $value;
							break;
						case "rtt2":
							$result_array[$index]['lastclock2'] = $value;
							break;
					}					
					break;

			}			
		}
	}	
		
}

//получаем время последнего обновления записей в zabbix
$last_update = zabbix_get_last_update($_SESSION["url"], $_SESSION["token"]);

//получаем массив узлов из файла nodes.csv
$index = 0;
$key_array = array();
$value_array = array();
if($GLOBALS['nodes_array']) {
	for ($i = 0; $i < count($GLOBALS['nodes_array']); $i++){
		$line = $GLOBALS['nodes_array'][$i];
		$str_res = preg_split ("/[,]+/", $line);
		$key_array[$i] = $str_res[0];
		$value_array[$i] = $str_res[1];
		}
	$points_abbr = array_combine($key_array, $value_array);	
	}
	else echo "Ошибка открытия файла с кодами узлов (nodes.csv)!";	
//делаем выборку координат для узлов
$index = 0;
if($GLOBALS['location_array']){	
	foreach ($points_abbr as $key => $value) { 						 
		$i = 0;
		$str_res[0] = "";
		$str_res[1] = "";
        	while ($value != $str_res[1]){
			$line = $GLOBALS['location_array'][$i];
			//берем название города из базы maxmind
			preg_match('/[0-9]*,"RU","[0-9]*","(.+)","*",*/', $line, $str_res); 
			if ($value == $str_res[1]){
				preg_match('/[0-9]*,"RU","[0-9]*","(.+)","*",([0-9]+.[0-9]+),*/', $line, $str_lat);
				preg_match('/[0-9]*,"RU","[0-9]*","(.+)","*",[0-9]+.[0-9]+,([0-9]+.[0-9]+),,*/', $line, $str_lon);

				$points_LatLon[$index]['key'] = $key;
				$points_LatLon[$index]['lat'] = $str_lat[2];
				$points_LatLon[$index]['lon'] = $str_lon[2];

				//смещаем координаты для московских узлов dtln и linx
				if ($key == 'dtln') {
					$points_LatLon[$index]['lat'] = $str_lat[2]+0.07;
					$points_LatLon[$index]['lon'] = $str_lon[2]+0.15;
					}
				if ($key == 'linx') {
					$points_LatLon[$index]['lat'] = $str_lat[2]+0.07;
					$points_LatLon[$index]['lon'] = $str_lon[2]-0.15;
					}

				//смещаем координаты для казанского узла kzn-tt
				if ($key == 'kzn-tt') {
					$points_LatLon[$index]['lat'] = $str_lat[2]+0.03;
					$points_LatLon[$index]['lon'] = $str_lon[2]+0.06;
					}

				//смещаем координаты для узла в Уфе ufanet
				if ($key == 'ufanet') {
					$points_LatLon[$index]['lat'] = $str_lat[2]+0.03;
					$points_LatLon[$index]['lon'] = $str_lon[2]+0.06;
					}
				$index++;
				}	
			$i++;
			}
		}						
}
else echo "Ошибка открытия файла с базой maxmind (locations.csv)!";

//проверяем файл кэша данных на актуальность
$filename = "cache_data.txt";
$flag_old_data = false;

if (file_exists($filename)) {
	$handle = file($filename, FILE_IGNORE_NEW_LINES);

	$ldate = $handle[0];
	if ($ldate != date("Y-m-d h:i:s", $last_update[0]['lastclock'])) 
		$flag_old_data = true;

	if (!$flag_old_data) $result_array = json_decode($handle[1], true);
} 
if ((!file_exists($filename)) || ($flag_old_data)) {
	$handle = fopen($filename, "w");
	fwrite($handle, date("Y-m-d h:i:s", $last_update[0]['lastclock']));	

	$app_name = "point1";
	$index = 0;
	fill_result_arr(zabbix_get_items($_SESSION["url"], $_SESSION["token"], $app_name), $result_array, $app_name, $points_abbr, $index);

	$app_name = "point2";
	$index = 0;
	fill_result_arr(zabbix_get_items($_SESSION["url"], $_SESSION["token"], $app_name), $result_array, $app_name, $points_abbr, $index);

	$app_name = "rtt1";
	$index = 0;
	fill_result_arr(zabbix_get_items($_SESSION["url"], $_SESSION["token"], $app_name), $result_array, $app_name, $points_abbr, $index);

	$app_name = "rtt2";
	$index = 0;
	fill_result_arr(zabbix_get_items($_SESSION["url"], $_SESSION["token"], $app_name), $result_array, $app_name, $points_abbr, $index);

	$app_name = "unicast";
	$index = 0;
	fill_result_arr(zabbix_get_items($_SESSION["url"], $_SESSION["token"], $app_name), $result_array, $app_name, $points_abbr, $index);
	
	fwrite($handle, json_encode($result_array));
	fclose($handle);
}

//подсчитываем количество прилипающих точек для каждого узла
$index = 0;
foreach ($points_abbr as $key => $value) {

	$points_numbers[$index]['key'] = $key;
	$points_numbers[$index]['point1'] = 0;
	$points_numbers[$index]['point2'] = 0;

	for ($i=0; $i < count($result_array); $i++) {
		if ($result_array[$i]['point1_value'] ==  $key) 
			$points_numbers[$index]['point1'] = $points_numbers[$index]['point1'] + 1; 
		if ($result_array[$i]['point2_value'] ==  $key) 
			$points_numbers[$index]['point2'] = $points_numbers[$index]['point2'] + 1; 
	}	
	$index++;
}

for ($i=0; $i < count($result_array); $i++) {
	$provaiders[$i] = $result_array[$i]['provider_name'];
}

sort($provaiders);

//удаляем повторяющиеся названия
$temp_array = array_unique($provaiders);
//записываем названия провайдеров в массив как ключевые значения
$i=0;
foreach ($temp_array as $value) {
	$provaider_numbers[$i]['key'] = $value;
	$i++;
}

//подсчитываем количество точек каждого провайдера
$j = 0;
for ($i=0; $i < count($provaider_numbers); $i++) {
	while ($provaider_numbers[$i]['key'] == $provaiders[$j]){
		$provaider_numbers[$i]['point'] = $provaider_numbers[$i]['point'] + 1;
		$j++;
	};
}

function build_sorter($key) {
    return function ($a, $b) use ($key) {
	if ($a[$key] < $b[$key]) return true;
		else return false;
    };
}

usort($provaider_numbers, build_sorter('point'));

echo json_encode($result_array, true);
echo "***";
echo json_encode($points_LatLon, true);
echo "***";
echo json_encode($points_numbers, true);
echo "***";
echo json_encode($provaider_numbers, true);
echo "***";
}
else echo "no data";

?>
