"use strict";

/********
 * Views
 ********/

var Views = (function() {
    var api = {};

    var currentView = '';
    var body = {};
    var template = '';
    var defaultMainClass = '';


    var swiper = null;
    var templates = {};
    var mainSection = '';

    var stationStorage = null;


    /**
     * Initialize view system
     */
    api.init = function() {
        stationStorage = StationStorageAdapter();
        stationStorage.load()
        .then(function() { // on success
            Log.info("StationStorage loaded successfully");
        });

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
              //body.update();
              //RoadMap.initCircle(Geolocation.getPosition());
              var stationId = $(swiper.activeSlide()).find('.station').attr('id').substr("station-".length);
              Log.debug(stationId);

              //var activeStation = Stations.getStationDetails(stationId); // get details from the active slide
              //RoadMap.addMarker(Geolocation.getPosition(), activeStation, currentView);
          }
      });
    }


    // TODO: clear that
    body = {
        // update the body from the views
        update: function() {
            body.clean();
            Log.info('Refresh view: ' + currentView);

            mainSection.className = currentView;

            template = templates[currentView];

            if ('content' in document.createElement('template')) {
                mainSection.appendChild(document.importNode(template.content.cloneNode(true), true));
            } else {
                Log.warning('template is NOT supported');
                template = $(template).html();
                mainSection.append(template);
            }
        },

        clean: function() {
            // cleaning the content
            Log.debug("Cleaning view");
            $(mainSection).empty();
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

            stationStorage.getStations()
            .then(function(allStations) {
                Log.debug("fill view");

                var stations = Stations.filterClosestStations(
                    allStations,
                    currentPosition,
                    10,
                    function(item) { return item.availableBikes > 0; }
                );

                var stationsList = document.getElementById('stations-list');
                $(stationsList).empty();

                var first = true;

                stations.forEach(function(station){
                    var fstation = Stations.format(station, currentPosition);

                    // Construction du DOM
                    var tile = templates['stationTile'].content.cloneNode(true);
                    tile.querySelector('.station').id = "station-" + station.number;
                    //tile.querySelector('.link').href += fstation.number;
                    tile.querySelector('.name').textContent = fstation.address;
                    tile.querySelector('.bikes').textContent = fstation.availableBikes;
                    tile.querySelector('.dist').textContent = fstation.distance;
                    if (fstation.availableBikes > 1) {
                        tile.querySelector('.legend').innerHTML = 'vélos<br/>disponibles';
                    } else {
                        tile.querySelector('.legend').innerHTML = 'vélo<br/>disponible';
                    }

                    // Activate first slide
                    if (first) {
                        tile.querySelector('.swiper-slide').className += " swiper-slide-active";

                        tile.querySelector('.circle').id = 'map';
                    }

                    stationsList.appendChild(tile);

                    // This requires the tile to be added to the DOM
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

            stationStorage.getStations()
            .then(function(allStations) {
                Log.debug("fill view");

                var stations = Stations.filterClosestStations(
                    allStations,
                    currentPosition,
                    10,
                    function(item) { return item.availableBikes > 0; }
                );

                var stationsList = document.getElementById('stations-list');
                $(stationsList).empty();

                var first = true;

                stations.forEach(function(station){
                    var fstation = Stations.format(station, currentPosition);

                    // Construction du DOM
                    var tile = templates['stationTile'].content.cloneNode(true);
                    tile.querySelector('.station').id = "station-" + station.number;
                    //tile.querySelector('.link').href += fstation.number;
                    tile.querySelector('.name').textContent = fstation.address;
                    tile.querySelector('.stands').textContent = fstation.availableStands;
                    tile.querySelector('.dist').textContent = fstation.distance;
                    tile.querySelector('.vplus').style.visibility = fstation.bonus ? 'visible' : 'hidden';
                    if (fstation.availableStands > 1) {
                        tile.querySelector('.legend').innerHTML = 'places<br/>libres';
                    } else {
                        tile.querySelector('.legend').innerHTML = 'place<br/>libre';
                    }

                    // Activate first slide
                    if (first) {
                        tile.querySelector('.swiper-slide').className += " swiper-slide-active";

                        tile.querySelector('.circle').id = 'map';
                    }

                    stationsList.appendChild(tile);

                    // This requires the tile to be added to the DOM
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

        stationStorage.getStarredStations()
        .then(function(starredStations) {
            Log.debug('Starred stations', starredStations);
            starredStations.forEach(function(station) {
                var fstation = Stations.format(station, currentPosition);

                // Construction du DOM
                var row = templates['starredItem'].content.cloneNode(true);
                row.querySelector('.starred-station').id = "starred-station-" + station.number;
                row.querySelector('.link').href += fstation.number;
                row.querySelector('.name').textContent = fstation.address;
                row.querySelector('.bikes').textContent = fstation.availableBikes;
                row.querySelector('.dist').textContent = 'Chargement…';
                row.querySelector('.stands').textContent = fstation.availableStands;
                starredList.appendChild(row);

                Geolocation.waitPosition(function() {
                    currentPosition = Geolocation.getPosition();
                    fstation = Stations.format(station, currentPosition);
                    Log.debug(starredList)
                    Log.debug(station.number);
                    starredList.querySelector("#starred-station-" + station.number + " .dist").textContent = fstation.distance;
                });
            });
        });
    };


    /**
     * Enable station view
     * Gives details about a given station
     */
    api.station = function() {
        var stationId = window.location.hash.substr(10); // hash = #/station/{stationId}
        Log.debug("stationId : " + stationId);

        stationStorage.getStationById(stationId)
        .then(function(station) {
            currentView = 'station';

            Log.debug('Views', 'station', 'display page');

            var fstation = Stations.format(station);

            var dom = templates['station'].content
            dom.querySelector('.name').textContent = fstation.address;
            dom.querySelector('.bikes').textContent = fstation.availableBikes;
            dom.querySelector('.stands').textContent = fstation.availableStands;
            if (fstation.bonus) {
                dom.querySelector('.vplus .entry--logo').style.display = "inline";
                dom.querySelector('.vplus .entry--desc').textContent = "";
            } else {
                dom.querySelector('.vplus .entry--logo').style.display = "none";
                dom.querySelector('.vplus .entry--desc').textContent = "Non";
            }
            dom.querySelector('.distance').textContent = fstation.distance;
            dom.querySelector('.position').textContent = fstation.position;
            dom.querySelector('.last_update').textContent = fstation.lastUpdate;
            dom.querySelector('.link').href = '#/search/id/' + fstation.number;


            body.update();

            Geolocation.waitPosition(function() {
                var currentPosition = Geolocation.getPosition();
                var fstation = Stations.format(station, currentPosition);
                mainSection.querySelector(" .distance").textContent = fstation.distance;
            });
        })
        .catch(function(err) {
            console.log(err);
            alert("La station n'existe pas !");
            Log.error("Views, station, station doesn't exist " + stationId);
            window.location.hash = "/index";
        });
    };


    /**
     * Enable search view
     * It displays a map that allows users to looking for a station in the Parisian neighborhoods.
     */
    api.search = function() {
        currentView = 'search';
        body.update();

        Log.info('Views', 'search', "display page");

        RoadMap.init();

        stationStorage.getStations()
        .then(function(stations) {
            RoadMap.addMarkers(stations);

            // SetPositionMarker after roadMap initiated
            Geolocation.watchPosition(function() {
                var pos = Geolocation.getPosition();
                RoadMap.setPositionMarker(pos);
            });

        });
    };

    return api;

})();
