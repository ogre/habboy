// var HABBOY_URL = window.location.hostname;
// var HABBOY_DATA_URL = "https://" + HABBOY_URL + ":8888";
var HABBOY_URL = window.location.origin;
if(HABBOY_URL == 'null')
	HABBOY_URL = 'http://localhost';
var HABBOY_HOST = window.location.hostname;

var HABBOY_DATA_URL = new URL(HABBOY_URL);
HABBOY_DATA_URL.port = '8888';
HABBOY_DATA_URL = HABBOY_DATA_URL.toString();
HABBOY_DATA_URL = HABBOY_DATA_URL.substr(0, HABBOY_DATA_URL.length-1);

console.debug('HABBOY_URL ', HABBOY_URL);
console.debug('HABBOY_HOST ', HABBOY_HOST);
console.debug('HABBOY_DATA_URL ', HABBOY_DATA_URL);

var HABBOY_PARAMS = {}; // parameters from data server
var HABBOY_PAYLOAD_ID = "NO_PAYLOAD"; // this will be set on HABBOY_INIT(), by query to DATA server
var HABBOY_PAYLOAD_CALLSIGN = "";

var HB_VEHICLES_TELEMETRY = {};
var HB_VEHICLES_TELEMETRY_LAST = {}; // from last update - all values since "HB_VEHICLES_TELEMETRY_Update_LastTime"
var HB_VEHICLES_TELEMETRY_UpdateCallbacks = []; // funs to call on each telemetry update. parameter is payload's telemetry
var HB_VEHICLES_GPS_LAST = {}; //for payloads
var HB_VEHICLES_SENTENCE_LAST = {};
var HB_VEHICLES_PREDICT = {}; // predicted path
var HB_VEHICLES_PREDICT_HABITAT = {}; // predicted path from HABITAT

var HB_HABBOY_TIME_DIFF_mSECS = 0; // if negative, HabBoy server has lagging clock relative to here
var HB_HABBOY_INFO = {}; // various info on habboy status and health

var HB_DEVICE_GPS_LAST = {
	"HABBOY": {
		'time':	'1970-01-01 12:00:00+00:00',
		"latitude": 52.1,
		"longitude": 21,
		"altitude": 100,
		'ground_speed_mps': 0,	// kmph
		'heading': 0,
		'sats': 0,
		'parse_timestamp': 0, // only for serial GPS from HabBoy
		'ascent_mps': 0, // m/s - calculated in HB_VEHICLES_TELEMETRY_Update
		'fix_age': 0, // seconds since last valid NMEA message received
		'data_age': 0 // seconds since last any   NMEA message received
		}
};
HB_DEVICE_GPS_LAST["DEVICE"] = HB_DEVICE_GPS_LAST["HABBOY"];

var HB_TAB_BUILDERS_ARR = []; // FUNCTIONS - each build a new tab content
var HB_TAB_BUTTONS = [];
var HB_TAB_BUTTON_CURRENT = "";
var HB_TAB_BUTTONS_WIDGET_NAV = {}; // indexed with tab_names (HB_TAB_BUTTON_CURRENT). keeps list of children widgets and it's nav info
var HABBOY_HABDEC_IFRAMES = [];


function toggleFullscreen()
{
	var elem = document.documentElement;
	if (!document.fullscreenElement && !document.mozFullScreenElement &&
	!document.webkitFullscreenElement && !document.msFullscreenElement)
	{
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.msRequestFullscreen) {
			elem.msRequestFullscreen();
		} else if (elem.mozRequestFullScreen) {
			elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) {
			elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	}
	else
	{
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}
}

function HB_get_css_val(i_css) {
	let root = document.querySelector(':root');
	let rootStyles = getComputedStyle(root);
	return rootStyles.getPropertyValue(i_css);
}

function HB_modal_submenu_fun(elements_list, parent_div)
{
	var button_onclick = function() {
		var modal_bg = document.createElement("div");
		modal_bg.classList.add("HB_modal_submenu_bg");
		modal_bg.style.display = "flex";

		var grid = document.createElement('div');
		grid.classList.add("HB_modal_submenu_div");
		grid.style.display = 'grid';
		grid.style.gridTemplateColumns = "auto auto auto auto ";
		modal_bg.appendChild(grid);

		for(i in elements_list)
		grid.appendChild( elements_list[i] );

		var close_b = document.createElement("button");
		close_b.innerHTML = "X";
		close_b.onclick = function () {
			modal_bg.innerHTML = '';
			modal_bg.parentElement.removeChild(modal_bg);
		}
		grid.appendChild( close_b );

		parent_div.appendChild(modal_bg);
	}

	return button_onclick;
}


function SentenceAge(i_sentence_time) { // isoformat 1970-01-01T12:00:00.0+00:00
	var sentence_time = Date.parse(i_sentence_time);
	var now = new Date(Date.now());
	var t_diff_secs = (now-(sentence_time-HB_HABBOY_TIME_DIFF_mSECS)) / 1e3;
	return t_diff_secs;
}


function bearing_to_dir_str(i_bear) {
	var bearing_dir_name = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
	var bearing_dir_arrow = [8593, 8599, 8594, 8600, 8595, 8601, 8592, 8598, 8593];
	var a = i_bear
	if (a < 0)
		a += 360;
	a = a % 360;
	i = 1.0 * a / 360.0;
	i = Math.round( i * (bearing_dir_name.length-1) );
	return bearing_dir_name[i] + String.fromCharCode(bearing_dir_arrow[i]);
}



function CalcGpsDistance(lat1, lon1, alt1, lat2, lon2, alt2)
{
    /*
    Calculate and return information from 2 (lat, lon, alt) points
    Input and output latitudes, longitudes, angles, bearings and elevations are
    in degrees, and input altitudes and output distances are in meters.
    */

	var radius = 6371000.0; // Earth radius in meters
	var M_PI = Math.PI;

    // to radians
    lat1 *= M_PI / 180.0;
    lat2 *= M_PI / 180.0;
    lon1 *= M_PI / 180.0;
    lon2 *= M_PI / 180.0;

    // Calculate the bearing, the angle at the centre, and the great circle
    // distance using Vincenty's_formulae with f = 0 (a sphere). See
    // http://en.wikipedia.org/wiki/Great_circle_distance#Formulas and
    // http://en.wikipedia.org/wiki/Great-circle_navigation and
    // http://en.wikipedia.org/wiki/Vincenty%27s_formulae
    var d_lon = lon2 - lon1;
    var sa = Math.cos(lat2) * Math.sin(d_lon);
    var sb = (Math.cos(lat1) * Math.sin(lat2)) - (Math.sin(lat1) * Math.cos(lat2) * Math.cos(d_lon));
    var bearing = Math.atan2(sa, sb);
    var aa = Math.sqrt((sa*sa) + (sb*sb));
    var ab = (Math.sin(lat1) * Math.sin(lat2)) + (Math.cos(lat1) * Math.cos(lat2) * Math.cos(d_lon));
    var angle_at_centre = Math.atan2(aa, ab);
    var great_circle_distance = angle_at_centre * radius;

    // Armed with the angle at the centre, calculating the remaining items
    // is a simple 2D triangley circley problem:

    // Use the triangle with sides (r + alt1), (r + alt2), distance in a
    // straight line. The angle between (r + alt1) and (r + alt2) is the
    // angle at the centre. The angle between distance in a straight line and
    // (r + alt1) is the elevation plus pi/2.

    // Use sum of angle in a triangle to express the third angle in terms
    // of the other two. Use sine rule on sides (r + alt1) and (r + alt2),
    // expand with compound angle formulae and solve for tan elevation by
    // dividing both sides by cos elevation
    var ta = radius + alt1;
    var tb = radius + alt2;
    var ea = (Math.cos(angle_at_centre) * tb) - ta;
    var eb = Math.sin(angle_at_centre) * tb;
    var elevation = Math.atan2(ea, eb);

    // Use cosine rule to find unknown side.
    var line_distance = Math.sqrt((ta*ta) + (tb*tb) - 2 * tb * ta * Math.cos(angle_at_centre));

    // Give a bearing in range 0 <= b < 2pi
    if (bearing < 0)
        bearing += 2 * M_PI;


    var res = {
		dist_line_: line_distance,
		dist_circle_: great_circle_distance,
		dist_radians_: angle_at_centre,
		elevation_: elevation / ( M_PI / 180.0 ),
		bearing_: bearing / ( M_PI / 180.0 )
	}
    return res;

}

//////////////////////////////////////////
//////////////////////////////////////////
//										//
//	PROCEDURES TO BUILD CONTENT OF TABS //
//										//
//////////////////////////////////////////
//////////////////////////////////////////


function HB_BuildStatusBar(status_bar_div) {
	var payload_div = document.createElement("div");
	payload_div.id = "HB_StatusBar_payload_div"
	payload_div.style.fontSize = "4.0vh";
	var habboy_div = document.createElement("div");
	habboy_div.id = "HB_StatusBar_habboy_div"
	habboy_div.style.fontSize = "4.0vh";

	status_bar_div.appendChild(payload_div);
	status_bar_div.appendChild(habboy_div);

	HB_UpdateStatusBar(payload_div, habboy_div);
}

function HB_UpdateStatusBar(payload_div, habboy_div) {
		var sentence_age = 0;
		var now = new Date(Date.now());

		var payload_info = "<font color=#800>No Telemetry - " + HABBOY_PAYLOAD_CALLSIGN + " - " + now + "</font>";
		if(HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID] != undefined)
		{
			payload_info = '[' + HABBOY_PAYLOAD_CALLSIGN + "] ";
			// payload_info += HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]["latitude"].toFixed(6) + " ";
			// payload_info += HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]["longitude"].toFixed(6) + " ";
			payload_info += HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]["altitude"].toFixed(0) + "m";

			var _s = HB_VEHICLES_TELEMETRY_LAST[HABBOY_PAYLOAD_ID]['altitude']['values'].length;
			payload_info += "  (" + HB_VEHICLES_TELEMETRY_LAST[HABBOY_PAYLOAD_ID]['altitude']['max'][_s-1].toFixed(0) + "m)";

			// ascent rate computed by habboy - based on incomming GPS altitudes
			var ascent_rate = HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]['ascent_mps'];
			var ascend_arrow = "&uarr;"
			if(ascent_rate<0)
				ascend_arrow = "&darr;"
			payload_info += "  " + ascend_arrow + ascent_rate.toFixed(1);

			// ARY specific. display payload-computed ascentrate
			try {
				var payload_ascent_rate = HB_VEHICLES_TELEMETRY_LAST[HABBOY_PAYLOAD_ID]['ascentrate']['values'][_s-1];
				payload_info += "(" + payload_ascent_rate.toFixed(1) + ")";
			} catch(err) {}
			payload_info += " m/s";

			var speed_mps = HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]['ground_speed_mps'];
			var speed_kmph = 3.6 * speed_mps;
			payload_info += " &rarr;" + speed_kmph.toFixed(0) + " km/h";

			// ARY Specific
			try{
				var state = HB_VEHICLES_TELEMETRY_LAST[HABBOY_PAYLOAD_ID]['state']['values'][_s-1];
				payload_info += "  S:" + state;
			} catch(err) {}

			sentence_age = SentenceAge( HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]['time'] );
			sentence_age_str = Math.floor(sentence_age);
			if(sentence_age>60)
				sentence_age_str = new Date(1000 * sentence_age).toISOString().substr(11,8);
			payload_info += " gps=" + sentence_age_str + "s";

			var sentence_reception_timestamp =  Date.parse( HB_VEHICLES_SENTENCE_LAST[HABBOY_PAYLOAD_ID]['_INSERT_TIME'] );
			var sentence_reception_age = (now - (sentence_reception_timestamp-HB_HABBOY_TIME_DIFF_mSECS)) / 1e3;
			sentence_reception_age_str = Math.floor(sentence_reception_age);
			if(sentence_reception_age>60)
				sentence_reception_age_str = new Date(1000 * sentence_reception_age).toISOString().substr(11,8);
			payload_info += " packet=" + sentence_reception_age_str + "s";
		}

		var habboy_info = "[HabBoy] ";
		var habboy_fix_age = 0;
		var habboy_data_age = 0;
		if(HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID] != undefined) {
			var payload_dist = CalcGpsDistance( HB_DEVICE_GPS_LAST['HABBOY']['latitude'],
												HB_DEVICE_GPS_LAST['HABBOY']['longitude'],
												HB_DEVICE_GPS_LAST['HABBOY']['altitude'],
												HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]['latitude'],
												HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]['longitude'],
												HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]['altitude'] );
			var payload_dist_str = Math.round(payload_dist.dist_circle_) + "m";
			if(payload_dist.dist_circle_ > 1000)
				payload_dist_str = (0.001 * payload_dist.dist_circle_).toFixed(1) + "km";
			habboy_info += "  Dist: " + payload_dist_str;
			habboy_info += "  &angle;: " + Math.round(payload_dist.elevation_).toFixed(0) + String.fromCharCode(176);
			var heading = Math.round(payload_dist.bearing_).toFixed(); //HB_DEVICE_GPS_LAST['HABBOY']['heading'].toFixed(1);
			if(heading > 180)
				heading -= 360;
			habboy_info += "  Azimuth: " + heading + String.fromCharCode(176) + "" + bearing_to_dir_str(heading);
		}

		habboy_info += "  Speed: " + Math.round(3.6 * HB_DEVICE_GPS_LAST['HABBOY']['ground_speed_mps']).toFixed(0) + "km/h ";
		habboy_fix_age = Math.round(HB_DEVICE_GPS_LAST['HABBOY']['fix_age']).toFixed(0);
		habboy_fix_age_str = Math.floor(habboy_fix_age);
		if(habboy_fix_age>60)
			habboy_fix_age_str = new Date(1000 * habboy_fix_age).toISOString().substr(11,8);

		habboy_data_age = Math.round(HB_DEVICE_GPS_LAST['HABBOY']['data_age']).toFixed(0);
		habboy_data_age_str = Math.floor(habboy_data_age);
		if(habboy_data_age>60)
			habboy_data_age_str = new Date(1000 * habboy_data_age).toISOString().substr(11,8);

		habboy_info += "  gps=" + habboy_fix_age_str + "s packet=" + habboy_data_age_str;

		if(sentence_age > 120)
			payload_div.innerHTML = '<font color=red>' + payload_info + '<font>';
		else if(sentence_age > 60)
			payload_div.innerHTML = '<font color=orange>' + payload_info + '<font>';
		else
			payload_div.innerHTML = '<font color=#00ee55>' + payload_info + '<font>';

		if(habboy_fix_age > 5 || habboy_data_age > 5)
			habboy_div.innerHTML = '<font color=red>' + habboy_info + '<font>';
		else
			habboy_div.innerHTML = '<font color=#00ee55>' + habboy_info + '<font>';

		setTimeout(() => {
			HB_UpdateStatusBar(payload_div, habboy_div);
		}, 1000);
}




function ExampleTabBuilder_img(parent_div, img_src) {
	var img = document.createElement("img");
	img.src = img_src;
	parent_div.appendChild(img);

}


function HB_Habitat_SSDV(parent_div) {
	var filter = "";
	//<iframe frameborder=0 width = "1000px;" height="700px" src="https://ssdv.habhub.org/ARY-2"></iframe>
	var container = document.createElement("div");
	container.classList.add ("HB_TAB_CONTENT_DIV");
	container.innerHTML = '<iframe frameborder=0 width = "100%;" height="100%" src="https://ssdv.habhub.org/' + HABBOY_PAYLOAD_CALLSIGN + '"></iframe>';
	parent_div.appendChild(container);
	// return "SSDV";
	return {"tab_name": "SSDV-G", "tab_nav": []};

}


function HB_Local_SSDV(parent_div) {
	var filter = "";
	var container = document.createElement("div");
	container.classList.add ("HB_TAB_CONTENT_DIV");
	console.debug(HABBOY_HOST);
	container.innerHTML = '<iframe frameborder=0 width = "100%;" height="100%" src="http://' + HABBOY_HOST + '/ssdv"></iframe>';
	parent_div.appendChild(container);
	// return "SSDV";
	return {"tab_name": "SSDV-L", "tab_nav": []};

}


function HB_Habitat_SSDV_Last(parent_div) {
	var filter = HABBOY_PAYLOAD_ID;
	var img = document.createElement("img");
	img.src = "https://ssdv.habhub.org/" + filter + "/latest.jpeg";
	img.style.width = "100%";
	img.style.height = "100%";
	parent_div.appendChild(img);
	// return "Last";
	return {"tab_name": "Photo", "tab_nav": []};

}


function HB_Habitat_Tracker(parent_div) {
	var filter = "";
	//<iframe src="https://tracker.habhub.org/index.html?embed=1&hidelist=0&hidegraph=0&expandgraph=0&filter=" style="border:1px solid #00A3D3;border-radius:20px;" width="400px" height="500px"></iframe>
	var container = document.createElement("div");
	container.classList.add ("HB_TAB_CONTENT_DIV");

	var iframe = document.createElement("iframe");
	iframe.src = "https://tracker.habhub.org/index.html?embed=1&hidelist=0&hidegraph=0&expandgraph=0&filter=!RS_*;";
	iframe.style.width = "100%";
	iframe.style.height = "100%";
	container.appendChild(iframe);

	parent_div.appendChild(container);
	// return "HabHub";
	return {"tab_name": "HabHub", "tab_nav": []};
}

function NiceRadioName(radio_addr) {
	if(radio_addr.toLowerCase().startsWith('ws://'))
		radio_addr = radio_addr.substr(5, radio_addr.length);
	radio_addr = radio_addr.split(":")[0];
	let tokens = radio_addr.split(".");
	if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(radio_addr))
		return tokens[tokens.length-1];
	else
		return tokens[0];
}


function HB_BuildHabdec(parent_div, habdec_addr) {

	if( habdec_addr.toLowerCase().startsWith("ws://") )
		habdec_addr = habdec_addr.substr(5, habdec_addr.length);

	// construct name for this tab.
	// check existing names to prevent duplicates
	if( typeof HB_BuildHabdec.existing_radio_names == 'undefined' )
		HB_BuildHabdec.existing_radio_names = [];

	var radio_name_proposed = NiceRadioName(habdec_addr);
	var radio_name_new = radio_name_proposed;
	if( HB_BuildHabdec.existing_radio_names.includes(radio_name_new) )
		radio_name_new = radio_name_proposed + '_' + habdec_addr.substr( habdec_addr.indexOf(':')+1, habdec_addr.length );

	HB_BuildHabdec.existing_radio_names.push(radio_name_new);

	var container = document.createElement("div");
	container.classList.add ("HB_TAB_CONTENT_DIV");

	var iframe = document.createElement("iframe");
	iframe.id = "HB_HABDEC_IFRAME_" + radio_name_new;
	iframe.radio_name = radio_name_new;
	iframe.style.width = "100%";
	iframe.style.height = "100%";

	let iframe_src = location.origin + "/" + location.pathname + "/habdec_gui";
	iframe.src = iframe_src;

	iframe.onload = () => {
		iframe.contentWindow.postMessage("cmd::setServer:addr=" + habdec_addr);
	}
	HABBOY_HABDEC_IFRAMES.push(iframe);

	container.appendChild(iframe);

	parent_div.appendChild(container);

	// return "Radio";
	return {"tab_name": "Radio " + radio_name_new, "tab_nav": []};
}


function HB_ReplaceColorScheme_CB(color_name) {

	/*
	var cssLinkIndex = 1;

	var oldlink = document.getElementsByTagName("link").item(cssLinkIndex);
	var newlink = document.createElement("link");

	console.debug(oldlink, newlink);

	newlink.setAttribute("rel", "stylesheet");
	newlink.setAttribute("type", "text/css");
	newlink.setAttribute("href", cssFile);

	document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
	*/

	/*Highcharts.theme = HB_highcharts_theme();
	Highcharts.setOptions(Highcharts.theme);*/

	HB_ApplyColorScheme( color_name, HB_COLOR_SCHEMES[color_name] );

	HB_TabButtonsUpdateState();

	// inform habdec
	for(let i in HABBOY_HABDEC_IFRAMES)
	{
		var habdec_window = HABBOY_HABDEC_IFRAMES[i].contentWindow;
		habdec_window.postMessage('cmd::setColorScheme' +
								':name=' + color_name +
								':config=' + JSON.stringify(HB_COLOR_SCHEMES[color_name]['HABDEC'])
							);
	}
}


function HB_UpdateInfo(info_div) {
	try{
		if( Object.keys(HB_HABBOY_INFO).length ) {
			var content = "";

			// globals stats
			content +='<p>GLOBALS</p>';

			try {
				var global_stats = Object.keys(HB_HABBOY_INFO['global']);
				content += '<p><table><tr>';
				for(var i in global_stats)
					content += "<th><p>" + global_stats[i] + "</p></th>";
				content += '</tr><tr>';
				for(var i in global_stats)
					content += '<td><p>' + Math.round(HB_HABBOY_INFO['global'][global_stats[i]]) + '<p></td>';
				content += '</tr></table></p>';
			} catch(err) {
				console.debug("Error in habboy info.", err);
			}

			// processes
			content += '<p>Process</p>';
			var procs_arr = Object.keys(HB_HABBOY_INFO['proc']);
			var stats_arr = Object.keys(HB_HABBOY_INFO['proc'][procs_arr[0]]);
			content += '<table>';
			content += "<tr>\n<th><p>Process</p></th>";
			for(var i in stats_arr)
				content += "<th><p>" + stats_arr[i] + "</p></th>";
			content += "</tr>";

			for (const [proc, stats] of Object.entries(HB_HABBOY_INFO['proc'])) {
				content += '<tr>';
				content += '<td><p>' + proc + "</p></td>";
				for ([key, value] of Object.entries(HB_HABBOY_INFO['proc'][proc])) {
					if(key == 'runtime')
						value = new Date(1000 * value).toISOString().substr(11,8);
					else
						value = Math.round(value);
					content += '<td><p>' + value + '<p></td>';
				}
				content += '</tr>';
			}
			content += '</table>';

			// telemetry
			content += '<p>Telemetry</p>';
			content += '<table>';

			var habhubs = Object.keys(HB_HABBOY_INFO['telemetry']['habhub']);
			if(habhubs.length) {
				var stats_arr = Object.keys(HB_HABBOY_INFO['telemetry']['habhub'][habhubs[0]]);
				content += "<tr>\n<th><p>Source</p></th>";
				for(var i in stats_arr)
					content += "<th><p>" + stats_arr[i] + "</p></th>";

				for(var i in habhubs) {
					var hh = habhubs[i];
					content += '<tr>';
					content += '<td><p> Habitat ' + hh + '</p></td>';
					for ([key, value] of Object.entries(HB_HABBOY_INFO['telemetry']['habhub'][hh])) {
						if(key == 'connection_age' || key == 'sentence_age')
							value = new Date(1000 * value).toISOString().substr(11,8);
						else
							value = Math.round(value);
						content += '<td><p>' + value + '<p></td>';
					}
					content += '</tr>';
				}
			}

			var habdecs = Object.keys(HB_HABBOY_INFO['telemetry']['habdec']);
			if(habdecs.length) {
				for(var i in habdecs) {
					var hd = habdecs[i];
					content += '<tr>';
					content += '<td><p>' + hd + "</p></td>";
					for ([key, value] of Object.entries(HB_HABBOY_INFO['telemetry']['habdec'][hd])) {
						if(key == 'connection_age' || key == 'sentence_age')
							value = new Date(1000 * value).toISOString().substr(11,8);
						else
							value = Math.round(value);
						content += '<td><p>' + value + '<p></td>';
					}
					content += '</tr>';
				}
			}

			content += '</table>';

			// last sentence
			if(HB_VEHICLES_SENTENCE_LAST[HABBOY_PAYLOAD_ID])
				content += '<p>Last Sentence</p><p>' + HB_VEHICLES_SENTENCE_LAST[HABBOY_PAYLOAD_ID]['_SENTENCE'] + '</p>	'

			info_div.innerHTML = content;
			info_div.style.backgroundColor = HB_get_css_val("--HB_bg");
		}
	}
	catch(err) {
		console.debug("HB_UpdateInfo error", err);
	}

	setTimeout(() => {
		HB_UpdateInfo(info_div)
	}, 1000);
}


function HB_BuildInfo(parent_div) {
	var info_div = document.createElement('div');
	info_div.id = "info_cnt_div";
	info_div.flex = "auto";
	info_div.style.width = '100%';
	info_div.style.backgroundColor = HB_get_css_val("--HB_bg");
	HB_UpdateInfo(info_div);
	parent_div.appendChild(info_div);
	return {"tab_name": "Info", "tab_nav": []};

}


function copy_text_to_clipboard(i_text){
	const el = document.createElement('textarea');
	el.value = i_text;
	document.body.appendChild(el);
	el.select();
	document.execCommand('copy');
document.body.removeChild(el);
};


function HB_BuildConfig(parent_div) {

	var nav_info = [];

	var grid = document.createElement('div');
	grid.flex = "auto";
	grid.style.width = '100%';
	grid.style.display = 'grid';
	grid.style.gridTemplateColumns = "auto auto auto auto ";
	parent_div.appendChild(grid);

	var b;

	b = document.createElement("button");
	b.innerHTML = "Full Screen";
	b.onclick = toggleFullscreen;
	grid.appendChild(b);
	nav_info.push( {"widget": b, "click": 1} );

	b = document.createElement("button");
	b.innerHTML = "Toggle Layout";
	b.onclick = function () { HB_MENU_LAYOUT_TOP = !HB_MENU_LAYOUT_TOP; HB_SetMenuLayout();	};
	grid.appendChild(b);
	nav_info.push( {"widget": b, "click": 1} );

	b = document.createElement("button");
	b.innerHTML = "Refresh";
	b.onclick = function(){location.reload()};
	grid.appendChild(b);
	nav_info.push( {"widget": b, "click": 1} );

	b = document.createElement("button");
	b.innerHTML = "Nav";
	b.onclick = function () {
		// var loc_url = "http://www.google.com/maps/place/" +
		copy_text_to_clipboard( HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]['latitude'] + ', ' +
								HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]['longitude'] );
		var loc_url = "geo:" +
			HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]["latitude"] + "," +HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]["longitude"];
		window.open(loc_url, '_blank');
	};
	grid.appendChild(b);
	nav_info.push( {"widget": b, "click": 1} );

	let chasecar_b = document.createElement("button");
	chasecar_b.innerHTML = "Chase Car";
	chasecar_b.onclick = () => {
		HABBOY_UPLOAD_CHASE_CAR = !HABBOY_UPLOAD_CHASE_CAR;
		if(HABBOY_UPLOAD_CHASE_CAR)
			chasecar_b.style.backgroundColor = HB_get_css_val('--HB_button_active');
		else
			chasecar_b.style.backgroundColor = HB_get_css_val('--HB_button');
	}
	grid.appendChild(chasecar_b);
	nav_info.push( {"widget": chasecar_b, "click": 1} );

	// device control
	//
	var ctrl_cmds_buttons = new Array();
	var CTRL_CMDS = ['habdec_stop', 'habdec_start',
					'spy_stop', 'spy_start',
					'restart', 'reboot', 'halt',
					];
	for(let cc in CTRL_CMDS)
	{
		b = document.createElement("button");
		b.innerHTML = CTRL_CMDS[cc].toUpperCase();
		b.onclick = function () {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', HABBOY_DATA_URL + "/habboy/api/v1/ctrl/" + CTRL_CMDS[cc]);
			xhr.send();
			// setTimeout(() => { location.reload() }, 1000);
		};
		ctrl_cmds_buttons.push(b);
	}

	b = document.createElement("button");
	b.innerHTML = 'Device...';
	b.onclick = HB_modal_submenu_fun(ctrl_cmds_buttons, parent_div);
	grid.appendChild(b);
	nav_info.push( {"widget": b, "click": 1} );

	// color schemes
	//
	var color_buttons = new Array();
	for(let color_scheme in HB_COLOR_SCHEMES)
	{
		b = document.createElement("button");
		b.innerHTML = color_scheme;
		b.onclick = function () { HB_ReplaceColorScheme_CB(color_scheme);	};
		color_buttons.push(b);
	}

	b = document.createElement("button");
	b.innerHTML = 'Color...';
	b.onclick = HB_modal_submenu_fun(color_buttons, parent_div);
	grid.appendChild(b);
	nav_info.push( {"widget": b, "click": 1} );

	// payloads
	//
	var payloads_buttons = new Array();
	for(let i in HABBOY_PARAMS['payloads'])
	{
		let pid_and_callsign = HABBOY_PARAMS['payloads'][i];
		var b = document.createElement("button");
		b.innerHTML = pid_and_callsign[1] + ', ' + pid_and_callsign[0];
		b.onclick = function(){HB_ReplacePayloadId(pid_and_callsign)};
		payloads_buttons.push(b);
	}

	b = document.createElement("button");
	b.innerHTML = 'Payloads...';
	b.onclick = HB_modal_submenu_fun(payloads_buttons, parent_div);
	grid.appendChild(b);
	nav_info.push( {"widget": b, "click": 1} );

	// test - add radio
	/*
	b = document.createElement("button");
	b.innerHTML = "Add Radio";
	b.onclick = function () {
		let buttons_div = document.getElementById("HB_BUTTONS_DIV");
		let tabs_div = document.getElementById("HB_TABS_DIV");
		HB_BuildTab(
			(parent_div)=> {
				return HB_BuildHabdec( parent_div, "127.0.0.1:5555" );
			},
			buttons_div, tabs_div );
	};
	grid.appendChild(b);
	nav_info.push( {"widget": b, "click": 1} );
	*/

	// return "Config";
	return {"tab_name": "Control", "tab_nav": nav_info};
}


//////////////////////////////////////////
//////////////////////////////////////////
//										//
//	GUI PROCEDURES						//
//										//
//////////////////////////////////////////
//////////////////////////////////////////


function HB_TabButtonsUpdateState() {
	// MANUALLY SET LIGHT-UP, BECAUSE THERE ARE OTHER BUTTONS THAT CAN BE CLICKED
	//

	// colors of tab buttons
	var root = document.querySelector(':root');
	var rootStyles = getComputedStyle(root);
	var color_tab_button = rootStyles.getPropertyValue('--HB_tab_button');
	var color_tab_button_active = rootStyles.getPropertyValue('--HB_tab_button_active');
	var color_tab_button_text = rootStyles.getPropertyValue('--HB_tab_button_text');
	var color_tab_button_active_text = rootStyles.getPropertyValue('--HB_tab_button_active_text');

	// un-light all buttons
	var tab_divs_arr = document.getElementsByClassName("HB_TAB_DIV");
	var buttons = document.getElementsByClassName("HB_TAB_BUTTON");
	for (i = 0; i < tab_divs_arr.length; i++) {
		buttons[i].style.backgroundColor = color_tab_button;
		buttons[i].style.color = color_tab_button_text;
	}
	// light up selected button
	var button = document.getElementById("HB_TAB_BUTTON_" + HB_TAB_BUTTON_CURRENT)
	button.style.backgroundColor = color_tab_button_active;
	button.style.color = color_tab_button_active_text;

}


function HB_TabButton_onclick_CB(tab_name) {
	HB_TAB_BUTTON_CURRENT = tab_name;

	// Hide all tabs
	var i, tab_divs_arr, tab_buttons;
	tab_divs_arr = document.getElementsByClassName("HB_TAB_DIV");
	for (i = 0; i < tab_divs_arr.length; i++)
		tab_divs_arr[i].style.display = "none";

	// Show the specific tab content
	var clicked_tab = document.getElementById("HB_TAB_DIV_" + tab_name);
	clicked_tab.style.display = "flex";

	HB_TabButtonsUpdateState();

	window.dispatchEvent(new Event('resize'));
}


function HB_BuildTab(builder_function, tab_buttons_parent_div, tabs_parent_div) {
	// tab button
	var tab_button = document.createElement("button");
	tab_button.classList.add("HB_TAB_BUTTON");
	tab_button.style.flex = "auto";
	tab_buttons_parent_div.appendChild(tab_button);
	HB_TAB_BUTTONS.push(tab_button);

	// tab div
	var tab_div = document.createElement("div");
	tab_div.classList.add("HB_TAB_DIV");
	tabs_parent_div.appendChild(tab_div);

	// content
	// var tab_name = builder_function(tab_div);
	var tab_result = builder_function(tab_div);
	var tab_name = tab_result.tab_name;
	var tab_nav = tab_result.tab_nav;
	HB_TAB_BUTTONS_WIDGET_NAV[tab_name] = tab_nav;

	tab_button.innerHTML = tab_name;
	tab_button.id = "HB_TAB_BUTTON_" + tab_name;
	tab_button.HB_tab_name = tab_name;
	tab_button.onclick = function () { HB_TabButton_onclick_CB(tab_name); };

	tab_div.id = "HB_TAB_DIV_" + tab_name;

	return tab_name;
}


var HB_MENU_LAYOUT_TOP = 0;
function HB_SetMenuLayout()
{
	var buttons_div = document.getElementById("HB_BUTTONS_DIV");
	var tabs_div = document.getElementById("HB_TABS_DIV");
	var buttons_plus_tabs_div = document.getElementById("HB_TABS_AND_BUTTONS_DIV");

	if(HB_MENU_LAYOUT_TOP) {
		buttons_plus_tabs_div.style.flexDirection = "column";
		buttons_div.style.flexDirection = "row";
		buttons_div.style.width = "";
		buttons_div.style.height = "10vh";
		tabs_div.style.width = 	"";
		tabs_div.style.height = 	"80vh";

		while (buttons_plus_tabs_div.firstChild)
			buttons_plus_tabs_div.removeChild(buttons_plus_tabs_div.firstChild);
		buttons_plus_tabs_div.appendChild(buttons_div);
		buttons_plus_tabs_div.appendChild(tabs_div);
	}
	else {
		buttons_plus_tabs_div.style.flexDirection = "row";
		buttons_div.style.flexDirection = "column";
		buttons_div.style.width = "13vw";
		buttons_div.style.height = "";
		tabs_div.style.width = 	"87vw";
		tabs_div.style.height = 	"90vh";

		while (buttons_plus_tabs_div.firstChild)
			buttons_plus_tabs_div.removeChild(buttons_plus_tabs_div.firstChild);
			buttons_plus_tabs_div.appendChild(tabs_div);
			buttons_plus_tabs_div.appendChild(buttons_div);
	}

	// window.dispatchEvent(new Event('resize'));

}



///////////////////////////////////////////////////
///////////////////////////////////////////////////
//												 //
//	PROCEDURES TO NAVIGATE TABS AND ITS CHILDREN //
//												 //
///////////////////////////////////////////////////
///////////////////////////////////////////////////

// Changes selected tab
// this is supposed to be initiated by a hardware switch
//
var  last_tab_highlighted = 0;
function HB_CycleTabs(i_jump) {

	last_tab_highlighted += i_jump;
	last_tab_highlighted = last_tab_highlighted % (HB_TAB_BUTTONS.length);
	while(last_tab_highlighted < 0)
		last_tab_highlighted += HB_TAB_BUTTONS.length;

	if(HB_TAB_BUTTONS[last_tab_highlighted] != undefined)
		HB_TAB_BUTTONS[last_tab_highlighted].click();

	var tab_name = HB_TAB_BUTTONS[last_tab_highlighted].HB_tab_name;
	console.debug( tab_name );
	console.debug( HB_TAB_BUTTONS_WIDGET_NAV[tab_name] );
}



function HB_BuildGui(habboy_main_div) {

	while (habboy_main_div.firstChild)
		habboy_main_div.removeChild(habboy_main_div.firstChild);

	// BUILD TABS
	//
	var tabs_div = document.createElement("div");
	tabs_div.id = "HB_TABS_DIV";
	tabs_div.style.display = "flex";
	var buttons_div = document.createElement("div");
	buttons_div.id = "HB_BUTTONS_DIV";
	buttons_div.style.display = "flex";

	for (var i in HB_TAB_BUILDERS_ARR) {
		HB_BuildTab( HB_TAB_BUILDERS_ARR[i], buttons_div, tabs_div );
	}

	// PUT TABS AND BUTTONS INTO DIV
	//
	var buttons_plus_tabs_div = document.createElement("div");
	buttons_plus_tabs_div.id = "HB_TABS_AND_BUTTONS_DIV";
	buttons_plus_tabs_div.style.display = "flex";
	buttons_plus_tabs_div.flex = "auto";
	buttons_plus_tabs_div.appendChild(buttons_div);
	buttons_plus_tabs_div.appendChild(tabs_div);

	// bottom status bar
	var status_bar_div = document.createElement("div");
	status_bar_div.classList.add("HB_STATUS_BAR_DIV");
	status_bar_div.style.height = "10vh";

	HB_BuildStatusBar(status_bar_div);

	habboy_main_div.appendChild(buttons_plus_tabs_div);
	habboy_main_div.appendChild(status_bar_div);

	window.onload =
		setTimeout(
			function () {
				var tab_divs_arr = document.getElementsByClassName("HB_TAB_DIV");
				// hide all but first tab
				for (i = 1; i < tab_divs_arr.length; i++)
					tab_divs_arr[i].style.display = "none";
				window.dispatchEvent(new Event('resize'));
				HB_SetMenuLayout();
			}
			, 100);

}


// this requires httpS ...
function HB_DeviceLocationGPS() {
	navigator.geolocation.getCurrentPosition(
		(loc) => { // success function
			HB_DEVICE_GPS_LAST["DEVICE"] = {
				"time": (new Date()).toISOString(),
				"latitude": 		loc.coords.latitude,
				"longitude": 		loc.coords.longitude,
				"altitude": 		loc.coords.altitude || 0,
				"ground_speed_mps": loc.coords.speed || 0,
				"heading": 			loc.coords.heading || 0,
				"sats": 			loc.coords.sats || 0 };
		},
		(err) => { // error function
			console.debug("HB_DeviceLocationGPS failed. Use HABBOY position. ", err);
			HB_DEVICE_GPS_LAST["DEVICE"] = HB_DEVICE_GPS_LAST["HABBOY"];
		}
	);
	setTimeout( HB_DeviceLocationGPS, 1000 );
}


/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

function HB_HabBoyTimeOffset() {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', HABBOY_DATA_URL + "/habboy/api/v1/utcnow");
	xhr.onload = function () {
		if (xhr.status == 200)
		{
			var now = new Date().getTime();
			var habboy_utcnow = Date.parse( xhr.responseText );
			HB_HABBOY_TIME_DIFF_mSECS = habboy_utcnow - now;
			console.debug("HB_HABBOY_TIME_DIFF_mSECS", HB_HABBOY_TIME_DIFF_mSECS);
		}
		setTimeout( () => { HB_HabBoyTimeOffset(HB_HabBoyTimeOffset) }, 15000);
	};
	xhr.onerror = () => { setTimeout(() => { HB_HabBoyTimeOffset(HB_HabBoyTimeOffset) }, 15000); };
	xhr.send();
}


function HB_HABBOY_INFO_Update() {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', HABBOY_DATA_URL + "/habboy/api/v1/info");
	xhr.onload = function () {
		if (xhr.status == 200) {
			try {
				HB_HABBOY_INFO = JSON.parse(xhr.responseText);
			} catch(e) {}
		}
		setTimeout( HB_HABBOY_INFO_Update, 5000);
	};
	xhr.onerror = () => { setTimeout(HB_HABBOY_INFO_Update, 5000); };
	xhr.send();
}


function HB_ReplacePayloadId(pid_and_callsign) {
	let xhr = new XMLHttpRequest();
	xhr.open('PUT', HABBOY_DATA_URL + "/habboy/api/v1/params/payload_id");
	xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
	xhr.onload = function () {
		if (xhr.status == 200) {
			location.reload();
		}
	};
	xhr.onerror = () => { console.debug("HB_ReplacePayloadId Failed.") };
	xhr.send( JSON.stringify( {'payload_id': pid_and_callsign[0], 'callsign': pid_and_callsign[1]} ) );
}


function WatchForNewHabdecs( current_habdec_clients ) {

	function eqSet(as, bs) {
		if (as.size !== bs.size) return false;
		for (var a of as) if (!bs.has(a)) return false;
		return true;
	}

	var xhr = new XMLHttpRequest();
	xhr.open('GET', HABBOY_DATA_URL + "/habboy/api/v1/params");
	xhr.onload = function () {
		if (xhr.status == 200)
		{
			let new_habdec_clients = new Set( JSON.parse(xhr.responseText)['habdec_clients'] );
			if( !eqSet(new_habdec_clients, current_habdec_clients) )
				location.reload();
			setTimeout(() => { WatchForNewHabdecs( current_habdec_clients )	}, 3000);
		}
	};
	xhr.onerror = () => { setTimeout(() => { WatchForNewHabdecs( current_habdec_clients )	}, 3000); };
	xhr.send();
}

/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

function HB_BuildAll(habboy_main_div) {

	Highcharts.theme = HB_highcharts_theme();
	Highcharts.setOptions(Highcharts.theme);

	// main TABs
	//
	for(let i in HABBOY_PARAMS['habdec_clients'])
	{
		HB_TAB_BUILDERS_ARR.push(
			(parent_div)=> {
				return HB_BuildHabdec( parent_div, HABBOY_PARAMS['habdec_clients'][i] );
			}
		);
	}
	HB_TAB_BUILDERS_ARR.push(HB_BuildMap);
	HB_TAB_BUILDERS_ARR.push(HB_BuildGoogleMap);
	HB_TAB_BUILDERS_ARR.push(HB_BuildCharts);
	HB_TAB_BUILDERS_ARR.push(HB_BuildGauges);
	// HB_TAB_BUILDERS_ARR.push(HB_Habitat_Tracker); // seems it doesn't work without https
	HB_TAB_BUILDERS_ARR.push(HB_Habitat_SSDV);
	HB_TAB_BUILDERS_ARR.push(HB_Local_SSDV);
	// HB_TAB_BUILDERS_ARR.push(HB_Habitat_SSDV_Last);
	// HB_TAB_BUILDERS_ARR.push(function name(parent_div) { ExampleTabBuilder_img(parent_div, "img/test2.jpg"); return {"tab_name": "Stat", "tab_nav": []}; });
	HB_TAB_BUILDERS_ARR.push(HB_BuildRcvStats);
	// HB_TAB_BUILDERS_ARR.push(function name(parent_div) { ExampleTabBuilder_img(parent_div, "img/test2.jpg"); return "Diagnosics"; });
	HB_TAB_BUILDERS_ARR.push(HB_BuildInfo);
	HB_TAB_BUILDERS_ARR.push(HB_BuildConfig);

	HB_BuildGui(habboy_main_div);

	setTimeout(() => {
		WatchForNewHabdecs( new Set(HABBOY_PARAMS['habdec_clients']) )
	}, 3000);


	HB_HabBoyTimeOffset();
	UpdateVehicleLastSentence();
	HB_VEHICLES_TELEMETRY_Update();
	HB_VEHICLES_PREDICT_Update();
	HB_VEHICLES_PREDICT_HABITAT_Update();
	HB_HABBOY_GPS_Update();
	HB_HABBOY_INFO_Update();
	HB_SendChaseCar();

	/*var use_geolocation = false;
	if(use_geolocation)
		HB_DeviceLocationGPS(); // this requires https ...
	else
		HB_hw_iface("ws://" + HABBOY_HOST + ":5565");*/

	// CycleTabs();

	setTimeout(() => {
		window.dispatchEvent(new Event('resize'));
	}, 500);

}

function HABBOY_INIT(habboy_main_div) {

	Highcharts.setOptions({
		global:
		{
		// getTimezoneOffset:undefined
		// timezone:undefined
		// timezoneOffset:undefined
		useUTC:false
		// VMLRadialGradientURL:http://code.highcharts.com/{version}/gfx/vml-radial-gradient.png
		}
	});


	var xhr = new XMLHttpRequest();
	xhr.open('GET', HABBOY_DATA_URL + "/habboy/api/v1/params");
	xhr.onload = function () {
		if (xhr.status == 200)
		{
			HABBOY_PARAMS = JSON.parse(xhr.responseText);
			HABBOY_PAYLOAD_ID = HABBOY_PARAMS["payload_id"];
			HABBOY_PAYLOAD_CALLSIGN = HABBOY_PARAMS["callsign"];
			console.debug("HABBOY_PARAMS ", HABBOY_PARAMS);
			HB_BuildAll(habboy_main_div);
		}
		else
		{
			HABBOY_INIT(habboy_main_div);
		}
	};
	xhr.onerror = () => { setTimeout(() => { HABBOY_INIT(habboy_main_div) }, 3000); };
	xhr.send();
}