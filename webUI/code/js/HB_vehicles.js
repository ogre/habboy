
// var HB_VEHICLES_TELEMETRY_Update_LastTime = "1970-01-01 12:00:00";
var HB_VEHICLES_TELEMETRY_Update_LastTime = "1970-01-01T00:00:00.0+00:00";

function calc_gps_speed(gps_prev, gps_new) // https://stackoverflow.com/questions/14560999/using-the-haversine-formula-in-javascript
{
	//gps for payloads: ['2019-10-12 12:34:56', [lat,lon,alt], ground speed m/s, ascend rate m/s]

	var result = gps_new;
	// while( result.length < 4)		result.push(0);

	if( gps_prev == undefined || gps_new == undefined )
		return result;

	var dT = -( SentenceAge(gps_new['time']) - SentenceAge(gps_prev['time']) );

	if( !dT && (gps_prev['time'] == gps_new['time'] ))
	{
		// reuse previously computed speed and ascent
		result['ground_speed_mps'] = gps_prev['ground_speed_mps'];
		result['ascent_mps'] = gps_prev['ascent_mps'];
		return result;
	}

	var dAlt = gps_new["altitude"] - gps_prev["altitude"];

	Number.prototype.toRad = function() {
		return this * Math.PI / 180;
	}

	var R = 6371000; // meters
	//has a problem with the .toRad() method below.
	var x1 = gps_new["latitude"] - gps_prev["latitude"];
	var dLat = x1.toRad();
	var x2 = gps_new["longitude"] - gps_prev["longitude"];
	var dLon = x2.toRad();
	var a = Math.sin(dLat/2.0) * Math.sin(dLat/2.0) +
			Math.cos(gps_prev["latitude"].toRad()) * Math.cos(gps_new["latitude"].toRad()) *
			Math.sin(dLon/2) * Math.sin(dLon/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var dP = R * c;

	result['ground_speed_mps'] = dP/dT; // ground speed m/s
	result['ascent_mps'] = dAlt/dT; // ascend rate m/s
	// console.debug(result);
	return result;
}


function HB_VEHICLES_TELEMETRY_Update(/*payload_id*/)
{
	let payload_id = HABBOY_PAYLOAD_ID;

	var xhr = new XMLHttpRequest();
	xhr.open(
		'GET',
			// HABBOY_DATA_URL + "/habboy/api/v1/payloads/" + payload_id + "/sensors/*?time=" + HB_VEHICLES_TELEMETRY_Update_LastTime
			HABBOY_DATA_URL + "/habboy/api/v1/payloads/" + payload_id + "/sensors/*?time=" +
			encodeURIComponent(HB_VEHICLES_TELEMETRY_Update_LastTime)
	);
	xhr.setRequestHeader("Content-Type", "application/json"); //;charset=UTF-8
	xhr.onload = function () {
		if (xhr.status == 200)
		{
			var telemetry = JSON.parse(xhr.responseText);
			if("latitude" in telemetry)
			{
				HB_VEHICLES_TELEMETRY_LAST[payload_id] = telemetry;
				if( !(payload_id in HB_VEHICLES_TELEMETRY) )
				{
					HB_VEHICLES_TELEMETRY[payload_id] = telemetry;
				}
				else // append
				{
					for(sensor in telemetry) {
						if(sensor in HB_VEHICLES_TELEMETRY[payload_id]) {
							for(key in HB_VEHICLES_TELEMETRY[payload_id][sensor]) {
								if(key != "is_numeric")
									HB_VEHICLES_TELEMETRY[payload_id][sensor][key].push(...telemetry[sensor][key]); // array
								// console.debug( "new data points ", key, telemetry[sensor][key].length );
								// console.debug( "ALL data points ", sensor, HB_VEHICLES_TELEMETRY[payload_id][sensor][key].length );
							}
						}
					}
				}

				// update HB_VEHICLES_GPS_LAST
				let batch_size = telemetry["latitude"]["values"].length;
				var gps_now = {
					"time": 	telemetry["latitude"]["times"][batch_size-1],
					"latitude":	telemetry["latitude"]["values"][batch_size-1],
					"longitude":	telemetry["longitude"]["values"][batch_size-1],
					"altitude":	telemetry["altitude"]["values"][batch_size-1],
					"ground_speed_mps": 0,
					"ascent_mps": 0
				}
				gps_now = calc_gps_speed( HB_VEHICLES_GPS_LAST[payload_id], gps_now );
				HB_VEHICLES_GPS_LAST[payload_id] = gps_now;
				// console.debug(HB_VEHICLES_GPS_LAST);

				// instead of utcnow - use last timestamp from received data
				// this way we won't receive the same data next time
				// HB_VEHICLES_TELEMETRY_Update_LastTime = new Date().toJSON().slice(0,19).replace(/T/g,' ');
				HB_VEHICLES_TELEMETRY_Update_LastTime = telemetry["latitude"]["times"][ telemetry["latitude"]["times"].length - 1 ];

				// callbacks for updated telemetry
				for(cb in HB_VEHICLES_TELEMETRY_UpdateCallbacks)
				{
					try {
						HB_VEHICLES_TELEMETRY_UpdateCallbacks[cb](telemetry);
					}
					catch (e) {
						console.debug("HB_VEHICLES_TELEMETRY_UpdateCallbacks error:", e);
					}
				}
			}
			else
			{
				console.debug("HB_VEHICLES_TELEMETRY_Update failed -- no LATITUDE");
			}

			setTimeout(() => { HB_VEHICLES_TELEMETRY_Update(payload_id); }, 3000);
		}
		else
		{
			console.debug("HB_VEHICLES_TELEMETRY_Update failed. Status:", xhr.status);
			console.debug(HABBOY_DATA_URL + "/habboy/api/v1/payloads/" + payload_id + "/sensors/*");
			setTimeout(() => { HB_VEHICLES_TELEMETRY_Update(payload_id); }, 6000);
		}
	};
	xhr.onerror = () => {
		console.debug("HB_VEHICLES_TELEMETRY_Update failed. Status:");
		setTimeout(() => { HB_VEHICLES_TELEMETRY_Update(payload_id); }, 6000);
	};
	xhr.send();
}


function HB_HABBOY_GPS_Update()
{
	var xhr = new XMLHttpRequest();
	xhr.open('GET', HABBOY_DATA_URL + "/habboy/api/v1/gps");
	xhr.onload = function () {
		if (xhr.status == 200) {
			var gps = JSON.parse(xhr.responseText);
			HB_DEVICE_GPS_LAST["HABBOY"] = gps;
			setTimeout( HB_HABBOY_GPS_Update, 1000 ); // currently GPS hardware is updated each 1 second
		}
		else {
			console.debug("HB_HABBOY_GPS_Update Failed. Status: ", xhr.status);
			setTimeout( HB_HABBOY_GPS_Update, 5000 );
		}
	}
	xhr.onerror = function () {
		console.debug("HB_HABBOY_GPS_Update Failed.");
		setTimeout( HB_HABBOY_GPS_Update, 5000 );
	}
	xhr.send();
}

function UpdateVehicleLastSentence(/*payload_id*/)
{
  	let payload_id = HABBOY_PAYLOAD_ID;

	var xhr = new XMLHttpRequest();
	xhr.open('GET', HABBOY_DATA_URL + "/habboy/api/v1/payloads/" + payload_id + "/sentences/lastdata");
	xhr.onload = function () {
		if (xhr.status == 200) {
			// HB_VEHICLES_SENTENCE_LAST[payload_id] = xhr.response; //text, not json
			HB_VEHICLES_SENTENCE_LAST[payload_id] = JSON.parse(xhr.responseText); //JSON
			setTimeout(() => {
				UpdateVehicleLastSentence(payload_id)
			}, 30000);
		}
		else {
			console.debug("UpdateVehicleLastSentence failed. Status: ", xhr.status);
			console.debug(HABBOY_DATA_URL + "/" + "habboy/api/v1/payloads/" + payload_id + "/sentences/lastdata");
			setTimeout(() => {
				UpdateVehicleLastSentence(payload_id)
			}, 30000);
		}
	}
	xhr.onerror = function () {
		console.debug("UpdateVehicleLastSentence Failed.");
		setTimeout(() => {
			UpdateVehicleLastSentence(payload_id)
		}, 30000);
	}
	xhr.send();

}


function HB_VEHICLES_PREDICT_Update(/*payload_id*/)
{
	let payload_id = HABBOY_PAYLOAD_ID;

	var xhr = new XMLHttpRequest();
	xhr.open('GET', HABBOY_DATA_URL + "/habboy/api/v1/payloads/" + payload_id + "/predict");
	xhr.onload = function () {
		if (xhr.status == 200) {
			HB_VEHICLES_PREDICT[payload_id] = JSON.parse(xhr.responseText);
			setTimeout(() => {
				HB_VEHICLES_PREDICT_Update();
			}, 60 * 1000); // predict takes 12 seconds on Odroid-XU4
		}
		else {
			console.debug("HB_VEHICLES_PREDICT_Update failed. Status: ", xhr.status);
			console.debug(HABBOY_DATA_URL + "/habboy/api/v1/payloads/" + payload_id + "/predict");
			setTimeout(() => {
				HB_VEHICLES_PREDICT_Update()
			}, 5000);
		}
	}
	xhr.onerror = function () {
		console.debug("HB_VEHICLES_PREDICT_Update failed.");
		console.debug(HABBOY_DATA_URL + "/habboy/api/v1/payloads/predict");
		setTimeout(() => {
			HB_VEHICLES_PREDICT_Update();
		}, 5000);
	}
	xhr.send();
}


function HB_VEHICLES_PREDICT_HABITAT_Update(/*payload_id*/)
{
	console.debug('HB_VEHICLES_PREDICT_HABITAT_Update');

	// https://legacy-snus.habhub.org/tracker/get_predictions.php?vehicles=AIRCOR-3
	let payload_id = HABBOY_PAYLOAD_ID;
	let payload_callsign = HABBOY_PAYLOAD_CALLSIGN;

	var xhr = new XMLHttpRequest();
	xhr.open('GET', "https://legacy-snus.habhub.org/tracker/get_predictions.php?vehicles=" + payload_callsign);
	xhr.onload = function () {
		if (xhr.status == 200) {
			let temp = JSON.parse(xhr.responseText);
			if(temp && temp[0]) {
				HB_VEHICLES_PREDICT_HABITAT[payload_id] = JSON.parse(temp[0].data); // [{'alt','lat','lon','time_1597935524'}]
				// console.debug('HB_VEHICLES_PREDICT_HABITAT[payload_id]', HB_VEHICLES_PREDICT_HABITAT[payload_id])
			}
			setTimeout(() => {
				HB_VEHICLES_PREDICT_HABITAT_Update();
			}, 60 * 1000);
		}
		else {
			console.debug("HB_VEHICLES_PREDICT_HABITAT_Update failed. Status: ", xhr.status);
			setTimeout(() => {
				HB_VEHICLES_PREDICT_HABITAT_Update()
			}, 10 * 1000);
		}
	}
	xhr.onerror = function () {
		console.debug("HB_VEHICLES_PREDICT_HABITAT_Update failed.");
		setTimeout(() => {
			HB_VEHICLES_PREDICT_HABITAT_Update();
		}, 5000);
	}
	xhr.send();
}


var HABBOY_UPLOAD_CHASE_CAR = 0;
function HB_SendChaseCar()
{
	if(!HABBOY_UPLOAD_CHASE_CAR) {
		setTimeout(() => {
			HB_SendChaseCar();
		}, 5000);
		return;
	}

	var chasecar_data = {
		"latitude": HB_DEVICE_GPS_LAST["HABBOY"]["latitude"],
		"longitude": HB_DEVICE_GPS_LAST["HABBOY"]["longitude"],
		"altitude": HB_DEVICE_GPS_LAST["HABBOY"]["altitude"],
		"ground_speed_mps": HB_DEVICE_GPS_LAST["HABBOY"]["ground_speed_mps"],
		"heading": HB_DEVICE_GPS_LAST["HABBOY"]["heading"]
	};

	var xhr = new XMLHttpRequest();
	xhr.open('POST', HABBOY_DATA_URL + "/habboy/api/v1/chasecar/habboy_chase");
	// xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onload = function () {
		if (xhr.status == 200) {
			console.debug("HB_SendChaseCar OK. ", JSON.parse(xhr.responseText) );
			setTimeout(() => {
				HB_SendChaseCar();
			}, 30000);
		}
		else {
			console.debug("HB_SendChaseCar failed. Status: ", xhr.status);
			setTimeout(() => {
				HB_SendChaseCar();
			}, 30000);
		}
	}
	xhr.onerror = function () {
		console.debug("HB_SendChaseCar failed.");
		setTimeout(() => {
			HB_SendChaseCar();
		}, 30000);
	}
	xhr.send( JSON.stringify(chasecar_data) );
}