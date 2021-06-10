

function SentenceTimeToEpoch(i_str) { // isoformat 1970-01-01T12:00:00.0+00:00
	var result = Date.parse(i_str);
	return result;
}


function hashCode(str) // java String#hashCode
{
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function stringToRGB(i)
{
	var hash = hashCode(i);
	var r = (hash & 0xFF0000) >> 16;
	var g = (hash & 0x00FF00) >> 8;
	var b = hash & 0x0000FF;
	return [r,g,b];
}

function HB_SensorColor(i_sensor_name, i_brightness) {
	var RGB = [50,50,50];
	if(i_sensor_name == "altitude")						RGB = [0,200,0];
	else if(i_sensor_name == "altitude")				RGB = [0,100,0];
	else if(i_sensor_name == "temperature_internal")	RGB = [150,50,50];
	else if(i_sensor_name == "temperature_external")	RGB = [0,25,125];
	else if(i_sensor_name == "pressure")				RGB = [150,25,7];
	else {
		RGB = stringToRGB( i_sensor_name );
		// fix minimum brightbess
		RGB[0] = 55 + Math.floor(.77*RGB[0]);
		RGB[1] = 55 + Math.floor(.77*RGB[1]);
		RGB[2] = 55 + Math.floor(.77*RGB[2]);
	}

	RGB[0] *= i_brightness;
	RGB[1] *= i_brightness;
	RGB[2] *= i_brightness;

	return "rgb(" + RGB[0] + "," + RGB[1] + "," + RGB[2] + ")";
}

function HB_GenericGraph_UpdateSeries_New(sensor, chart, data) {
	if(!(sensor in data))
		return;

	var _now = new Date().getTime();
	// console.debug( data[sensor]['times'][data[sensor]['times'].length-1] );
	// console.debug( SentenceTimeToEpoch(data[sensor]['times'][data[sensor]['times'].length-1]) );
	// console.debug( _now );
	var time_samples = []; // array of [time,value] pairs
	var time_samples_dVdT = []; // array of [time,delta_value] pairs
	var hour_as_milisecs = 3600 * 1000;
	for(var i=0; i<data[sensor]['values'].length; ++i) {
		var _t = SentenceTimeToEpoch( data[sensor]['times'][i] );
		if( Math.abs(_now-_t) < 3*hour_as_milisecs) { // only last 3 hours
			time_samples.push( 	 [_t, data[sensor]['values'][i]] );
			time_samples_dVdT.push([_t, data[sensor]['dVdT'][i]] );
		}
	}

	// add series to graph if new
	if(!chart.series.length)
	{
		chart.addSeries( {
				type: "line",
				"name": sensor,
				"color": HB_SensorColor(sensor, 1.0),
				data: time_samples
			}	, 1 /*redraw*/);

		chart.addSeries( {
				type: "line",
				"name": sensor + "/ dT",
				"color": HB_SensorColor(sensor, .5),
				data: time_samples_dVdT,
				yAxis: 1,
			}	, 1 /*redraw*/);
	}
	else // or append new data
	{
		// only add last data point and only if newer than 30 seconds
		var last_point_in_graph = chart.series[0].data[ chart.series[0].data.length - 1 ];
		var last_point_in_graph_timestamp = last_point_in_graph.x;
		var _last_i = time_samples.length - 1;
		var _last_time = time_samples[_last_i][0];
		if( (_last_time - last_point_in_graph_timestamp) > 15e3 ) { // add every 15 seconds
			chart.series[0].addPoint( time_samples[_last_i] );
			chart.series[1].addPoint( time_samples_dVdT[_last_i] );
		}
	}
}

function HB_BuildSensorChart_GenericGraph(sensor) {
	var chart_div = document.createElement('div');

	var chart = new Highcharts.Chart({
		chart: {
			renderTo: chart_div,
			type: 'line',
			zoomType: 'x',
			animation: false,
		},
		title: {
			text: sensor,
			style: { fontFamily: 'monospace', color: "hsl(32, 93%, 45%)" }
		},
		xAxis: {
			type: 'datetime',
		},
		yAxis: [ { title: {text: sensor} }, // values
				 { title: {text: sensor + " / dT"}, opposite: true }], // values / dT
		plotOptions: {
			series: {
				animation: false
			}
		},
		series: []
	});

	return [chart_div, chart];
}


function HB_BuildCharts_AllSensors(parent_div) {
	let payload_id = HABBOY_PAYLOAD_ID;

	if( !(payload_id in HB_VEHICLES_TELEMETRY) )
	{
		console.debug("HB_BuildCharts_AllSensors - No telemetry for " + payload_id);
		setTimeout(() => {
			HB_BuildCharts_AllSensors(parent_div)
		}, 1000);
		return;
	}

	var grid = document.createElement("div");
	grid.style.display = "grid";
	grid.style.gridTemplateColumns = "auto auto auto";
	grid.style.width = "100%";
	grid.style.height = "100%";
	parent_div.appendChild(grid);

	for (let sensor in HB_VEHICLES_TELEMETRY[payload_id]) {
		if( 	sensor == "latitude"
			|| 	sensor == "longitude"
			|| 	sensor == "time"
			|| 	sensor == "sentence_id"
			|| 	! HB_VEHICLES_TELEMETRY[payload_id][sensor]["is_numeric"]
		)
			continue;

		let _t = HB_BuildSensorChart_GenericGraph(sensor);
		let chart_container = _t[0];
		let chart = _t[1];
		grid.appendChild(chart_container);

		// initialize with data
		HB_GenericGraph_UpdateSeries_New(sensor, chart, HB_VEHICLES_TELEMETRY[payload_id]);

		// update chart on each telemetry update
		console.debug("Register telemetry callback for chart  ", sensor);
		HB_VEHICLES_TELEMETRY_UpdateCallbacks.push(
			(sensor_update_data) => {
				HB_GenericGraph_UpdateSeries_New(sensor, chart, sensor_update_data);
			}
		)
	}
}

function HB_BuildCharts(parent_div) {
	var charts_div = document.createElement("div");
	charts_div.id = "HB_CHARTS";
	charts_div.style.width = '100%';
	charts_div.style.height = '100%';
	parent_div.appendChild(charts_div);

	HB_BuildCharts_AllSensors(charts_div);

	return {"tab_name": "Graphs", "tab_nav": []};
}
