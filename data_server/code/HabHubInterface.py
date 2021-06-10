#!/usr/bin/env python3

"""
misc utility functions for habitat queries
"""

import string
import sys
import json
from time import time
from pprint import pprint
import urllib3

urllib3.disable_warnings()
http = urllib3.PoolManager()

import formatSentence


def getFlights():
    _url = (
        "http://habitat.habhub.org/habitat/_design/flight/_view/end_start_including_payloads?startkey=["
        + str(int(time()))
        + "]&include_docs=True"
    )
    flights_json = http.request("GET", _url)
    flights = json.loads(flights_json.data.decode("utf-8"))["rows"]
    res = [f for f in flights if f["doc"]["type"] == "flight"]
    return res


def getPayloads(i_flights=None):
    _url = (
        "http://habitat.habhub.org/habitat/_design/flight/_view/end_start_including_payloads?startkey=["
        + str(int(time()))
        + "]&include_docs=True"
    )
    all_docs = http.request("GET", _url)
    all_docs = json.loads(all_docs.data.decode("utf-8"))["rows"]

    if not i_flights:
        i_flights = getFlights()

    flyingPayloadsIds = []
    for f in i_flights:
        flyingPayloadsIds.extend(f["doc"]["payloads"])

    res = []
    for f in all_docs:
        if (
            f["doc"]["type"] == "payload_configuration"
            and f["doc"]["_id"] in flyingPayloadsIds
        ):
            # f['telemetry'] = getTelemetry( f['doc']['sentences'][0]['callsign'] )
            res.append(f)

    return res


def getCallsignsForPayloadId(payload_id):
    flights = getFlights()
    payloads = getPayloads(flights)
    for p in payloads:
        if p["doc"]["_id"] == payload_id:
            return p["doc"]["sentences"][0]["callsign"]
    return None


"""
def getTelemetry(i_payloadName, max_positions=1 ):
	data_url = "http://spacenear.us/tracker/datanew.php"
	data_str = "mode=position&type=positions&format=json&max_positions=" + str(max_positions) + "&position_id=0&vehicles=" + urllib2.quote(i_payloadName)
	_url = data_url + '?' + data_str
	res = http.request('GET', _url)
	res = json.loads(res.data.decode('utf-8'))
	res = res['positions']['position']

	return res
"""


def defaultSensorsInfo(i_sentence):
    """
		treat all sensors as string
		except: sentence_id, time, lat, lon, alt
	"""

    if not i_sentence:
        return None

    num_sensors = len(formatSentence.getData(i_sentence))

    sensors_info_arr = [
        {"name": "sensor_" + str(x), "sensor": "base.string"}
        for x in range(num_sensors)
    ]

    # sentence_id
    sensors_info_arr[0]["name"] = "sentence_id"
    sensors_info_arr[0]["sensor"] = "base.ascii_int"

    # time
    sensors_info_arr[1]["name"] = "time"
    sensors_info_arr[1]["sensor"] = "stdtelem.time"

    # lat
    sensors_info_arr[2]["name"] = "latitude"
    sensors_info_arr[2]["sensor"] = "stdtelem.coordinate"

    # lon
    sensors_info_arr[3]["name"] = "longitude"
    sensors_info_arr[3]["sensor"] = "stdtelem.coordinate"

    # alt
    sensors_info_arr[4]["name"] = "altitude"
    sensors_info_arr[4]["sensor"] = "base.ascii_float"

    return sensors_info_arr


def getSentenceInfo(i_payload_id, i_sentence=None):
    # print('getSentenceInfo', (i_payload_id, i_sentence))
    example_output = [
        {"name": "sentence_id", "sensor": "base.ascii_int"},
        {"name": "time", "sensor": "stdtelem.time"},
        {"name": "latitude", "sensor": "stdtelem.coordinate", "format": "dd.dddd"},
        {"name": "longitude", "sensor": "stdtelem.coordinate", "format": "dd.dddd"},
        {"name": "altitude", "sensor": "base.ascii_int"},
        {"name": "temperature_internal", "sensor": "base.ascii_float"},
        {"name": "temperature_external", "sensor": "base.ascii_float"},
        {"name": "satellites", "sensor": "base.ascii_int"},
        {"name": "some_float1", "sensor": "base.ascii_float"},
        {"name": "some_float2", "sensor": "base.ascii_float"},
        {"name": "some_float3", "sensor": "base.ascii_float"},
        {"name": "some_float4", "sensor": "base.ascii_float"},
        {"name": "packets_err", "sensor": "base.ascii_int"},
        {"name": "flags", "sensor": "base.string"},
    ]

    # ARY
    example_output = [
        {"name": "sentence_id", "sensor": "base.ascii_int"},
        {"name": "time", "sensor": "stdtelem.time"},
        {"name": "latitude", "sensor": "stdtelem.coordinate", "format": "dd.dddd"},
        {"name": "longitude", "sensor": "stdtelem.coordinate", "format": "dd.dddd"},
        {"name": "altitude", "sensor": "base.ascii_int"},
        {"name": "elev", "sensor": "base.ascii_int"},
        {"name": "temperature_internal", "sensor": "base.ascii_float"},
        {"name": "temperature_external", "sensor": "base.ascii_float"},
        {"name": "pressure", "sensor": "base.ascii_float"},
        {"name": "mesg", "sensor": "base.string"},
    ]

    # return example_output

    result = None

    payloads = getPayloads(getFlights())
    for p in payloads:
        # print("payload ", p['doc']['_id'], p['doc']['name'], i_payload_id)
        # if p['doc']['_id'] == i_payload_id or p['doc']['name'] == i_payload_id:
        if (
            p["doc"]["_id"] == i_payload_id
            or p["doc"]["sentences"][0]["callsign"] == i_payload_id
        ):
            result = p["doc"]["sentences"][0]["fields"]
            break
        else:
            pass
            # print(p)

    '''
    if not result and i_sentence:
        result = defaultSensorsInfo(i_sentence)
        print("Building Default sensor datainfo based on sentence: " + i_sentence)
        pprint(result)
        return result
    '''

    return result


"""
def getLastSentence_faked(i_payload_name):
	getLastSentence.last_id += 1
	result = "CALLSIGN," + str(getLastSentence.last_id) + ",15:41:24,44.32800,-74.14427,00491,0,0,12,30.7,0.0,0.001,20.2,958,1b*6BC9"
	result = formatSentence.formatSentence(result)
	return ""
	return result
getLastSentence_faked.last_id = 0
"""


def getLastSentence(i_payload_id):
    _url = (
        "http://habitat.habhub.org/habitat/_design/flight/_view/end_start_including_payloads?startkey=["
        + str(int(time()))
        + "]&include_docs=True"
    )

    try:
        flights_json = http.request("GET", _url)
    except urllib3.exceptions.MaxRetryError:
        return None

    flights = json.loads(flights_json.data.decode("utf-8"))["rows"]

    flight_id = None
    for f in flights:
        if f["doc"]["type"] != "flight":
            continue
        if i_payload_id in f["doc"]["payloads"]:
            flight_id = f["doc"]["_id"]
            break

    if flight_id:
        try:
            r = http.request(
                "GET",
                'http://habitat.habhub.org/habitat/_design/payload_telemetry/_view/flight_payload_time?startkey=["'
                + flight_id
                + '","'
                + i_payload_id
                + '",[]]&endkey=["'
                + flight_id
                + '","'
                + i_payload_id
                + '"]&include_docs=True&descending=True&limit=1',
            )
        except urllib3.exceptions.MaxRetryError:
            return None

        telemetry = json.loads(r.data.decode("utf-8"))["rows"]
        if telemetry:
            try:
                telemetry = json.loads(r.data.decode("utf-8"))["rows"][-1]
                last_sentence = telemetry["doc"]["data"]["_sentence"]
                last_sentence = last_sentence.strip()
            except KeyError:
                pprint(telemetry)
                return ""
            print(last_sentence)
            return last_sentence
    return None


def uploadChaseCar(car_data):
    r = None
    try:
        r = http.request(
            "GET",
            'http://spacenear.us/tracker/track.php',
            fields = car_data
        )
    except urllib3.exceptions.MaxRetryError:
        return False

    if r.status != 200:
        print(r.data)
        return False

    return True

if __name__ == "__main__":

    flights = getFlights()
    payloads = getPayloads(flights)

    """
	print "Flights:"
	pprint(flights)
	print "==================================="

	print "payloads:"
	pprint(payloads)
	print "==================================="

	for p in payloads:
		print "telemetry ", p['doc']['name']
		pprint( getTelemetry(p['doc']['name']) )
		print "==================================="

	print('M6')
	pprint ( getTelemetry('M6') )
	print "==================================="

	print( getSentenceInfo('MI6') )
	"""

    pprint(getSentenceInfo("5facec9731fc190ce510c9f1ee6e4bb8"))
    # pprint( getLastSentence('5facec9731fc190ce510c9f1ee6e4bb8') )

    # //////////////////////////////

    # print( getSentenceInfo( 0, 'fro3,3,220759,52.029996,21.999550,130.0,80.0,80.0,80.0*CE7D') )

