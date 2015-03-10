"use strict";

/********
 * Views
 ********/

var Views = (function() {
    var currentView = '';
    var body = {};
    var template = '';
    var defaultMainClass = '';


    var swiper = {};
    var templates = {}
    var mainSection = '';

    var stationStorage = null;


    var init = function() {
        stationStorage = StationStorageAdapter();
        stationStorage.load(noop); /* tmp */

        swiper = new Swiper('.swiper-container', {
            // general settings
            hashNav: false,
            keyboardControl: true,
            calculateHeight: true,
            // pagination settings
            //loop: true,
            pagination: '.pagination',
            paginationClickable: true,
            createPagination: true,
            onSlideChangeStart: function(e){
                body.update(viewStruct);
                RoadMap.initCircle(Geolocation.getPosition());
                var stationDetail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2);

                var activeStation = stationStorage.getStationById(stationDetail[1]); // get details from the active slide
                RoadMap.addMarker(Geolocation.getPosition(), activeStation, viewStruct.view);
            }
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


    body = (function() {
        // update the body from the views
        body.update = function(viewStruct) {
            body.clean();
            console.log('Views', currentView, 'body.update');
            mainSection.className = currentView;

            template = templates[currentView];

            if ('content' in document.createElement('template')) {
                mainSection.appendChild(document.importNode(template.content, true));
            } else {
                console.log('Views', 'body', 'template is NOT supported');
                template = $(template).html();
                mainSection.append(template);
            }
        };

        body.clean = function() {
            // cleaning the content
            console.log('Views', 'body', 'empty');
            $(mainSection).empty();
        };

        return body;

    })();


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

        Geolocation.waitPosition(function() {
            var coords = Geolocation.getPosition();

            var stations = Stations.filterClosestStations(
                stationStorage.getStations(),
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

            var stationDetail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2); // ugly…
            var activeStation = stationStorage.getStationById(stationDetail[1], coords); // get details for the active slide
            RoadMap.addMarker(Geolocation.getPosition(), activeStation, viewStruct.view);
        });
    };

    var stands = function() {
        currentView = "stands";

        console.log('Views', currentView, "display page");
        body.update();

        Geolocation.waitPosition(function() {
            var coords = Geolocation.getPosition();

            var stations = Stations.filterClosestStations(
                stationStorage.getStations(),
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

            var stationDetail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2);
            var activeStation = stationStorage.getStationById(stationDetail[1], coords); // get details for the active slide
            RoadMap.addMarker(Geolocation.getPosition(), activeStation, viewStruct.view);
        });
    };

    var starred = function() {
        currentView = "starred";
        console.log('Views', currentView, "display page");
        body.update();
        
        var starredList = document.getElementById('starred-list');
        $(starredList).empty();

        Geolocation.waitPosition(function() {
            var currentPosition = Geolocation.getPosition();
            var starredStations = stationStorage.getStarredStations();
            console.log('IDE', starredStations);

            $.each(starredStations, function(id, station) {
                station = Stations.format(station, currentPosition);

                // Construction du DOM
                var row = templates['starredItem'];
                row.id = station.number;
                row.querySelector('a').href += station.number
                row.querySelector('.name').textContent = station.address;
                row.querySelector('.dist').textContent = station.distance;
                row.querySelector('.bikes').textContent = station.availableBikes;
                row.querySelector('.stands').textContent = station.availableStands;
                starredList.appendChild(document.importNode(row, true));
            });
        });
    };

    var station = function() {
        var stationId = window.location.hash.substr(10); // hash = #/station/{stationId}
        console.log("stationId : " + stationId);

        Geolocation.waitPosition(function() {
            var coords = Geolocation.getPosition();
            // Allow to get distance between station and current position
            var stations = Stations.filterClosestStations(
                stationStorage.getStations(),
                coords
            );
            
            var station = stationStorage.getStationById(stationId)[0];
            var stationExist = $.grep(stations, function(v) {
                return v.number == stationId;
            });

            // If station doesn't exist : redirection
            if (stationExist.length == 0) {
                alert("La station n'existe pas !");
                console.log("Views.js", "station", "station doesn't exist", stationExist.length);
                window.location.hash = "/index";
            } else {
                currentView = "station";

                console.log('Views', viewStruct.view, "display page");
                var stationFormatted = Stations.getFormattedStation(station, coords);
                
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
            }
        });
    };

    var search = function() {
        currentView = "search";
        
        console.log('Views', currentView, "display page");
        body.update();

        RoadMap.init(stationStorage);
        RoadMap.addMarkers();

        Geolocation.waitPosition(function() {
            var pos = Geolocation.getPosition();
            RoadMap.addMarkerPosition(pos);
        });

        $('.station-info, .info').addClass('hidden');

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
