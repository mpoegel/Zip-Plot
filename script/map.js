// Global map variables
var map;
var geocoder;

// initialize the map and geocoder
function initialize() {
	var mapOptions = {
		center: { lat: 39.50, lng: -89.35},
		zoom: 4
	};
	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
	geocoder = new google.maps.Geocoder();
}

// alert box to show the success of adding data
function dataResponse(success) {
	if (success) {
		$("<div/>", {
			"class": "alert alert-success",
			text: "Data successfully added!"
		}).appendTo("#alertBox");
	}
	else {
		$("<div/>", {
			"class": "alert alert-danger",
			text: "Oh no! Something went wrong!"
		}).appendTo("#alertBox");
	}
}

// take a zip code as a string and mark its location on the map
function plotZipCode(zipCode) {
	geocoder.geocode( {'address':zipCode}, function(data, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var marker = new google.maps.Marker({
				map: map,
				position: data[0].geometry.location
			});
			dataResponse(true);
		}
		else {
			console.log("error in request!");
			dataResponse(false)
		}
	});
}

// not currently used (but may use later?)
function plotLocation(location) {
	var marker = new google.maps.Marker({
		map: map,
		position: location
	});
	return marker;
}

function addDatumPoint() {
	// clear the alert box of any old alerts
	$("#alertBox").empty();
	var code = $("#zipCodeEntry").val();
	// make sure that a valid zipcode was entered
	if (code.length != 5) {
		$("<div/>", {
			"class": "alert alert-danger",
			text: "Oh Snap! That's not a valid zip code!"
		}).appendTo("#alertBox");
		return;
	}
	// alert if the zip code is already on the map
	else if (false) {
		$("<div/>", {
			"class": "alert alert-warning",
			text: "Looks we already have that datum point!"
		}).appendTo("#alertBox");
		return;
	}
	// all good: plot the point
	plotZipCode(code);
	
}

// ==================================================================
$(document).ready(function() {
	
	// load the map and geocoder
	google.maps.event.addDomListener(window, 'load', initialize);
	
	// listener for manual data entry form
	$("#addDatumPoint").click(addDatumPoint);
	
});