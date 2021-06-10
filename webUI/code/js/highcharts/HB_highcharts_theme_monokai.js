function HB_highcharts_theme() {

	var HB_bg = HB_get_css_val('--HB_bg');
	var HB_text = HB_get_css_val('--HB_text');
	var HB_text_highlight = HB_get_css_val('--HB_text_highlight');

	// based on monokai
	// http://jkunst.com/highcharts-themes-collection/

	var res =
	{
		"colors": ["#F92672", "#66D9EF", "#A6E22E", "#A6E22E"],
		"chart": {
			"backgroundColor": HB_bg,
			"style": {
				// "fontFamily": "Inconsolata",
				"color": HB_text_highlight
			}
		},
		"title": {
			"style": {
				"color": "#A2A39C"
			},
			"align": "left"
		},
		"subtitle": {
			"style": {
				"color": "#A2A39C"
			},
			"align": "left"
		},
		"legend": {
			"align": "right",
			"verticalAlign": "bottom",
			"itemStyle": {
				"fontWeight": "normal",
				"color": "#A2A39C"
			}
		},
		"xAxis": {
			"gridLineDashStyle": "Dot",
			"gridLineWidth": 1,
			"gridLineColor": "#A2A39C",
			"lineColor": "#A2A39C",
			"minorGridLineColor": "#A2A39C",
			"tickColor": "#A2A39C",
			"tickWidth": 1
		},
		"yAxis": {
			"gridLineDashStyle": "Dot",
			"gridLineColor": "#A2A39C",
			"lineColor": "#A2A39C",
			"minorGridLineColor": "#A2A39C",
			"tickColor": HB_text_highlight,
			"tickWidth": 1
		}
	}

	return res;
}