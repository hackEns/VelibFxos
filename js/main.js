var tiles_provider = 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg';

if ( typeof String.prototype.startsWith != 'function' ) {
  String.prototype.startsWith = function( str ) {
    return this.substring( 0, str.length ) === str;
  }
};

var stations = [
    {'latitude': 48.84249, 'longitude': 2.34462},
    {'latitude': 48.84249, 'longitude': 2.34462},
]

var maps = Array();
var coords = {'latitude': 48.8429, 'longitude': 2.34463}

function station_map_circle(id) {
    var id = parseInt(id);
    var latitude = stations[id - 1]['latitude'];
    var longitude = stations[id - 1]['longitude'];
    var map_id = 'map-circle-'+id;
    var slide = $('.swiper-slide[data-hash=station-'+id+']');
    var height = slide.height() - $('.station-info', slide).height() - 120;

    if(height > slide.width() - 40) {
        var tmp = slide.width() - 100;
        margin = (height - tmp) / 2;
        height = tmp;
    }
    $('#'+map_id).height(height +'px');
    $('#'+map_id).width(height +'px');

    window.maps[id-1] = L.map(map_id, { zoomControl: false}).setView([latitude, longitude], 16);
    L.marker([latitude, longitude]).addTo(window.maps[id-1]);
    window.maps[id-1].dragging.disable();
    window.maps[id-1].touchZoom.disable();
    window.maps[id-1].doubleClickZoom.disable();
    window.maps[id-1].scrollWheelZoom.disable();
    window.maps[id-1].boxZoom.disable();
    window.maps[id-1].keyboard.disable();

    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {id: 'examples.map-20v6611k'}).addTo(window.maps[id-1]);

    window.maps[id-1].on('click', function(e) {
        e.preventDefault;
        location.hash = 'map-station-'+id;
    });
}

$(function(){
	var gallery = $('.swiper-container').swiper({
        mode:'horizontal',
        loop: true,
		slidesPerView:1,
		watchActiveIndex: true,
		centeredSlides: true,
		pagination:'.pagination',
		paginationClickable: true,
		resizeReInit: true,
		keyboardControl: true,
		grabCursor: true,
        hashNav: true,
    });

    if(navigator.geolocation || coords !== '') {
        $('.swiper-slide[data-hash=home] .inner').append('<p>Recherche de la position GPS…</p>');
        navigator.geolocation.getCurrentPosition(positionSuccessFunction, positionErrorFunction, {enableHighAccuracy:true,  maximumAge:60000, timeout:2000});
    }
    else if(!navigator.geolocation) {
        $('.swiper-slide[data-hash=home] .inner').append('<p class="error">Votre navigateur ne supporte pas l\'API de géolocalisation.</p>');
    }

    /*for(id = 1; id < 4; id++) {
        station_map_circle(id);
    }*/
});

function positionSuccessFunction(position) {
    window.coords = position.coords;

    $('.switch-slide[data-hash=home] .inner').remove('p').append('<div><p>Prendre un vélo ? Poser un vélo ?</p></div>');
}

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
