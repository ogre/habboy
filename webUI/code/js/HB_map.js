
var HB_MAP;
var HB_Map_FollowDevice = 0;    // autozoom to show this device on map
var HB_Map_FollowHabBoy = 0;    // autozoom to show habboy server
var HB_Map_FollowPayloads = 0;  // autozoom to show all vehicles on map
var HB_Map_FollowLanding = 0;   // autozoom to show this device on map
var HB_Map_Bearing = false;         // rotate map to match HabBoy GPS bearing

function CreateRadioHorizon(lat, lon, alt, points) {
	if(!points) points = 64;

	var coords = {
		latitude: lat,
		longitude: lon
	};

	var km = Math.sqrt(12.756 * alt); // horizon in kilometers

	var ret = [];
	var distanceX = km/(111.320*Math.cos(coords.latitude*Math.PI/180));
	var distanceY = km/110.574;

	var theta, x, y;
	for(var i=0; i<points; i++) {
		theta = (i/points)*(2*Math.PI);
		x = distanceX*Math.cos(theta);
		y = distanceY*Math.sin(theta);

		ret.push([coords.longitude+x, coords.latitude+y]);
	}
	ret.push(ret[0]);

	return  {
		"type": "FeatureCollection",
		"features": [{
			"type": "Feature",
			"geometry": {
				"type": "LineString",
				"coordinates": ret
			}
		}]
	};

};

function HB_BuildMap(parent_div) {

	var map_div = document.createElement("div");
	map_div.id = "map";
	parent_div.appendChild(map_div);

	var style = HB_map_style_simplified();
	// var style = HB_map_style_bright();

	// mapboxgl.workerCount = 1;
	HB_MAP = new mapboxgl.Map({
		container: map_div,
		center: [19.95, 52.15],
		zoom: 10,
		style: style,
		fadeDuration: 0,
		// pitch: 45,
		// bearing: -60, // bearing in degrees
	});

	// nav
	//
	HB_MAP.addControl(new mapboxgl.NavigationControl());

	// scale ctrl
	//
	var scale_ctrl = new mapboxgl.ScaleControl({
		maxWidth: 800,
		unit: 'metric'
	});
	HB_MAP.addControl(scale_ctrl);

	var nav_info = [];

	HB_MAP.on('load', function () {

		HB_MAP.loadImage('img/balloon.png', function (error, image) { HB_MAP.addImage('balloon', image); }); // , {"sdf": "true"}
		HB_MAP.loadImage('img/car.png', function (error, image) { HB_MAP.addImage('car', image); }); // , {"sdf": "true"}

		HB_MAP.addLayer({
			"id": "payloads",
			"type": "symbol", //"circle",
			"source": {
				type: 'geojson',
				data: {
					"type": "FeatureCollection",
					"features": []
				},
			},
			"layout": {
				"icon-image": "balloon",
				"icon-size": 1
			}
		});

		// this device layer
		//
		// HB_MAP.addLayer({
		//   "id": "DEVICE",
		//   "type": "circle",
		//   "source": {
		//   type: 'geojson', data: {
		//     "type": "Point",
		//     "coordinates": []
		//   }
		// }
		//   "paint": {
		//     "circle-radius": 10,
		//     "circle-color": "rgb(0,200,100)"
		//   }
		// });

		// payload path
		HB_MAP.addLayer(
			{
				'id': 'payloads_path',
				'type': 'line',
				'source': {
					'type': 'geojson',
					'data': {
						"type": "FeatureCollection",
						"features": [{
							"type": "Feature",
							"geometry": {
								"type": "LineString",
								"coordinates": []
							}
						}]
					}
				},
				'layout': {
					'line-cap': 'round',
					'line-join': 'round'
				},
				'paint': {
					// 'line-color': 'rgb(255,0,250)',
					'line-color': 'rgb(255,50,20)',
					'line-width': 5,
					'line-opacity': .5
				}
			}
			);

			// path predict
			HB_MAP.addLayer(
				{
					'id': 'payloads_predict',
					'type': 'line',
					'source': {
						'type': 'geojson',
						'data': {
							"type": "FeatureCollection",
							"features": [{
								"type": "Feature",
								"geometry": {
									"type": "LineString",
									"coordinates": []
								}
							}]
						}
					},
					'layout': {
						'line-cap': 'round',
						'line-join': 'round'
					},
					'paint': {
						'line-color': 'rgb(155,0, 255)',
						'line-width': 5,
						'line-opacity': .85
					}
				}
				);

				// path predict - habitat
				HB_MAP.addLayer(
					{
						'id': 'payloads_predict_habitat',
						'type': 'line',
						'source': {
							'type': 'geojson',
							'data': {
								"type": "FeatureCollection",
								"features": [{
									"type": "Feature",
									"geometry": {
										"type": "LineString",
										"coordinates": []
									}
								}]
							}
						},
						'layout': {
							'line-cap': 'round',
							'line-join': 'round'
						},
						'paint': {
							'line-color': 'rgb(255,50, 155)',
							'line-width': 5,
							'line-opacity': .85
						}
					}
					);

					// landing predict
					HB_MAP.addLayer({
						"id": "Landing",
						"type": "circle",
						"source": {
							type: 'geojson', data: {
								"type": "Point",
								"coordinates": []
							}
						},
						"paint": {
							"circle-radius": 10,
							"circle-color": 'rgb(155,0, 255)',
							"circle-stroke-color": "rgb(0,0,0)",
							"circle-stroke-width": 2
						}
					});

					// landing predict - HABITAT
					HB_MAP.addLayer({
						"id": "LandingHabitat",
						"type": "circle",
						"source": {
							type: 'geojson', data: {
								"type": "Point",
								"coordinates": []
							}
						},
						"paint": {
							"circle-radius": 10,
							"circle-color": 'rgb(255,50, 155)',
							"circle-stroke-color": "rgb(0,0,0)",
							"circle-stroke-width": 2
						}
					});

					// HABBOY layer
					HB_MAP.addLayer({
						"id": "HABBOY",
						"type": "circle",
						"source":{
							type: 'geojson', data: {
								"type": "Point",
								"coordinates": []
							}
						},
						"paint": {
							"circle-radius": 10,
							"circle-color": "rgb(0,255,0)",
							"circle-stroke-color": "rgb(0,0,0)",
							"circle-stroke-width": 2
						}
					});

					// payload radio horizon
					HB_MAP.addLayer(
						{
							'id': 'horizon',
							'type': 'line',
							'source': {
								'type': 'geojson',
								'data': {
									"type": "FeatureCollection",
									"features": [{
										"type": "Feature",
										"geometry": {
											"type": "LineString",
											"coordinates": []
										}
									}]
								}
							},
							'layout': {
								'line-cap': 'round',
								'line-join': 'round'
							},
							'paint': {
								'line-color': 'rgb(255,0,250)',
								'line-width': 2,
								'line-opacity': .5
							}
						}
						);

						HB_Map_PayloadPos(HABBOY_PAYLOAD_ID); // update positions of payloads and device
						HB_Map_AutoZoomAndBearing();

						// layers
						//
						var _temp = HB_Map_BuildLayersMenu(parent_div, HB_MAP);
						var layers_menu_button = _temp[0];
						var layers_buttons_arr = _temp[1];
						nav_info.push(layers_menu_button);

						// car and tracker autozoom
						//
						// _temp = HB_Map_BuildFollowButtons(parent_div, HB_MAP);
						_temp = HB_Map_BuildFollowButtons(parent_div);
						for(let i in _temp)
						nav_info.push(_temp[i]);

					}); // onload

					HB_VEHICLES_TELEMETRY_UpdateCallbacks.push(
						(telemetry_data) =>
						HB_Map_PayloadPathUpdate(HABBOY_PAYLOAD_ID, telemetry_data)
						);
						// HB_Map_PayloadPathUpdate(HABBOY_PAYLOAD_ID, HB_VEHICLES_TELEMETRY[HABBOY_PAYLOAD_ID]);

						HB_VEHICLES_TELEMETRY_UpdateCallbacks.push(HB_Map_PayloadPredictUpdate);

						// return "MAP";
						return { "tab_name": "MAP", "tab_nav": nav_info };
					}


					function HB_Map_BuildFollowButtons(parent_div/*, HB_MAP*/) {

						// device
						// let's not use DEVICE locations as this requires working over HTTPS
						/*
						var device_button = document.createElement("button");
						device_button.innerHTML = "Me";
						device_button.style.position = "absolute";
						device_button.style.bottom = "35vh";
						device_button.style.left = "0";
						device_button.style.height = "13%";
						device_button.style.width = "13%";
						if (HB_Map_FollowDevice)
						device_button.style.backgroundColor = HB_get_css_val('--HB_button_active');
						else
						device_button.style.backgroundColor = HB_get_css_val('--HB_button');
						device_button.onclick = function () {
							HB_Map_FollowDevice = !HB_Map_FollowDevice;
							if (HB_Map_FollowDevice)
							device_button.style.backgroundColor = HB_get_css_val('--HB_button_active');
							else
							device_button.style.backgroundColor = HB_get_css_val('--HB_button');
						};
						parent_div.appendChild(device_button);
						*/

						// HABBOY
						var habboy_button = document.createElement("button");
						habboy_button.innerHTML = "HabBoy";
						habboy_button.style.position = "absolute";
						habboy_button.style.bottom = "30vh";
						habboy_button.style.left = "0";
						habboy_button.style.height = "13%";
						habboy_button.style.width = "13%";
						if (HB_Map_FollowHabBoy)
						habboy_button.style.backgroundColor = HB_get_css_val('--HB_button_active');
						else
						habboy_button.style.backgroundColor = HB_get_css_val('--HB_button');
						habboy_button.onclick = function () {
							HB_Map_FollowHabBoy = !HB_Map_FollowHabBoy;
							if (HB_Map_FollowHabBoy)
							habboy_button.style.backgroundColor = HB_get_css_val('--HB_button_active');
							else
							habboy_button.style.backgroundColor = HB_get_css_val('--HB_button');
						};
						parent_div.appendChild(habboy_button);

						// payload
						var payload_button = document.createElement("button");
						payload_button.innerHTML = "Payload";
						payload_button.style.position = "absolute";
						payload_button.style.bottom = "45vh";
						payload_button.style.left = "0";
						payload_button.style.height = "13%";
						payload_button.style.width = "13%";
						if (HB_Map_FollowPayloads)
						payload_button.style.backgroundColor = HB_get_css_val('--HB_button_active');
						else
						payload_button.style.backgroundColor = HB_get_css_val('--HB_button');
						payload_button.onclick = function () {
							HB_Map_FollowPayloads = !HB_Map_FollowPayloads;
							if (HB_Map_FollowPayloads)
							payload_button.style.backgroundColor = HB_get_css_val('--HB_button_active');
							else
							payload_button.style.backgroundColor = HB_get_css_val('--HB_button');
						};
						parent_div.appendChild(payload_button);

						// landing spot
						// payload
						var landing_button = document.createElement("button");
						landing_button.innerHTML = "Land Spot";
						landing_button.style.position = "absolute";
						landing_button.style.bottom = "60vh";
						landing_button.style.left = "0";
						landing_button.style.height = "13%";
						landing_button.style.width = "13%";
						if (HB_Map_FollowLanding)
						landing_button.style.backgroundColor = HB_get_css_val('--HB_button_active');
						else
						landing_button.style.backgroundColor = HB_get_css_val('--HB_button');
						landing_button.onclick = function () {
							HB_Map_FollowLanding = !HB_Map_FollowLanding;
							if (HB_Map_FollowLanding)
							landing_button.style.backgroundColor = HB_get_css_val('--HB_button_active');
							else
							landing_button.style.backgroundColor = HB_get_css_val('--HB_button');
						};
						parent_div.appendChild(landing_button);

						// orient map button
						//
						var map_orient_bt = document.createElement("button");
						// map_orient_bt.innerHTML = String.fromCharCode(0x2b99);
						// map_orient_bt.innerHTML = '^';
						map_orient_bt.innerHTML = '^'; // compass symbol "&#x1f9ed;"
						map_orient_bt.style.position = "absolute";
						map_orient_bt.style.bottom = "75vh";
						map_orient_bt.style.left = "0";
						map_orient_bt.style.height = "13%";
						map_orient_bt.style.width = "13%";
						map_orient_bt.onclick = function () {
							HB_Map_Bearing = ! HB_Map_Bearing;
							if(HB_Map_Bearing)
							map_orient_bt.style.backgroundColor = HB_get_css_val('--HB_button_active');
							else
							map_orient_bt.style.backgroundColor = HB_get_css_val('--HB_button');
						}
						parent_div.appendChild(map_orient_bt);

						// return [device_button, payload_button, habboy_button];
						return [payload_button, habboy_button, landing_button, map_orient_bt];

					}


					function HB_Map_BuildLayersMenu(parent_div, map) {

						// menu content
						//
						var grid_div = document.createElement("div");
						grid_div.id = "HG_MapLayersGrid"
						grid_div.style.display = "none";
						grid_div.style.gridTemplateColumns = "auto auto auto auto";
						grid_div.style.width = "70%";
						grid_div.style.height = "50%";
						grid_div.style.position = "absolute";
						grid_div.style.bottom = "20vh";
						grid_div.style.left = "15%";
						// grid_div.style.zIndex = "-1";

						// menu button
						//
						var menu_button = document.createElement("button");
						menu_button.innerHTML = "Layers";
						menu_button.style.position = "absolute";
						menu_button.style.bottom = "15vh";
						menu_button.style.left = "0";
						menu_button.style.height = "13%";
						menu_button.style.width = "13%";
						menu_button.onclick = function () {
							if (grid_div.style.display === "grid")
							grid_div.style.display = "none";
							else if (grid_div.style.display === "none")
							grid_div.style.display = "grid";
						}

						// colors of buttons
						var color_button = HB_get_css_val('--HB_button');
						menu_button.style.background = color_button;



						var display_groups = {
							"green": [
								"landuse_forest",
								"wood",
								"landuse_park",
								"landuse_grass",
								"bush",
								"natural_other",
							],
							"farm": [
								"landuse_farmland",
								"country",
								"soil",
							],
							"water": [
								"water",
								"wetland",
								"mud",
								"river",
							],
							"other": [
								"landuse_residential",
								"landuse_com",
								"landuse_other",
							],
							"air": [
								"aeroway",
								"aeroway_other",
							],
							"road": [
								"road_main",
								"road_secondary",
								"road_tertiary",
								"road_other",
								"railway",
								// "river",
							],
							"buildings": [
								"building",
							],
							"admin": [
								"admin",
								"road_label",
								"place_city",
								"place_other"
							]
							// "background",
						};

						var layer_buttons = [];

						// for (let display_group of Object.keys(display_groups)) {
						var style = HB_map_style_bright();
						for (let display_group of style.layers) {
							var b = document.createElement('button');
							// b.innerHTML = display_group;
							b.innerHTML = display_group.id;
							b.style.opacity = .75;
							b.style.background = color_button;
							// b.onclick = function (e) { HB_Map_ToggleDisplayGrp(e, map, display_groups[display_group]); }
							b.onclick = function (e) { HB_Map_ToggleDisplayGrp(e, map, [display_group.id]); }
							grid_div.appendChild(b);

							layer_buttons.push(b);
						}

						parent_div.appendChild(grid_div);
						parent_div.appendChild(menu_button);

						return [menu_button, layer_buttons];

					}


					function HB_Map_ToggleDisplayGrp(e, map, layers_arr) {
						e.preventDefault();
						e.stopPropagation();

						for (var j = 0; j < layers_arr.length; j++) {
							var layer = layers_arr[j];
							var visibility = map.getLayoutProperty(layer, 'visibility');
							if (visibility === 'visible')
							map.setLayoutProperty(layer, 'visibility', 'none');
							else
							map.setLayoutProperty(layer, 'visibility', 'visible');
						}
					}



					// PAYLOADS
					//

					var G_HB_Map_PayloadPos = {}; // position for all tracked payloads
					var G_HB_Map_TrackBounds = new mapboxgl.LngLatBounds();

					// updates DEVICE and payload markers position
					function HB_Map_PayloadPos(payload_id) {

						var data_arr = [];
						G_HB_Map_TrackBounds = new mapboxgl.LngLatBounds();

						var vehicles = HB_VEHICLES_GPS_LAST;
						for (v in vehicles) {
							if (!(v in G_HB_Map_PayloadPos)) {
								G_HB_Map_PayloadPos[v] = {
									"type": "Feature",
									"geometry": {
										"type": "Point",
										"coordinates": [21, 52]
									},
									"properties": {
										"title": v
									}
								}
							}

							data_arr.push(G_HB_Map_PayloadPos[v]);

							if (vehicles[v] != undefined) {
								var lat = vehicles[v]["latitude"];
								var lon = vehicles[v]["longitude"];

								if (HB_Map_FollowPayloads && lat && lon)
								G_HB_Map_TrackBounds.extend(new mapboxgl.LngLat(lon, lat));

								G_HB_Map_PayloadPos[v].geometry.coordinates = [lon, lat];
								G_HB_Map_PayloadPos[v].properties.title = v + " " + vehicles[v]["altitude"].toString();
							}

						} // for (v in vehicles)

						if (HB_Map_FollowDevice) {
							var lat = HB_DEVICE_GPS_LAST["DEVICE"]["latitude"];
							var lon = HB_DEVICE_GPS_LAST["DEVICE"]["longitude"];
							if (lat && lon)
							G_HB_Map_TrackBounds.extend(new mapboxgl.LngLat(lon, lat));
						}

						if (HB_Map_FollowHabBoy) {
							var lat = HB_DEVICE_GPS_LAST["HABBOY"]["latitude"];
							var lon = HB_DEVICE_GPS_LAST["HABBOY"]["longitude"];
							if (lat && lon)
							G_HB_Map_TrackBounds.extend(new mapboxgl.LngLat(lon, lat));
						}

						if (HB_Map_FollowLanding) {
							// local predict
							if(HB_VEHICLES_PREDICT[payload_id]) {
								var sz = HB_VEHICLES_PREDICT[payload_id].length;
								if(sz) {
									var landing_lon_lat = [ HB_VEHICLES_PREDICT[payload_id][sz-1][2], HB_VEHICLES_PREDICT[payload_id][sz-1][1] ];
									if (landing_lon_lat[0] && landing_lon_lat[1])
									G_HB_Map_TrackBounds.extend(new mapboxgl.LngLat(landing_lon_lat[0], landing_lon_lat[1]));
								}
							}
							// habitat predict
							if(HB_VEHICLES_PREDICT_HABITAT[payload_id]) {
								var sz = HB_VEHICLES_PREDICT_HABITAT[payload_id].length;
								if(sz) {
									var landing_lon_lat = [ parseFloat(HB_VEHICLES_PREDICT_HABITAT[payload_id][sz-1]['lon']),
									parseFloat(HB_VEHICLES_PREDICT_HABITAT[payload_id][sz-1]['lat']) ];
									if (landing_lon_lat[0] && landing_lon_lat[1])
									G_HB_Map_TrackBounds.extend(new mapboxgl.LngLat(landing_lon_lat[0], landing_lon_lat[1]));
								}
							}
						}


						HB_MAP.getSource('payloads').setData({ "type": "FeatureCollection", "features": data_arr });
						// HB_MAP.getSource('DEVICE').setData({ "type": "Point", "coordinates": [HB_DEVICE_GPS_LAST['DEVICE']["longitude"], HB_DEVICE_GPS_LAST['DEVICE']["latitude"]] });
						HB_MAP.getSource('HABBOY').setData({ "type": "Point", "coordinates": [HB_DEVICE_GPS_LAST['HABBOY']["longitude"], HB_DEVICE_GPS_LAST['HABBOY']["latitude"]] });

						setTimeout( ()=>{HB_Map_PayloadPos(payload_id)}, 500);
					}


					function HB_Map_AutoZoomAndBearing() {
						var goals_num = HB_Map_FollowPayloads + HB_Map_FollowDevice + HB_Map_FollowHabBoy + HB_Map_FollowLanding;
						if (goals_num) {
							try {
								if(goals_num > 1) {
									HB_MAP.fitBounds(G_HB_Map_TrackBounds, {
										padding: { top: 130, bottom: 130, left: 130, right: 130 },
										maxZoom: HB_MAP.getZoom()
									});
								}
								else if(goals_num == 1){
									HB_MAP.easeTo({
										center: G_HB_Map_TrackBounds.getCenter(),
										bearing: HB_Map_Bearing * HB_DEVICE_GPS_LAST['HABBOY']['heading'],
									});
								}
							}
							catch (e) {
								console.debug('HB_Map_AutoZoomAndBearing err: ', e);
							}
						}
						else {
						}

						setTimeout(HB_Map_AutoZoomAndBearing, 3000);
					}


					var G_HB_Map_PayloadsPathGeoJson = {}; // mapbox paths for payload_id's
					function HB_Map_PayloadPathUpdate(payload_id, data) {
						// console.debug("HB_Map_PayloadPathUpdate ", data);

						if(!data)
						return;

						if (!(payload_id in G_HB_Map_PayloadsPathGeoJson)) {
							G_HB_Map_PayloadsPathGeoJson[payload_id] = {
								"type": "FeatureCollection",
								"features": [{
									"type": "Feature",
									"geometry": {
										"type": "LineString",
										"coordinates": [
										]
									}
								}]
							};
						}

						for (var i in data['latitude']["values"]) {
							G_HB_Map_PayloadsPathGeoJson[payload_id]["features"][0]["geometry"]["coordinates"].push(
								[ data['longitude']["values"][i],
								data['latitude']["values"][i] ]
								);
							}

							if( HB_MAP.getSource('payloads_path') ) {
								HB_MAP.getSource('payloads_path').setData(
									G_HB_Map_PayloadsPathGeoJson[payload_id]
									);
									// console.debug(G_HB_Map_PayloadsPathGeoJson[payload_id]["features"][0]["geometry"]["coordinates"]);
								}

								if( HB_MAP.getSource('horizon') ) {
									HB_MAP.getSource('horizon').setData(
										CreateRadioHorizon(
											data['latitude']["values"][0],
											data['longitude']["values"][0],
											data['altitude']["values"][0]
											, 64 )
											);
										}

									}


									function HB_Map_PayloadPredictUpdate() {

										// predict path
										let payload_id = HABBOY_PAYLOAD_ID;
										var pred_path_data = {
											"type": "FeatureCollection",
											"features": [{
												"type": "Feature",
												"geometry": {
													"type": "LineString",
													"coordinates": [
													]
												}
											}]
										};

										var pred_path_data_hab = {
											"type": "FeatureCollection",
											"features": [{
												"type": "Feature",
												"geometry": {
													"type": "LineString",
													"coordinates": [
													]
												}
											}]
										};;

										for (var i in HB_VEHICLES_PREDICT[payload_id]) {
											pred_path_data["features"][0]["geometry"]["coordinates"].push(
												[ HB_VEHICLES_PREDICT[payload_id][i][2],
												HB_VEHICLES_PREDICT[payload_id][i][1] ]
												);
											}

											for (var i in HB_VEHICLES_PREDICT_HABITAT[payload_id]) {
												pred_path_data_hab["features"][0]["geometry"]["coordinates"].push(
													[ parseFloat(HB_VEHICLES_PREDICT_HABITAT[payload_id][i]['lon']),
													parseFloat(HB_VEHICLES_PREDICT_HABITAT[payload_id][i]['lat']) ]
													);
												}

												if( HB_MAP.getSource('payloads_predict') ) {
													HB_MAP.getSource('payloads_predict').setData(pred_path_data);
												}

												if( HB_MAP.getSource('payloads_predict_habitat') ) {
													HB_MAP.getSource('payloads_predict_habitat').setData(pred_path_data_hab);
												}

												// landing spot
												var src_land = HB_MAP.getSource('Landing');
												if(HB_VEHICLES_PREDICT[payload_id]) {
													var sz = HB_VEHICLES_PREDICT[payload_id].length;
													if(sz && src_land) {
														var landing_lon_lat = [ HB_VEHICLES_PREDICT[payload_id][sz-1][2], HB_VEHICLES_PREDICT[payload_id][sz-1][1] ];
														src_land.setData( { "type": "Point", "coordinates": landing_lon_lat } );
													}
												}

												// landing spot - habitat
												var src_land_habitat = HB_MAP.getSource('LandingHabitat');
												if(HB_VEHICLES_PREDICT_HABITAT[payload_id]) {
													var sz = HB_VEHICLES_PREDICT_HABITAT[payload_id].length;
													if(sz && src_land_habitat) {
														var landing_h_lon_lat = [
															parseFloat(HB_VEHICLES_PREDICT_HABITAT[payload_id][sz-1]['lon']),
															parseFloat(HB_VEHICLES_PREDICT_HABITAT[payload_id][sz-1]['lat']) ];
															src_land_habitat.setData( { "type": "Point", "coordinates": landing_h_lon_lat } );
														}
													}

												}
