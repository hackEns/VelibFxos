function show(id) {
    $('body>div').css('display', 'none');
    $(id).toggle();
    location.hash = id;

    switch(id) {
        case '#station':
            station_map_circle();
            break;
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

function station_map_circle(id) {
    map = L.map('map-circle', { zoomControl: false }).setView([latitude, longitude], 13);
}
