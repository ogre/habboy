#!/usr/bin/env python3


import string
import time
import datetime
import threading
import urllib3
import traceback
import math
import random

import HabHubInterface
import formatSentence


def fake_sentence():
    # 'CALLSIGN,25,15:41:24,44.32800,-74.14427,00491,0,0,12,30.7,0.0,0.001,20.2,958,1b*6BC9'
    # CALLSIGN,3748,15:41:24,44.32800,-74.14427,00491,0,0,12,30.7,0.0,0.001,20.2,958,1b*D55E
    res = ""

    res += "ARY_test"

    res += "," + str(fake_sentence.id)
    fake_sentence.id += 1

    res += "," + datetime.datetime.utcnow().strftime("%H%M%S")
    res += "," + str(52.0 + math.sin(float(fake_sentence.id) / 50))  # lat
    res += "," + str(21.0 + math.sin(float(fake_sentence.id) / 50))  # lon
    res += "," + str(80 + int(35000.0 * math.sin(float(fake_sentence.id) / 250)))  # alt
    res += "," + str(300 + int(100.0 * math.sin(float(fake_sentence.id) / 250)))  # elev
    res += "," + str(
        15.0 + 20.0 * math.sin(float(fake_sentence.id) / 250)
    )  # temperature_internal
    res += "," + str(
        -10.0 + 20.0 * math.sin(float(fake_sentence.id) / 250)
    )  # temperature_external
    res += "," + str(1000.0 * (1.0 / (1 + 0.1 * fake_sentence.id)))  # pressure
    res += ",A"
    # flags

    res += "*" + formatSentence.crc(res)
    return res


fake_sentence.id = 1


class HabHubClient(object):
    """
	periodically polls habitat for specific payload telemetry
	"""

    interval_seconds = 15

    def __init__(self, i_payload_id, i_interval_seconds = None):
        self.__payload_id = i_payload_id
        self.__sentence_thread = None
        self.__sentence_run = False

        self.__sentences_dict = {}
        self.__sentence_mtx = threading.Lock()

        self.__interval_seconds = i_interval_seconds or HabHubClient.interval_seconds

        self.__last_connection_time = datetime.datetime.utcfromtimestamp(0)
        self.__last_sentence_time = datetime.datetime.utcfromtimestamp(0)

        print("Initialized HabHub client with payload_id ", i_payload_id)

    def __habhub_thread_f(self):
        while self.__sentence_run:
            time.sleep( self.__interval_seconds )

            sentences = [ HabHubInterface.getLastSentence(self.__payload_id) ]
            self.__last_connection_time = datetime.datetime.utcnow()
            # sentences = [fake_sentence()]
            # print ("!!!!!!!!!!!!! FAKE !!!!!!!!!!!!!!!")

            if not sentences:
                continue

            sentence = sentences[-1]
            sent_id = formatSentence.sentenceToId(sentence)

            if sent_id:
                with self.__sentence_mtx:
                    if sent_id not in self.__sentences_dict:
                        self.__sentences_dict[sent_id] = sentence
                        self.__last_sentence_time = datetime.datetime.utcnow()
                        # print("Habitat: ", sentence)

    def Start(self):
        self.__sentence_run = True
        self.__sentence_thread = threading.Thread(target=self.__habhub_thread_f)
        self.__sentence_thread.start()

    def Stop(self):
        print("HabHub Client Stopping ", self.__payload_id)
        self.__sentence_run = False
        if self.__sentence_thread and self.__sentence_thread.is_alive():
            self.__sentence_thread.join()
        self.__sentence_thread = None

    def GetLastSentence(self):
        res = None
        with self.__sentence_mtx:
            if len(self.__sentences_dict):
                max_id = max(self.__sentences_dict.keys())
                if max_id:
                    res = self.__sentences_dict[max_id]
        # return 'CALLSIGN,25,15:41:24,44.32800,-74.14427,00491,0,0,12,30.7,0.0,0.001,20.2,958,1b*6BC9'
        # return fake_sentence()
        return res

    def GetLastSentenceReceiveTime(self):
        with self.__sentence_mtx:
            return self.__last_sentence_time

    def GetLastConnectionTime(self):
        return self.__last_connection_time