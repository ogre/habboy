
var HB_hw_iface_websocket;


function HB_HandleHwMessage(msg)
{
	msg = msg.replace('\r', '');
	msg = msg.replace('\n', '');

	// console.debug('HB_HandleHwMessage: ', msg);

	var msg_parts = msg.split("::");

	if(msg_parts[0] == "gps")
	{
		gps_result = {
			'time':	'1970-01-01 12:00:00',
			"latitude": 0,
			"longitude": 0,
			"altitude": 0,
			'speed': 0,	// kmph
			'heading': 0,
			'sats': 0,
			'ground_speed_mps': 0, // m/s
			'ascent_mps': 0 // m/s
		};

		var kv = msg_parts[1].split(",");
		for(i in kv)
		{
			var tokens = kv[i].split("=");
			// console.debug(tokens[0], tokens[1]);
			if(tokens[0] == "time")			gps_result['time'] = 		tokens[1];
			if(tokens[0] == "lat")			gps_result['latitude'] = 	parseFloat( tokens[1] ) * 1e-7;
			if(tokens[0] == "lon")			gps_result['longitude'] = 	parseFloat( tokens[1] ) * 1e-7;
			if(tokens[0] == "alt")			gps_result['altitude'] = 	parseFloat( tokens[1] );
			if(tokens[0] == "speed")		gps_result['speed'] = 		parseFloat( tokens[1] );
			if(tokens[0] == "heading")		gps_result['heading'] = 	parseFloat( tokens[1] );
			if(tokens[0] == "sats")			gps_result['sats'] = 		parseInt( tokens[1] );
		}
		HB_DEVICE_GPS_LAST["HABBOY"] = gps_result;
	}
	else if(msg_parts[0] == "tab")
	{
		var tokens = msg_parts[1].split("=");
		if(tokens[0] == "cycle")	HB_CycleTabs(parseInt(tokens[1]));
	}
	else if(msg_parts[0] == "rot")
	{
		HB_CycleTabs( parseInt(msg_parts[1]) );
	}
}

function HB_hw_iface_open(endpoint)
{
	HB_hw_iface_websocket = new WebSocket(endpoint);
	// console.debug("HB_hw_iface_open: ", HB_hw_iface_websocket);

	if(HB_hw_iface_websocket === undefined)
	{
		setTimeout(function () { HB_hw_iface_open(endpoint); }, 1000);
		return;
	}

	HB_hw_iface_websocket.onopen = function (ev) {
		console.debug("Hardware interface connection opened");
	};

	HB_hw_iface_websocket.onclose = function (ev) {
		HB_hw_iface_websocket = undefined;
		console.debug("Hardware interface connection closed");
		HB_hw_iface_open(endpoint);
	};

	HB_hw_iface_websocket.onmessage = function (ev) {
		var msg = ev.data;
		HB_DEVICE_GPS_LAST["HABBOY"] = ["000000", [52 + .001*Math.random(),21 + .001*Math.random(),80, 150, 350, 11]];
		HB_HandleHwMessage(msg);
	};

	HB_hw_iface_websocket.onerror = function (ev) {
		console.debug("Hardware interface error");
		console.log(ev);
		// HB_hw_iface_open(endpoint);
	};
}

function HB_hw_iface(endpoint)
{
	HB_hw_iface_open(endpoint);

	/*HB_DEVICE_GPS_LAST = ["000000", [52 + .001*Math.random(),21 + .001*Math.random(),80, 150, 350, 11]];
	setTimeout(() => {
		UpdateHabboyGps();
	}, 500);*/
}