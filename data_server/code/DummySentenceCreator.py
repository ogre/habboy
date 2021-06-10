#!/usr/bin/env python3

from datetime import datetime as dtime
import os
import time
import math
import random
import formatSentence
import json
import urllib3

urllib3.disable_warnings()
http = urllib3.PoolManager()

C_BLACK = "\033[1;30m"
C_RED = "\033[1;31m"
C_GREEN = "\033[1;32m"
C_BROWN = "\033[1;33m"
C_BLUE = "\033[1;34m"
C_MAGENTA = "\033[1;35m"
C_CYAN = "\033[1;36m"
C_LIGHTGREY = "\033[1;37m"
C_OFF = "\033[0m"
C_CLEAR = "\033[2K"

if os.name == 'nt':
    C_BLACK=C_RED=C_GREEN=C_BROWN=C_BLUE=C_MAGENTA=C_CYAN=C_LIGHTGREY=C_OFF=C_CLEAR=''


def DummySentenceCreator(i_payloadId, i_callsign, i_sensors_info, lat=None, lon=None, alt=None):

    if not DummySentenceCreator.sentence_id:
        # get last ID from DB to maintain continuity
        # or comment out to test for real payloads that can restart and start from 0
        #DummySentenceCreator.sentence_id = G_SentencesDB.getLastSentenceId(i_payloadId)

        if not DummySentenceCreator.sentence_id:
            DummySentenceCreator.sentence_id = 1

    sentence = i_callsign
    s_id = DummySentenceCreator.sentence_id
    DummySentenceCreator.sentence_id += 1

    for si in i_sensors_info:
        if not "sensor" in si:
            continue

        if si["name"] == "sentence_id":
            sentence += "," + str(int(s_id))
        elif si["name"] == "date":
            sentence += "," + dtime.utcnow().strftime("%m%D")
        elif si["name"] == "time":
            sentence += "," + dtime.utcnow().strftime("%H%M%S")
        elif si["name"] == "latitude":
            if lat:
                sentence += ",{0:.6f}".format(lat)
            else:
                sentence += ",{0:.6f}".format(52.0 + math.sin(0.01 * s_id) + .0001  * random.randrange(0, 100))
        elif si["name"] == "longitude":
            if lon:
                sentence += ",{0:.6f}".format(lon)
            else:
                sentence += ",{0:.6f}".format(21.0 + math.cos(0.01 * s_id) + .0001  * random.randrange(0, 100))
        elif si["name"] == "altitude":
            if alt:
                sentence += ",{}".format(int(alt))
            else:
                sentence += ",{}".format(int(100 + s_id * 10))
        elif si["name"] == "satellites":
            sentence += "," + str(random.randrange(3, 12))
        else:
            if si["sensor"] == "base.ascii_float":
                sentence += ",{0:.2f}".format(random.random())
            elif si["sensor"] == "base.ascii_int":
                sentence += "," + str(random.randrange(-100, 100))
            else:
                sentence += "," + si["sensor"]

    sentence += "*" + formatSentence.crc(sentence)
    # print(C_RED, "DUMMY ", sentence, C_OFF)
    return sentence

DummySentenceCreator.sentence_id = 0


if __name__ == "__main__":
	while True:
		time.sleep(5)
		snt  =DummySentenceCreator(
			i_payloadId = None,
			i_callsign = 'SP5WWL',
			i_sensors_info = [
					{
						"name": "sentence_id",
						"sensor": "base.ascii_int"
					},
					{
						"name": "time",
						"sensor": "base.string"
					},
					{
						"format": "ddmm.mmmm",
						"name": "latitude",
						"sensor": "stdtelem.coordinate"
					},
					{
						"format": "ddmm.mmmm",
						"name": "longitude",
						"sensor": "stdtelem.coordinate"
					},
					{
						"name": "altitude",
						"sensor": "base.ascii_float"
					},
					{
						"name": "battery",
						"sensor": "base.ascii_float"
					},
					{
						"name": "satellites",
						"sensor": "base.ascii_int"
					},
					{
						"name": "telemetry",
						"sensor": "base.string"
					}
				],
		)

		res = http.request('PUT', 'http://localhost:8888/habboy/api/v1/sentence/dummy/' + snt)
		res = json.loads( res.data.decode("utf-8") )
		print (res, snt)
