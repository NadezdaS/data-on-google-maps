var map;//google map object
var markers = new Array(); //array of marker objects
var polylines = new Array();//array of showed polylines on a map
var nodes = new Array();//array of marker nodes (network servers)
var nodeLabels = new Array();//array of labels for nodes
var markerLabels = new Array();//array of labels for markers
var resultArr = new Array();//data array from zabbix server
var points = new Array();//list of nodes from zabbix
var pointsNum = new Array();//list of nodes links to markers
var providersNum = new Array();//list of providers links to markers
var othersProv = new Array();//list of providers with only one linked marker
var strProv;//auxiliary string variable to content all othersProv values
var timestamp;//current unixtime
var arrOfNums = [0, 0, 0, 0, 0, NaN, 0];//numbers of markers for each color (to show in legend)
var checkNum;//numbers of selected checkboxes
var rtt1Intervals = new Array();//the range of rrt values for Anycast1 - use to choose color for marker
var rtt2Intervals = new Array();//the range of rrt values for Anycast2 - use to choose color for marker
var unicastIntervals = new Array();//the range of rrt values for Unicast - use to choose color for marker
var lineColor = ["#01DF01", "#FF8000", "#FF0000"];//array of colors for drawing links on a map
var img = ['images/green.png', 'images/orange.png', 'images/red.png', 'images/orange_warning.png', 'images/red_warning.png'];//pictures for markers
var defenitions = ["0 .. 30 ms", "30 .. 70 ms", "70 .. <span class=\"special\">&infin;</span> ms", "unreachable", "black hole", "CDN node (with lines)", "CDN node"];//array of definitions to show in map legend
//--------------------------------------------------------------------------------------------------------------------
//function choosing the color of line or marker picture depends on the rtt value
function setColor(value, arrayIntervals, arrayColors){
 var i, clr;

 if (value == 0) {
	if (arrayColors[0] == '#01DF01'){
	clr = "#000000";
	return clr;
	}else return;
 }

 clr = "";
 //choosing the wright picture
 for (i=0; i< arrayIntervals.length; i++){
	if (value <= arrayIntervals[i])  {
		clr = arrayColors[i];
		break;
		}
	} 
 if (clr == "") clr = arrayColors[2];
 //count the marker number of each color
 if (clr == 'images/green.png') arrOfNums[0] += 1;
 if (clr == 'images/orange.png') arrOfNums[1] += 1;
 if (clr == 'images/red.png') arrOfNums[2] += 1;

 return clr;
}
//--------------------------------------------------------------------------------------------------------------------
//set the end of the range for rtt value
function setIntervalsForRtt() {
 rtt1Intervals.push(30);
 rtt1Intervals.push(70);
 rtt2Intervals.push(30);
 rtt2Intervals.push(70);
 unicastIntervals.push(30);
 unicastIntervals.push(70);
}
//--------------------------------------------------------------------------------------------------------------------
//draw the line on the map
function drawLineOnMap(lat1, lon1, lat2, lon2, clr) {
 //set coordinates for drawing
 var lineCoordinates = [
    	new google.maps.LatLng(lat1, lon1),
    	new google.maps.LatLng(lat2, lon2)
  	];

 //draw the line for point1
 var linePath = new google.maps.Polyline({
    	path: lineCoordinates,
    	geodesic: true,
    	strokeColor: clr,
    	strokeOpacity: 1.0,
    	strokeWeight: 2
  	});			
 polylines.push(linePath);
 linePath.setMap(map);
}
//--------------------------------------------------------------------------------------------------------------------
//erase the lines
function eraseLines(){
var i;

for (i=0; i< polylines.length; i++){
	polylines[i].setMap(null);
 }
//set the color for node marker as grey (with no showed lines)
for (i = 0; i < points.length ; i++) { 
	nodes[i].icon = "images/node_marker_grey.png";
	}
}
//--------------------------------------------------------------------------------------------------------------------
//find the node for value
function findNode(value){
var index;

for (i=0; i< points.length; i++){
	if (points[i].key == value) {
		index = i;
		break;
		};
 	}
 nodes[index].icon = "images/node_marker_blue.png";
 nodes[index].setVisible(true);
 nodeLabels[index].show();
 return index;
}
//--------------------------------------------------------------------------------------------------------------------
//draw the lines on the map for marker
function showLinesForCurrentPoint(markerIndex){
 var i;
 var color; //color of line
 var index; //index of the node for marker
 var lineCoordinates;
 var linePath;
 var index;

 //do not draw lines for Unicast option
 if (resultArr[markerIndex].unicast_value == 0) return;

 //hide points with no linked markers for Anycast2 option
 if ($("#point option:selected").val() == 2){
	for (i=0; i< points.length; i++){
		if (pointsNum[i].point2 == 0) {
			nodes[i].setVisible(false);
 			nodeLabels[i].hide();
			}
 	}
 }
 eraseLines();

 if (resultArr[markerIndex].point1_value !=0){
 //find the node for point1 value
 index = findNode(resultArr[markerIndex].point1_value); 
 //choose the color for line depends on the rtt value
 color = setColor(parseFloat(resultArr[markerIndex].rtt1_value), rtt1Intervals, lineColor);
 //draw the line for point1
 drawLineOnMap(resultArr[markerIndex].lat, resultArr[markerIndex].lon, points[index].lat, points[index].lon, color);
 }

 if (resultArr[markerIndex].point2_value !=0) {
 //find the node for point2 value
 index = findNode(resultArr[markerIndex].point2_value);
 //choose the color for line depends on the rtt value
 color = setColor(parseFloat(resultArr[markerIndex].rtt2_value), rtt2Intervals, lineColor);

 //draw the line for point2
 drawLineOnMap(resultArr[markerIndex].lat, resultArr[markerIndex].lon, points[index].lat, points[index].lon, color);
 }
 
 //set the line color for unicast value
 color = setColor(parseFloat(resultArr[markerIndex].unicast_value), unicastIntervals, lineColor);
 //draw the line for unicast
 drawLineOnMap(resultArr[markerIndex].lat, resultArr[markerIndex].lon, 55.7500, 37.6167, color); //the Moscow coordinates - 55.7500, 37.6167
}
//--------------------------------------------------------------------------------------------------------------------
//draw the lines on the map for provider
function showMarkerLinesForProvider(markerIndex){
 var i;
 var color; //color of line
 var index; //index of the node for marker
 var lineCoordinates;
 var linePath;

 if (resultArr[markerIndex].unicast_value == 0) return;

 //hide points with no linked markers for Anycast2 option
 if ($("#point option:selected").val() == 2){
	for (i=0; i< points.length; i++){
		if (pointsNum[i].point2 == 0) {
			nodes[i].setVisible(false);
 			nodeLabels[i].hide();
			}
 	}
 }

 if ((resultArr[markerIndex].point1_value !=0) && ($("#point option:selected").val() == 1)) {
 //find the node for point1
 index = findNode(resultArr[markerIndex].point1_value); 
  //choose the line color for rtt1 value
 color = setColor(parseFloat(resultArr[markerIndex].rtt1_value), rtt1Intervals, lineColor);
 //draw the line for point1
 drawLineOnMap(resultArr[markerIndex].lat, resultArr[markerIndex].lon, points[index].lat, points[index].lon, color);  
 }

 if ((resultArr[markerIndex].point2_value !=0) && ($("#point option:selected").val() == 2)){
 //find the node for point2
 index = findNode(resultArr[markerIndex].point2_value); 
  //choose the line color for rtt2 value
 color = setColor(parseFloat(resultArr[markerIndex].rtt2_value), rtt2Intervals, lineColor);
 //draw the line for point2
 drawLineOnMap(resultArr[markerIndex].lat, resultArr[markerIndex].lon, points[index].lat, points[index].lon, color); 
 }
 
 if ($("#point option:selected").val() == 3) {
 //choose the line color for unicast value
 color = setColor(parseFloat(resultArr[markerIndex].unicast_value), unicastIntervals, lineColor);
 //draw the line for unicast
 drawLineOnMap(resultArr[markerIndex].lat, resultArr[markerIndex].lon, 55.7500, 37.6167, color); //the Moscow coordinates - 55.7500, 37.6167
 }
}
//--------------------------------------------------------------------------------------------------------------------
//draw lines for point1 or point2 for current node 
function showLines(currentPoint, pointNum){
 var i, f;
 var image, image_anchor;//pictures for markers
 var point; //the point1 or point2 value for marker
 var index; //index of currentPoint
 var lineSymbol, linePath;

 if (pointNum == 3) return;
 if (pointNum == 1) {
	$("#point").val('1');
	} else {
	$("#point").val('2');
	}

 //choose color for markers and show them on the map
 for (i=0; i< markers.length; i++){
	if (!markers[i].getVisible()) continue;
	if (pointNum == 1) {
	image = setColor(parseFloat(resultArr[i].rtt1_value), rtt1Intervals, img);
	} else {
	image = setColor(parseFloat(resultArr[i].rtt2_value), rtt2Intervals, img);
	}

	if (resultArr[i].unicast_value == 0) {		
	image = img[3];
	}else {
		if ((pointNum == 1) && ((timestamp-resultArr[i].lastclock1) > 3900)){
		image = img[4];
		}
		if ((pointNum == 2) && ((timestamp-resultArr[i].lastclock2) > 3900)){
		image = img[4];
		}
	}

	image_anchor = {
   		url: image,
    		size: new google.maps.Size(10, 10),
    		origin: new google.maps.Point(0,0),
    		anchor: new google.maps.Point(5, 5)
  		};

	markers[i].icon = image_anchor;
	markers[i].setVisible(true);
	markerLabels[i].hide();
 }	

 eraseLines();

 //find the node index
 index = findNode(currentPoint); 

 if(pointNum == 2) {
	//hide nodes with zero markers
 	for (i = 0; i < points.length ; i++) { 
		nodes[i].flag_rtt = 2;
		if (pointsNum[i].point2 == 0) 	{
		nodes[i].setVisible(false);
		nodeLabels[i].hide();
		}
	}
 } else {
	for (i = 0; i < points.length ; i++) { 
	nodes[i].icon = "images/node_marker_grey.png";
	nodes[i].flag_rtt = 1;
	nodes[i].setVisible(true);
	nodeLabels[i].show();
 	}
 }

 //show markers for currentPoint and draw lines for them
 for (i=0; i< markers.length; i++){
	if (!markers[i].getVisible()) continue;
	if (pointNum == 1) {
	point = resultArr[i].point1_value; 
	}else {
	point = resultArr[i].point2_value; 
	}

 	if ((point == currentPoint) && (resultArr[i].unicast_value != 0)) {
			markers[i].setVisible(true); 			
			markerLabels[i].show();

			if (pointNum == 1) {
				if ((timestamp-resultArr[i].lastclock1) > 3900) {
				color = "#000000";
				}else 	{
				color = setColor(parseFloat(resultArr[i].rtt1_value), rtt1Intervals, lineColor);
				}
			}else {
				if ((timestamp-resultArr[i].lastclock2) > 3900) {
				color = "#000000";
				}else {
				color = setColor(parseFloat(resultArr[i].rtt2_value), rtt2Intervals, lineColor);
				}
			}

			drawLineOnMap(resultArr[i].lat, resultArr[i].lon, points[index].lat, points[index].lon, color);	
			}
	}	
}
//--------------------------------------------------------------------------------------------------------------------
//put the markers definitions with numbers in the legend
function setLegendText(arrayOfNumbers) {
	var i = 0;
	$(".def_legend").each(function(){
		if (!isNaN(arrayOfNumbers[i])) {
			$(this).html(defenitions[i] + " (" + arrayOfNumbers[i] + ")");
		} else {
			$(this).html(defenitions[i]);
		}
		i++;
	});	
}
//--------------------------------------------------------------------------------------------------------------------
//drawing lines from checked provaider to markers
function showPointForProvider(provaider){
 var i;

 eraseLines(); 
 for (i = 0; i < points.length ; i++) { 
	nodes[i].setVisible(true);
	nodeLabels[i].show();	
	}

 //if selected all provaiders
 if (provaider == "selectall"){	
	if ($("input[type=checkbox][value=\""+provaider+"\"]").prop("checked")) {
		//show all markers
		$("#waiting_gif").css("display", "block");
		for (i=0; i < markers.length; i++){	
			markers[i].setVisible(true);
			markerLabels[i].hide();
 			}
		$("input[type=checkbox]").each(function(){
			$(this).prop('checked', true);
		});
		$("#waiting_gif").css("display", "none");
		checkNum = providersNum.length;		
	}else {
		//hide all markers
		$("#waiting_gif").css("display", "block");
		for (i=0; i < markers.length; i++){	
			markers[i].setVisible(false);
			markerLabels[i].hide();
 			}		
		$("input[type=checkbox]").each(function(){
			$(this).prop('checked', false);
		});	
		$("#waiting_gif").css("display", "none");
		checkNum = 0;
	}
 return;
 } 	

 //if selected Others provaider option
 if (provaider == "others"){	
	if ($("input[type=checkbox][value=\""+provaider+"\"]").prop("checked")) {
		checkNum = checkNum + othersProv.length;
		$("#waiting_gif").css("display", "block");
		for (i=0; i < markers.length; i++){	
			if(strProv.indexOf(resultArr[i].provider_name) != -1) {
				markers[i].setVisible(true);
				markerLabels[i].hide();
			}
 		}
		$("#waiting_gif").css("display", "none");
		if (checkNum == providersNum.length){
		$("input[type=checkbox][value=\"selectall\"]").prop('checked', true);
		}	
	}else {
		checkNum = checkNum - othersProv.length;
		$("#waiting_gif").css("display", "block");
		for (i=0; i < markers.length; i++){	
			if(strProv.indexOf(resultArr[i].provider_name) != -1) {
				markers[i].setVisible(false);
				markerLabels[i].hide();
			}
 		}
		$("#waiting_gif").css("display", "none");
		if (checkNum != providersNum.length){
		$("input[type=checkbox][value=\"selectall\"]").prop('checked', false);
		}
		if (checkNum == 1) {
			checkNum -= 1;
			showPointForProvider($("input[type=checkbox]:checked").filter(":first").val());
		}
	}
 return;
 } 		

 //if selected some provaider
 if ($("input[type=checkbox][value=\""+provaider+"\"]").prop("checked")) {
	checkNum = checkNum + 1;	 
	$("#waiting_gif").css("display", "block");
	for (i=0; i < markers.length; i++){	
			if(resultArr[i].provider_name == provaider) {
				markers[i].setVisible(true);
				markerLabels[i].hide();
				if (checkNum == 1) {					
					showMarkerLinesForProvider(i);
				}
			}
 		}
	$("#waiting_gif").css("display", "none");
	if (checkNum == providersNum.length){
	$("input[type=checkbox][value=\"selectall\"]").prop('checked', true);
	}
 }else {
	checkNum = checkNum - 1;
	$("#waiting_gif").css("display", "block");
	for (i=0; i < markers.length; i++){	
			if(resultArr[i].provider_name == provaider) {
				markers[i].setVisible(false);
				markerLabels[i].hide();
			}
 		}
	$("#waiting_gif").css("display", "none");
	if (checkNum != providersNum.length){
	$("input[type=checkbox][value=\"selectall\"]").prop('checked', false);
	}
 }
}
//--------------------------------------------------------------------------------------------------------------------
//filter data depends on selected option (select host)
function showMarkerForSelectedHost() {
 var i;
 var image, image_anchor; 
 var checkbxs = $("input:checkbox");
 arrOfNums = [0, 0, 0, 0, 0, NaN, 0];
 
 if ($("#point option:selected").val() == 2) {
	for (i = 0; i < points.length ; i++) { 
		nodes[i].flag_rtt = 2;		
		//hide nodes with zero markers
		if (pointsNum[i].point2 == 0) 	{
			nodes[i].setVisible(false);
			nodeLabels[i].hide();
		}else {
			nodes[i].icon = "images/node_marker_grey.png";
			nodes[i].setVisible(true);
			nodeLabels[i].show();
		}
		arrOfNums[6] += 1;
	}
 }else {
	for (i = 0; i < points.length ; i++) { 
		if ($("#point option:selected").val() == 1) {
		nodes[i].flag_rtt = 1;
		}else {
		nodes[i].flag_rtt = 3;
		}
		nodes[i].icon = "images/node_marker_grey.png";
		nodes[i].setVisible(true);
		nodeLabels[i].show();
		arrOfNums[6] += 1;
	}
 }

 //show markers for selected host
 for (i=0; i < markers.length; i++){	
	if ($("#point option:selected").val() == 1) {
	image = setColor(parseFloat(resultArr[i].rtt1_value), rtt1Intervals, img);
	}
	if ($("#point option:selected").val() == 2) {
	image = setColor(parseFloat(resultArr[i].rtt2_value), rtt2Intervals, img);
	}
	if ($("#point option:selected").val() == 3) {
	image = setColor(parseFloat(resultArr[i].unicast_value), unicastIntervals, img);
	}


	if (resultArr[i].unicast_value == 0) {		
		image = img[3];
		arrOfNums[3] += 1;
	}else {
		if (($("#point option:selected").val() == 1) && ((timestamp-resultArr[i].lastclock1) > 3900)) {
			image = img[4];
			arrOfNums[4] += 1;
		}
		if (($("#point option:selected").val() == 2) && ((timestamp-resultArr[i].lastclock2) > 3900)) {
			image = img[4];
			arrOfNums[4] += 1;
		}
	}

	if (!markers[i].getVisible()) {
		continue;
	}

	image_anchor = {
   		url: image,
    		size: new google.maps.Size(10, 10),
    		origin: new google.maps.Point(0,0),
    		anchor: new google.maps.Point(5, 5)
  		};

	markers[i].icon = image_anchor;
	markers[i].setVisible(true);
	markerLabels[i].hide();
 }	

 if (checkNum != 1) {
   //if more than one provaider is checked than clear all lines on the map
   eraseLines();
 }else {
	//show lines for provaider
	checkNum -= 1;
	showPointForProvider($("input[type=checkbox]:checked").filter(":first").val());
 }
setLegendText(arrOfNums);
}
//--------------------------------------------------------------------------------------------------------------------

//функция первоначальной отрисовки карты
function showData() {
var infowindow = new google.maps.InfoWindow();

var contentString;
var node_name;
var str1, str2;
var image;
var myMarker;
var node;
var label;
var i;
var str_p1, str_p2;

setIntervalsForRtt(); //задаем интервалы значений rtt (для выбора цвета маркера)

document.getElementById('point').options[0].selected=true;
checkNum = providersNum.length;


//выводим маркеры для узлов (серверов)
for (i = 0; i < points.length ; i++) { 
	
	image = 'images/node_marker_grey.png';
	node = new google.maps.Marker({
      		position: new google.maps.LatLng(points[i].lat, points[i].lon),
      		map: map,
      		icon: image,
		title: points[i].key,
		flag_rtt: 1
  		});
	
	nodes.push(node);
	arrOfNums[6] += 1;
	
	if (pointsNum[i].point1 == 0){
		str1 = '<tr> <td class="title">point1:</td> <td class="noData">'+pointsNum[i].point1+' points</td> </tr>';
		}
		else {
			str1 = '<tr> <td class="title">point1:</td> <td><a onclick = "showLines(\''+points[i].key+'\', 1)">'+pointsNum[i].point1+' points</a></td> </tr>';
		}

	if (pointsNum[i].point2 == 0){
		str2 = '<tr> <td class="title">point2:</td> <td class="noData">'+pointsNum[i].point2+' points</td> </tr>';
		}
		else {
			str2 = '<tr> <td class="title">point2:</td> <td><a onclick = "showLines(\''+points[i].key+'\', 2)">'+pointsNum[i].point2+' points</a></td> </tr>';
		}


	//структура данных для вывода в всплывающем окне для маркера узла
	contentString = '<div id="content">'+
        '<h2 id="secondHeading" class="secondHeading">'+points[i].key+'</h2>'+	
	'<div id="bodyContent"><table>'+str1+str2+'</table>'+
	'</div>'+
	'</div>';

	google.maps.event.addListener(node, 'click', (function(node, contentString) {
        	return function() {
			 infowindow.setContent(contentString);
          		 infowindow.open(map, node);
			 showLines(node.title, node.flag_rtt);
        		}
      		})(node, contentString));

	label = new Label({
       		map: map
     		}, "10px", "-30px");
     	label.bindTo('position', node, 'position');
     	label.bindTo('text', node, 'title');
	nodeLabels.push(label);

}


//выводим маркеры для точек
for (i = 0; i < resultArr.length ; i++) { 
	if (resultArr[i].point1_value == 0) str_p1 = "-";
		else str_p1 = resultArr[i].point1_value;
	if (resultArr[i].point2_value == 0) str_p2 = "-";
		else str_p2 = resultArr[i].point2_value;

	if ((resultArr[i].point1_value == "") || (resultArr[i].point1_value == 0)){
		str1 = '<tr> <td class="title">point1:</td> <td class="badData">'+str_p1+' ('+resultArr[i].rtt1_value+' ms)</td> </tr>';
		}
		else {
			str1 = '<tr> <td class="title">point1:</td> <td><a onclick = "showLines(\''+str_p1+'\', 1)">'+str_p1+'</a>'+' ('+resultArr[i].rtt1_value+' ms)</td> </tr>';
		}

	if ((resultArr[i].point2_value == "") || (resultArr[i].point2_value == 0)){
		str2 = '<tr> <td class="title">point2:</td> <td class="badData">'+str_p2+' ('+resultArr[i].rtt2_value+' ms)</td> </tr>';
		}
		else {
			str2 = '<tr> <td class="title">point2:</td> <td><a onclick = "showLines(\''+str_p2+'\', 2)">'+str_p2+'</a>'+' ('+resultArr[i].rtt2_value+' ms)</td> </tr>';
		}

	//исключение для значения unicast равного нулю
	if (resultArr[i].unicast_value == 0) {
		resultArr[i].rtt1_value = 0;
		resultArr[i].rtt2_value = 0;
		str1 = '<tr> <td class="title">point1:</td> <td class="badData">'+str_p1+' (0 ms)</td> </tr>';	
		str2 = '<tr> <td class="title">point2:</td> <td class="badData">'+str_p2+' (0 ms)</td> </tr>';
	}else {
		timestamp = Math.round(new Date().getTime() / 1000);
		//если значение старее 65 минут (3900 сек) назад, то считаем значение rtt1 неверным и ставим ноль
		if ((resultArr[i].rtt1_value != 0) && ((timestamp-resultArr[i].lastclock1) > 3900)){
			str1 = '<tr> <td class="title">point1:</td> <td class="badData">'+str_p1+' (0 ms)</td> </tr>';
			resultArr[i].rtt1_value = 0;
		}
		if ((resultArr[i].rtt2_value != 0) && ((timestamp-resultArr[i].lastclock2) > 3900)){
			str2 = '<tr> <td class="title">point1:</td> <td class="badData">'+str_p2+' (0 ms)</td> </tr>';
			resultArr[i].rtt2_value = 0;
		}
	}

	//структура данных для вывода в всплывающем окне для маркера
	contentString = '<div id="content">'+
        '<h2 id="secondHeading" class="secondHeading">'+resultArr[i].provider_name+'</h2>'+
	'<h3 id="thirdHeading" class="thirdHeading">'+resultArr[i].city_name+'</h3>'+
	'<div id="bodyContent"><table>'+str1+str2+			
	'<tr> <td class="title">unicast: </td> <td>msk ('+resultArr[i].unicast_value+' ms)</td> </tr>'+
	'<tr> <td class="title">IP: </td> <td> '+resultArr[i].IP_address+'</td> </tr>'+
	'</table>'+
	'</div>'+
	'</div>';

	image= '';
	image = setColor(parseFloat(resultArr[i].rtt1_value), rtt1Intervals, img);

	//исключение для значения unicast равного нулю
	if (resultArr[i].unicast_value == 0) {		
		image = img[3];
		arrOfNums[3] += 1;
	}else {
		if ((timestamp-resultArr[i].lastclock1) > 3900){
			image = img[4];	
			arrOfNums[4] += 1;
		}			
	}	

	var image_anchor = {
   		url: image,
    		size: new google.maps.Size(10, 10),
    		origin: new google.maps.Point(0,0),
    		anchor: new google.maps.Point(5, 5)
  		};

	myMarker = new google.maps.Marker({
      		position: new google.maps.LatLng(resultArr[i].lat, resultArr[i].lon),
      		map: map,
      		icon: image_anchor,
		title1: resultArr[i].point1_value,
		title2: resultArr[i].point2_value,
		title3: resultArr[i].provider_name,
		index: i,
		mouse_over: 'false'
  		});

	markers.push(myMarker);

	label = new Label({
       		map: map
     		}, "5px", "-10px");
     	label.bindTo('position', myMarker, 'position');
     	label.bindTo('text', myMarker, 'title3');
	markerLabels.push(label);
	markerLabels[i].hide();

	google.maps.event.addListener(myMarker, 'click', (function(myMarker, contentString) {
        	return function() {
			 infowindow.setContent(contentString);
          		 infowindow.open(map, myMarker);
			 showLinesForCurrentPoint(myMarker.index);
        		}
      		})(myMarker, contentString));

	google.maps.event.addListener(myMarker, 'mouseover', (function(myMarker, contentString) {
        	return function() {
			 myMarker.mouse_over = 'true';
			 setTimeout(function(){ 
				if (myMarker.mouse_over == 'true') {
					infowindow.setContent(contentString);
          		 		infowindow.open(map, myMarker);
					}
				}, 300);         		 
        		}
      		})(myMarker, contentString));

	google.maps.event.addListener(myMarker, 'mouseout', (function(myMarker, contentString) {
        	return function() {
			 myMarker.mouse_over = 'false';      		 
        		}
      		})(myMarker, contentString));
	}
setLegendText(arrOfNums);
}
//--------------------------------------------------------------------------------------------------------------------
//send the request to the server to get data about network from zabbix
function getData(){
var str;
var request = $.ajax({
	method: "GET",
  	url: "getDataFromZabbix.php?request=true"
	});

request.done(function() {
	$("#waiting_gif").css("display", "none");
	$("#outdiv").css("display", "block");
	res = request.responseText.split("***");
	resultArr = JSON.parse(res[0]);
	points = JSON.parse(res[1]);
	pointsNum = JSON.parse(res[2]);
	providersNum = JSON.parse(res[3]);

	parent = $('#checkbox'); 
	parent.empty();
	//create the checkboxes to choose providers
	str = "selectall";
	new_checkbox = $("<input type=\"checkbox\">").attr({
		name: str, 
		id: str,
		value: str,
		onchange: "showPointForProvider(\""+str+"\")"
	});
	new_label = $("<label>").attr('for', str).html("<span></span><strong>Select All</strong>");
	parent.append(new_checkbox).append(new_label).append($("<br>"));
	
	strProv = "*";
	//создаем список checkbox для провайдеров
	for (i = 0; i < providersNum.length ; i++) { 
		if (providersNum[i].point == 1) {
			othersProv.push(providersNum[i].key);
			strProv = strProv + providersNum[i].key + "*";
			continue;
			} 
		str = providersNum[i].key;
		new_checkbox = $("<input type=\"checkbox\">").attr({
			name: str, 
			id: str,
			value: str,
			onchange: "showPointForProvider(\""+str+"\")",
			checked: true
		});
		new_label = $("<label>").attr('for', str).html("<span></span>"+str+" ("+providersNum[i].point+")");
		parent.append(new_checkbox).append(new_label).append($("<br>"));
		}
	str = "others";
	new_checkbox = $("<input type=\"checkbox\">").attr({
			name: str, 
			id: str,
			value: str,
			onchange: "showPointForProvider(\""+str+"\")",
			checked: true
		});
	new_label = $("<label>").attr('for', str).html("<span></span>Others ("+othersProv.length+")");
	parent.append(new_checkbox).append(new_label).append($("<br>"));
	$("#selectall").attr("checked", "true");
	showData();	
  	});

request.fail(function() {
	alert ("The php script sent the \""+request.statusText+"\" status.");
	});
}
//--------------------------------------------------------------------------------------------------------------------
function slidePanel(){
 var elem;

 elem = document.getElementById('outdiv'); 
 if (elem.style.right == '-210px') {	
	elem.style.right = '0';
	setTimeout(function(){ 
		document.getElementById('slide_img').src = "images/right_arrow.png";	
		}, 1000);    
  	
	}
 else {
	elem.style.right = '-210px';
	setTimeout(function(){ 
		document.getElementById('slide_img').src = "images/left_arrow.png";	
		}, 1000);	
	}
}
//--------------------------------------------------------------------------------------------------------------------
//send the ajax request to the server to login into zabbix
function loginIntoZabbix(){
var usrname = $("#name").val();
var pswd = $("#password").val();

var request = $.ajax({
	method: "POST",
  	url: "loginIntoZabbix.php",
	contentType: "application/x-www-form-urlencoded",
	data: {submit : true, username : usrname, password : pswd}
	});

request.done(function() {
	if (request.responseText == "Wrong username or password!"){
		$("#err").html(request.responseText);
	}else {
		$("#login").css("display", "none");
		$("#outdiv").css("display", "none");
		$("#waiting_gif").css("display", "block");
		getData();
	}	
  	});

request.fail(function() {
	alert("The php script sent the \""+request.statusText+"\" status.");
	});	
}
//--------------------------------------------------------------------------------------------------------------------
//bind the submit method to the form button
function createEventsFunction(){
	$("form").submit(function(event) {
	event.preventDefault();
	if ($("#name").val() == "" || $("#password").val() == ""){
		$("#err").html("Username or Password is empty.");
		return;
	}
	loginIntoZabbix();
	});

	$("#slide_img").on("click", slidePanel);
}
//--------------------------------------------------------------------------------------------------------------------
//send the ajax request to the server to check whether the session was established or not
function checkSessionStatus(){
var request = $.ajax({
	method: "GET",
  	url: "checkSessionStatus.php"
	});

request.done(function() {
	if (request.responseText == "token is set"){
		$("#login").css("display", "none");
		$("#outdiv").css("display", "none");
		$("#waiting_gif").css("display", "block");
		getData();
	}else {
		$("#login").css("display", "block");
		$("#outdiv").css("display", "none");
		$("#waiting_gif").css("display", "none");
	}	
  	});

request.fail(function() {
	alert ("The php script sent the \""+request.statusText+"\" status.");
	});

}
//--------------------------------------------------------------------------------------------------------------------
// clear the map
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
  markers = [];

 for (var i = 0; i < polylines.length; i++) {
    polylines[i].setMap(map);
  }
  polylines = [];

 for (var i = 0; i < nodes.length; i++) {
    nodes[i].setMap(map);
  }
  nodes = [];

 for (var i = 0; i < nodeLabels.length; i++) {
    nodeLabels[i].setMap(map);
  }
  nodeLabels = [];

 for (var i = 0; i < markerLabels.length; i++) {
    markerLabels[i].setMap(map);
  }
  markerLabels = [];

  resultArr = [];
  points = [];
  pointsNum = [];
}
//--------------------------------------------------------------------------------------------------------------------
//logout from zabbix server
function closeAuth(){
var request = $.ajax({
	method: "GET",
  	url: "logoutFromZabbix.php?logout=true",
	});

request.done(function() {
    	setMapOnAll(null);
	$("#waiting_gif").css("display", "none");
	$("#outdiv").css("display", "none");
	$("#login").css("display", "block");
  	});
}

$("document").ready(checkSessionStatus);
$("document").ready(createEventsFunction);
