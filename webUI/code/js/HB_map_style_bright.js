
function HB_map_style_bright() {
	var land_type_min_zoom = 9;

	// var data_root = location.origin + "/habboy/open_street_map/vector_tiles/poland/";
	// var fonts = location.origin + "/habboy/open_street_map/font/{fontstack}/{range}.pbf";

	// var data_root = "http://" + HABBOY_URL + "/osm/poland_layered";
	// var fonts = "http://" + HABBOY_URL + "/osm/font/{fontstack}/{range}.pbf";

	var data_root = HABBOY_URL + "/osm/tiles";
	var fonts = HABBOY_URL + "/osm/font/{fontstack}/{range}.pbf";

	var data_path_template = "{z}/{x}/{y}.pbf";

	var green_opacity = .5;
	var farm_opacity = .5;
	var water_opacity = .65;

	var style =
	{
		// "id": "g61ohl2cd",
		"version": 8,
		"name": "hab",
		"metadata": {
			"mapbox:autocomposite": true,
			"mapbox:type": "template"
		},

		"glyphs": fonts,

		// minzoom / maxzoom must be the same as in .json
		"sources": {
			"landuse": {
				"type": "vector",
				"tiles": [data_root + "/landuse/" + data_path_template],
				"minzoom": 9, "maxzoom": 14
			},
			"water": {
				"type": "vector",
				"tiles": [data_root + "/water/" + data_path_template],
				"minzoom": 5, "maxzoom": 14
			},
			"aeroway": {
				"type": "vector",
				"tiles": [data_root + "/aeroway/" + data_path_template],
				"minzoom": 9, "maxzoom": 14
			},
			"roads": {
				"type": "vector",
				"tiles": [data_root + "/roads/" + data_path_template],
				"minzoom": 5, "maxzoom": 14
			},
			"buildings": {
				"type": "vector",
				"tiles": [data_root + "/buildings/" + data_path_template],
				"minzoom": 15, "maxzoom": 15
			},
			"labels": {
				"type": "vector",
				"tiles": [data_root + "/labels/" + data_path_template],
				"minzoom": 6, "maxzoom": 15
			},
			"admin": {
				"type": "vector",
				"tiles": [data_root + "/admin/" + data_path_template],
				"minzoom": 5, "maxzoom": 10
			}
		},


		// layers order determines drawing order
		"layers": [
			{
				"id": "background",
				"type": "background",
				"paint": {
					"background-color": "hsl(0, 0%, 100%)"
				}
			},

			{
				"id": "natural_other",
				"type": "fill",
				"source": "landuse",
				"source-layer": "natural",
				"minzoom": land_type_min_zoom,
				// "maxzoom": land_type_max_zoom,
				"paint": {
					"fill-color": "hsl(60, .8, .75)",
					"fill-opacity": green_opacity
				},
			},

			{
				"id": "land_other",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				// "maxzoom": land_type_max_zoom,
				"paint": {
					"fill-color": "hsl(25, .85, .75)",
					"fill-opacity": .25
				},
				"filter": [
					"!in",
					"class",
					"wood", "forest", "national_park", "reservoir",
					"park", "grass", "bush",
					"soil", "farmland", "farmyard",
					"residential", "commercial", "construction", "industrial", "retail",
				],
			},

			{
				"id": "woods",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				// "maxzoom": land_type_max_zoom,
				"paint": {
					"fill-color": "hsl(90, 1.0, .75)",
					"fill-opacity": green_opacity
				},
				"filter": [
					"in",
					"class",
					"wood", "forest", "national_park", "reservoir"
				],
			},

			{
				"id": "park",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				// "maxzoom": land_type_max_zoom,
				"paint": {
					"fill-color": "hsl(100, .85, .85)",
					"fill-opacity": green_opacity
				},
				"filter": [
					"in",
					"class",
					"park", "grass", "bush"
				],
			},

			{
				"id": "farm",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				// "maxzoom": land_type_max_zoom,
				"paint": {
					"fill-color": "hsl(45, 0.85, 0.75)",
					"fill-opacity": farm_opacity
				},
				"filter": [
					"in",
					"class",
					"soil", "farmland", "farmyard"
				],
			},

			{
				"id": "civil",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				// "maxzoom": land_type_max_zoom,
				"paint": {
					"fill-color": "hsl(20, .0, .85)",
				},
				"filter": [
					"in",
					"class",
					"residential", "commercial", "construction", "industrial", "retail"
				],
			},


			{
				"id": "river",
				"type": "line",
				"source": "water",
				"source-layer": "river",
				"minzoom": 9,
				"paint": {
					"line-color": "rgb(0,50,150)",
					"line-opacity": water_opacity,
					"line-width": {
						"base": 2,
						"stops": [
							[9, 2],
							[10, 5]
						]
					}
				},
				"filter": [
					"all",
					[
						"==",
						"$type",
						"LineString"
					],
					[
						"in",
						"class",
						"river",
						"canal",
						// "stream"
					]
				],
			},

			{
				"id": "water",
				"type": "fill",
				"source": "water",
				"source-layer": "water",
				"minzoom": 9,
				"paint": {
					"fill-color": "hsl(225, .35, .45)",
					"fill-opacity": water_opacity
				},
				"filter": [
					"in",
					"class",
					"riverbank", "water"
				]
			},

			{
				"id": "wetland",
				"type": "fill",
				"source": "water",
				"source-layer": "water",
				"minzoom": land_type_min_zoom,
				// "maxzoom": land_type_max_zoom,
				"paint": {
					"fill-color": "hsl(205, .3, .37)",
					"fill-opacity": water_opacity
				},
				"filter": [
					"==",
					"class",
					"wetland"
				]
			},

			{
				"id": "mud",
				"type": "fill",
				"source": "water",
				"source-layer": "water",
				"minzoom": land_type_min_zoom,
				// "maxzoom": land_type_max_zoom,
				"paint": {
					"fill-color": "rgb(80,50,20)",
					"fill-opacity": water_opacity
				},
				"filter": [
					"==",
					"class",
					"mud"
				]
			},

			{
				"id": "admin",
				"type": "line",
				"source": "admin",
				"source-layer": "admin",
				"filter": [
					"all",
					[
						"==",
						"$type",
						"Polygon"
					],
				],
				"paint": {
					"line-color": "rgb(0,110,0)",
					"line-width": 3
				}
			},

			{
				"id": "aeroway",
				"type": "fill",
				"source": "aeroway",
				"source-layer": "aeroway",
				"minzoom": 8,
				"filter": [
					"!in", "class", "terminal", "hangar"
				],
				"paint": {
					"fill-color": "rgb(255,90,0)",
					"fill-opacity": 0.5
				},
			},

			{
				"id": "aeroway_buildings",
				"type": "fill",
				"source": "aeroway",
				"source-layer": "aeroway",
				"minzoom": 14,
				"filter": [
					"in", "class", "terminal", "hangar"
				],
				"paint": {
					"fill-color": "rgb(180,20,0)"
				},
			},

			{
				"id": "road_other",
				"type": "line",
				"source": "roads",
				"source-layer": "roads",
				"minzoom": 14, // one less than buildings
				"filter": [
					"in",
					"class",
					"track", "road", "living_street", "residential", "footway"
				],
				"paint": {
					"line-color": "rgb(110,90,80)",
					// "line-width": 3
					"line-width": {
						"base": 2,
						"stops": [
							[10, 0.25],
							[14, 1.5]
						]
					}
				}
			},

			{
				"id": "road_tertiary",
				"type": "line",
				"source": "roads",
				"source-layer": "roads",
				"minzoom": 10,
				"filter": [
					"in",
					"class",
					"tertiary", "tertiary_link", "unclassified"
				],
				"paint": {
					"line-color": "rgb(145,120,110)",
					"line-width": {
						"base": 2,
						"stops": [
							[10, 0.8],
							[14, 3]
						]
					}
				}
			},

			{
				"id": "road_secondary",
				"type": "line",
				"source": "roads",
				"source-layer": "roads",
				"filter": [
					"in",
					"class",
					"motorway_link",
					"trunk_link",
					"primary_link",
					"secondary",
					"secondary_link",
				],
				"paint": {
					"line-color": "rgb(200,133,66)",
					"line-width": {
						"base": 2,
						"stops": [
							[8, 2],
							[11, 4]
						]
					}
				},
				"layout": {
					"line-cap": "round",
					"line-join": "miter"
				}
			},

			{
				"id": "road_main",
				"type": "line",
				"source": "roads",
				"source-layer": "roads",
				"filter": [
					"in",
					"class",
					"motorway",
					"trunk",
					"primary",
				],
				"paint": {
					"line-color": "rgb(200,0,0)",
					"line-width": {
						"base": 2,
						"stops": [
							[5, 3],
							[9, 6.5]
						]
					}
				},
				"layout": {
					"line-cap": "round",
					"line-join": "round"
				}
			},

			{
				"id": "railways",
				"type": "line",
				"source": "roads",
				"source-layer": "railways",
				"minzoom": 13,
				"paint": {
					"line-color": "rgb(80,80,80)",
					"line-width": 2,
					"line-dasharray": [6, 3]
				}
			},

			{
				"id": "building",
				"type": "fill",
				"source": "buildings",
				"source-layer": "building",
				"paint": {
					"fill-color": "hsl(220, .15, .8)",
					// "fill-opacity": .15
				}
			},

			{
				"id": "place_city",
				"type": "symbol",
				"source": "labels",
				"source-layer": "place_label",
				"filter": [
					"all",
					[
						"==",
						"$type",
						"Point"
					],
					[
						"in",
						"type",
						"capital",
						"city",
						"town"
					],
					[
						">=",
						"scalerank",
						5
					]
				],
				"layout": {
					"text-field": "{name}",
					"text-font": [
						"Open Sans Semibold"
					],
					"text-max-width": 6,
					"text-size": {
						"stops": [
							[10,20],
							[15,30]
						]
					}
				},
				"paint": {
					// "text-color": "hsl(220, 0.4, 1)",
					"text-color": "rgb(80,255,255)",
					"text-halo-color": "rgba(0,0,0,1)",
					"text-halo-width": 2,
					"text-halo-blur": 1
				}
			},

			{
				"id": "place_other",
				"type": "symbol",
				"source": "labels",
				"source-layer": "place_label",
				"minzoom": 12,
				"filter": [
					"all",
					[
						"==",
						"$type",
						"Point"
					],
					[
						"!in",
						"type",
						"capital",
						"city",
						"town"
					],
					// [
					//   "<",
					//   "scalerank",
					//   7
					// ]
				],
				"layout": {
					"text-field": "{name}",
					"text-font": [
						"Open Sans Semibold"
					],
					"text-max-width": 6,
					"text-size": {
						"stops": [
							// [6,12],
							// [12,16]
							[10,10],
							[15,15]
						]
					}
				},
				"paint": {
					// "text-color": "hsl(220,0.4,.8)",
					"text-color": "rgb(80,255,255)",
					"text-halo-color": "rgba(0,0,0,1)",
					"text-halo-width": 2,
					"text-halo-blur": 1
				}
			},

			{
				"id": "road_label",
				"type": "symbol",
				"source": "labels",
				"source-layer": "road_label",
				"filter": [
					"all",
					[
						"==",
						"$type",
						"LineString"
					],
				],
				"layout": {
					"symbol-placement": "line",
					"text-field": "{name}",
					"text-font": [
						"Open Sans Semibold"
					],
					"text-transform": "uppercase",
					"text-letter-spacing": 0.1,
					"text-size": {
						// "base": 1.4,
						"base": 2,
						"stops": [
							// [10,8],
							// [20,14]
							[10,10],
							[15,15]
						]
					}
				},
				"paint": {
					"text-color": "rgb(0,0,0)",
					"text-halo-color": "rgba(255,255,255,1)",
					"text-halo-width": 2,
					"text-halo-blur": 1
				}
			},

		] // layers
	}; // STYLE



	return style;
}
