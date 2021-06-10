
var G_HD_WEBSOCKET;
var G_HD_CONNECTED = 0;


function debug_print()
{
	console.debug(arguments);
	document.getElementById("ws_client_debug").innerHTML = "";
	for (i = 0; i < arguments.length; i++)
		document.getElementById("ws_client_debug").innerHTML += arguments[i] + " ";
}


function OpenConnection(endpoint)
{
	if(G_HD_CONNECTED)
		return;

	var server = endpoint;
	console.debug("Connecting to ", server, " ...");
	G_HD_WEBSOCKET = new WebSocket("ws://" + server);
	G_HD_WEBSOCKET.binaryType = 'arraybuffer'; // or 'blob'

	G_HD_WEBSOCKET.onopen =    function(evt) { ws_onOpen(evt) };
	G_HD_WEBSOCKET.onclose =   function(evt) { ws_onClose(evt) };
	G_HD_WEBSOCKET.onmessage = function(evt) { ws_onMessage(evt) };
	G_HD_WEBSOCKET.onerror =   function(evt) { ws_onError(evt) };
}


function ws_onClose(evt)
{
	G_HD_CONNECTED = 0;
	debug_print("DISCONNECTED");
	setTimeout(function () { OpenConnection(); }, 5000);
}


function ws_onError(evt)
{
	debug_print("ws_onError: ", evt.data);
}


function ws_onOpen(evt)
{
	G_HD_CONNECTED = 1;
	debug_print("ws_onOpen: ", "Connected.");

	G_HD_WEBSOCKET.send("hi");
	SendCommand("info:gps");

	console.debug("ws_onOpen: init refresh.");
}


function ws_onMessage(evt)
{
	if(!G_HD_CONNECTED)
	{
		debug_print("ws_onMessage: not connected.");
		return;
	}

	// console.debug("ON_MSG", evt);

	if(typeof evt.data === "string")
	{
		HandleMessage(evt.data)
	}
	else if(evt.data instanceof ArrayBuffer)
	{
		debug_print("got bin data");
	}
	else
	{
		debug_print("ws_onMessage: unknown data type.");
		return;
	}
}


function SendCommand(i_cmd)
{
	if(!G_HD_CONNECTED)
	{
		debug_print("SendCommand: not connected.");
		return;
	}
	var msg = "cmd::" + i_cmd;
	// debug_print("SendCommand: ", msg);
	G_HD_WEBSOCKET.send(msg);
}


function HandleMessage(i_data)
{
	if(!G_HD_CONNECTED)
	{
		debug_print("HandleMessage: not connected.");
		return;
	}

	if( !i_data.startsWith("cmd::info:liveprint") )
		debug_print("Received Message: ", i_data);

	return false;

}
