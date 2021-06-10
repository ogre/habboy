
function HB_map_style_default() {
	var land_type_min_zoom = 9;

	// var data_root = location.origin + "/habboy/open_street_map/vector_tiles/poland/";
	// var fonts = location.origin + "/habboy/open_street_map/font/{fontstack}/{range}.pbf";

	// var data_root = "http://" + HABBOY_URL + "/osm/poland_layered";
	// var fonts = "http://" + HABBOY_URL + "/osm/font/{fontstack}/{range}.pbf";

	var data_root = HABBOY_URL + "/osm/tiles";
	var fonts = HABBOY_URL + "/osm/font/{fontstack}/{range}.pbf";

	var data_path_template = "{z}/{x}/{y}.pbf";

	var green_opacity = .35;
	var farm_opacity = .35;
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
			"aeroway": {
				"type": "vector",
				"tiles": [data_root + "/aeroway/" + data_path_template],
				"minzoom": 5, "maxzoom": 15
			},
			"buildings": {
				"type": "vector",
				"tiles": [data_root + "/buildings/" + data_path_template],
				"minzoom": 14, "maxzoom": 15
			},
			"labels": {
				"type": "vector",
				"tiles": [data_root + "/labels/" + data_path_template],
				"minzoom": 5, "maxzoom": 15
			},
			"landuse": {
				"type": "vector",
				"tiles": [data_root + "/landuse/" + data_path_template],
				"minzoom": 5, "maxzoom": 15
			},
			"roads": {
				"type": "vector",
				"tiles": [data_root + "/roads/" + data_path_template],
				"minzoom": 5, "maxzoom": 15
			},
			"water": {
				"type": "vector",
				"tiles": [data_root + "/water/" + data_path_template],
				"minzoom": 5, "maxzoom": 15
			},
			"admin": {
				"type": "vector",
				"tiles": [data_root + "/admin/" + data_path_template],
				"minzoom": 5, "maxzoom": 15
			}
		},


		"layers": [

			{
				"id": "background",
				"type": "background",
				"paint": {
					"background-color": "hsl(47, 2%, 10%)"
				}
			},

			{
				"id": "natural_other",
				"type": "fill",
				"source": "landuse",
				"source-layer": "natural_other",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(20,50,20)",
					"fill-opacity": green_opacity
				},
			},

			{
				"id": "soil",
				"type": "fill",
				"source": "landuse",
				"source-layer": "soil",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(70,40,35)",
					"fill-opacity": farm_opacity
				},
			},

			{
				"id": "landuse_other",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(20,20,20)",
					"fill-opacity": .75
				},
				"filter": [
					"!in",
					"class",
					"forest", "national_park", "reservoir", "park", "grass", "farmland", "farmyard", "residential",
					"commercial", "construction", "industrial", "retail"
				],
			},

			{
				"id": "landuse_forest",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(0,80,0)",
					"fill-opacity": green_opacity
				},
				"filter": [
					"in",
					"class",
					"forest", "national_park", "reservoir"
				],
			},

			{
				"id": "landuse_park",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(0,120,0)",
					"fill-opacity": green_opacity
				},
				"filter": [
					"==",
					"class",
					"park"
				],
			},

			{
				"id": "landuse_grass",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(30,120,30)",
					"fill-opacity": green_opacity
				},
				"filter": [
					"==",
					"class",
					"grass"
				],
			},

			{
				"id": "landuse_farmland",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": 10,
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "hsl(45, 0.35, 0.333)",
					"fill-opacity": farm_opacity
				},
				"filter": [
					"in",
					"class",
					"farmland", "farmyard"
				],
			},

			{
				"id": "landuse_residential",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(30,30,30)",
					"fill-opacity": 1
				},
				"filter": [
					"==",
					"class",
					"residential"
				],
			},

			{
				"id": "landuse_com",
				"type": "fill",
				"source": "landuse",
				"source-layer": "landuse",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(30,30,30)",
					"fill-opacity": 1
				},
				"filter": [
					"in",
					"class",
					"commercial", "construction", "industrial", "retail"
				],
			},

			{
				"id": "wood",
				"type": "fill",
				"source": "landuse",
				"source-layer": "wood",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(0,80,60)",
					"fill-opacity": green_opacity
				}
			},

			{
				"id": "bush",
				"type": "fill",
				"source": "landuse",
				"source-layer": "bush",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(0,120,90)",
					"fill-opacity": green_opacity
				}
			},

			{
				"id": "river",
				"type": "line",
				"source": "water",
				"source-layer": "river",
				"maxzoom": 15,
				"paint": {
					"line-color": "rgb(0,50,150)",
					"line-width": 1.5
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
				"source-layer": "mud",
				"minzoom": land_type_min_zoom,
				"paint": {
					"fill-color": "rgb(80,50,20)",
					"fill-opacity": water_opacity
				},
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
					// [
					//   "==",
					//   "admin_level",
					//   4
					// ]
				],
				"paint": {
					"line-color": "rgb(0,150,0)",
					"line-width": 1
				}
			},

			{
				"id": "aeroway",
				"type": "fill",
				"source": "aeroway",
				"source-layer": "aeroway",
				"minzoom": 9,
				"paint": {
					"fill-color": "rgb(180,130,0)"
				},
			},

			{
				"id": "aeroway_other",
				"type": "fill",
				"source": "aeroway",
				"source-layer": "aeroway_other",
				"minzoom": 9,
				"paint": {
					"fill-color": "rgb(180,0,0)"
				},
				// "filter": [ "==", "$type", "Polygon" ]
			},

			{
				"id": "road_other",
				"type": "line",
				"source": "roads",
				"source-layer": "road_other",
				"paint": {
					"line-color": "rgb(110,90,80)",
					"line-width": {
						"base": 1.8,
						"stops": [
							[
								4,
								0.25
							],
							[
								20,
								30
							]
						]
					}
				}
			},

			{
				"id": "road_tertiary",
				"type": "line",
				"source": "roads",
				"source-layer": "road_tertiary",
				"paint": {
					"line-color": "rgb(150,100,50)",
					"line-width": {
						"base": 1.55,
						"stops": [
							[
								4,
								0.25
							],
							[
								20,
								30
							]
						]
					}
				}
			},

			{
				"id": "road_secondary",
				"type": "line",
				"source": "roads",
				"source-layer": "road_secondary",
				"paint": {
					"line-color": "rgb(150,100,50)",
					"line-width": {
						"base": 1.4,
						"stops": [
							[
								6,
								0.5
							],
							[
								20,
								30
							]
						]
					}
				}
			},

			{
				"id": "road_main",
				"type": "line",
				"source": "roads",
				"source-layer": "road_main",
				"paint": {
					"line-color": "rgb(150,30,0)",
					"line-width": 2,
					// {
					// 	"base": 1.5,
					// 	"stops": [
					// 		[
					// 			6,
					// 			0.5
					// 		],
					// 		[
					// 			20,
					// 			30
					// 		]
					// 	]
					// }
				}
			},

			{
				"id": "railway",
				"type": "line",
				"source": "roads",
				"source-layer": "railway",
				"paint": {
					"line-color": "rgb(80,80,80)",
					"line-width": {
						"base": 2.5,
						"stops": [
							[
								6,
								0.5
							],
							[
								20,
								30
							]
						]
					},
					"line-dasharray": [
						6,
						3
					]
				}
			},

			{
				"id": "building",
				"type": "fill",
				"source": "buildings",
				"source-layer": "building",
				"paint": {
					// "fill-color": "rgb(110,95,95)",
					"fill-color": "rgb(45,47,55)",
					// "fill-opacity": .15
				}
				// ,"filter": ["==", "$type", "Polygon"]
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
							[
								6,
								12
							],
							[
								12,
								16
							]
						]
					}
				},
				"paint": {
					// "text-color": "rgb(120,150,200)",
					"text-color": "hsl(220,0.4,0.8)",
					"text-halo-color": "rgba(0,0,0,0.75)",
					"text-halo-width": 1,
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
							[
								6,
								12
							],
							[
								12,
								16
							]
						]
					}
				},
				"paint": {
					// "text-color": "rgb(120,150,200)",
					"text-color": "hsl(220,0.4,0.8)",
					"text-halo-color": "rgba(0,0,0,0.75)",
					"text-halo-width": 1,
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
						"base": 1.4,
						"stops": [
							[
								10,
								8
							],
							[
								20,
								14
							]
						]
					}
				},
				"paint": {
					// "text-color": "rgb(120,150,200)",
					"text-color": "hsl(220,0.4,0.8)",
					"text-halo-color": "rgba(0,0,0,0.75)",
					"text-halo-width": 1,
					"text-halo-blur": 1
				}
			},
		] // layers
	};

	return style;
}
