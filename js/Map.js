"use strict";

/********
 * Map
 ********/

var Map = (function() {

    // Init the map
    var init = (function(pos) {
        console.log('Map', 'init', 'Map under construction');
        var selectedLayer = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        window.map = L.map('map', {
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            scrollWheelZoom: false,
            boxZoom: true,
            keyboard: false,
            zoomControl: false,
            zoom: 16
        }).setView([pos.latitude, pos.longitude], 16);

        // search plugin
        console.log('Map', 'init', 'Search plugin is available');
        var osmGeocoder = new L.Control.OSMGeocoder();
        map.addControl(osmGeocoder);

        window.map.panTo([pos.latitude, pos.longitude]);
        L.tileLayer(selectedLayer).addTo(window.map);

        console.log('Map', 'init', 'Map built');

        return init;
    });

    // Init map for bikes and stands view
    var initCircle = (function(pos) {
        console.log('Map', 'init_circl', 'Map under construction');
        var selectedLayer = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        window.map = L.map('map', {
            dragging: true,
            touchZoom: true,
            doubleClickZoom: false,
            scrollWheelZoom: false,
            boxZoom: true,
            keyboard: false,
            zoomControl: true,
            zoom: 16
        }).setView([pos.latitude, pos.longitude], 16);

        window.map.panTo([pos.latitude, pos.longitude]);
        L.tileLayer(selectedLayer).addTo(window.map);

        console.log('Map', 'init_circl', 'Map built');

        return initCircle;
    });

    // Add all markers to the Map
    var addMarkers = (function(pos) {
        console.log('Map', 'addMarkers');
        var stations = Stations.getFullList();
        var myIcon = '';

        // 1st marker is the current position
        L.marker([pos.latitude, pos.longitude], {
            clickable: false,
            draggable: false,
            title: "Moi",
            alt: "Vous êtes ici !"
        }).addTo(window.map);

        for(var i=0; i < stations.length; i++) {
            // Set icon for each stations
            myIcon = L.divIcon({
                className: 'mapIcon',
                html: '<div class="avail_bikes">' + stations[i].available_bikes + '</div>' + '<div class="avail_bike_stands">' + stations[i].available_bike_stands + '</div>'
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
            }).addTo(window.map).on('click', function (e) {
                // Click on marker for more details about the station
                window.location.hash = "/station/" + e.target.options.number;
            });
        }

        return addMarkers;
    });

    // Add markers from position to a station
    var addMarker = (function(pos, activeStation) {
        // 1st marker is the current position
        L.marker([pos.latitude, pos.longitude], {
            clickable: false,
            draggable: false,
            title: "Moi",
            alt: "Vous êtes ici !"
        }).addTo(window.map);

        // 2nd marker is the activeStation
        L.marker(activeStation[0].position, {
            clickable: true,
            draggable: false,
            title: activeStation[0].address,
            alt: activeStation[0].name,
            address: activeStation[0].address,
            number: activeStation[0].number
        }).addTo(window.map);

        return addMarker;
    });

    return {
        init: init,
        initCircle: initCircle,
        addMarkers: addMarkers,
        addMarker: addMarker
    };
})();
