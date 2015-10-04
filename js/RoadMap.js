"use strict";

/********
 * RoadMap
 ********/

var RoadMap = (function() {
    var api = {};
    var map = null;

    var stations = null;

    // Uniq markers
    var positionMarker = null;
    var researchMarker = null;

    // Change default icon path for Leaflet, as they are stored under the
    // `img/leaflet` folder.
    L.Icon.Default.imagePath = "img/leaflet/";

    /**
     * Init the global map
     */
    api.init = function() {
        Log.info('RoadMap', 'init', 'RoadMap under construction');

        // (Please document overwritten fields of leafletConfig in Config.js)
        var opts = Config.leafletConfig;
        opts.zoomControl = false;

        map = L.map('map', opts).setView(Config.defaultPosition, Config.defaultZoom);

        // search plugin
        Log.info('RoadMap', 'init', 'Search plugin is available');
        var osmGeocoder = new L.Control.OSMGeocoder();
        map.addControl(osmGeocoder);

        L.tileLayer(Config.tileProvider).addTo(map);

        Log.info('RoadMap', 'init', 'RoadMap built');

        return api;
    };


    /**
     * Init map for bikes and stands view
     * @param position where to center the circle view
     */
    api.initCircle = function(position) {
        Log.info('RoadMap', 'init_circl', 'RoadMap under construction');

        // (Please document overwritten fields of leafletConfig in Config.js)
        var opts = Config.leafletConfig;
        opts.zoomControl = true;

        map = L.map('map', opts).setView([position.latitude, position.longitude], 16);

        L.tileLayer(Config.tileProvider).addTo(map);

        Log.info('RoadMap', 'init_circl', 'RoadMap built');

        return api;
    };


    /**
     * Add station markers markers to the Map
     * @param _stations list of all stations to display
     */
    api.addMarkers = function(_stations) {
        Log.info('RoadMap', 'addMarkers');

        stations = _stations;

        var markers = new L.MarkerClusterGroup();

        // build Markers
        stations.forEach(function(station) {
            // Set custom station icon
            var myIcon = L.divIcon({
                className:  'mapIcon',
                html:       '<div class="available-bikes">' + station.availableBikes + '</div>' +
                            '<div class="available-stands">' + station.availableStands + '</div>'
            });

            // Create marker
            var marker = L.marker(
                [station.position.latitude, station.position.longitude],
                {
                    icon: myIcon,
                    clickable: true,
                    draggable: false,
                    title: station.address,
                    alt: station.name,
                    address: station.address,
                    number: station.number
                }
            );

            marker.bindPopup('<a href="#/station/' + station.number + '">' + station.name + '</a>');

            markers.addLayer(marker);
        });

        map.addLayer(markers);

        Log.info('RoadMap', 'addMarkers', 'done');

        return api;
    };


    /**
     * Add or move the position marker
     * @param position where to place the position marker
     */
    api.setPositionMarker = function(position) {
        //Log.info('RoadMap', 'setPositionMarker', position);

        var latlng = [position.latitude, position.longitude];

        if (!positionMarker) {
            positionMarker = L.marker(latlng, {
                clickable: false,
                draggable: false,
                title: "Moi",
                alt: "Vous êtes ici !"
            });
        } else {
            positionMarker.setLatLng(latlng);
        }

        positionMarker.addTo(map);

        var distanceFromCity = distance(
            position,
            {
                "latitude": Config.defaultPosition[0],
                "longitude": Config.defaultPosition[1]
            }
        );
        if (distanceFromCity <= (config.maxDistanceFromCity * 1000)) {
            // Prevent panning if too far from Paris
            map.panTo(latlng);
        }

        return api;
    };


    /**
     * Add or move the researched position marker
     * @param position where to place the research marker
     */
    api.setResearchMarker = function(position) {
        Log.info('RoadMap', 'setResearchMarker', position);

        var latlng = [position.lat, position.lng];

        if(!researchMarker) {
            researchMarker = L.marker(latlng, {
                clickable: false,
                draggable: false,
                title: "Station recherchée",
                alt: "Je veux aller ici"
            });
        } else {
            researchMarker.setLatLng(latlng);
        }

        researchMarker.addTo(map);

        map.panTo(latlng);

        return api;
    };


    /**
     * Add path from position to a station
     * @param position source position
     * @param station destination station
     */
    api.addMarker = function(position, station, view) {

        var startIcon = L.icon({
            iconUrl: 'img/leaflet/map-my-position.svg',
            iconSize: [40, 45]
        });

        // icon is customized according to the view
        if(view == 'bikes') {
            var endIcon = L.icon({
                iconUrl: 'img/leaflet/map-available-bike.svg',
                iconSize: [40, 45]
            });
        } else {
            var endIcon = L.icon({
                iconUrl: 'img/leaflet/map-available-stand.svg',
                iconSize: [40, 45]
            });
        }

        var markers = [];
        var route = L.Routing.control({
            waypoints: [
                L.latLng(pos.latitude, pos.longitude),
                L.latLng(activeStation.position.latitude, activeStation.position.longitude)
            ],
            routeWhileDragging: true,
            fitSelectedRoutes: true,
            useZoomParameter: true,
            autoRoute: true
        }).addTo(map);


        //desable itenary panel
        $(".leaflet-right").hide();

        return true;
    };

    return api;
})();
