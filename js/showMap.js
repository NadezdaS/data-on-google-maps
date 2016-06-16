  //set the center of the map on Moscow(Russia)
  var myLatLng = new google.maps.LatLng(55.7500, 37.6167);
  var mapOptions = {
    zoom: 5,
    center: myLatLng
  }; 
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
