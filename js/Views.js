"use strict";

/********
 * Views
 ********/

var Views = (function() {
    var api = {};

    var currentView = '';
    var body = {};
    var defaultMainClass = '';

    var swiper = null;
    var templates = {};
    var mainSection = '';

    var stationStorage = null;


    /**
     * Initialize view system
     */
    api.init = function() {
        stationStorage = StationStorage();
        stationStorage.start();

        // Main templates
        templates['index'] = document.getElementById('index');
        templates['bikes'] = document.getElementById('bikes');
        templates['stands'] = document.getElementById('stands');
        templates['starred'] = document.getElementById('starred');
        templates['station'] = document.getElementById('station');
        templates['search'] = document.getElementById('search');

        // Sub-template (items to be repeated)
        templates['starredItem'] = document.getElementById('starred-item');
        templates['stationTile'] = document.getElementById('station-tile');

        mainSection = document.querySelector('main');
    };


    /**
     * Get a localized copy of a template (private method)
     */
    var getLocalizedTemplate = function(currentView) {
        var tpl = templates[currentView].content.cloneNode(true);
        document.webL10n.translate(tpl);
        return tpl;
    };


    /**
     * Initialize swiper (private method)
     */
    var initSwiper = function() {
      swiper = new Swiper('.swiper-container', {
          // general settings
          hashNav: false,
          keyboardControl: true,
          calculateHeight: true,
          // pagination settings
          loop: true,
          pagination: '.pagination',
          paginationClickable: true,
          createPagination: true,
          onSlideChangeStart: function(swiper){
              // TODO: Remove commented-out code
              //body.update();
              //RoadMap.initCircle(Geolocation.getPosition());
              var stationId = $(swiper.activeSlide()).find('.station').attr('id').substr("station-".length);
              Log.debug(stationId);

              //var activeStation = Stations.getStationDetails(stationId); // get details from the active slide
              //RoadMap.addMarker(Geolocation.getPosition(), activeStation, currentView);
          }
      });
    };


    // TODO: clear that
    body = {
        // update the body from the views
        update: function() {
            body.clean();
            Log.info('Refresh view: ' + currentView);

            mainSection.className = currentView;

            if ('content' in document.createElement('template')) {
                var template = getLocalizedTemplate(currentView);
                mainSection.appendChild(document.importNode(template, true));
            } else {
                Log.warning('template is NOT supported');
                var template = $(templates[currentView]).html();
                mainSection.innerHTML = mainSection.innerHTML + template;
                // Translation should be done explicitly
                document.webL10n.translate(mainSection);
            }
        },

        clean: function() {
            // cleaning the content
            Log.debug("Cleaning view");
            $(mainSection).empty();
            // Reset geolocation callbacks
            Geolocation.off('position');
        }
    };


    /**
     * Enable index view
     * The index is a menu listing other main views
     */
    api.index = function() {
        currentView = "index";
        body.update();

        // clean by removing stations swiper
        $('.swiper-wrapper, .pagination').empty().attr('style', '');

        console.log('Views', "Index", "display page");

    };


    /**
     * Enable bikes view
     * Show a set of stations with bikes available around the current position
     */
    api.bikes = function() {
        currentView = "bikes";
        body.update();

        Geolocation.waitPosition(function() {
            var currentPosition = Geolocation.getPosition();

            var stations = [];
            var first = true;

            stationStorage.on('stations', function(newStations) {
                Log.debug("fill view");

                // Refilter with new stations
                stations = Stations.filterClosestStations(
                    stations.concat(newStations),
                    currentPosition,
                    10,
                    function(item) { return item.availableBikes > 0; }
                );

                // TODO: edit tiles instead of rebuilding from scratch
                var stationsList = document.getElementById('stations-list');
                $(stationsList).empty();

                stations.forEach(function(station) {
                    var fstation = Stations.format(station, currentPosition);

                    // Construction du DOM
                    var tile = getLocalizedTemplate('stationTile');
                    tile.querySelector('.station').id = "station-" + station.number;
                    //tile.querySelector('.link').href += fstation.number;
                    tile.querySelector('.name').textContent = fstation.address;
                    tile.querySelector('.bikes').textContent = fstation.availableBikes;
                    tile.querySelector('.dist').textContent = fstation.distance;
                    tile.querySelector('.legend').innerHTML = document.webL10n.get('available_bikes.innerHTML', { "n": fstation.availableBikes});

                    // Activate first slide
                    if (first) {
                        tile.querySelector('.swiper-slide').className += " swiper-slide-active";

                        tile.querySelector('.circle').id = 'map';
                    }

                    stationsList.appendChild(tile);

                    // This requires the tile to be added to the DOM
                    if (first) {
                        RoadMap.initCircle(station.position);
                        //RoadMap.addMarker(Geolocation.getPosition(), station, currentView);
                        first = false;
                    }
                });

                initSwiper();
            });
        });
    };


    // TODO: Factorize bikes and stands commons
    /**
     * Enable stands view
     * Show a set of stations with stands available around the current position
     */
    api.stands = function() {
        currentView = "stands";

        body.update();

        Geolocation.waitPosition(function() {
            var currentPosition = Geolocation.getPosition();

            var stations = [];
            var first = true;

            stationStorage.on('stations', function(newStations) {
                Log.debug("fill view");

                // Refilter with new stations
                stations = Stations.filterClosestStations(
                    stations.concat(newStations),
                    currentPosition,
                    10,
                    function(item) { return item.availableStands > 0; }
                );

                // TODO: edit tiles instead of rebuilding from scratch
                var stationsList = document.getElementById('stations-list');
                $(stationsList).empty();

                stations.forEach(function(station) {
                    var fstation = Stations.format(station, currentPosition);

                    // Construction du DOM
                    var tile = getLocalizedTemplate('stationTile');
                    tile.querySelector('.station').id = "station-" + station.number;
                    //tile.querySelector('.link').href += fstation.number;
                    tile.querySelector('.name').textContent = fstation.address;
                    tile.querySelector('.stands').textContent = fstation.availableStands;
                    tile.querySelector('.dist').textContent = fstation.distance;
                    tile.querySelector('.vplus').style.visibility = fstation.bonus ? 'visible' : 'hidden';
                    tile.querySelector('.legend').innerHTML = document.webL10n.get("free_stands.innerHTML", { n: fstation.availableStands });

                    // Activate first slide
                    if (first) {
                        tile.querySelector('.swiper-slide').className += " swiper-slide-active";

                        tile.querySelector('.circle').id = 'map';
                    }

                    stationsList.appendChild(tile);

                    // This requires the tile to be added to the DOM
                    // TODO: Remove commented-out code
                    //RoadMap.initCircle(station.position);

                    if (first) {
                        //RoadMap.addMarker(Geolocation.getPosition(), station, currentView);
                        first = false;
                    }
                });

                initSwiper();
            });
        });
    };


    /**
     * Enable starred view
     * Show the list of user's starred stations and their availability
     */
    api.starred = function() {
        currentView = "starred";
        console.log('Views', currentView, "display page");
        body.update();

        var starredList = document.getElementById('starred-list');
        $(starredList).empty();

        var currentPosition = null;

        stationStorage.on('starred-stations', function(starredStations) {
            Log.debug('Starred stations', starredStations);
            starredStations.forEach(function(station) {

                // Construction du DOM
                var row = getLocalizedTemplate('starredItem');
                row.querySelector('.starred-station').id = "starred-station-" + station.number;
                starredList.appendChild(row);

                // Update function
                var updateView = function() {
                    currentPosition = Geolocation.getPosition();
                    var fstation = Stations.format(station, currentPosition);

                    var entry = starredList.querySelector("#starred-station-" + station.number);
                    entry.querySelector('.link').href += fstation.number;
                    entry.querySelector('.name').textContent = fstation.address;
                    entry.querySelector('.bikes').textContent = fstation.availableBikes;
                    entry.querySelector('.dist').textContent = fstation.distance;
                    entry.querySelector('.stands').textContent = fstation.availableStands;
                }

                updateView();
                station.on('update', updateView);

                // To be factorized
                Geolocation.waitPosition(function() {
                    station.emit('update');
                });
            });
        });
    };


    /**
     * Enable station view
     * Gives details about a given station
     */
    api.station = function() {
        var stationId = window.location.hash.substr(10);
        Log.debug("stationId : " + stationId);

        stationStorage.getStationById(stationId)
        .then(function(station) {
            currentView = 'station';

            Log.debug('Views', 'station', 'display page');

            var fstation = Stations.format(station);

            var dom = templates['station'].content;
            dom.querySelector('.name').textContent = fstation.address;
            dom.querySelector('.bikes').textContent = fstation.availableBikes;
            dom.querySelector('.stands').textContent = fstation.availableStands;
            if (fstation.bonus) {
                dom.querySelector('.vplus .entry--logo').style.display = "inline";
                dom.querySelector('.vplus .entry--desc').textContent = "";
            } else {
                dom.querySelector('.vplus .entry--logo').style.display = "none";
                dom.querySelector('.vplus .entry--desc').textContent = document.webL10n.get("No");
            }
            dom.querySelector('.distance').textContent = fstation.distance;
            dom.querySelector('.position').textContent = fstation.position;
            dom.querySelector('.last_update').textContent = fstation.lastUpdate;
            dom.querySelector('.link').href = '#/search/id/' + fstation.number;


            body.update();

            Geolocation.waitPosition(function() {
                var currentPosition = Geolocation.getPosition();
                var fstation = Stations.format(station, currentPosition);
                mainSection.querySelector(".distance").textContent = fstation.distance;
            });
        }, function(err) {
            console.log(err);
            alert(document.webL10n.get("Unknown_station"));
            Log.error("Views, station, station doesn't exist " + stationId);
            window.location.hash = "/index";
        });
    };


    /**
     * Enable search view
     * It displays a map that allows users to look for a station in the Parisian neighborhoods.
     */
    api.search = function() {
        currentView = 'search';
        body.update();

        Log.info('Views', 'search', "display page");

        RoadMap.init();

        // SetPositionMarker after roadMap initiated
        Geolocation.on('position', function(pos) {
            RoadMap.setPositionMarker(pos);
        });

        stationStorage.on('stations', function(stations) {
            RoadMap.addAllMarkers(stations);
        });
    };

    return api;

})();
