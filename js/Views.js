"use strict";

/********
 * Views
 ********/

var Views = (function() {
    var viewStruct = {};
    var header = {};
    var body =   {};
    var footer = {};

    header = (function() {

        header.update = function(viewStruct) {
            $('#app-bar').removeClass().addClass(viewStruct.view);
            $('#app-logo').addClass('hidden');
            $('#app-bar').addClass(viewStruct.view);

            $('#app-bar h1').html(viewStruct.title);
            $('#app-bar menu img').attr('src', 'img/' + viewStruct.img + '.svg');
            console.log('App', viewStruct.view, 'header updated');
        };

        return header;

    })();

    body = (function() {
        // update the body from the views
        body.update = function(viewStruct) {
            console.log('App', viewStruct.view, 'body update');
            $('main').addClass(viewStruct.view);
            if (viewStruct.view == "starred") {
                initStarredTable();
            } else if (viewStruct.view == "station") {
                initStationTable();
            }
        };

        // init Starred table
        var initStarredTable = function() {
            var imgStand = '<img class="entry--logo" alt="" src="img/borne-blue.svg" />';
            var imgBike = '<img class="entry--logo" alt="" src="img/velib-pink.svg" />';

            console.log('App', 'Starred table', 'display starred table');
            $('main.starred > section').prepend('<table class="starred"><thead></thead><tbody></tbody></table>');
            $('main.starred thead').append('<tr><td>Station</td>' + '<td class="center">' + imgBike + '</td>' + '<td class="center">' + imgStand + '</td></tr>');

            // boucle de test
            for (var i = 0; i < 5; i++) {
                $('tbody').append('<tr>' + '<td class="stations"><span class="uppercase">Station ' + i + '</span><br><span class="dist">' + i + '0m</span></td>' + '<td class="bikes">' + i + '</td>' + '<td class="stands">' + i + '</td>' + '</tr>');

            }

            $("tbody tr").click(function() {
                window.location.hash = "/station";
            });
        };

        var initStationTable = function() {
            var imgVPlus = '<img class="entry--logo" alt="" src="img/plus-dark-blue.svg" />';

            // Test code
            $('main.station > section').prepend('<table class="station"><tbody></tbody></table>');
            $('main.station tbody').append('<tr><td><p class="uppercase title">Vélos disponibles</p></td><td><p class="uppercase title">Places Libres</p></td></tr>');
            $('main.station tbody').append('<tr><td><p class="bikes">' + '2' + '</span></td><td><p class="stands">' + '5' + '</p></td></tr>');
            $('main.station tbody').append('<tr><td><p class="uppercase title">Station V+</p></td><td><p class="uppercase title">Distance</p></td></tr>');
            $('main.station tbody').append('<tr><td>' + imgVPlus + '</td><td>' + '2 km' + '</td></tr>');
            $('main.station tbody').append('<tr><td><p class="uppercase title">Position</p></td><td><p class="uppercase title">Mise à jour</p></td></tr>');
            $('main.station tbody').append('<tr><td>' + 'XX.XX' + '</td><td>Il y a ' + ' 2 min' + '</td></tr>');
        };

        body.clean = function() {
            // cleaning the content
            $('main > section').empty();
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
        console.log('App', "Index", "display page");

        $('.station-info').html('' +
            '<div class="entry bikes"><span>vélos<br/>disponibles</span><img class="entry--logo" alt="" src="img/velib.svg" /></div>' +
            '<div class="entry stands"><span>places<br/>libres</span><img class="entry--logo" alt="" src="img/borne.svg" /></div>' +
            '<div class="entry starred"><span>Favoris</span><img class="entry--logo" alt="" src="img/favori.svg" /></div>' +
            '<div class="entry search"><span>Rechercher</span><img class="entry--logo" alt="" src="img/loupe.svg" /></div>');

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

        console.log('App', viewStruct.view, "display page");
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

        Views.footer.update(viewStruct);

        console.log('App', viewStruct.view, "display page");
        header.update(viewStruct);
        body.clean();
        body.update(viewStruct);

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

        console.log('App', viewStruct.view, "display page");
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

        console.log('App', viewStruct.view, "display page");
        header.update(viewStruct);
        body.clean();

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
