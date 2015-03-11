"use strict";

/********
 * RoadMap
 ********/

var RoadMap = (function() {
    var stationStorage = null;
    var positionMarker = null;

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
    var addMarkers = (function() {
        console.log('RoadMap', 'addMarkers');
        var stations = stationStorage.getStations();
        var myIcon = '';

        for(var i=0; i < stations.length; i++) {
            // Set icon for each stations
            myIcon = L.divIcon({
                className: 'mapIcon',
                html: '<div class="available-bikes">' + stations[i].availableBikes + '</div>' + '<div class="available-stands">' + stations[i].availableStands + '</div>'
            });

            // Set markers for each stations
            L.marker( stations[i].position, {
                icon: myIcon,
                clickable: true,
                draggable: false,
                title: stations[i].address,
                alt: stations[i].name,
                address: stations[i].address,
                number: stations[i].number
            }).addTo(window.roadMap).on('click', function (e) {
                // Click on marker for more details about the station
                window.location.hash = "/station/" + e.target.options.number;
            });
        }

        return true;
    });

    // Add or move the marker for the current position
    var setPositionMarker = function(position) {
        var latlng = [position.latitude, position.longitude];

        if (positionMarker === null) {
            positionMarker = L.marker(latlng, {
                clickable: false,
                draggable: false,
                title: "Moi",
                alt: "Vous êtes ici !"
            })
        } else {
            positionMarker.setLatLng(latlng);
        }

        positionMarker.addTo(window.roadMap);

        window.roadMap.panTo(latlng);
    };


    // Add a marker for any search
    var addMarkerSearch = (function(position) {
        console.log('RoadMap', 'addMarkers');
        var stations = StationStorage;
        var myIcon = '';

        L.marker([position._initialCenter.lat, position._initialCenter.lng], {
            clickable: false,
            draggable: false,
            title: "Station recherchée",
            alt: "Je veux aller ici"
        }).addTo(window.roadMap);

        return true;
    });

    // Add markers from position to a station
    var addMarker = (function(pos, activeStation, view) {

        var startIcon = L.icon({
            iconUrl: 'js/images/map-my-position.svg',
            iconSize: [40, 45]
        });

        var endIcon = '';

        // icon is customized according to the view
        if(view == 'bikes') {
            endIcon = L.icon({
                iconUrl: 'js/images/map-available-bike.svg',
                iconSize: [40, 45]
            });
        } else {
            endIcon = L.icon({
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
        addMarkerSearch: addMarkerSearch,
        setPositionMarker: setPositionMarker
    };
})();
