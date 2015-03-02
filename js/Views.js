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

    header = (function() {

        header.update = function(viewStruct) {
            $('#app-bar').removeClass().addClass(viewStruct.view);
            $('#app-logo').addClass('hidden');
            $('#app-bar').addClass(viewStruct.view);

            $('#app-bar h1').html(viewStruct.title);
            $('#app-bar menu img').attr('src', 'img/' + viewStruct.img + '.svg');
            console.log('Views', viewStruct.view, 'header updated');
        };

        return header;

    })();

    body = (function() {
        var mainSection = document.querySelector('main > section');

        // update the body from the views
        body.update = function(viewStruct) {
            var template = '';
            var clone = '';

            console.log('Views', viewStruct.view, 'body.update');
            $('main').addClass(viewStruct.view);

            if ('content' in document.createElement('template')) {
                console.log('Views', 'body', 'template is supported');

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

                // should be tested on IE
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

            if(Geolocation.waitPosition(initStarredContent))
            {
                var currentPosition = Geolocation.getPosition();
                var starredStations = Stations.getStarredStations(currentPosition);

                console.log("Views", "initStarredContent", starredStations);

                $.each(starredStations, function(id, station) {
                    row.querySelector('td.stations > span').textContent = station.address;
                    //row.querySelector('td.stations > span.dist').textContent = Stations.distance(currentPosition, station);
                    row.querySelector('td.bikes').textContent = station.available_bikes;
                    row.querySelector('td.stands').textContent = station.available_bike_stands;
                    document.querySelector('table.starred tbody').appendChild(document.importNode(row, true));
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

    footer = (function() {

        var update = function(data) {
            $("footer").html("<input class='" + data.view + "' type='text' " + (data.value !== "" ? "value='" + data.value + "'" : "") + data.prop + "/><a href='#'><img class='" + data.view + "' alt='" + data.alt + "' src='img/" + data.src + "'/></a>");
            $("footer").removeClass().addClass(data.view);
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
        body.clean();
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
        body.clean();

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


        console.log('Views', viewStruct.view, "display page");
        header.update(viewStruct);
        body.clean();
        body.update(viewStruct);
        footer.update(viewStruct);

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
        viewStruct.view = "station";
        viewStruct.title = "AVENUE DE L'ELYSEE";
        viewStruct.img = "favori";
        viewStruct.src = "plus-dark-blue.svg";
        viewStruct.alt = "plus";
        viewStruct.value = "Ajouter aux favoris";
        viewStruct.prop = "readonly";

        Views.footer.update(viewStruct);

        console.log('Views', viewStruct.view, "display page");
        header.update(viewStruct);
        body.clean();
        body.update(viewStruct);

        Geolocation.noWaitPosition();
        if (Stations.waitList(search)) {
            $('.station-info').html('');
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

        Views.footer.update(viewStruct);

        console.log('Views', viewStruct.view, "display page");
        header.update(viewStruct);
        body.clean();
        body.update(viewStruct);

        Geolocation.noWaitPosition();
        if (Stations.waitList(search)) {
            $('.station-info').html('');
        }
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
