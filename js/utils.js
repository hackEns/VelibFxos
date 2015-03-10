

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

    console.log('utils.js', 'dateDiff', diff);
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
 * @param coords1 Position object with fields `lat` and `lng`
 * @param coords2 idem
 * @return distance between them on earth surface (following earth curve)
 */
var distance = function(coords1, coords2) {
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

var noop = function(){};
