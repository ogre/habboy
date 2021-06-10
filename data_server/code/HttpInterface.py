#!/usr/bin/env python3

# access over HTTP
#

'''
("/habboy/api/v1/params",   method=['OPTIONS', 'GET'])
("/habboy/api/v1/params/payload_id",    method=['OPTIONS', 'GET', 'PUT'])
("/habboy/api/v1/payloads",     method=['OPTIONS', 'GET'])
("/habboy/api/v1/payloads/<payload>/sensors",   method=['OPTIONS', 'GET'])
("/habboy/api/v1/payloads/<payload>/sensors/<sensor>",  method=['OPTIONS', 'GET'])
("/habboy/api/v1/payloads/<payload>/sensors/<sensor>/last",     method=['OPTIONS', 'GET'])
("/habboy/api/v1/payloads/<payload>/gps",   method=['OPTIONS', 'GET'])
("/habboy/api/v1/payloads/<payload>/gps/last",  method=['OPTIONS', 'GET'])
("/habboy/api/v1/payloads/<payload>/sentences/last",    method=['OPTIONS', 'GET'])
("/habboy/api/v1/payloads/<payload>/sentences/lastdata",    method=['OPTIONS', 'GET'])
("/habboy/api/v1/payloads/<payload>/sentences/lastId",  method=['OPTIONS', 'GET'])
("/habboy/api/v1/payloads/<payload>/receiver_stats",    method=['OPTIONS', 'GET'])
("/habboy/api/v1/payloads/<payload>/predict",   method=['OPTIONS', 'GET'])
("/habboy/api/v1/habdec/add/<habdec_addr>",     method=['OPTIONS', 'GET'])
("/habboy/api/v1/habdec/del/<habdec_addr>",     method=['OPTIONS', 'GET'])
("/habboy/api/v1/habdec/get",   method=['OPTIONS', 'GET'])
("/habboy/api/v1/sentence/<uploader>/<sentence>", method=['OPTIONS', 'PUT'])
("/habboy/api/v1/chasecar/<chasecar_name>", method=['OPTIONS', 'POST'])
("/habboy/api/v1/ctrl/habdec_stop", method=['OPTIONS', 'GET'])
("/habboy/api/v1/ctrl/habdec_start", method=['OPTIONS', 'GET'])
("/habboy/api/v1/ctrl/spy_stop", method=['OPTIONS', 'GET'])
("/habboy/api/v1/ctrl/spy_start", method=['OPTIONS', 'GET'])
("/habboy/api/v1/ctrl/reboot",  method=['OPTIONS', 'GET'])
("/habboy/api/v1/ctrl/restart",     method=['OPTIONS', 'GET'])
("/habboy/api/v1/ctrl/halt",    method=['OPTIONS', 'GET'])
("/habboy/api/v1/gps",  method=['OPTIONS', 'GET'])
("/habboy/api/v1/utcnow",  method=['OPTIONS', 'GET'])
("/habboy/api/v1/info",  method=['OPTIONS', 'GET'])
("/habboy",     method=['OPTIONS', 'GET'])
('/')
'''

__all__ = ['RUN']


import os
import json
import bottle
import time
import datetime
import traceback
import sys
import shlex
import subprocess
import formatSentence
from pprint import pprint
from copy import deepcopy

from cheroot import wsgi
from cheroot.ssl.builtin import BuiltinSSLAdapter

import HabdecClient
import HabHubClient
import HabHubInterface
from get_ip import get_ip_local

DB = None
# G_EXP_BURST_ALT = 30000 # expected burst altitude - meters
G_PREDICTOR = None
G_HABDEC_CLIENTS = {}
G_HABHUB_CLIENTS = {}
G_OPTIONS = {}
G_HABDEC_CLIENTS = None

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime.datetime):
            return o.isoformat() + '+00:00'
        else:
            return json.JSONEncoder.default(self, o)


def merge_dicts(*args):
    result = {}
    for dictionary in args:
        result.update(dictionary)
    return result


def redirect_http_to_https(callback):
    '''Bottle plugin that redirects all http requests to https'''

    def wrapper(*args, **kwargs):
        scheme = bottle.request.urlparts[0]
        if scheme == 'http':
            # request is http; redirect to https
            bottle.redirect(bottle.request.url.replace('http', 'https', 1))
        else:
            # request is already https; okay to proceed
            return callback(*args, **kwargs)
    return wrapper


def time_to_string(i_datetime):
    return i_datetime.isoformat() + '+00:00'
    # return datetime.datetime.strftime(i_datetime, "%Y-%m-%d %H:%M:%S")




class EnableCors(object):
    name = "enable_cors"
    api = 2

    def apply(self, fn, context):
        def _enable_cors(*args, **kwargs):
            # set CORS headers
            bottle.response.headers["Access-Control-Allow-Origin"] = "*"
            bottle.response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, OPTIONS"
            bottle.response.headers["Access-Control-Allow-Headers"] = "Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token"

            # actual request; reply with the actual response
            if bottle.request.method != "OPTIONS":
                return fn(*args, **kwargs)

        return _enable_cors


# Create our own sub-class of Bottle's ServerAdapter
# so that we can specify SSL. Using just server='cherrypy'
# uses the default cherrypy server, which doesn't use SSL
class SSLCherryPyServer(bottle.ServerAdapter):
    def run(self, handler):
        server = wsgi.Server( (self.host, self.port), handler)
        server.ssl_adapter = BuiltinSSLAdapter("cacert.pem", "privkey.pem")

        # By default, the server will allow negotiations with extremely old protocols
        # that are susceptible to attacks, so we only allow TLSv1.2
        # server.ssl_adapter.context.options |= ssl.OP_NO_TLSv1
        # server.ssl_adapter.context.options |= ssl.OP_NO_TLSv1_1

        try:
            server.start()
        finally:
            server.stop()


application = bottle.app()
application.install(EnableCors())


######################################################################
######################################################################


def GetRequestValueWithDefault(i_req, i_token, i_type, defaultValue):
    """
	get value from GET request
	ensure proper type
	return defaultValue on error or missing
	"""
    if type(defaultValue) != i_type:
        raise ValueError("defaultValue is of wrong type")

    if i_token not in i_req:
        return defaultValue
    val_str = i_req[i_token]

    if i_type == bool:
        res = defaultValue
        if val_str == "1" or val_str.lower() == "true":
            res = True
        elif val_str == "0" or val_str.lower() == "false":
            res = False
        return res
    elif i_type == int:
        try:
            res = int(val_str)
            return res
        except:
            return defaultValue
    else:
        # string
        return val_str

    return defaultValue


@application.route("/habboy/api/v1/params", method=['OPTIONS', 'GET'])
def GetPayloadIdAndCallsign():
    bottle.response.content_type = "application/javascript"
    global G_OPTIONS
    res = {}
    res['payload_id'] = G_OPTIONS['payload_id']
    res['callsign'] = G_OPTIONS['callsign']
    res['payloads'] = G_OPTIONS['payloads']
    res['burst'] = G_OPTIONS['burst']
    with G_OPTIONS['clients_mutex']:
        res['habdec_clients'] = list( G_OPTIONS['habdec_clients'].keys() )
    return JSONEncoder().encode(res)


@application.route("/habboy/api/v1/params/payload_id", method=['OPTIONS', 'GET', 'PUT'])
def PayloadId():
    global G_PAYLOAD_ID
    global G_CALLSIGN
    if bottle.request.method == 'GET':
        bottle.response.content_type = "application/json"
        return json.dumps( {'payload_id': G_OPTIONS['payload_id'], 'callsign': G_OPTIONS['callsign']} )

    if bottle.request.method == 'PUT':
        data = bottle.request.json
        if 'callsign' in data and 'payload_id' in data:
            old_pid = G_OPTIONS['payload_id']
            new_pid = data['payload_id']
            if old_pid in G_OPTIONS['habhub_clients']:
                G_OPTIONS['habhub_clients'][old_pid].Stop()
                del G_OPTIONS['habhub_clients'][old_pid]

            G_OPTIONS['callsign'] =   data['callsign']
            G_OPTIONS['payload_id'] = new_pid

            G_OPTIONS['habhub_clients'][new_pid] = HabHubClient.HabHubClient(new_pid)
            G_OPTIONS['habhub_clients'][new_pid].Start()


@application.route("/habboy/api/v1/payloads", method=['OPTIONS', 'GET'])
def GetVehicles():
    global G_OPTIONS
    DB = G_OPTIONS['sentences_db']
    bottle.response.content_type = "application/json"
    data = DB.getAllPayloadIds()
    return json.dumps(data)


@application.route("/habboy/api/v1/payloads/<payload>/sensors", method=['OPTIONS', 'GET'])
def GetVehicleSensors(payload):
    global G_OPTIONS
    DB = G_OPTIONS['sentences_db']
    bottle.response.content_type = "application/json"
    sensors_info = DB.getSensorsInfo(payload)
    res = [{
        'name': sens['name'],
        'sensor': sens['sensor'],
        'sql_data_type': sens['sql_data_type'],
    } for sens in sensors_info]
    return JSONEncoder().encode(res)


@application.route("/habboy/api/v1/payloads/<payload>/sensors/<sensor>", method=['OPTIONS', 'GET'])
def GetSensorData(payload, sensor):
    global G_OPTIONS
    DB = G_OPTIONS['sentences_db']
    bottle.response.content_type = "application/json"

    last_time = GetRequestValueWithDefault(bottle.request.query, "time", str, time_to_string(datetime.datetime.utcfromtimestamp(0)))

    sensors = [sensor]
    if sensor == "*":
        sensors = DB.getSensorsList(payload)
    elif "," in sensor:
        sensors = sensor.split(",")

    if "time" in sensors:
        sensors.remove("time")

    res = {}
    for _sensor in sensors:
        data = DB.getTelemetryByTime(payload, _sensor, last_time)
        if data:
            data["times"] = [
                time_to_string(x) for x in data["times"]
            ]
            res[_sensor] = data

    return json.dumps(res)


@application.route("/habboy/api/v1/payloads/<payload>/sensors/<sensor>/last", method=['OPTIONS', 'GET'])
def GetSensorDataLast(payload, sensor):
    global G_OPTIONS
    DB = G_OPTIONS['sentences_db']
    bottle.response.content_type = "application/json"

    sensors = [sensor]
    if sensor == "*":
        sensors = DB.getSensorsList(payload)
    elif "," in sensor:
        sensors = sensor.split(",")
    if "time" in sensors:
        sensors.remove("time")

    res = {}
    for _sensor in sensors:
        data = DB.getTelemetryLast(payload, _sensor)
        if data:
            data["times"] = [time_to_string(x) for x in data["times"] ]
            res[_sensor] = data

    return json.dumps(res)


@application.route("/habboy/api/v1/payloads/<payload>/gps", method=['OPTIONS', 'GET'])
def GetGps(payload):
    """
	result:
	[ ["014056", [52.15429, 21.03445, 7223]], ... ]
	"""
    global G_OPTIONS
    DB = G_OPTIONS['sentences_db']
    bottle.response.content_type = "application/json"

    last_time = GetRequestValueWithDefault(bottle.request.query, "time", str, time_to_string(datetime.datetime.utcfromtimestamp(0)))

    lat = DB.getTelemetryByTime(payload, "latitude", time_to_string(datetime.datetime.utcfromtimestamp(0)))
    lon = DB.getTelemetryByTime(payload, "longitude", time_to_string(datetime.datetime.utcfromtimestamp(0)))
    alt = DB.getTelemetryByTime(payload, "altitude", time_to_string(datetime.datetime.utcfromtimestamp(0)))

    if not lat or not lon or not alt:
        return "{}"

    lat["times"] = [time_to_string(x) for x in lat["times"]]
    lon["times"] = [time_to_string(x) for x in lon["times"]]
    alt["times"] = [time_to_string(x) for x in alt["times"]]

    data = list(zip(lat["values"], lon["values"], alt["values"]))
    times = lat["times"]
    res = list(zip(times, data))
    return json.dumps(res)


@application.route("/habboy/api/v1/payloads/<payload>/gps/last", method=['OPTIONS', 'GET'])
def GetGpsLast(payload):
    """
	result:
	[ ["014059", [52.15429, 21.03445, 12223]] ]
	"""
    global G_OPTIONS
    DB = G_OPTIONS['sentences_db']
    bottle.response.content_type = "application/json"

    lat = DB.getTelemetryLast(payload, "latitude")
    lon = DB.getTelemetryLast(payload, "longitude")
    alt = DB.getTelemetryLast(payload, "altitude")

    if not lat or not lon or not alt:
        return "{}"

    lat["times"] = [time_to_string(x) for x in lat["times"]]
    lon["times"] = [time_to_string(x) for x in lon["times"]]
    alt["times"] = [time_to_string(x) for x in alt["times"]]

    data = list(zip(lat["values"], lon["values"], alt["values"]))
    times = lat["times"]
    res = list(zip(times, data))
    return json.dumps(res)


@application.route("/habboy/api/v1/payloads/<payload>/sentences/last", method=['OPTIONS', 'GET'])
def GetSentenceLast(payload):
    global G_OPTIONS
    DB = G_OPTIONS['sentences_db']
    bottle.response.content_type = "text/plain"

    last_sentence_data = DB.getLastSentence(payload)
    # return last_sentence_data[-3]
    return last_sentence_data['_SENTENCE']

@application.route("/habboy/api/v1/payloads/<payload>/sentences/lastdata", method=['OPTIONS', 'GET'])
def GetSentenceLastData(payload):
    global G_OPTIONS
    DB = G_OPTIONS['sentences_db']
    bottle.response.content_type = "application/json"

    last_sentence_data = DB.getLastSentence(payload)
    return JSONEncoder().encode( last_sentence_data )

@application.route("/habboy/api/v1/payloads/<payload>/sentences/lastId", method=['OPTIONS', 'GET'])
def GetSentenceLastId(payload):
    global G_OPTIONS
    DB = G_OPTIONS['sentences_db']
    bottle.response.content_type = "text/plain"

    last_sentence_id = DB.getLastSentenceId(payload)
    return last_sentence_id

@application.route("/habboy/api/v1/payloads/<payload>/receiver_stats", method=['OPTIONS', 'GET'])
def GetReceiverStats(payload):
    global G_OPTIONS
    DB = G_OPTIONS['sentences_db']
    bottle.response.content_type = "json"

    res = DB.getReceiversStats(payload)
    return res

@application.route("/habboy/api/v1/payloads/<payload>/predict", method=['OPTIONS', 'GET'])
def GetPayloadPrediction(payload):
    bottle.response.content_type = "application/json"
    global G_OPTIONS
    get_predict_fun = G_OPTIONS['get_predict']
    if get_predict_fun:
        flight_path = get_predict_fun()
        return JSONEncoder().encode( flight_path )
    return json.dumps( {} )

@application.route("/habboy/api/v1/habdec/add/<habdec_addr>", method=['OPTIONS', 'GET'])
def HabdecAdd(habdec_addr):
    bottle.response.content_type = "text/plain"
    global G_OPTIONS

    if not habdec_addr.lower().startswith('ws://'):
        habdec_addr = 'ws://' +     habdec_addr

    with G_OPTIONS['clients_mutex']:
        if habdec_addr in G_OPTIONS['habdec_clients']:
            return 'already exists'

        if not habdec_addr.lower().startswith('ws://'):
            habdec_addr = 'ws://' + habdec_addr

        if habdec_addr not in G_OPTIONS['habdec_clients']:
            G_OPTIONS['habdec_clients'][habdec_addr] = HabdecClient.HabdecClient(habdec_addr)
            G_OPTIONS['habdec_clients'][habdec_addr].Start()

    return "OK"


@application.route("/habboy/api/v1/habdec/del/<habdec_addr>", method=['OPTIONS', 'GET'])
def HabdecDel(habdec_addr):
    global G_OPTIONS
    if not habdec_addr.lower().startswith('ws://'):
        habdec_addr = 'ws://' +     habdec_addr
    with G_OPTIONS['clients_mutex']:
        if habdec_addr in G_OPTIONS['habdec_clients']:
            G_OPTIONS['habdec_clients'][habdec_addr].Stop()
            del G_OPTIONS['habdec_clients'][habdec_addr]

    bottle.response.content_type = "text/plain"
    return "OK"


@application.route("/habboy/api/v1/habdec/get", method=['OPTIONS', 'GET'])
def HabdecGet():
    global G_OPTIONS
    bottle.response.content_type = "application/json"
    with G_OPTIONS['clients_mutex']:
        habdecs = G_OPTIONS['habdec_clients'].keys()
        return json.dumps( list(habdecs) )


@application.route("/habboy/api/v1/gps", method=['OPTIONS', 'GET'])
def GetHabboyGps():
    bottle.response.content_type = "application/json"
    if G_OPTIONS['get_gps']:
        gps = deepcopy( G_OPTIONS['get_gps']() )
        gps['time'] = gps['time'].isoformat() + '+00:00'
        gps['parse_timestamp'] = gps['parse_timestamp'].isoformat() + '+00:00'
        return json.dumps( gps )
    return json.dumps( {} )


@application.route("/habboy/api/v1/utcnow", method=['OPTIONS', 'GET'])
def GetUtcNow():
    bottle.response.content_type = "text/plain"
    return datetime.datetime.utcnow().isoformat() + '+00:00'


@application.route("/habboy/api/v1/info", method=['OPTIONS', 'GET'])
def GetHabboyInfo():
    global G_OPTIONS
    bottle.response.content_type = "application/json"
    res = {}
    if G_OPTIONS['get_stats']:
        res = G_OPTIONS['get_stats']()
    return JSONEncoder().encode( res )


@application.route("/habboy/api/v1/chasecar/<chasecar_name>", method=['OPTIONS', 'POST'])
def Habdec_ChasecarUpload(chasecar_name):
    bottle.response.content_type = "application/json"

    if not chasecar_name.endswith('_chase'):
        return JSONEncoder().encode( {'result': 'error', 'what': 'car name does not end with _chase'} )

    if bottle.request.method == 'POST':
        params = merge_dicts(dict(bottle.request.forms), dict(bottle.request.query.decode()))
        params = list(params.keys())[0] # this is very weird
        params = json.loads(params)

        try:
            data = {'vehicle' : chasecar_name,
                    'time'  : datetime.datetime.utcnow().strftime("%H%M%S"),
                    'lat'  : params["latitude"],
                    'lon'  : params["longitude"],
                    'alt'  : params["altitude"],
                    'speed'  : params["ground_speed_mps"],
                    'heading'  : params["heading"],
                    'pass'  : "aurora"}
        except KeyError as e:
            return JSONEncoder().encode( {'result': 'error', 'what': 'KeyError: ' + str(e)} )
        try:
            if not HabHubInterface.uploadChaseCar(data):
                return JSONEncoder().encode( {'result': 'error', 'what': 'Connection Error'} )
        except:
            eprint(traceback.format_exc())
            return JSONEncoder().encode( {'result': 'error', 'what': 'Other Exception'} )

        return JSONEncoder().encode( {'result': 'ok'} )
    return json.dumps( {} )


@application.route("/habboy/api/v1/ctrl/habdec_stop", method=['OPTIONS', 'GET'])
def habdec_stop():
    os.system('sudo systemctl stop habdec')
    bottle.response.content_type = "application/json"
    return json.dumps({})

@application.route("/habboy/api/v1/ctrl/habdec_start", method=['OPTIONS', 'GET'])
def habdec_start():
    os.system('sudo systemctl start habdec')
    bottle.response.content_type = "application/json"
    return json.dumps({})


@application.route("/habboy/api/v1/ctrl/spy_stop", method=['OPTIONS', 'GET'])
def spy_stop():
    os.system('sudo systemctl stop spyserver')
    bottle.response.content_type = "application/json"
    return json.dumps({})

@application.route("/habboy/api/v1/ctrl/spy_start", method=['OPTIONS', 'GET'])
def spy_start():
    os.system('sudo systemctl start spyserver')
    bottle.response.content_type = "application/json"
    return json.dumps({})


@application.route("/habboy/api/v1/ctrl/reboot", method=['OPTIONS', 'GET'])
def Reboot():
    os.system('sudo reboot')


@application.route("/habboy/api/v1/sentence/<uploader>/<sentence>", method=['OPTIONS', 'PUT'])
def SententenceUpload(uploader, sentence):
    if bottle.request.method == 'PUT':
        # data = bottle.request.json
        if sentence:
            if G_OPTIONS['sentences_db'].insert(i_sentence = sentence, i_RECEIVER = uploader):
                return json.dumps   ( {'result': 1} )
            else:
                eprint('DB Input FAIL')
    return json.dumps   ( {'result': 0} )


@application.route("/habboy/api/v1/ctrl/restart", method=['OPTIONS', 'GET'])
def Restart():
    os.system('sudo systemctl daemon-reload')
    os.system('sudo systemctl restart habboy_advertise.service')
    os.system('sudo systemctl restart habdec_advertise.service')
    os.system('sudo systemctl restart habdec.service')
    os.system('sudo systemctl restart habboy.service')
    bottle.response.content_type = "application/json"
    return json.dumps({})


@application.route("/habboy/api/v1/ctrl/halt", method=['OPTIONS', 'GET'])
def Halt():
    os.system('sudo shutdown now')
    bottle.response.content_type = "application/json"
    return json.dumps({})


@application.route("/habboy", method=['OPTIONS', 'GET'])
def HabboyDiscovery():
    bottle.response.content_type = "application/json"
    return json.dumps({'HABBOY': 1})


@application.route('/')
def route_root():
    new_url = bottle.request.url[0:bottle.request.url.rindex(':')] + '/habboy'
    res = '<meta http-equiv="refresh" content="0; url={}" />'.format(new_url)
    return res


def RUN(hostname,
        port,
        is_https,
        i_opts,
        debug=True,
        reloader=True):

    global DB
    DB = i_opts['sentences_db']

    global G_OPTIONS
    G_OPTIONS = i_opts
    G_OPTIONS['start_time'] = datetime.datetime.utcnow()

    if not hostname:
        hostname = get_ip_local()

    if is_https:
        print("AS HTTPS")
        application.install(redirect_http_to_https)
        bottle.run(
            host=hostname,
            port=port,
            debug=debug,
            reloader=reloader,
            server=SSLCherryPyServer,
        )
    else:
        bottle.run(host=hostname, port=port, debug=debug, reloader=reloader, quiet=True)

if __name__ == "__main__":
    pprint( get_process_stats(['habdecWebsocketServer', 'habboy_data']) )