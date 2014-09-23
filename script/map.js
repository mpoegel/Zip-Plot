// Global map variables
var map;
var geocoder;
var mapData = {};
var mapItems = [];
var zipDatabase = [];
var curr_cookie_name = "zip-plot-latlong-data"
var curr_db_num = 0;
var c_display_option;
var total_count = 0;
var infoWindow;

// initialize the map and geocoder and other stuff
function initialize() {
	var mapOptions = {
		center: { lat: 42.652081, lng: -73.754079},
		zoom: 8
	};
	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
	geocoder = new google.maps.Geocoder();
	c_display_option = $("input[name=dataDisplayOption]:checked").val();
	
	// get any stored data in cookies
	var cookies = $.cookie("zip-plot-latlong-data-0");
	var i = 1;
	while (cookies) {
		zipDatabase.push(JSON.parse(cookies));
		cookies = $.cookie("zip-plot-latlong-data-" + i.toString());
		i++;
		curr_db_num++;
	}
	if (!zipDatabase[curr_db_num]) {
		zipDatabase.push({});
	}
	
	// initialize the info window with no location or text
	infoWindow = new google.maps.InfoWindow({
		content: 'hello'
	});
}
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

// takes fraction of a whole and returns an RGB representation of that fraction
function fractionToRGB(part, total) {
	var i = Math.floor( Math.log(part / total * 100) * 100);
	var n = 255 - Math.floor(part / total * 255);
	var hex = n.toString(16);
	var rgb = '';
	
	// less than 1 is red
	if (i < Math.log(Math.sqrt(total))) {
		rgb = "#" + hex + "0000";
	}
	// less than 3 is green
	else if (i < Math.log(Math.sqrt(total)/10)) { // this is meaningless what is maths
		rgb = "#" + "00" + hex + "00";
	}
	// greater than 3 is blue
	else {
		rgb = "#0000" + hex;
	}

	return rgb;
}

function ratioToRGB(ratios) {
	var rollup = 0;
	var base = ratios[0]; // first entry is the base
	// roll the rest up into one value 
	// ratio of 0 to >0
	for (var i = 1; i<ratios.length; i++) {
		rollup += ratios[i];
	}
	
	var rgb = '';
	var perc = rollup / base * 100;
	if (perc < 5) {
		rgb = "#FF0000"; // red
	}
	else if (perc < 15) {
		rgb = "#00FF00"; // green
	}
	else {
		rgb = "#0000FF"; // blue
	}
	
	return rgb;
}

// binds an info window to the map item to display on hover
function bindInfoWindow(item, loc, code, data) {
	
	// html string to display 'weight : count'
	var count_text = "";
	for (var i = 0; i<data["counts"].length; i++) {
		count_text += i.toString() + " : " + data["counts"][i].toString() + "<br>";
	}
	
	google.maps.event.addListener(item, 'mouseover', function() {
		infoWindow.setContent("<p><b>" + code + "</b><br>" + count_text + "</p>");
		infoWindow.setPosition(loc);
		infoWindow.open(map);
	});
	google.maps.event.addListener(item, 'mouseout', function() {
		infoWindow.close();
	});
	return item;
}

// returns the plotting function according to the current setting
function getPlotFunction() {
	// route the data to the appropriate func depending on the current display setting	
	if (c_display_option == "location") {
		return plotMapMarkerZip;
	}
	else if (c_display_option == "total_number") {
		return plotMapCircleZip;
	}
	else if (c_display_option == "weight_ratio") {
		return plotMapWeightZip;
	}
	else if (c_display_option == "heatmap") {
		return null;
	}
	else { 
		alert("Something went wrong!");
		return null;
	}
}

// clear everything on the map (in mapItems)
function clearMap() {
	$("#alertBox").empty();
	for (var i=0; i<mapItems.length; i++) {
		mapItems[i].setMap(null);
	}
	mapItems = [];
}

// clear the MDE form
function clearForm() {
	$("#alertBox").empty();
	$("#zipCodeEntry").val("");
	$("#countEntry").val("");
	$("#weightEntry").val("");
}

// alert box to show the success of adding data
function dataResponse(success) {
	if (success) {
		$("<div/>", {
			"class": "alert alert-success",
			text: "Data successfully added!"
		}).append('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>').appendTo("#alertBox");
	}
	else {
		$("<div/>", {
			"class": "alert alert-danger",
			text: "Oh no! Something went wrong!"
		}).append('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>').appendTo("#alertBox");
	}
}

// take a zip code as a string and mark its location on the map
function plotMapMarkerZip(zipCode,data) {
	
	// clear alerts
	$("#alertBox").empty();
	
	var found = false;
	// check the database to see if we have a LatLong for this code
	for (var i=0; i<zipDatabase.length; i++) {
		if (zipDatabase[i][zipCode]) {
			var Lat = zipDatabase[i][zipCode]['k'];
			var Long = zipDatabase[i][zipCode]['B'];
			var LatLong = new google.maps.LatLng(Lat,Long);
			// create a new marker
			mapItems.push( bindInfoWindow(plotMapMarker(LatLong), LatLong, zipCode, data) );
			// save for the current session
			mapData[zipCode] = {
				"data": data,
				"loc": LatLong
			}
			found = true;
		}
	}
	
	// if we don't have it yet then get it with geocoder api call
	if (!found) {
		geocoder.geocode( {'address':zipCode}, function(data, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var marker = new google.maps.Marker({
					map: map,
					position: data[0].geometry.location
				});
				// add the marker to the list 
				mapItems.push( bindInfoWindow(marker, data[0].geometry.location, zipCode, data) );
				// save the data
				mapData[zipCode] = {
					"data": data,
					"loc": data[0].geometry.location
				}
				// save to databank
				if (Object.keys(zipDatabase[curr_db_num]).length > 50) {
					zipDatabase.push({});
					curr_db_num++;
				}
				zipDatabase[curr_db_num][zipCode] = data[0].geometry.location;
				// update the cookie!
				for (var i=0; i<zipDatabase.length; i++) {
					$.cookie("zip-plot-latlong-data-" + i.toString(), JSON.stringify(zipDatabase[i]));
				}
				dataResponse(true);
			}
			else {
				console.log("error in request!");
				dataResponse(false)
			}
		});
	}
}

// plot a marker given the location
function plotMapMarker(location) {
	var marker = new google.maps.Marker({
		map: map,
		position: location
	});
	return marker;
}

// plot the zip code as a circle on the map
function plotMapCircleZip(zipCode,data) {
	
	var found = false;
	// check the database to see if we have a LatLong for this code
	for (var i=0; i<zipDatabase.length; i++) {
		if (zipDatabase[zipCode]) {
			var Lat = zipDatabase[zipCode]['k'];
			var Long = zipDatabase[zipCode]['B'];
			var LatLong = new google.maps.LatLng(Lat,Long);
			// create a new marker
			mapItems.push( bindInfoWindow(plotMapCircle(LatLong,data), LatLong, zipCode, data) );
			// save for the current session
			mapData[zipCode] = {
				"data": data,
				"loc": LatLong
			}
			found = true;
		}
	}
	
	// if we don't have then get it with geocoder api call
	if (!found) {
		var count = data["counts"][0];
		geocoder.geocode( {'address':zipCode}, function(locData, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var color = fractionToRGB(count, total_count);
				var circleOptions = {
					strokeColor: color,
					strokeOpacity: 0.35,
					strokeWeight: 2,
					fillColor: color,
					fillOpacity: 0.35,
					map: map,
					center: locData[0].geometry.location,
					radius: 5000
				};
				mapItems.push( bindInfoWindow(new google.maps.Circle(circleOptions), locData[0].geometry.location, zipCode, data) );
				// add the marker to the list 
				mapItems.push(circle);
				// save the data
				mapData[zipCode] = {
					"data": data,
					"loc": locData[0].geometry.location
				}
				// save to databank
				zipDatabase[curr_db_num][zipCode] = locData[0].geometry.location;
				// update the cookie!
				for (var i=0; i<zipDatabase.length; i++) {
					$.cookie("zip-plot-latlong-data-" + i.toString(), JSON.stringify(zipDatabase[i]));
				}
			}
			else {
				console.log("error in request!");
				dataResponse(false)
			}
		});
	}
	
}

// plot the location as a circle on the map
function plotMapCircle(location,data) {
	var count = data["counts"][0];
	var color = fractionToRGB(count, total_count);
	var circleOptions = {
		strokeColor: color,
		strokeOpacity: 0.35,
		strokeWeight: 2,
		fillColor: color,
		fillOpacity: 0.35,
		map: map,
		center: location,
		radius: 5000
	};
	var circle = new google.maps.Circle(circleOptions);
	return circle;
}

// plot the weight data from a zip code 
function plotMapWeightZip(zipCode, data) {
	
	var found = false;
	// check the database to see if we have a LatLong for this code
	for (var i=0; i<zipDatabase.length; i++) {
		if (zipDatabase[zipCode]) {
			var Lat = zipDatabase[zipCode]['k'];
			var Long = zipDatabase[zipCode]['B'];
			var LatLong = new google.maps.LatLng(Lat,Long);
			// create a new marker
			mapItems.push( bindInfoWindow(plotMapWeight(LatLong,data), LatLong, zipCode, data) );
			// save for the current session
			mapData[zipCode] = {
				"data": data,
				"loc": LatLong
			}
			found = true;
		}
	}
	
	// if we don't have then get it with geocoder api call
	if (!found) {
		geocoder.geocode( {'address':zipCode}, function(locData, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var color = ratioToRGB(data["counts"]);
				var circleOptions = {
					strokeColor: color,
					strokeOpacity: 0.35,
					strokeWeight: 2,
					fillColor: color,
					fillOpacity: 0.35,
					map: map,
					center: locData[0].geometry.location,
					radius: 5000
				};
				mapItems.push( bindInfoWindow(new google.maps.Circle(circleOptions), locData[0].geometry.location, zipCode, data) );
				// add the marker to the list 
				mapItems.push(circle);
				// save the data
				mapData[zipCode] = {
					"data": data,
					"loc": locData[0].geometry.location
				}
				// save to databank
				zipDatabase[curr_db_num][zipCode] = locData[0].geometry.location;
				// update the cookie!
				for (var i=0; i<zipDatabase.length; i++) {
					$.cookie("zip-plot-latlong-data-" + i.toString(), JSON.stringify(zipDatabase[i]));
				}
			}
			else {
				console.log("error in request!");
				dataResponse(false)
			}
		});
	}
}

// plot the weight data from a location 
function plotMapWeight(location, data) {
	var color = ratioToRGB(data["counts"]);
	var circleOptions = {
		strokeColor: color,
		strokeOpacity: 0.35,
		strokeWeight: 2,
		fillColor: color,
		fillOpacity: 0.35,
		map: map,
		center: location,
		radius: 5000
	};
	var circle = new google.maps.Circle(circleOptions);
	return circle;
}

// capture the data from manual entry and plot appropriately
function addManualData() {
	// clear the alert box of any old alerts
	$("#alertBox").empty();
	
	// get the zip code that was entered
	var code = $("#zipCodeEntry").val();
	// make sure that a valid zipcode was entered
	if (code.length != 5) {
		$("<div/>", {
			"class": "alert alert-danger",
			text: "Oh Snap! That's not a valid zip code!"
		}).append('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>').appendTo("#alertBox");
		return;
	}
	
	// get the count that was entered
	var count = $("#countEntry").val();
	// validate the entry
	if ($.isNumeric(count) == false) {
		$("<div/>", {
			"class": "alert alert-danger",
			text: "'Count' must be a valid number"
		}).append('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>').appendTo("#alertBox");
		return;
	}
	
	// get the weight that was entered
	var weight = $("#weightEntry").val();
	// validate the entry
	if ($.isNumeric(weight) == false) {
		$("<div/>", {
			"class": "alert alert-danger",
			text: "'Weight' must be a valid number"
		}).append('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>').appendTo("#alertBox");
		return;
	}
	
	// alert if the same data was already entered
	// overwrite the old data with new!
	// NOT IMPLEMENTED YET
	if (false) {
		$("<div/>", {
			"class": "alert alert-warning",
			text: "Looks we already have that datum point!"
		}).append('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>').appendTo("#alertBox");
		return;
	}
	
	// get the function to plot the data according to the current setting 
	count = parseInt(count);
	var data = {"counts": [count]};
	var plot = getPlotFunction();
	plot(code, data);
	total_count += count;
	
	// clear the data entered in the form
	clearForm();
}

// update the map according to the current selected display style
function updateMap() {
	
	var sel_option = $("input[name=dataDisplayOption]:checked").val();
	
	// ignore func call if the setting was not changed
	if (sel_option == c_display_option) { return; }
	
	// clear the map of the old overlays
	clearMap();
	
	// save the new display option
	c_display_option = sel_option;
	
	// plot the data all over again
	plotAllData();
	
}

// plot all of the existing data
function plotAllData() {
	$.each( mapData, function( k,v ) {
		// information at current point
		var code = k;
		var data = v["data"];
		var loc = v["loc"];
		// map it depending on the selected option
		if (c_display_option == "location") {
			mapItems.push(bindInfoWindow(plotMapMarker(loc), loc, code, data));
		}
		else if (c_display_option == "total_number") {
			mapItems.push(bindInfoWindow(plotMapCircle(loc,data), loc, code, data));
		}
		else if (c_display_option == "weight_ratio") {
			mapItems.push(bindInfoWindow(plotMapWeight(loc,data), loc, code, data));
		}
		else if (c_display_option == "heatmap") {
			
		}
	});
}

function addDataFromFile() {
	// grab the file object
	var file = $("#dataInputFile")[0].files[0];
	// open and read the file 
	if (file) {
		var data = [];
		var errors = 0;
		var successes = 0;
		// create a reader (FileReader API)
		var reader = new FileReader();
		reader.readAsText(file);
		// ASYNCHRONOUS CALL
		// function that will be called when the file is loaded
		reader.onload = function(e) {
			var text = reader.result;
			// each datum point is on its own line so we split by new line into an array
			data = text.split("\n");
			// loop over each data point and split at commas
			for (var i=0; i<data.length; i++) {
				data[i] = data[i].split(",");
			}
			
			// get the function to plot the data according to the current setting 
			var plot = getPlotFunction();
			
			// loop over all the data and plot it 
			for (var i=0; i<data.length; i++) {
				// error check the data format
				if (data[i] == '') {
					continue;
				}
				else if (data[i] < 2) { // not enough data to plot
					errors++;
				}				
				else {
					// first comes the zip code
					var code = data[i][0];
					// then the rest is count data 
					var datum = {"counts": []};
					var k = 1; // starts at the (second) index
					while (data[i][k]) {
						datum["counts"].push(parseInt(data[i][k]));
						k++;
					}
					total_count += datum["counts"][0]; // only use the first entry for this 
					
					plot(code,datum);
					successes++; // well..... not really
				}
			}
			
			// sloppy but maybe I'll fix it later
			$("#alertBox").empty();
			
			// show the success rate of reading the file 
			var alert_text = successes + " data points (datum point) read successfully. \n " + errors + " error(s).";
			var alert_type = "";
			if (errors == 0) { alert_type = "alert alert-success"; }
			else if (successes == 0) { alert_type = "alert alert-danger"; }
			else { alert_type = "alert alert-warning"; }
			$("<div/>", {
				"class": alert_type,
				text: alert_text,
			}).append('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>').appendTo("#alertBox");
			
		}; // end onload function
	} // end if (file)
} // end addDataFromFile function

// ==================================================================
$(document).ready(function() {
	
	// load the map and geocoder
	google.maps.event.addDomListener(window, 'load', initialize);
	
	// listener for manual data entry form
	$("#addDatumPoint").click(addManualData);
	
	// listener to update the display settings on the map
	$("#dataDisplayOption").click(updateMap);
	
	// clear map button
	$("#clearMap").click(clearMap);
	
	// clear all the data (add a confirm)
	$("#eraseData").click(function(){ mapData = {}; clearMap(); });
	
	// clear the data in the MDE form
	$("#clearForm").click(clearForm);
	
	// listener to add data from a file 
	$("#addFile").click(addDataFromFile);
	
});