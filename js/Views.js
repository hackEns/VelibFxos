"use strict";

/********
 * Views
 ********/

var Views = (function() {
    var currentView = '';
    var body = {};
    var template = '';
    var defaultMainClass = '';


    var swiper = null;
    var templates = {};
    var mainSection = '';

    var stationStorage = null;


    var init = function() {
        stationStorage = StationStorageAdapter();
        stationStorage.load()
        .then(function() { // on success
            Log.info("StationStorage loaded successfully");
        })
        .catch(function(err) { // on error
            Log.error("Unable to load station storage: " + err);
        });

        templates['index'] = document.getElementById('index');
        templates['bikes'] = document.getElementById('bikes');
        templates['stands'] = document.getElementById('stands');
        templates['starred'] = document.getElementById('starred');
        templates['station'] = document.getElementById('station');
        templates['search'] = document.getElementById('search');
        templates['starredItem'] = document.getElementById('starred-item');

        mainSection = document.querySelector('main');
    };

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
          onSlideChangeStart: function(e){
              body.update(viewStruct);
              RoadMap.initCircle(Geolocation.getPosition());
              var stationDetail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2);

              var activeStation = Stations.getStationDetails(stationDetail[1]); // get details from the active slide
              RoadMap.addMarker(Geolocation.getPosition(), activeStation, viewStruct.view);
          }
      });
    }


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


    var index = function() {
        currentView = "index";
        body.update();

        // clean by removing stations swiper
        $('.swiper-wrapper, .pagination').empty().attr('style', '');

        console.log('Views', "Index", "display page");

    };

    var bikes = function() {
        currentView = "bikes";
        body.update();

        initSwiper();

        Geolocation.waitPosition(function() {
            var coords = Geolocation.getPosition();

            stationStorage.getStations()
            .then(function(allStations) {
                var stations = Stations.filterClosestStations(
                    allStations,
                    coords,
                    10,
                    function(item) { return item.availableBikes > 0; }
                );

                // Stations slides creation
                var newSlide = '';
                for (var i = 0; i < stations.length; i++) {
                    console.log(stations[i].name);
                    newSlide = swiper.createSlide('<div>Station ' + stations[i].name + '<br>Vélos disponibles ' + stations[i].availableBikes + '</div>');
                    newSlide.append();
                }
                RoadMap.initCircle(Geolocation.getPosition());

                $('.swiper-slide:first').addClass("swiper-slide-active");

                var stationDetail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2); // ugly…

                stationStorage.getStationById(stationDetail[1])
                .then(function(activeStation) {
                    RoadMap.addMarker(Geolocation.getPosition(), activeStation, currentView);
                });
            });
        });
    };

    var stands = function() {
        currentView = "stands";

        console.log('Views', currentView, "display page");
        body.update();
        initSwiper();

        Geolocation.waitPosition(function() {
            var coords = Geolocation.getPosition();

            stationStorage.getStations()
            .then(function(allStations) {
                var stations = Stations.filterClosestStations(
                    allStations,
                    coords,
                    10,
                    function(item) { return item.availableStands > 0; }
                );

                // Stations slides creation
                var newSlide = '';
                for (var i = 0; i < stations.length; i++) {
                    console.log(stations[i].name);
                    newSlide = swiper.createSlide('<div>Station ' + stations[i].name + '<br>Bornes disponibles ' + stations[i].availableBikes + '</div>');
                    newSlide.append();
                }
                RoadMap.initCircle(Geolocation.getPosition());

                $('.swiper-slide:first').addClass("swiper-slide-active");

                var stationDetail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2);
                stationStorage.getStationById(stationDetail[1])
                .then(function(activeStation) {
                    RoadMap.addMarker(Geolocation.getPosition(), activeStation, currentView);
                });
            });
        });
    };

    var starred = function() {
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

    var station = function() {
        var stationId = window.location.hash.substr(10); // hash = #/station/{stationId}
        Log.debug("stationId : " + stationId);

        stationStorage.getStationById(stationId)
        .then(function(station) {
            currentView = 'station';

            Log.debug('Views', 'station', 'display page');
            Geolocation.waitPosition(function() {
                var coords = Geolocation.getPosition();
                
                var stationFormatted = Stations.format(station, coords);

                var availableBikes = templates['station'].content.querySelector('.bikes');
                var availableStands = templates['station'].content.querySelector('.stands');
                var distance = templates['station'].content.querySelector('.distance');
                var position = templates['station'].content.querySelector('.position');
                var lastUpdate = templates['station'].content.querySelector('.last_update');

                availableBikes.textContent = stationFormatted.availableBikes;
                availableStands.textContent = stationFormatted.availableStands;
                distance.textContent = stationFormatted.distance;
                position.textContent = stationFormatted.position;
                lastUpdate.textContent = stationFormatted.lastUpdate;

                body.update();

            });
        })
        .catch(function(err) {
            alert("La station n'existe pas !");
            Log.error("Views, station, station doesn't exist " + stationId);
            window.location.hash = "/index";
        });
    };

    /**
     * This is the "Search" view.
     * It displays a map that allows users to looking for a station in the Parisian neighborhoods.
     */
    var search = function() {
        currentView = "search";
        stationStorage = StationStorageAdapter();

        console.log('Views', currentView, "display page");
        body.update();

        stationStorage.getStations()
        .then(function(stations) {
            RoadMap.init();
            RoadMap.addMarkers(stations);

            // SetPositionMarker after roadMap initiated
            Geolocation.watchPosition(function() {
                // when Geolocation is ready
                var pos = Geolocation.getPosition();
                RoadMap.setPositionMarker(pos);
            });

        });
    };

    return {
        init: init,
        index: index,
        bikes: bikes,
        stands: stands,
        starred: starred,
        station: station,
        search: search
    };

})();
