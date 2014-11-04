var tiles_provider = 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg';
var stations_url = 'https://api.jcdecaux.com/vls/v1/stations?contract=paris&apiKey=5eec7c1a3babb6b2abeabb0143c635d2d9aff1c3';
var realtime_url = 'https://api.jcdecaux.com/vls/v1/stations/{station_number}?contract=paris&apiKey=5eec7c1a3babb6b2abeabb0143c635d2d9aff1c3'

if (typeof(Array.prototype.last) != 'function') {
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

if (typeof( String.prototype.startsWith) != 'function') {
    String.prototype.startsWith = function( str ) {
      return this.substring( 0, str.length ) === str;
    }
};

var full_stations_list = {};  // Store the full list of stations
var stations = [];  // Store only the relevant stations

var coords = {};  // Store the position of the user
var map = false;  // Handles minimaps
var slides_container = false;  // Global object for the Slides API

var mode = 'vélos';  // Current mode - look for bicycles or parks


/***************
 * Geolocation *
 ***************/

/**
 * Called on successful geopositionning, sets the coords and build new home page.
 */
function positionSuccessFunction(position) {
    window.coords = position.coords;
    window.coords = {"latitude": 48.841863, "longitude": 2.345027}; // TODO

    $('.swiper-slide[data-hash=home] .inner p').remove();
    $('.swiper-slide[data-hash=home] .inner').append('<div><button class="entry bikes home_button"><img src="img/velo.svg" alt="Prendre un vélo&nbsp;?"/></button><button class="entry parks home_button"><img src="img/borne.svg" alt="Poser un vélo&nbsp;?"/></button></div><p>Position obtenue&nbsp;: '+parseFloat(window.coords.latitude).toFixed(3)+', '+parseFloat(window.coords.longitude).toFixed(3)+'</p>');
    $('.swiper-slide[data-hash=home] .inner .bikes').click(buildView);
    $('.swiper-slide[data-hash=home] .inner .parks').click(buildView);
}


/**
 * Called on error during geopositionning, displays the error on the home page.
 */
function positionErrorFunction(error) {
    switch(error.code) {
        case error.TIMEOUT:
            $('.swiper-slide[data-hash=home] .inner p').addClass('error').html("Erreur : L'application n'a pas pu accéder aux ressources de geolocalisation dans le temps imparti. Elle va recommencer avec une durée plus longue.");
            //Restart with a greater timeout
            navigator.geolocation.getCurrentPosition(positionSuccessFunction, positionErrorFunction, {enableHighAccuracy:true,  maximumAge:60000, timeout:5000});
            break;

        case error.PERMISSION_DENIED:
            $('.swiper-slide[data-hash=home] .inner p').addClass('error').html("Erreur : L'application n'a pas l'autorisation d'utiliser les ressources de geolocalisation.");
            break;

        case error.POSITION_UNAVAILABLE:
            $('.swiper-slide[data-hash=home] .inner p').addClass('error').html("Erreur : La position n'a pas pu être déterminée.");
            break;

        default:
            $('.swiper-slide[data-hash=home] .inner p').addClass('error').html("Erreur "+error.code+" : "+error.message);
            break;
    }
}


/*********************
 * Slides management *
 *********************/

/**
 * Remove all the existing slides except the last one (credits) and add the
 * slides `slides`.
 * @param: slides is an array of slide HTML.
 */
function setSlides(slides) {
    var nb_slides = window.slides_container.slides.length - 2;  // Remove the two "duplicate" slides used for looping

    for (var i = 0; i < slides.length; i++) {
        window.slides_container.insertSlideAfter(nb_slides - 2, slides[i]);  // Insert right before the last slide (credits)
    }

    for (var i = 0; i < nb_slides - 1; i++) {  // Remove all the previous slides
        window.slides_container.removeSlide(i);
    }
}


/**
 * Pads a number with a leading zero, if smaller than 10.
 */
function pad(nb) {
    return (nb < 10 ? '0' : '') + nb;
}


/**
 * Converts a timestamp to a nicely formatted date
 */
function nice_date(timestamp) {
    var now = parseInt(Date.now() / 1000);
    var diff = now - (timestamp / 1000);
    if (diff < 60) {
        return 'il y a '+diff+ ' s';
    } else if (diff < 300) {
        var val = Math.round(diff / 60);
        return 'il y a ' + val + ' min'+(val > 1 ? 's' : '');
    } else if (diff < 3600) {
        var val = Math.round(diff / 300) * 5;
        return 'il y a ' + val + ' min'+(val > 1 ? 's' : '');
    } else {
        var date = new Date(timestamp * 1000);
        return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + ' à ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }
}


/**
 * Returns a nice station name, without the id prefix.
 */
function station_name(full_name) {
    return full_name.split(' - ').last();
}


/**
 * Converts an angle from degrees to rads
 */
function deg2rad(angle) {
    return angle * Math.PI / 180;
}


/**
 * Computes the distance between two points identified by latitude / longitude
 */
function lat_lng_to_dist(lat1, lng1, lat2, lng2) {
		var latitude1 = deg2rad(lat1);
		var longitude1 = deg2rad(lng1);
		var latitude2 = deg2rad(lat2);
		var longitude2 = deg2rad(lng2);

		var a = Math.pow(Math.sin(latitude2 - latitude1)/2, 2) + Math.cos(latitude1) * Math.cos(latitude2)*Math.pow(Math.sin(longitude2 - longitude1)/2, 2);
		var c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		var R = 6371000;
		var distance = R*c;
        return distance;
}


/**
 * Fetch information about stations, asynchronously
 */
function fetch_stations(distances, start, length) {
    var ajax_requests = [];
    for (var i = start; i < start + length; i++) {
        if (i > distances.length) {
            break;
        }
        ajax_requests.push($.getJSON(
                window.realtime_url.replace('{station_number}', distances[i]['number']),
                function (data) {
                    if (data['status'] == "OPEN") {  // Station must be opened
                        if ((window.mode == "vélos" && data['available_bikes'] > 0) || window.mode == "places" && data['available_bike_stands'] > 0) {  // And there must be available bikes / places
                            window.stations[i] = data;
                        }
                    }
                }));
    }
    $.when.apply(this, ajax_requests).done(function () {
        // If we got enough stations, let's display them
        if ($.grep(window.stations, function (v, i) { return typeof(v) !== "undefined"; }).length >= 10 || start + length > window.full_stations_list.length) {
            display_stations();
        }
        // Else, fetch more stations
        else {
            fetch_stations(distances, start + length, 1);
        }
    });
}


/**
 * Display resulting stations
 */
function display_stations() {
    var slides = [];
    for(var result = 0; result < window.stations.length; result++) {
        if (typeof(window.stations[result]) === "undefined") {
            continue;
        }
        if (window.mode == 'vélos') {
            var available = window.stations[result]['available_bikes'];
            var class_name = "bikes";
        }
        else if (window.mode == 'places') {
            var available = window.stations[result]['available_bike_stands'];
            var class_name = "parks";
        }
        slides.push('<div class="inner"><div class="name"><h2>'+station_name(window.stations[result]['name'])+'</h2></div><div class="update">Mis à jour <span class="date">'+nice_date(window.stations[result]['last_update'])+'</span>.</div><div class="entry '+class_name+'"><span class="nb">'+available+'</span> '+window.mode+' disponibles</div><div class="map-circle" data-id="'+window.stations[result]['number']+'"></div></div></div>');
    }
    // Set the new slides
    setSlides(slides);
    // Initialize the minimaps
    init_map_circle();
    // Load the map corresponding to actually loaded slide
    station_map_circle();
}


/**
 * Build the view, with the various slides
 * @params: bikes_parks is either "Bikes" or "Parks" depending on the button clicked on the homepage.
 */
function buildView(ev) {
    if($(ev.target).hasClass('bikes')) {
        window.mode = 'vélos';
    }
    else if($(ev.target).hasClass('parks')) {
        window.mode = 'places';
    }

    $(ev.target).parent('div').html("<p>Loading…</p>");

    // Wait until window.full_stations_list has been populated
    while(window.full_stations_list === null) {
    }

    var distances = [];
    // Look for the 10 closest stations
    // Compute all the distances
    for (var i = 0; i < window.full_stations_list.length; i++) {
        distances.push({'number': window.full_stations_list[i]['number'], 'distance': lat_lng_to_dist(window.coords.latitude, window.coords.longitude, window.full_stations_list[i]['position']['lat'], window.full_stations_list[i]['position']['lng'])});
    }
    // Sort stations by distances
    distances.sort(function(a, b) { return a.distance - b.distance; });

    // Get station status for the 10 first elements
    fetch_stations(distances, 0, 10);
}


/**
 * Init the minimap height for all slides
 */
function init_map_circle() {
    var slides = $(window.slides_container.slides);
    // Ignore the first slide (loop) and the last two slides (about + loop)
    for (var i = 1; i < slides.length - 2; i++) {
        var active_slide = $(slides[i]);
        var id = parseInt($('.map-circle', active_slide).attr('data-id'));

        var height = $('.inner', active_slide).height() - $('.name', active_slide).height() - $('.update', active_slide).height() - $('.entry', active_slide).height() - 45;  // 40 is padding + margins

        if(height > active_slide.width() - 80) {  // 80 for margins and padding
            height = active_slide.width() - 80;
        }
        $('.map-circle[data-id='+id+']').height(height +'px');
        $('.map-circle[data-id='+id+']').width(height +'px');
    }
}


/**
 * Load the minimap when switching tile.
 */
function station_map_circle() {
    if (window.map != false) {
        window.map.remove();
        window.map = false;
    }

    var active_slide = $(window.slides_container.activeSlide());
    try {
        var id = parseInt($('.map-circle', active_slide).attr('data-id'));
        if (isNaN(id)) {
            throw new TypeError;
        }
    }
    catch(e) {
        if (e instanceof TypeError) {
            return;
        }
        else {
            throw e;
        }
    }
    var station = $.grep(window.stations, function(v, i) {
        return typeof(v) !== "undefined" && v['number'] === id;
    });
    var latitude = station[0]['position']['lat'];
    var longitude = station[0]['position']['lng'];

    window.map = L.map($('.map-circle', active_slide).get(0), { zoomControl: false}).setView([latitude, longitude], 16);
    L.marker([latitude, longitude]).addTo(window.map);
    window.map.dragging.disable();
    window.map.touchZoom.disable();
    window.map.doubleClickZoom.disable();
    window.map.scrollWheelZoom.disable();
    window.map.boxZoom.disable();
    window.map.keyboard.disable();

    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {id: 'examples.map-20v6611k'}).addTo(window.map);

    window.map.on('click', function(e) {
        e.preventDefault;
        location.hash = 'map-station-'+id;
        // TODO
    });
}


/**
 * Retrieve the JSON of the stations at JCDecaux OpenData API and stores it in localStorage.
 */
function retrieve_stations() {
    // Reset stations state to null, while loading the ressource
    window.full_stations_list = null;
    // Update the stations list
    $.getJSON(window.stations_url, function (data, status, jqXHR) {
        localStorage.setItem('last_stations_update', Date.now());
        localStorage.setItem('stations', jqXHR.responseText);
        window.full_stations_list = data;
    });
}


$(function(){
    // Try to recover the stations list from localStorage
    try {
        window.full_stations_list = JSON.parse(localStorage.getItem('stations'));
    } catch (e) {
        window.full_stations_list = null;
    }
    // Update stations list once per month
    last_stations_update = localStorage.getItem('last_stations_update');
    if (last_stations_update === null || last_stations_update < 30*24*3600*1000 || $.isEmptyObject(window.full_stations_list)) {
        retrieve_stations();
    }

	window.slides_container = $('.swiper-container').swiper({
        mode: 'horizontal',
        loop: true,
		slidesPerView: 1,
		watchActiveIndex: true,
		centeredSlides: true,
		pagination: '.pagination',
		paginationClickable: true,
		resizeReInit: true,
		keyboardControl: true,
		grabCursor: true,
        hashNav: true,
        onSlideChangeEnd: station_map_circle,
    });

    // Get the current position
    if(navigator.geolocation) {
        $('.swiper-slide[data-hash=home] .inner').append('<p>Recherche de la position GPS…</p>');
        navigator.geolocation.getCurrentPosition(positionSuccessFunction, positionErrorFunction, {enableHighAccuracy:true,  maximumAge:60000, timeout:2000});
    }
    else if(!navigator.geolocation) {
        $('.swiper-slide[data-hash=home] .inner').append('<p class="error">Votre navigateur ne supporte pas l\'API de géolocalisation.</p>');
    }
});
