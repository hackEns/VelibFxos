

// Returns difference between today and an another date
function dateDiff(date1){
    var diff = {}
    var today = new Date().getTime();
    var tmp = today - date1;

    tmp = Math.floor(tmp/1000);
    diff.sec = tmp % 60;

    tmp = Math.floor((tmp-diff.sec)/60);
    diff.min = tmp % 60;

    tmp = Math.floor((tmp-diff.min)/60);
    diff.hour = tmp % 24;

    tmp = Math.floor((tmp-diff.hour)/24);
    diff.day = tmp;

    //console.log('utils.js', 'dateDiff', diff);
    return diff;
}


/**
 * Converts an angle from degrees to rads
 * @param angle in degrees
 * @return angle in radians
 */
var deg2rad = function(angle) {
    return angle * Math.PI / 180;
};

/**
 * Computes the distance between two points identified by latitude / longitude
 * @param coords1 Position object with fields `latitude` and `longitude`
 * @param coords2 idem
 * @return distance between them on earth surface (following earth curve)
 */
var distance = function(coords1, coords2) {
    if (coords1 === null || coords2 === null) {
        return NaN;
    }
    var latitude1 = deg2rad(coords1.latitude);
    var longitude1 = deg2rad(coords1.longitude);
    var latitude2 = deg2rad(coords2.latitude);
    var longitude2 = deg2rad(coords2.longitude);
    var a = Math.pow(Math.sin(latitude2 - latitude1) / 2, 2) + Math.cos(latitude1) * Math.cos(latitude2) * Math.pow(Math.sin(longitude2 - longitude1) / 2, 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var R = 6371000;
    var distance = R * c;
    return distance;
};

/**
 * Pretty format durations.
 * @param diff the duration to format, in DateDiff format.
 */
var formatTime = function(diff) {
    var text = "";

    if (diff.day >= 1) {
        text = diff.day + " " + document.webL10n.get("days", { n: diff.day});
    } else if (diff.hour > 1) {
        text = diff.hour + " " + document.webL10n.get("hours", { n: diff.hour});
    } else if (diff.min > 1) {
        text = diff.min + " " + document.webL10n.get("minutes", { n: diff.min});
    } else if (diff.sec > 1) {
        text = diff.sec + " " + document.webL10n.get("seconds", { n: diff.sec});
    } else {
        text = document.webL10n.get("moment_ago");
    }

    return text;
};

/**
 * Pretty format distances. Use kilometers or meters depending on the distance.
 * @param dist the distance to format.
 */
var formatDistance = function(dist) {
    var kmDistance = (dist / 1000.0).toFixed(2);
    if (kmDistance > 1) {
        return kmDistance + " km";
    } else {
        return Math.floor(kmDistance * 1000.0) + " m";
    }
};
