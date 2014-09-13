var tiles_provider = 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg';
var api_url = 'http://localhost/VelibFxOS/api/';

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

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
	window.slides_container = $('.swiper-container').swiper({
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

    $('.swiper-slide[data-hash=home] .inner p').remove();
    $('.swiper-slide[data-hash=home] .inner').append('<button onclick="buildTakeBike();" class="entry bikes home_button"><img src="img/velo.svg" alt="Prendre un vélo&nbsp;?"/></button><button onclick="buildLeaveBike();" class="entry parking home_button"><img src="img/borne.svg" alt="Poser un vélo&nbsp;?"/></button><p style="margin-top: 15%;">Position obtenue&nbsp;: '+parseFloat(position.coords.latitude).toFixed(2)+', '+parseFloat(position.coords.longitude).toFixed(2)+'</p>');
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

function buildTakeBike() {
    $.getJSON(
            window.api_url,
            {'do': 'getClosestBikes', 'lat': window.coords.latitude, 'lng': window.coords.longitude},
            function(data) {
                var slides = Array();
                for(var result in data) {
                    var date = new Date(data[result]['last_check'] * 1000);
                    date = date.getDate() + '/' + (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1) + '/' + date.getFullYear() + ' à ' + date.getHours() + ':' + date.getMinutes();
                    slides.push('<div class="inner"><div class="name">'+data[result]['name'].split(' - ').last()+'</div><div class="update">Dernière mise à jour :<span class="date">'+date+'</span></div><div class="entry bikes"><span class="nb">'+data[result]['available']+'</span>vélos disponibles</div><div class="entry parking"><span class="nb">'+data[result]['free']+'</span>places libres</div><div class="map-circle" id="map-circle-1"></div></div></div>');
                }
                setSlides(slides)
            }
        );
    return false;
}

function buildLeaveBike() {
    $.getJSON(
            window.api_url,
            {'do': 'getClosestParks', 'lat': window.coords.latitude, 'lng': window.coords.longitude},
            function(data) {
                var slides = Array();
                for(var result in data) {
                    slides.push('<div class="inner"><div class="name">'+data[result]['name']+'</div><div class="update">Dernière mise à jour :<span class="date">'+data[result]['last_check']+'</span></div><div class="entry bikes"><span class="nb">'+data[result]['available']+'</span>vélos disponibles</div><div class="entry parking"><span class="nb">'+data[result]['free']+'</span>places libres</div><div class="map-circle" id="map-circle-1"></div></div></div>');
                }
                setSlides(slides)
            }
        );
    return false;
}

function setSlides(slides) {
    for(var i = 0; i < slides.length; i++) {
        window.slides_container.insertSlideAfter(0, slides[i]);
    }
    window.slides_container.removeSlide(0);
}
