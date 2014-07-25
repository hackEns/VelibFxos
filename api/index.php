<?php
if (empty($_GET['do'])) {
	http_response_code(400);
	exit('No action specified.');
}

if(!is_file('data/data')) {
    $data = array();
}
else {
    $data = unserialize(gzinflate(base64_decode(file_get_contents('data'))));
}


/**
 * Update the list of stations
 */
function update_stations() {
    $stations_xml = simplexml_load_file('http://www.velib.paris.fr/service/carto');

    $data['stations'] = array();
    foreach($stations_xml->markers->marker as $station)
    {
        $data['stations'][(int) $station['number']] = array(
            'name' => htmlentities((string) $station['name']),
            'address' => htmlentities((string) $station['fullAddress']),
            'lat' => (float) $station['lat'],
            'lng' => (float) $station['lng'],
            'open' => (int) $station['open'],
            'bonus' => (int) $station['bonus'],
            'free' => 0,
            'available' => 0,
            'updated' => 0,
            'last_check' => 0
        );
    }
    $data['last_stations_udpate'] = time();

    file_put_contents('data', base64_encode(gzdeflate(serialize($data))));
}


/**
 * Refresh the status of a single station
 */
function refresh_station($id) {
    if(time() - $data['stations'][$id]['last_check'] > 300) {
        $station_xml = simplexml_load_file('http://www.velib.paris.fr/service/stationdetails/paris/'.$id);

        $data['stations'][$id]['available'] = (int) $station_xml->available;
        $data['stations'][$id]['free'] = (int) $station_xml->free;
        $data['stations'][$id]['open'] = (int) $station_xml->open;
        $data['stations'][$id]['last_check'] = time();
        file_put_contents('data', base64_encode(gzdeflate(serialize($data))));
    }
}


/**
 * Convert latitude and longitude to degrees (useful for calculation)
 */
function lat_lng_to_dist($lat1, $lng1, $lat2, $lng2) {
		$latitude1 = deg2rad((float) $lat1);
		$longitude1 = deg2rad((float) $lng1);
		$latitude2 = deg2rad((float) $lat2);
		$longitude2 = deg2rad((float) $lng2);

		$a = pow(sin($latitude2 - $latitude1)/2, 2) + cos($latitude1)*cos($latitude2)*pow(sin($longitude2 - $longitude1)/2, 2);
		$c = 2*atan2(sqrt($a),sqrt(1-$a));
		$R = 6371000;
		$distance = $R*$c;
}

if (empty($data['stations']) || time() - $data['last_stations_update'] > 86400) {
    update_stations();
}

switch($_GET['do']) {
    case 'getClosestBikes':
    case 'getClosestParks':
        if (empty($_GET['lat']) || empty($_GET['lng'])) {
            http_response_code(400);
            exit('No action specified.');
        }
        if(!empty($_GET['n'])) {
            $n = (int) $_GET['n'];
        }
        else {
            $n = 10;
        }
        $distances = array();
        foreach($data['stations'] as $id=>$station) {
            $distances[$id] = lat_lng_to_dist($_GET['lat'], $_GET['lng'], $station['lat'], $station['lng']);
        }
        asort($distances);
        $return = array();
        $i = 0;
        foreach($distances as $id=>$distance) {
            refresh_station($id);
            if(($data['stations'][$id]['available'] > 0 && $_GET['do'] == 'getClosestBikes') || ($data['stations'][$id]['free'] > 0 && $_GET['do'] == 'getClosestParks')) {
                $return[$id] = $data['stations'][$id];
                $return[$id]['distance'] = $distance;
                $i++;
            }
            if($i == $n) {
                break;
            }
        }
        exit(json_encode($return));
        break;
}
