// Global map variables
var map;
var geocoder;
var mapData = {};
var mapItems = [];
var c_display_option;

// initialize the map and geocoder
function initialize() {
	var mapOptions = {
		center: { lat: 39.50, lng: -89.35},
		zoom: 4
	};
	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
	geocoder = new google.maps.Geocoder();
	c_display_option = $("input[name=dataDisplayOption]:checked").val();
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
function plotMapMarker(zipCode,count,weight) {
	geocoder.geocode( {'address':zipCode}, function(data, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var marker = new google.maps.Marker({
				map: map,
				position: data[0].geometry.location
			});
			// add the marker to the list 
			mapItems.push(marker);
			// save the data
			mapData[zipCode] = {
				"count": count,
				"weight": weight,
				"loc": data[0].geometry.location
			}
			dataResponse(true);
		}
		else {
			console.log("error in request!");
			dataResponse(false)
		}
	});
}

// plot a marker given the location
function plotLocation(location) {
	var marker = new google.maps.Marker({
		map: map,
		position: location
	});
	return marker;
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
	
	// route the data to the appropriate func depending on the current display setting	
	if (c_display_option == "location") {
		plotMapMarker(code,count,weight);
	}
	else if (c_display_option == "total_number") {
		
	}
	else if (c_display_option == "weight_ratio") {
		
	}
	else if (c_display_option == "heatmap") {
		
	}
	else { alert("Something went wrong!"); }
	
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
		var weight = v["weight"];
		var count = v["count"];
		var loc = v["loc"];
		// map it depending on the selected option
		if (c_display_option == "location") {
			mapItems.push(plotLocation(loc));
		}
		else if (c_display_option == "total_number") {
			
		}
		else if (c_display_option == "weight_ratio") {
			
		}
		else if (c_display_option == "heatmap") {
			
		}
	});
}

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
	
});