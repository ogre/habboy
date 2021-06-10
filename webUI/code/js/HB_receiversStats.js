
function HB_RcvStats_UpdateSeries(chart) {
	let payload_id = HABBOY_PAYLOAD_ID;

	var xhr = new XMLHttpRequest();
	xhr.open('GET', HABBOY_DATA_URL + "/habboy/api/v1/payloads/" + payload_id + "/receiver_stats");
	xhr.onload = function () {
		if (xhr.status == 200)
		{
			var data = JSON.parse(xhr.responseText);
			var series_data = [];
			for(receiver in data)
				series_data.push( [receiver, data[receiver]] );
			chart.series[0].update( {data: series_data}, true);

			setTimeout(() => {
				HB_RcvStats_UpdateSeries(chart)
			}, 3000);
		}
		else
		{
			console.debug("HB_RcvStats_UpdateSeries failed. Status:", xhr.status);
			console.debug("HB_RcvStats_UpdateSeries failed URL: ", HABBOY_DATA_URL + "/habboy/api/v1/payloads/" + payload_id + "/receiver_stats");
			setTimeout(() => {
				HB_RcvStats_UpdateSeries(chart)
			}, 3000);
		}
	};
	xhr.onerror = () => { setTimeout(() => {
		console.debug("HB_RcvStats_UpdateSeries failed. Status:", xhr.status);
		console.debug("HB_RcvStats_UpdateSeries failed URL: ", HABBOY_DATA_URL + "/habboy/api/v1/payloads/" + payload_id + "/receiver_stats");
		setTimeout(() => {
			HB_RcvStats_UpdateSeries(chart)
		}, 3000);
	}, 3000); };
	xhr.send();
}


function HB_BuildRcvStatsChart() {
	var HB_bg = HB_get_css_val('--HB_bg');
	var HB_text_highlight = HB_get_css_val('--HB_text_highlight');
	var HB_tab_button = HB_get_css_val('--HB_tab_button');

	var chart_div = document.createElement('div');

	var chart = new Highcharts.Chart({
		chart: {
			renderTo: chart_div,
			type: 'pie',
			animation: false,
			plotBackgroundColor: null,
			plotBackgroundImage: null,
			plotBorderWidth: 0,
			plotShadow: false,
		},
		title: {
			text: "Receivers Stats",
			align: 'center',
			verticalAlign: 'middle',
			style: { fontFamily: 'monospace', color: HB_text_highlight },
			y: 85
		},
		plotOptions: {
			pie: {
				dataLabels: {
					enabled: true,
					// distance: -50,
					style: {
						fontSize: "20px",
						color: "#0EA",
						textOutline: "0px",
						fontWeight: 'bold',
					},
					format: '<b>{point.name}</b>: {point.y}'
				},
				startAngle: -90,
				endAngle: 90,
				center: ['50%', '75%'],
				size: '110%'
			}
		},
		series: [{
			innerSize: '50%',
			type: 'pie',
			name: 'Receivers Stats',
			// data: [ ['xxx', 23], ['yyy', 23], ['zzz', 54] ]
		}]
	});

	HB_RcvStats_UpdateSeries(chart);

	return chart_div;
}


function HB_BuildRcvStats(parent_div) {
	var charts_div = document.createElement("div");
	charts_div.id = "HB_RcvStats";
	parent_div.appendChild(charts_div);

	var grid = document.createElement("div");
	grid.style.display = "grid";
	grid.style.gridTemplateColumns = "auto auto auto";
	grid.style.width = "100%";
	grid.style.height = "100%";
	charts_div.appendChild(grid);

	var graph_container = HB_BuildRcvStatsChart();
	grid.appendChild(graph_container);

	return {"tab_name": "RcvStats", "tab_nav": []};

}
