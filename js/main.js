var tiles_provider = 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg';
var api_url = 'http://localhost/VelibFxOS/api/';

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

var stations = {};

var maps = Array();
var coords = {}
var map = false;
var slides_container = false;


/***************
 * Geolocation *
 ***************/

/**
 * Called on successful geopositionning, sets the coords and build new home page.
 */
function positionSuccessFunction(position) {
    window.coords = position.coords;

    $('.swiper-slide[data-hash=home] .inner p').remove();
    $('.swiper-slide[data-hash=home] .inner').append('<div><button class="entry bikes home_button"><img src="img/velo.svg" alt="Prendre un vélo&nbsp;?"/></button><button class="entry parks home_button"><img src="img/borne.svg" alt="Poser un vélo&nbsp;?"/></button></div><p>Position obtenue&nbsp;: '+parseFloat(position.coords.latitude).toFixed(2)+', '+parseFloat(position.coords.longitude).toFixed(2)+'</p>');
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
    var diff = now - timestamp;
    if (diff < 60) {
        return 'il y a '+diff+ ' s';
    } else if (diff < 300) {
        var val = Math.round(diff / 60);
        return 'il y a ' + val + ' min'+(val > 1 ? 's' : '');
    } else if (diff < 3600) {
        var val = Math.round(diff / 300) * 5;
        return 'il y a ' + val + ' min'+(val > 1 ? 's' : '');
    } else {
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
 * Build the view, with the various slides
 * @params: bikes_parks is either "Bikes" or "Parks" depending on the button clicked on the homepage.
 */
function buildView(ev) {
    var bikes_parks = 'Bikes';
    if($(ev.target).hasClass('bikes')) {
        bikes_parks = 'Bikes';
    }
    else if($(ev.target).hasClass('parks')) {
        bikes_parks = 'Parks';
    }

    $(ev.target).parent('div').html("<p>Loading…</p>");
    $.getJSON(
            window.api_url,
            {'do': 'getClosest'+bikes_parks, 'lat': window.coords.latitude, 'lng': window.coords.longitude},
            function(data) {
                var slides = Array();
                for(var result in data) {
                    window.stations[result] = data[result];
                    if (bikes_parks == 'Bikes') {
                        var available = data[result]['available'];
                        var bikes_parks_i18n = 'vélos';
                    }
                    else if (bikes_parks == 'Parks') {
                        var available = data[result]['free'];
                        var bikes_parks_i18n = 'places';
                    }
                    slides.push('<div class="inner"><div class="name"><h2>'+station_name(data[result]['name'])+'</h2></div><div class="update">Mis à jour <span class="date">'+nice_date(data[result]['last_check'])+'</span></div><div class="entry '+bikes_parks.toLowerCase()+'"><span class="nb">'+data[result]['available']+'</span> '+bikes_parks_i18n+' disponibles</div><div class="map-circle" id="map-circle-'+result+'"></div></div></div>');
                }
                // Set the new slides
                setSlides(slides);
                // Initialize the minimaps
                init_map_circle();
                // Load the map corresponding to actually loaded slide
                station_map_circle();
            }
        );
    return false;
}


/**
 * Init the minimap height for all slides
 */
function init_map_circle() {
    var slides = $(window.slides_container.slides);
    // Ignore the first slide (loop) and the last two slides (about + loop)
    for (var i = 1; i < slides.length - 2; i++) {
        var active_slide = $(slides[i]);
        var id = parseInt($('.map-circle', active_slide).attr('id').replace('map-circle-', ''));

        var height = $('.inner', active_slide).height() - $('.name', active_slide).height() - $('.update', active_slide).height() - $('.entry', active_slide).height() - 45;  // 40 is padding + margins

        if(height > active_slide.width() - 80) {  // 80 for margins and padding
            height = active_slide.width() - 80;
        }
        $('#map-circle-'+id).height(height +'px');
        $('#map-circle-'+id).width(height +'px');
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
    var id = parseInt($('.map-circle', active_slide).attr('id').replace('map-circle-', ''));
    var latitude = window.stations[id]['lat'];
    var longitude = window.stations[id]['lng'];

    window.map = L.map('map-circle-'+id, { zoomControl: false}).setView([latitude, longitude], 16);
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


$(function(){
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
