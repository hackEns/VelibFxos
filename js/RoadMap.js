"use strict";

/********
 * RoadMap
 ********/

var RoadMap = (function() {
    var stationStorage = null;
    var positionMarker = null;
    var requestedPosition = null;

    // Init the roadMap
    var init = function(_stationStorage) {
        console.log('RoadMap', 'init', 'RoadMap under construction');
        var selectedLayer = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        stationStorage = _stationStorage;

        window.roadMap = L.map('map', {
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            scrollWheelZoom: true,
            boxZoom: true,
            keyboard: true,
            zoomControl: false,
            zoom: 16
        }).setView([48.842206, 2.345169], 16); // default position if there is no geolocation

        // search plugin
        console.log('RoadMap', 'init', 'Search plugin is available');
        var osmGeocoder = new L.Control.OSMGeocoder();
        roadMap.addControl(osmGeocoder);

        L.tileLayer(selectedLayer).addTo(window.roadMap);

        console.log('RoadMap', 'init', 'RoadMap built');

        return init;
    };

    // Init map for bikes and stands view
    var initCircle = (function(pos) {
        console.log('RoadMap', 'init_circl', 'RoadMap under construction');
        var selectedLayer = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        window.roadMap = L.map('map', {
            dragging: true,
            touchZoom: true,
            doubleClickZoom: false,
            scrollWheelZoom: true,
            boxZoom: true,
            keyboard: false,
            zoomControl: true,
            zoom: 16
        }).setView([pos.latitude, pos.longitude], 16);

        //window.roadMap.panTo([pos.latitude, pos.longitude]);
        L.tileLayer(selectedLayer).addTo(window.roadMap);

        console.log('RoadMap', 'init_circl', 'RoadMap built');

        return initCircle;
    });

    // Add all markers to the Map
    var addMarkers = (function(_stationStorage) {
        console.log('RoadMap', 'addMarkers()');
        stationStorage = _stationStorage;

        var myIcon = '';
        var markersList = [];

        // build Markers
        for(var i=0; i < stationStorage.length; i++) {
            // Set icon for each stations
            myIcon = L.divIcon({
                className:  'mapIcon',
                html:       '<div class="available-bikes">' + stationStorage[i].availableBikes + '</div>' +
                            '<div class="available-stands">' + stationStorage[i].availableStands + '</div>'
            });
            // Set markers in markersList
            markersList[i] = L.marker( [stationStorage[i].position.latitude, stationStorage[i].position.longitude], {
                                icon: myIcon,
                                clickable: true,
                                draggable: false,
                                title: stationStorage[i].address,
                                alt: stationStorage[i].name,
                                address: stationStorage[i].address,
                                number: stationStorage[i].number
            });
        }

        // insert Markers on the roadMap
        $.map( markersList, function(station) {
            station.addTo(window.roadMap);
        });

    });

    // Add or move the marker for the current position
    var setPositionMarker = function(position) {
        console.log('RoadMap', 'setPositionMarker', position);
        var latlng = [position.latitude, position.longitude];

        if (positionMarker === null) {
            console.log('null', positionMarker);
            positionMarker = L.marker(latlng, {
                clickable: false,
                draggable: false,
                title: "Moi",
                alt: "Vous êtes ici !"
            });
        } else {
            positionMarker.setLatLng(latlng);
        }

        positionMarker.addTo(window.roadMap);

        window.roadMap.panTo(latlng);
    };


    // Add a marker for any search
    var setRequestedPositionMarker = (function(position) {
        console.log('RoadMap', 'setRequestedPositionMarker');
        var latlng = [position._initialCenter.lat, position._initialCenter.lng];

        if(requestedPosition === null) {
            requestedPosition = L.marker(latlng, {
                clickable: false,
                draggable: false,
                title: "Station recherchée",
                alt: "Je veux aller ici"
            });
        } else {
            requestedPosition.setLatLng(latlng);
        }

        requestedPosition.addTo(window.roadMap);

        window.roadMap.panTo(latlng);

    });

    // Add markers from position to a station
    var addMarker = (function(pos, activeStation, view) {

        var startIcon = L.icon({
            iconUrl: 'js/images/map-my-position.svg',
            iconSize: [40, 45]
        });

        // icon is customized according to the view
        if(view == 'bikes') {
            var endIcon = L.icon({
                iconUrl: 'js/images/map-available-bike.svg',
                iconSize: [40, 45]
            });
        } else {
            var endIcon = L.icon({
                iconUrl: 'js/images/map-available-stand.svg',
                iconSize: [40, 45]
            });
        }

        var markers = [];
        var route = L.Routing.control({
            waypoints: [
                L.latLng(pos.latitude, pos.longitude),
                L.latLng(activeStation[0].position)
            ],
            routeWhileDragging: true,
            fitSelectedRoutes: true,
            useZoomParameter: true,
            autoRoute: true
        }).addTo(window.roadMap);


        //desable itenary panel
        $(".leaflet-right").hide();

        return true;
    });

    return {
        init: init,
        initCircle: initCircle,
        addMarkers: addMarkers,
        addMarker: addMarker,
        setPositionMarker: setPositionMarker,
        setRequestedPositionMarker: setRequestedPositionMarker
    };
})();
