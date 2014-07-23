var tiles_provider = 'http://c.tile.stamen.com/toner-lite/{z}/{x}/{y}.jpg' // Stamen Toner

if ( typeof String.prototype.startsWith != 'function' ) {
  String.prototype.startsWith = function( str ) {
    return this.substring( 0, str.length ) === str;
  }
};

function show(id) {
    $('body>div').css('display', 'none');
    $(id).toggle();
    location.hash = id;

    if(id.startsWith('#station-')) {
        station_map_circle(id.replace('#station-', ''));
    }
}

window.onhashchange = function() {
    show(location.hash);
}

$(document).ready(function() {
    if (location.hash != '') {
        show(location.hash);
    }
});

var stations = [{'latitude': 48.84249, 'longitude': 2.34462}]

function station_map_circle(id) {
    var latitude = window.stations[id]['latitude'];
    var longitude = window.stations[id]['longitude'];
    var map_id = 'map-circle-'+id;
    var height = $('#station-'+id).height() - $('.station-info', $('#station-'+id)).height() - 20;
    var margin = 0;

    if(height > $('#station-'+id).width() - 40) {
        var tmp = $('#station-'+id).width();
        margin = (height - tmp) / 2;
        height = tmp;
    }
    $('#'+map_id).height(height +'px');
    $('#'+map_id).width(height +'px');
    if(margin != 0) {
        $('#'+map_id).css('margin-top', margin+'px');
    }
    map = L.map(map_id, { zoomControl: false}).setView([latitude, longitude], 18);
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();

    L.tileLayer(window.tiles_provider,
        {}).addTo(map);

    map.on('click', function(e) {
        e.preventDefault;
        location.hash = 'map-station-'+id;
    });
}
