"use strict";

/********
 * Views
 ********/

var Views = (function() {
    var viewStruct = {};
    var body = {};
    var template = '';
    var defaultMainClass = '';


    var swiper = {};
    var templates = {}
    var mainSection = '';


    var init = function() {
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

                var activeStation = Stations.getStationDetails(stationDetail[1]); // get details from the active slide
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
            var clone = '';

            body.clean();
            console.log('Views', viewStruct.view, 'body.update');
            mainSection.className = viewStruct.view;

            template = templates[viewStruct.view];

            if ('content' in document.createElement('template')) {
                mainSection.appendChild(document.importNode(template.content, true));
            } else {
                console.log('Views', 'body', 'template is NOT supported');
                template = $(template).html();
                mainSection.append(template);
            }
        };

        // Insert in Station template, details from a specific station
        var completeStationDetails = function(template, station) {
            var availableBikes = template.content.querySelector('.bikes');
            var availableStands = template.content.querySelector('.stands');
            var distance = template.content.querySelector('.distance');
            var position = template.content.querySelector('.position');
            var lastUpdate = template.content.querySelector('.last_update');

            availableBikes.textContent = station.availableBikes;
            availableStands.textContent = station.availableStands;
            distance.textContent = station.distance;
            position.textContent = station.position;
            lastUpdate.textContent = station.lastUpdate;

            return template;
        };

        // init the table with starred stations
        body.initStarredContent = function() {
            var starredList = document.getElementById('starred-list');

            $(starredList).empty();

            if(Geolocation.waitPosition(body.initStarredContent) && Stations.waitList(body.initStarredContent))
            {
                var currentPosition = Geolocation.getPosition();
                var starredStations = Stations.getStarredStations(currentPosition);

                console.log('IDE', starredStations);

                $.each(starredStations, function(id, station) {
                    station = Stations.getFormattedStation(station);

                    // Construction du DOM
                    var row = templates['starredItem'].content.cloneNode(true);
                    row.id = station.number;
                    row.querySelector('a').href += station.number
                    row.querySelector('.name').textContent = station.address;
                    row.querySelector('.dist').textContent = station.distance;
                    row.querySelector('.bikes').textContent = station.availableBikes;
                    row.querySelector('.stands').textContent = station.availableStands;
                    starredList.appendChild(document.importNode(row, true));
                });
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
        viewStruct.view = "index";

        Geolocation.noWaitPosition();
        Stations.noWaitList();
        // clean by removing stations swiper
        $('.swiper-wrapper, .pagination').empty().attr('style', '');

        console.log('Views', "Index", "display page");
        body.update(viewStruct);

    };

    var bikes = function() {
        viewStruct.view = "bikes";
        viewStruct.prop = "readonly";

        body.update(viewStruct);

        if (Geolocation.waitPosition(bikes) && Stations.waitList(bikes)) {
            var stations = Stations.getClosestStations(Geolocation.getPosition(), 10, function(item) {
                return item.availableBikes > 0;
            });
            console.log(stations);

            // Stations slides creation
            var newSlide = '';
            for (var i = 0; i < stations.length; i++) {
                console.log(stations[i].name);
                newSlide = swiper.createSlide('<div>Station ' + stations[i].name + '<br>Vélos disponibles ' + stations[i].availableBikes + '</div>');
                newSlide.append();
            }
            RoadMap.initCircle(Geolocation.getPosition());

            var stationDetail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2);
            var activeStation = Stations.getStationDetails(stationDetail[1]); // get details for the active slide
            RoadMap.addMarker(Geolocation.getPosition(), activeStation, viewStruct.view);
        }
        else {
            console.log('Views', 'bikes', 'Looking for geolocation');
        }
    };

    var stands = function() {
        viewStruct.view = "stands";
        viewStruct.prop = "readonly";

        console.log('Views', viewStruct.view, "display page");
        body.update(viewStruct);

        if (Geolocation.waitPosition(stands) && Stations.waitList(stands)) {
            var stations = Stations.getClosestStations(Geolocation.getPosition(), 10, function(item) {
                return item.availableStands > 0;
            });
            console.log(stations);

            // Stations slides creation
            var newSlide = '';
            for (var i = 0; i < stations.length; i++) {
                console.log(stations[i].name);
                newSlide = swiper.createSlide('<div>Station ' + stations[i].name + '<br>Bornes disponibles ' + stations[i].availableBikes + '</div>');
                newSlide.append();
            }
            RoadMap.initCircle(Geolocation.getPosition());

            var stationDetail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2);
            var activeStation = Stations.getStationDetails(stationDetail[1]); // get details for the active slide
            RoadMap.addMarker(Geolocation.getPosition(), activeStation, viewStruct.view);
        }
        else if (!Geolocation.waitPosition(stands)) {
            console.log('Views', 'stands', 'Looking for geolocation');
        }
    };

    var starred = function() {
        viewStruct.view = "starred";
        viewStruct.prop = "readonly";

        console.log('Views', viewStruct.view, "display page");
        body.update(viewStruct);
        body.initStarredContent();

        Geolocation.noWaitPosition();
        if (Stations.waitList(starred)) {
            console.log(Stations.getClosestStations(Geolocation.getPosition(), 10, function(item) {
                return item.starred > 0;
            }));
            $('.station-info').empty();
        }
    };

    var station = function() {
        var stationId = window.location.hash.substr(10); // hash = #/station/{stationId}
        console.log("stationId : " + stationId);

        if (Geolocation.waitPosition(station) && Stations.waitList(station)) {
            // Allow to get distance between station and current position
            var stations = Stations.getClosestStations(Geolocation.getPosition());

            viewStruct.station = Stations.getStationDetails(stationId)[0];
            console.log("viewStruct.station : "+ viewStruct.station);
            var stationExist = $.grep(stations, function(v) {
                return v.number == stationId;
            });

            // If station doesn't exist : redirection
            if (stationExist.length == 0) {
                alert("La station n'existe pas !");
                console.log("Views.js", "station", "station doesn't exist", stationExist.length);
                window.location.hash = "/index";
            } else {
                viewStruct.view = "station";
                viewStruct.title = viewStruct.station.address;
                viewStruct.img = "favori";
                viewStruct.src = "plus-dark-blue.svg";
                viewStruct.alt = "plus";
                viewStruct.value = "Ajouter aux favoris";
                viewStruct.prop = "readonly";

                console.log('Views', viewStruct.view, "display page");
                var stationFormatted = Stations.getFormattedStation(viewStruct.station);
                templates['station'] = completeStationDetails(templates['station'], stationFormatted);
                body.update(viewStruct);

                var stationId = parseInt(window.location.hash.substr(2).split("/")[1]);

                $(".vplus").click(function() {
                    var returnedStation = Stations.toggleStarStation(stationId);s
                });
            }
        }
    };

    var search = function() {
        viewStruct.view = "search";
        viewStruct.title = "Rechercher";
        viewStruct.img = "loupe";
        viewStruct.src = "search-yellow.svg";
        viewStruct.alt = "loupe";
        viewStruct.value = "";
        viewStruct.prop = "placeHolder='Rechercher'";

        console.log('Views', viewStruct.view, "display page");
        body.update(viewStruct);

        RoadMap.init();
        RoadMap.addMarkers();

        if(Geolocation.waitPosition(search)) {
            var pos = Geolocation.getPosition();
            RoadMap.addMarkerPosition(pos);
        }

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
