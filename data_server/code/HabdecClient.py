#!/usr/bin/env python3

# BASIC COMMUNICATION WITH HABDEC WEBSOCKET SERVER
#


import sys
import string
from ws4py.client.threadedclient import WebSocketClient  # pip install ws4py
import struct
import time
import threading
import bisect
import traceback
import datetime

import HabHubInterface
import formatSentence

# GLOBAL VARIABLES:
#
WS = None  # websocket
WS_THREAD = None
SENTENCES = []


# WEBSOCKET CLIENT
#
class HabdecClient(WebSocketClient):
    def __init__(self, i_habdec_server):
        if not i_habdec_server.lower().startswith('ws://'):
            i_habdec_server = 'ws://' +     i_habdec_server
        self.habdec_server = i_habdec_server
        WebSocketClient.__init__(self, self.habdec_server)

        # self.__sentences_dict = {}
        # self.__sentences_sorted_ids = []
        self.__sentences_arr = []
        self.__sentence_mtx = threading.Lock()

        self.__sentence_thread = None
        self.__sentence_run = False
        self.__habdec_thread = None
        self.__habdec_run = False
        self.__habdec_connection_initialized = False

        self.__last_connection_time = datetime.datetime.utcfromtimestamp(0)
        self.__last_sentence_time = datetime.datetime.utcfromtimestamp(0)

    def opened(self):
        print("Opened Connection")

    def closed(self, code, reason=None):
        print("Closed down", code, reason)

    def __connect(self):
        if self.terminated:
            WebSocketClient.__init__(self, self.habdec_server)

        # while self.__sentence_run:
        while self.__habdec_run:
            try:
                print("Connecting to Habdec ", self.habdec_server, "... ")
                self.connect()
                print("Connected  to Habdec ", self.habdec_server, "... ")
                return
            except KeyboardInterrupt:
                print("Connection interruped KeyboardInterrupt")
                return
            except:
                # print("Failed connection.")
                # print('traceback: ', traceback.format_exc())
                time.sleep(1)

    def Start(self):
        self.__habdec_run = True
        self.__habdec_thread = threading.Thread(target=self.run_forever)
        self.__habdec_thread.start()

        self.__sentence_run = True
        self.__sentence_thread = threading.Thread(target=self.__get_sentence_thread_f)
        self.__sentence_thread.start()

    def Stop(self):
        print("Habdec Client Stopping... " + self.habdec_server)
        self.__sentence_run = False
        self.__habdec_run = False

        if self.__sentence_thread and self.__sentence_thread.is_alive():
            self.__sentence_thread.join()

        try:
            self.close()
            self.__habdec_connection_initialized = False
        except:
            print("Error HabdecClient::Stop -> close()")
            print(traceback.format_exc())
        self.__habdec_thread = None

    def __get_sentence_thread_f(self):
        if not self.__habdec_connection_initialized:
            self.__connect()
            self.__habdec_connection_initialized = True
        while self.__sentence_run:
            if self.terminated:
                self.__connect()
            try:
                self.send("cmd::sentence")
            except:
                print("Problem communicating Habdec")
                print("traceback: ", traceback.format_exc())
            time.sleep(1)

    def received_message(self, m):
        self.__last_connection_time = datetime.datetime.utcnow()
        i_data = None
        try:
            i_data = m.data.decode()
        except:
            print(self.habdec_server + " - Can't decode data.")
        if not i_data:
            return

        if i_data.startswith("cmd::info:sentence"):
            sent_str = i_data[len("cmd::info:sentence:") :]
            sentences = formatSentence.formatSentence(sent_str)
            if sentences:
                sent = sentences[-1]
                sent_id = formatSentence.sentenceToId(sent)
                if sent_id:
                    with self.__sentence_mtx:
                        self.__sentences_arr.append( sent )
                        self.__last_sentence_time = datetime.datetime.utcnow()
                        # if sent_id not in self.__sentences_dict:
                        #     self.__sentences_dict[sent_id] = sent
                        #     bisect.insort(self.__sentences_sorted_ids, sent_id)
                        #     self.__last_sentence_time = datetime.datetime.utcnow()

    def GetLastSentence(self):
        res = None
        with self.__sentence_mtx:
            if len(self.__sentences_arr):
                return self.__sentences_arr[-1]
            # if len(self.__sentences_sorted_ids):
            #     res = self.__sentences_dict[self.__sentences_sorted_ids[-1]]
        return res

    def GetLastSentenceReceiveTime(self):
        with self.__sentence_mtx:
            return self.__last_sentence_time

    def GetLastConnectionTime(self):
        return self.__last_connection_time