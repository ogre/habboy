var HB_GoogleMap;
var HB_GoogleMap_Marker_Payload;
var HB_GoogleMap_Marker_Landing;
var HB_GoogleMap_Marker_Habboy;
var HB_GoogleMap_directionsService;
var HB_GoogleMap_directionsDisplay;
var GMAPS_API_KEY = "YOUR GOOGLE MAPS API KEYS";


function HB_loadScript(url, callback){

    try {
        console.debug("HB_loadScript:", url, callback);
        var script = document.createElement("script")
        script.type = "text/javascript";
        script.onload = function(){
            console.debug("HB_loadScript callback:", url, callback);
            callback();
        };
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    }
    catch (e) {
        console.debug("HB_loadScript error:", url, callback, e);
        setTimeout(() => {
            HB_loadScript(url, callback)
        }, 5000);
    }
}


function throttle_events(event)
{
    var now = window.performance.now();
    var distance = Math.sqrt(Math.pow(event.clientX - mthrottle_last.x, 2) + Math.pow(event.clientY - mthrottle_last.y, 2));
    var time = now - mthrottle_last.time;
    if (distance * time < mthrottle_space * mthrottle_period) {    //event arrived too soon or mouse moved too little or both
        if (event.stopPropagation) { // W3C/addEventListener()
            event.stopPropagation();
        } else { // Older IE.
            event.cancelBubble = true;
        }
    } else {
        mthrottle_last.time = now;
        mthrottle_last.x    = event.clientX;
        mthrottle_last.y    = event.clientY;
    }
}


function HB_BuildGoogleMap(parent_div) {
    setTimeout(() => {
        HB_BuildGoogleMap_TryLoad(parent_div)
    }, 1);

    return { "tab_name": "GMap", "tab_nav": [] };
}


function HB_BuildGoogleMap_TryLoad(parent_div) {
    try {
        const script = document.createElement('script');
        document.body.appendChild(script);
        script.onload = () => {
            HB_BuildGoogleMap_DoIt(parent_div)
        };
        script.onerror = () => {
            // console.debug("HB_BuildGoogleMap_TryLoad fail.");
            setTimeout(() => {
                HB_BuildGoogleMap_TryLoad(parent_div)
            }, 10000);
        }
        script.async = false;
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + GMAPS_API_KEY;
    }
    catch(e) {
        // console.debug("HB_BuildGoogleMap_TryLoad fail.", e);
        setTimeout(() => {
            HB_BuildGoogleMap_TryLoad(parent_div)
        }, 10000);
    }
}


function HB_BuildGoogleMap_DoIt(parent_div) {

    var map_div = document.createElement("div");
    map_div.id = "googlemap";
    map_div.style.display = "flex";
    map_div.style.flexGrow = "1";

    parent_div.appendChild(map_div);

    google.maps.visualRefresh = true;

    var mapOptions = {
        center: new google.maps.LatLng(52, 21),
        zoom: 13,
        mapTypeControl: true,
        mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU },
        mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.TERRAIN
        ],
        zoomControl: true,
        zoomControlOptions: { style: google.maps.ZoomControlStyle.LARGE },
        //styles: map_style_browns, //map_style_mc map_style_blue
        key: GMAPS_API_KEY
    };


    // if(window.performance && window.performance.now && window.navigator.userAgent.indexOf("Firefox") != -1)        map_div.addEventListener("mousemove", throttle_events, true);

    HB_GoogleMap = new google.maps.Map(map_div, mapOptions);
    google.maps.event.addListenerOnce( HB_GoogleMap, 'idle', function() {google.maps.event.trigger(HB_GoogleMap, 'resize');} );
    google.maps.event.trigger(HB_GoogleMap, 'resize');

    HB_GoogleMap_Marker_Habboy = new google.maps.Marker(
        { 	position: new google.maps.LatLng(52, 21),
            map: HB_GoogleMap,
            //labelContent: PAYLOAD_NAME,
            ////labelAnchor: initPos,
            // labelAnchor: new google.maps.Point(-15, 35),
            labelClass: 'labels', // the CSS class for the label
            labelInBackground: false,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "rgb(0,255,0)",
                fillOpacity: 1,
                strokeWeight: 1
            },
            /*
            icon: {
                url: 'img/balloon.png',
                scaledSize: new google.maps.Size(64,64),
                size: new google.maps.Size(64,64),
                anchor: new google.maps.Point(32,32),
                //anchor: new google.maps.Point(23, 42),
                //anchor: new google.maps.Point(23, 105),
            },
            */
        }
    );

    HB_GoogleMap_Marker_Landing = new google.maps.Marker(
        { 	position: new google.maps.LatLng(52.1, 21.1),
            map: HB_GoogleMap,
            //labelContent: PAYLOAD_NAME,
            ////labelAnchor: initPos,
            // labelAnchor: new google.maps.Point(-15, 35),
            labelClass: 'labels', // the CSS class for the label
            labelInBackground: false,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "rgb(255,255,0)",
                // url: 'img/balloon.png',
                scale: 10,
                fillOpacity: 1,
                strokeWeight: 1
            }
        }
    );

    HB_GoogleMap_Marker_Payload = new google.maps.Marker(
        { 	position: new google.maps.LatLng(52.1, 21),
            map: HB_GoogleMap,
            //labelContent: PAYLOAD_NAME,
            ////labelAnchor: initPos,
            // labelAnchor: new google.maps.Point(-15, 35),
            labelClass: 'labels', // the CSS class for the label
            labelInBackground: false,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "rgb(255,80,0)",
                // url: 'img/balloon.png',
                scale: 10,
                fillOpacity: 1,
                strokeWeight: 1
            }
        }
    );

    HB_GoogleMap_directionsService = new google.maps.DirectionsService;
    HB_GoogleMap_directionsDisplay = new google.maps.DirectionsRenderer({
        preserveViewport: true,
        polylineOptions: {strokeColor: "rgb(255, 120,0)"},
        markerOptions: {visible: false}
    });
    HB_GoogleMap_directionsDisplay.setMap(HB_GoogleMap);

    // HB_GoogleMap.set('styles', HB_GMAP_style_red);

    // HB_Map_BuildFollowButtons(parent_div);

    HB_GoogleMap_AutoZoom();
    HB_GoogleMap_PayloadPos();
	// HG_GoogleMap_NavigationUpdate();

    return { "tab_name": "GMap", "tab_nav": [] };

}


// updates DEVICE and payload markers position
function HB_GoogleMap_PayloadPos() {
    if(HABBOY_PAYLOAD_ID in HB_VEHICLES_GPS_LAST)
    {
        var current_pos = new google.maps.LatLng( HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]["latitude"], HB_VEHICLES_GPS_LAST[HABBOY_PAYLOAD_ID]["longitude"] );

        HB_GoogleMap_Marker_Payload.setPosition( current_pos );
        //marker.labelContent = PAYLOAD_NAME + '\n' + alt;
        //marker.label.setStyles();
        HB_GoogleMap_Marker_Payload.setShape();
        //marker.label.draw();
    }

    // if( HB_DEVICE_GPS_LAST['DEVICE']["latitude"] )
    // {
    //     var device_pos = new google.maps.LatLng( HB_DEVICE_GPS_LAST['DEVICE']["latitude"], HB_DEVICE_GPS_LAST['DEVICE']["longitude"] );
    //     HB_GoogleMap_Marker_Device.setPosition( device_pos );
    //     HB_GoogleMap_Marker_Device.setShape();
    // }

    if( HB_DEVICE_GPS_LAST['HABBOY']["latitude"] )
    {
        var habboy_pos = new google.maps.LatLng( HB_DEVICE_GPS_LAST['HABBOY']["latitude"], HB_DEVICE_GPS_LAST['HABBOY']["longitude"] );
        HB_GoogleMap_Marker_Habboy.setPosition( habboy_pos );
        HB_GoogleMap_Marker_Habboy.setShape();
    }

    if( HB_VEHICLES_PREDICT[HABBOY_PAYLOAD_ID] && HB_VEHICLES_PREDICT[HABBOY_PAYLOAD_ID].length>1 ) {
        var last = HB_VEHICLES_PREDICT[HABBOY_PAYLOAD_ID].length;
        var landing_lat_lon = new google.maps.LatLng( [HB_VEHICLES_PREDICT[HABBOY_PAYLOAD_ID][last-1][1],
                                HB_VEHICLES_PREDICT[HABBOY_PAYLOAD_ID][last-1][2]] );
        HB_GoogleMap_Marker_Landing.setPosition( landing_lat_lon );
        HB_GoogleMap_Marker_Landing.setShape();
    }

    setTimeout(HB_GoogleMap_PayloadPos, 3000);
}


function HG_GoogleMap_NavigationUpdate()
{
    console.debug('HG_GoogleMap_NavigationUpdate');
    if( HB_VEHICLES_PREDICT && HB_VEHICLES_PREDICT[HABBOY_PAYLOAD_ID] )
    {
	    let origin = [ HB_DEVICE_GPS_LAST["HABBOY"]["latitude"], HB_DEVICE_GPS_LAST["HABBOY"]["longitude"] ];
        var last = HB_VEHICLES_PREDICT[HABBOY_PAYLOAD_ID].length;
        var landing_lat_lon = [ HB_VEHICLES_PREDICT[HABBOY_PAYLOAD_ID][last-1][1],
                                HB_VEHICLES_PREDICT[HABBOY_PAYLOAD_ID][last-1][2] ];
        let destination = landing_lat_lon;

        console.debug('google nav');
        HB_GoogleMap_directionsService.route({
                origin: origin[0] + ',' + origin[1],
                destination: destination[0] + ',' + destination[1],
                travelMode: 'DRIVING'
            }, function(response, status) {
                if (status === 'OK') {
                    console.debug(response);
                    HB_GoogleMap_directionsDisplay.setDirections(response);
                    setTimeout(HG_GoogleMap_NavigationUpdate, 60 * 1000);
                } else {
                    console.debug('HG_GoogleMap_NavigationUpdate failed: ' + status);
                    setTimeout(HG_GoogleMap_NavigationUpdate, 30 * 1000);
                }
            }
        );

        setTimeout(HG_GoogleMap_NavigationUpdate, 60 * 1000);

    }
    else{
        console.debug('google nav - no HB_VEHICLES_PREDICT');
        setTimeout(HG_GoogleMap_NavigationUpdate, 10 * 1000);
    }

}


function HB_GoogleMap_AutoZoom() {
    if (HB_Map_FollowPayloads || HB_Map_FollowDevice || HB_Map_FollowHabBoy) {
        try {
            if(     G_HB_Map_TrackBounds['_sw']["lat"] == G_HB_Map_TrackBounds['_ne']["lat"]
                &&  G_HB_Map_TrackBounds['_sw']['lng'] == G_HB_Map_TrackBounds['_ne']['lng'] )
            { // center
                HB_GoogleMap.setCenter( new google.maps.LatLng(G_HB_Map_TrackBounds['_sw']["lat"], G_HB_Map_TrackBounds['_sw']['lng']) );
            }
            else
            { // fit
                var bounds = new google.maps.LatLngBounds();
                bounds.extend( new google.maps.LatLng(G_HB_Map_TrackBounds['_sw']["lat"], G_HB_Map_TrackBounds['_sw']['lng']) );
                bounds.extend( new google.maps.LatLng(G_HB_Map_TrackBounds['_ne']["lat"], G_HB_Map_TrackBounds['_ne']['lng']) );
                HB_GoogleMap.fitBounds(bounds);
            }
        }
        catch (e) {
            console.debug('HB_GoogleMap_AutoZoom err: ', e);
        }
    }
    else {
    }
    setTimeout(HB_GoogleMap_AutoZoom, 3000);
}


var HB_GMAP_style_blue = 	[{"featureType":"water","elementType":"geometry","stylers":[{"color":"#193341"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#2c5a71"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#29768a"},{"lightness":-37}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#406d80"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#406d80"}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#3e606f"},{"weight":2},{"gamma":0.84}]},{"elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"administrative","elementType":"geometry","stylers":[{"weight":0.6},{"color":"#1a3541"}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#2c5a71"}]}];
var HB_GMAP_style_mc = 		[{"featureType":"all","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"color":"#000000"},{"lightness":13}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#144b53"},{"lightness":14},{"weight":1.4}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#08304b"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#0c4152"},{"lightness":5}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#0b434f"},{"lightness":25}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#0b3d51"},{"lightness":16}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"}]},{"featureType":"transit","elementType":"all","stylers":[{"color":"#146474"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#021019"}]}];
var HB_GMAP_style_browns = 	[{"elementType":"geometry","stylers":[{"hue":"#ff4400"},{"saturation":-68},{"lightness":-4},{"gamma":0.72}]},{"featureType":"road","elementType":"labels.icon"},{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"hue":"#0077ff"},{"gamma":3.1}]},{"featureType":"water","stylers":[{"hue":"#00ccff"},{"gamma":0.44},{"saturation":-33}]},{"featureType":"poi.park","stylers":[{"hue":"#44ff00"},{"saturation":-23}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"hue":"#007fff"},{"gamma":0.77},{"saturation":65},{"lightness":99}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"gamma":0.11},{"weight":5.6},{"saturation":99},{"hue":"#0091ff"},{"lightness":-86}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"lightness":-48},{"hue":"#ff5e00"},{"gamma":1.2},{"saturation":-23}]},{"featureType":"transit","elementType":"labels.text.stroke","stylers":[{"saturation":-64},{"hue":"#ff9100"},{"lightness":16},{"gamma":0.47},{"weight":2.7}]}];
var HB_GMAP_style_red = 	[{"featureType":"all","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#c9323b"}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#c9323b"},{"weight":1.2}]},{"featureType":"administrative.locality","elementType":"geometry.fill","stylers":[{"lightness":"-1"}]},{"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"lightness":"0"},{"saturation":"0"}]},{"featureType":"administrative.neighborhood","elementType":"labels.text.stroke","stylers":[{"weight":"0.01"}]},{"featureType":"administrative.land_parcel","elementType":"labels.text.stroke","stylers":[{"weight":"0.01"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#c9323b"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#99282f"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#99282f"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry.stroke","stylers":[{"color":"#99282f"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#99282f"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#99282f"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#99282f"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#090228"}]}];
var HB_GMAP_style_red2 = 	[{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#952d2d"},{"lightness":17}]}];
var HB_GMAP_style_hopper = 	[{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#165c64"},{"saturation":34},{"lightness":-69},{"visibility":"on"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"hue":"#b7caaa"},{"saturation":-14},{"lightness":-18},{"visibility":"on"}]},{"featureType":"landscape.man_made","elementType":"all","stylers":[{"hue":"#cbdac1"},{"saturation":-6},{"lightness":-9},{"visibility":"on"}]},{"featureType":"road","elementType":"geometry","stylers":[{"hue":"#8d9b83"},{"saturation":-89},{"lightness":-12},{"visibility":"on"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"hue":"#d4dad0"},{"saturation":-88},{"lightness":54},{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"hue":"#bdc5b6"},{"saturation":-89},{"lightness":-3},{"visibility":"simplified"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"hue":"#bdc5b6"},{"saturation":-89},{"lightness":-26},{"visibility":"on"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"hue":"#c17118"},{"saturation":61},{"lightness":-45},{"visibility":"on"}]},{"featureType":"poi.park","elementType":"all","stylers":[{"hue":"#8ba975"},{"saturation":-46},{"lightness":-28},{"visibility":"on"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"hue":"#a43218"},{"saturation":74},{"lightness":-51},{"visibility":"simplified"}]},{"featureType":"administrative.province","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":0},{"lightness":100},{"visibility":"simplified"}]},{"featureType":"administrative.neighborhood","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":0},{"lightness":100},{"visibility":"off"}]},{"featureType":"administrative.locality","elementType":"labels","stylers":[{"hue":"#ffffff"},{"saturation":0},{"lightness":100},{"visibility":"off"}]},{"featureType":"administrative.land_parcel","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":0},{"lightness":100},{"visibility":"off"}]},{"featureType":"administrative","elementType":"all","stylers":[{"hue":"#3a3935"},{"saturation":5},{"lightness":-57},{"visibility":"off"}]},{"featureType":"poi.medical","elementType":"geometry","stylers":[{"hue":"#cba923"},{"saturation":50},{"lightness":-46},{"visibility":"on"}]}]

var HB_GMAP_COLOR_SCHEMES = {
    'BLUE': HB_GMAP_style_blue,
    'RED': HB_GMAP_style_red2,
    'GREEN': HB_GMAP_style_hopper,
    'GOLD': HB_GMAP_style_browns,
    'PLUM': HB_GMAP_style_mc
}


