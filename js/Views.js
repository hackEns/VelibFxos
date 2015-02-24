"use strict";

/********
 * Views
 ********/

var Views = (function() {
    var viewStruct = {};
    var header = {};
    var body =   {};
    var footer = {};
    var template = '';

	window.mySwiper = new Swiper('.swiper-container', {
		// general settings
		hashNav: false,
		keyboardControl: true,
		calculateHeight: true,
		// pagination settings
		// loop: true,
		pagination: '.pagination',
		paginationClickable: true,
		createPagination: true
	});

    header = (function() {

        header.update = function(viewStruct) {
            $('#app-bar').removeClass().addClass(viewStruct.view);
            $('#app-logo').addClass('hidden');
            $('#app-bar').addClass(viewStruct.view);

            $('#app-bar h1').html(viewStruct.title);
            $('#app-bar menu img').attr('src', 'img/' + viewStruct.img + '.svg');
            console.log('Views', viewStruct.view, 'header updated');
        };

        $('#app-bar a').click(function(e) {
            e.preventDefault();
            goBack();
        });

        var goBack = (function() {
            console.log('Views', viewStruct.view, 'go back');
            window.history.back()
        });

        return header;

    })();

    body = (function() {
        // mainSection is where the action takes place
        var mainSection = document.querySelector('main > section');

        // update the body from the views
        body.update = function(viewStruct) {
            var clone = '';

            body.clean();
            console.log('Views', viewStruct.view, 'body.update');
            $('main').addClass(viewStruct.view);

            if ('content' in document.createElement('template')) {
                switch(viewStruct.view) {
                    case "index":
                        template = document.getElementById('index');
                        var clone = document.importNode(template.content, true);
                        mainSection.appendChild(clone);
                        break;
                    case "starred":
                        template = document.getElementById('starred');
                        clone = document.importNode(template.content, true);
                        mainSection.appendChild(clone);
                        initStarredContent();
                        break;
                    case "station":
                        template = document.getElementById('stationDetail');
                        var stationFormatted = Stations.getFormattedStation(viewStruct.station);

                        var avail_bike = template.content.querySelector('.bikes');
                        var avail_stands = template.content.querySelector('.stands');
                        var distance = template.content.querySelector('.distance');
                        var position = template.content.querySelector('.position');
                        var last_update = template.content.querySelector('.last_update');

                        avail_bike.textContent = stationFormatted.available_bikes;
                        avail_stands.textContent = stationFormatted.available_bike_stands;
                        distance.textContent = stationFormatted.distance;
                        position.textContent = stationFormatted.position;
                        last_update.textContent = stationFormatted.last_update;

                        var clone = document.importNode(template.content, true);
                        mainSection.appendChild(clone);

                        break;
                    case "search":
                        template = document.getElementById('search');
                        var clone = document.importNode(template.content, true);
                        mainSection.appendChild(clone);
                        break;
                }

            } else {
                console.log('Views', 'body', 'template is NOT supported');
                switch (viewStruct.view) {
                    case "index":
                        template = $('#index').html();
                        mainSection.append(template);
                    case "starred":
                        template = $('#starred').html();
                        mainSection.append(template);
                    case "station":
                        template = $('#stationDetail').html();
                        mainSection.append(template);
                    case "search":
                        template = $('#search').html();
                        mainSection.append(template);
                }
            }
        };

        // init the table with starred stations
        var initStarredContent = function() {
            var row = '';
            template = document.getElementById('starred');
            row = template.content.querySelector('tbody tr');

            // delete first template row
            var tbody = document.querySelector('tbody');
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }

            // boucle de test
            for (var i = 1; i <= 5; i++) {
                row.querySelector('td.stations > span').textContent = "My station " + i;
                row.querySelector('td.stations > span.dist').textContent = i;
                row.querySelector('td.bikes').textContent = Math.floor((Math.random() * 10) + i);
                row.querySelector('td.stands').textContent = Math.floor((Math.random() * 10) + i);
                document.querySelector('table.starred tbody').appendChild(document.importNode(row, true));
            }
        };

        body.clean = function() {
            // cleaning the content
            console.log('Views', 'body', 'empty');
            $(mainSection).empty();
        };

        return body;

    })();

    footer = (function() {

        var update = function(data) {

            $("footer").removeClass().addClass(data.view).html('');

            if(data.view == 'search') {
                //
            } else {
                $("footer").html("<input class='" + data.view + "' type='text' " + (data.value !== "" ? "value='" + data.value + "'" : "") + data.prop + "/><a href='#'><img class='" + data.view + "' alt='" + data.alt + "' src='img/" + data.src + "'/></a>");
            }
        };

        var disableFooterDisplay = function() {
            $("footer").addClass("hidden");
        };

        var enableFooterDisplay = function() {
            $("footer").removeClass("hidden");
        };

        return {
            update: update,
            enableFooterDisplay: enableFooterDisplay,
            disableFooterDisplay: disableFooterDisplay
        };

    })();

    var index = function() {
        viewStruct.view = "index";

        Geolocation.noWaitPosition();
        Stations.noWaitList();
        // cleaning header
        $('#app-bar').addClass('hidden');
        $('#app-logo').removeClass('hidden');
        // clean by removing stations swiper
        $('.swiper-wrapper, .pagination').empty().attr('style', '');

        body.clean();
        console.log('Views', "Index", "display page");
        body.update(viewStruct);

        $('.entry.bikes').click(function() {
            window.location.hash = "/bikes";
        });
        $('.entry.stands').click(function() {
            window.location.hash = "/stands";
        });
        $('.entry.starred').click(function() {
            window.location.hash = "/starred";
        });
        $('.entry.search').click(function() {
            window.location.hash = "/search";
        });
    };

    var bikes = function() {
        viewStruct.view = "bikes";
        viewStruct.title = "Vélos disponibles";
        viewStruct.img = "velib";
        viewStruct.src = "plus-pink.svg";
        viewStruct.alt = "plus";
        viewStruct.value = "Informations";
        viewStruct.prop = "readonly";

        Views.footer.update(viewStruct);

        header.update(viewStruct);
        body.update(viewStruct);

        if (Geolocation.waitPosition(bikes) && Stations.waitList(bikes)) {
            var stations = Stations.getClosestStations(Geolocation.getPosition(), 10, function(item) {
                return item.available_bikes > 0;
            });
            console.log(stations);

            // Stations slides creation
            var newSlide = '';
            for (var i = 0; i < stations.length; i++) {
                console.log(stations[i].name);
                newSlide = window.mySwiper.createSlide('<div>Station ' + stations[i].name + '<br>Vélos disponibles ' + stations[i].available_bikes + '</div>');
                newSlide.append();
            }
        }
    };

    var stands = function() {
        viewStruct.view = "stands";
        viewStruct.title = "Places libres";
        viewStruct.img = "borne";
        viewStruct.src = "plus-blue.svg";
        viewStruct.alt = "plus";
        viewStruct.value = "Informations";
        viewStruct.prop = "readonly";

        Views.footer.update(viewStruct);

        console.log('Views', viewStruct.view, "display page");
        header.update(viewStruct);

        if (Geolocation.waitPosition(stands) && Stations.waitList(stands)) {
            console.log(Stations.getClosestStations(Geolocation.getPosition(), 10, function(item) {
                return item.available_bike_stands > 0;
            }));
            $('.station-info').html('');
        }
    };

    var starred = function() {
        viewStruct.view = "starred";
        viewStruct.title = "Favoris";
        viewStruct.img = "favori";
        viewStruct.src = "plus-violet.svg";
        viewStruct.alt = "plus";
        viewStruct.value = "Ajouter";
        viewStruct.prop = "readonly";

        Views.footer.update(viewStruct);

        console.log('Views', viewStruct.view, "display page");
        header.update(viewStruct);
        body.update(viewStruct);

        $("tbody tr td").click(function() {
            window.location.hash = "/station";
        });

        Geolocation.noWaitPosition();
        if (Stations.waitList(starred)) {
            console.log(Stations.getClosestStations(Geolocation.getPosition(), 10, function(item) {
                return item.starred > 0;
            }));
            $('.station-info').html('');
        }
    };

    var station = function() {
        var pathArray = window.location.hash.split('/');
        var station_id = pathArray[pathArray.length-1];

        if (Geolocation.waitPosition(station) && Stations.waitList(station)) {
            // Allow to get distance between station and current position
            var stations = Stations.getClosestStations(Geolocation.getPosition());

            viewStruct.station = Stations.getStationDetails(station_id)[0];

            var station_exist = $.grep(stations, function(v) {
                return v.number == station_id;
            });

            // If station doesn't exist : redirection
            if (station_exist.length == 0) {
                alert("La station n'existe pas !");
                console.log("Views.js", "station", "station doesn't exist", station_exist.length);
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
                header.update(viewStruct);
                body.update(viewStruct);
                footer.update(viewStruct);
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
        header.update(viewStruct);
        body.update(viewStruct);
        footer.update(viewStruct);

        if(Geolocation.waitPosition(search)) {
            var pos = Geolocation.getPosition();
            Map.init(pos);
            Map.addMarkers(pos);
        }

        $('.station-info, .info').addClass('hidden');

    };

    return {
        index: index,
        bikes: bikes,
        stands: stands,
        starred: starred,
        station: station,
        search: search,
        footer: footer
    };

})();
