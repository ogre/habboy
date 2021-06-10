
function HB_Gauge_UpdateSeries_New(sensor, chart, data) {
	var _l = data[sensor]['values'].length;
	var val = data[sensor]['values'][_l-1];
	chart.series[0].points[0].update( [0, val] ); // time is not important, only life is
}


function HB_BuildSensorGauge(sensor) {
	var HB_bg = HB_get_css_val('--HB_bg');
	var HB_text_highlight = HB_get_css_val('--HB_text_highlight');
	var HB_tab_button = HB_get_css_val('--HB_tab_button');

	var chart_div = document.createElement('div');

	var y_axis = {
		min: -100,
		max: 100,
		minorTickLength: 7,
		tickLength: 13
	}

	if (sensor == "elev") {
		y_axis.min = 0;
		y_axis.max = 500;
	}
	else if (sensor == "altitude") {
		y_axis.min = 0;
		y_axis.max = 50000;
		y_axis.plotBands = [{
            from: 0,
            to: 10000,
            color: '#008811' // green
        }, {
            from: 10000,
            to: 30000,
            color: '#aaaa00' // yellow
        }, {
            from: 30000,
            to: 40000,
            color: '#aa0000' // red
		}, {
            from: 40000,
            to: 50000,
            color: '#8800bb' // purple
		}

		]
	}

	var chart = new Highcharts.Chart({
		chart: {
			renderTo: chart_div,
			type: 'gauge',
			animation: false,
			plotBackgroundColor: null,
			plotBackgroundImage: null,
			plotBorderWidth: 0,
			plotShadow: false,
		},
		title: {
			text: sensor,
			style: { fontFamily: 'monospace', color: "hsl(32, 93%, 45%)" }
		},
		pane: {
			startAngle: -150,
			endAngle: 150,
			background: [{
				backgroundColor: null,
				borderColor: HB_tab_button,
				borderWidth: 3,
				outerRadius: '109%',
			}]
		},
		yAxis: y_axis,
		plotOptions: {
			gauge: {
                pivot: {
					radius: 5,
					backgroundColor: "hsl(32, 93%, 40%)"
				}
			},
			series: {
				dial: {
                    backgroundColor: "hsl(32, 93%, 25%)",
                    radius: '80%',
                    baseWidth: 12,
					baseLength: '5%',
					rearWidth: 1,
					rearLength: '0%',
                },
				dataLabels: {
					enabled: true,
					borderWidth: 0,
					style: {
						"color": HB_text_highlight,
						"fontSize": "20px",
						"fontWeight": "bold",
						"textOutline": "0px"
					}
				}
			}
		},
		series: [{
			name: sensor,
			data: [0]
		}]
	});

	return [chart_div, chart];
}


function HB_BuildGauges_AllSensors(parent_div) {
	let payload_id = HABBOY_PAYLOAD_ID;

	if(HB_VEHICLES_TELEMETRY[payload_id] == undefined)
	{
		setTimeout(() => {
			HB_BuildGauges_AllSensors(parent_div)
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
		if (sensor == "latitude"
			|| sensor == "longitude"
			|| sensor == "time"
			|| sensor == "sentence_id"
			|| 	! HB_VEHICLES_TELEMETRY[payload_id][sensor]["is_numeric"]
		)
			continue;

		let _t = HB_BuildSensorGauge(sensor);
		let chart_container = _t[0];
		let chart = _t[1];
		grid.appendChild(chart_container);

		// update chart on each telemetry update
		console.debug("Register telemetry callback for gauge  ", sensor);
		HB_VEHICLES_TELEMETRY_UpdateCallbacks.push(
			(sensor_update_data) => {
				HB_Gauge_UpdateSeries_New(sensor, chart, sensor_update_data);
			}
		)
	}
}


function HB_BuildGauges(parent_div) {
	var charts_div = document.createElement("div");
	charts_div.id = "HB_GAUGES";
	parent_div.appendChild(charts_div);

	HB_BuildGauges_AllSensors(charts_div);

	return {"tab_name": "Gauge", "tab_nav": []};

}
