#!/usr/bin/env python3


import os
import string
import threading
from pprint import pprint, pformat
# import bisect
import datetime
import dateutil.parser
import traceback
import json
import math
from copy import deepcopy

import formatSentence
import HabHubInterface

import sqlite3
from sqlite3 import Error as sqerr


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


def sentence_time_formatter(i_str):
    result = datetime.datetime.utcnow()
    in_time = None
    if ":" in i_str:
        in_time = datetime.datetime.strptime(i_str, "%H:%M:%S")
    else:
        if len(i_str) < 6:
            i_str = i_str.zfill(6)
        in_time = datetime.datetime.strptime(i_str, "%H%M%S")

    result = result.replace(hour = in_time.hour)
    result = result.replace(minute = in_time.minute)
    result = result.replace(second = in_time.second)
    result = result.replace(microsecond = 0)
    return result

def coordinate_formatter(i_coord, i_format):
    if i_format == 'dd.dddd': # decimals
        degrees = float(i_coord)
        return degrees
    elif i_format == 'ddmm.mmmm': # degrees/minutes 02145.4512 = 21 degrees, 45 minutes 45.12 seconds
        coord = float(i_coord)
        degrees = math.trunc(coord/100.0)
        minutes = coord - 100.0 * degrees
        return (degrees + minutes/60.0)

def sensor_type_converter( i_sensor ):
    s_name = i_sensor['name']
    s_type = i_sensor['sensor']
    if s_type == "base.ascii_int":
        return lambda x: int(float(x))
    elif s_type == "base.ascii_float":
        return lambda x: float(x)
    elif s_type == "base.string":
        if s_name == 'time':
            return sentence_time_formatter
        return lambda x: x
    elif s_type == "stdtelem.time":
        return sentence_time_formatter
    elif s_type == "stdtelem.coordinate":
        if 'format' in i_sensor:
            return lambda x: coordinate_formatter(x, i_sensor['format'])
        else:
            return lambda x: float(x)
    else:
        lambda x: x

def is_sensor_numeric(i_sensor_type):
    if i_sensor_type == "base.ascii_int":
        return True
    elif i_sensor_type == "base.ascii_float":
        return True
    elif i_sensor_type == "base.string":
        return False
    elif i_sensor_type == "stdtelem.time":
        return False
    elif i_sensor_type == "stdtelem.coordinate":
        return False
    else:
        return False

def sensor_sql_type(i_sensor):
    s_type = i_sensor["sensor"]
    if s_type == "base.ascii_int":
        return "integer"
    elif s_type == "base.ascii_float":
        return "real"
    elif s_type == "base.string":
        if(i_sensor['name'] == 'time'):
            return 'timestamp'
        return "text"
    elif s_type == "stdtelem.time":
        return "timestamp"
    elif s_type == "stdtelem.coordinate":
        return "real"
    else:
        return "text"

class VehicleData(object):
    """
	keeps parsed data for specific callsign
	"""

    def __init__(self, i_sentence_info):
        # print("VehicleData init")
        # pprint(i_sentence_info)

        if not i_sentence_info:
            print('VehicleData init, no sentence info')
            raise ValueError

        self.__IDs = [] # list of sentence TIMESTAMPS

        # indexed with telemetry sensor name
        # each item is a dict
        # self.__data['altitude']['values'] = [] # raw values
        # self.__data['altitude']['accum'] = [] # sum of values
        # self.__data['altitude']['min'] = []
        # self.__data['altitude']['max'] = []
        # self.__data['altitude']['avg'] = []
        self.__data = {}

        # info about telemetry datatypes
        # indexed by position in sentence, excluding callsing
        self.__data_info = deepcopy(i_sentence_info)
        # self.__data_info = HabHubInterface.getSentenceInfo(
        #     self.__payloadName, i_sentence
        # )

        if not self.__data_info:
            print(10 * "VehicleData init - no sentence info. exit.\n")
            return
            raise ValueError

        for i in range(len(self.__data_info)):
            for k in self.__data_info[i]:
                self.__data_info[i][str(k)] = str(self.__data_info[i][k])

        for i in range(len(self.__data_info)):
            if "sensor" not in self.__data_info[i]:
                continue
            self.__data_info[i]["converter"] = sensor_type_converter( self.__data_info[i] )
            self.__data_info[i]["is_numeric"] = is_sensor_numeric( self.__data_info[i]["sensor"] )

    def __repr__(self):
        print("Vehicle Data:")
        print("__data")
        pprint(self.__data)
        pprint(self.__data_info)

    def to_str(self):
        return pformat(self.__data)

    def add(self, i_sentence, i_sentence_timestamp):
        sentences = formatSentence.formatSentence(i_sentence)
        for s in sentences:

            sensor_values_str_arr = formatSentence.getData(s)
            if len(sensor_values_str_arr) != len(self.__data_info):
                pprint(self.__data_info)
                raise ValueError(
                    "VehicleData ",
                    # self.__payloadName,
                    " Wrong Sentence Format (values count): ",
                    i_sentence,
                    len(sensor_values_str_arr),
                    len(self.__data_info),
                )

            sentence_id = i_sentence_timestamp

            # do not accept sentences older than last - this would require to recompute all stats
            if self.__IDs and sentence_id <= self.__IDs[-1]:
                return

            self.__IDs.append(sentence_id)
            # insert_index = self.__IDs.index(sentence_id)

            # sentence_time = sentence_time_formatter(sensor_values_str_arr[1])
            # self.__times.append(i_sentence_timestamp)

            if not self.__data:
                for i in range( 2, len(sensor_values_str_arr) ):  # skip sentence_id and time
                    sensor = self.__data_info[i]["name"]
                    self.__data[sensor] = {}
                    self.__data[sensor]["is_numeric"] = self.__data_info[i]["is_numeric"]
                    self.__data[sensor]["values"] = []  # raw values
                    if self.__data_info[i]["is_numeric"]:
                        self.__data[sensor]["accum"] = []  # sum of values
                        self.__data[sensor]["min"] = []
                        self.__data[sensor]["max"] = []
                        self.__data[sensor]["avg"] = []
                        self.__data[sensor]["dVdT"] = []

            for i in range(2, len(sensor_values_str_arr)):  # skip sentence_id and time
                sensor = self.__data_info[i]["name"]

                # value
                converter = self.__data_info[i]["converter"]
                value = converter(sensor_values_str_arr[i])
                self.__data[sensor]["values"].append(value)

                if not self.__data_info[i]["is_numeric"]:
                    continue

                # update min/max/avg
                #
                self.__data[sensor]["accum"].append(value)
                self.__data[sensor]["min"].append(value)
                self.__data[sensor]["max"].append(value)
                self.__data[sensor]["avg"].append(value)
                self.__data[sensor]["dVdT"].append(value) # not a good initial value - fix later

                if len(self.__data[sensor]["values"]) > 1:
                    self.__data[sensor]["min"][-1] = min(
                        self.__data[sensor]["min"][-2],
                        value
                    )
                    self.__data[sensor]["max"][-1] = max(
                        self.__data[sensor]["max"][-2],
                        value
                    )
                    self.__data[sensor]["accum"][-1] = self.__data[sensor]["accum"][-2] + value
                    self.__data[sensor]["avg"][-1] = float(self.__data[sensor]["accum"][-1]) / len(self.__data[sensor]["accum"])


                    # compute change over time - with dT at least 5 seconds
                    #

                    prev_index = len(self.__IDs) - 2
                    prev_time = self.__IDs[prev_index]
                    prev_value = self.__data[sensor]["values"][prev_index]
                    dT = float( (i_sentence_timestamp - prev_time).total_seconds() ) or 1
                    dVdT = float(value-prev_value) / dT

                    while prev_index >= 0:
                        prev_time = self.__IDs[prev_index]
                        dT = float( (i_sentence_timestamp - prev_time).total_seconds() )
                        if dT < 5:
                            prev_index -= 1
                            continue
                        else:
                            prev_value = self.__data[sensor]["values"][prev_index]
                            dVdT = float(value-prev_value) / dT
                            break
                    self.__data[sensor]["dVdT"][-1] = dVdT

                # fix first dVdT value
                if len(self.__data[sensor]["dVdT"]) == 2:
                    self.__data[sensor]["dVdT"][0] = self.__data[sensor]["dVdT"][1]

    def get_last(self, i_sensor_name):
        result = {}
        try:
            result["is_numeric"] = self.__data[i_sensor_name]["is_numeric"]
            result["values"] = [self.__data[i_sensor_name]["values"][-1]]
            result["times"] = [self.__IDs[-1]]
            if self.__data[i_sensor_name]["is_numeric"]:
                result["min"] = [self.__data[i_sensor_name]["min"][-1]]
                result["max"] = [self.__data[i_sensor_name]["max"][-1]]
                result["avg"] = [self.__data[i_sensor_name]["avg"][-1]]
                result["dVdT"] = [self.__data[i_sensor_name]["dVdT"][-1]]
        except KeyError:
            return result
        return result

    def get_by_time(self, i_sensor_name, i_time):
        """
		return sensor data past i_time (excluded)
		"""

        if i_sensor_name not in self.__data:
            return {}

        left_i = 0
        for i in range(len(self.__IDs)):
            left_i = i
            # print(self.__IDs[left_i], i_time, self.__IDs[left_i] > i_time)
            if self.__IDs[left_i] > i_time:
                break

        result = {}
        result["is_numeric"] = self.__data[i_sensor_name]["is_numeric"]
        result["values"] = self.__data[i_sensor_name]["values"][left_i:]
        result["times"] = self.__IDs[left_i:]
        if self.__data[i_sensor_name]["is_numeric"]:
            result["min"] = self.__data[i_sensor_name]["min"][left_i:]
            result["max"] = self.__data[i_sensor_name]["max"][left_i:]
            result["avg"] = self.__data[i_sensor_name]["avg"][left_i:]
            result["dVdT"] = self.__data[i_sensor_name]["dVdT"][left_i:]
        # print(i_sensor_name, len(result['times']),len(result['values']), len(result['dt']) )
        return result

    def sensorsList(self):
        # if self.__data:            return list(self.__data.keys())
        if self.__data_info:
            return [ s['name'] for s in self.__data_info ]
        return [None]

    def sensorsInfo(self):
        if self.__data_info:
            return copy.deepcopy( self.__data_info )
            # return [ s['name'] for s in self.__data_info ]
        return [None]

    def verify(self):
        if self.__IDs != sorted(self.__IDs):
            print ("IDs - unsorted")
        if self.__IDs != sorted(self.__IDs):
            print ('times unsorted')
            pprint(self.__IDs)


class SentencesDB(object):
    def __init__(self, db_file):
        if not db_file or db_file == "":
            raise ValueError("SentencesDB: no file specified.")

        self.__mutex = threading.Lock()

        self.__sensorsInfo = (
            {}
        )  # functions to convert from string to real data, indexed with payloadId
        self.__sqldb = None
        self.__sqldb_file = db_file
        self.__callsignToPayloadId = {}
        self.__sensorToPosition = {} # convert payload_id/sensor_name to position in sentence INCLUDING callsign

        self.__vehicles_data = {}  # class VehicleData, indexed by payloadId

        self.__initSQLDB()

    def __initSQLDB(self):
        if self.__sqldb:
            return
        self.__sqldb = sqlite3.connect(self.__sqldb_file, check_same_thread=False, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
        self.__sqldb.row_factory = sqlite3.Row
        self.__createPayloadInfoTable()
        self.__loadSensorsInfo()
        for payload_id in self.__sensorsInfo:
            self.__createPayloadTable(payload_id)
        self.__initVehiclesData()

    def __createPayloadInfoTable(self):
        """
		one global metadata table
		keeps info for each table
		"""

        meta_table_creation_ = "CREATE TABLE IF NOT EXISTS PayloadInfo ("
        meta_table_creation_ += "	PayloadId TEXT PRIMARY KEY,"
        meta_table_creation_ += "	callsign TEXT NOT NULL,"
        meta_table_creation_ += "	SentenceInfo TEXT NOT NULL"
        meta_table_creation_ += ");"

        try:
            with self.__mutex:
                cur = self.__sqldb.cursor()
                cur.execute(meta_table_creation_)
                self.__sqldb.commit()
        except sqerr as e:
            print(e)
            import traceback

            print(traceback.format_exc())
        except:
            import traceback

            print(traceback.format_exc())

    def __createPayloadTable(self, i_payloadId):
        """
		per payload table
		"""

        payload_table_creation_ = "CREATE TABLE IF NOT EXISTS {} (".format(
            "P_" + i_payloadId
        )

        for sensor_info in self.__sensorsInfo[i_payloadId]:
            payload_table_creation_ += (
                "\n\t" + sensor_info["name"] + " " + sensor_info["sql_data_type"] + ","
            )

        payload_table_creation_ += "\n\t_SENTENCE text,\n\t_RECEIVER text,\n\t_INSERT_TIME timestamp,"
        payload_table_creation_ += "\n\tPRIMARY KEY(sentence_id, time, _RECEIVER)\n);"

        cur = self.__sqldb.cursor()
        try:
            cur.execute(payload_table_creation_)
            self.__sqldb.commit()
        except sqerr as e:
            print(
                "error cur.execute(payload_table_creation_) - payload_id = ",
                i_payloadId,
            )
            print(e)
            print(payload_table_creation_)
            import traceback
            print(traceback.format_exc())
        except:
            import traceback

            print(traceback.format_exc())

    def __loadSensorsInfo(self):
        if self.__sensorsInfo and len(self.__sensorsInfo.keys()):
            print("__loadSensorsInfo - early exit")
            return

        # load from disk
        #

        habitat_data = {}
        try:
            with self.__mutex:
                cur = self.__sqldb.cursor()
                cur.execute("SELECT PayloadId,callsign,SentenceInfo FROM PayloadInfo;")
                for PayloadId, callsign, sensors_info_str in cur.fetchall():
                    habitat_data[PayloadId] = json.loads(sensors_info_str)
                    self.__callsignToPayloadId[callsign] = PayloadId
        except sqerr as e:
            print(e)
            import traceback

            print(traceback.format_exc())

        # convert from habitat data
        #

        for PayloadId in habitat_data:

            self.__sensorsInfo[PayloadId] = []

            self.__sensorToPosition[PayloadId] = {'callsign': 0}
            sensorPostiion = 1 # start with 1 because callsign is counted in indexing

            for sensor_info in habitat_data[PayloadId]:
                sensor_info["sql_data_type"] = sensor_sql_type( sensor_info )
                sensor_info["converter"] = sensor_type_converter( sensor_info )
                # sensor_info["sql_primary_key"] = sensor_info["name"] == "sentence_id"
                self.__sensorsInfo[PayloadId].append(sensor_info)
                self.__sensorToPosition[PayloadId][sensor_info['name']] = sensorPostiion
                sensorPostiion += 1


    def __initVehiclesData(self):
        # return
        if not self.__sqldb:
            return

        allPayloadIds = self.getAllPayloadIds()
        print("allPayloadIds:")
        pprint(allPayloadIds)
        sentences_count = {}

        cur = self.__sqldb.cursor()
        for pid,callsign in allPayloadIds:
            sentences_count[pid] = 0

            # update vehicles data
            if pid not in self.__vehicles_data:
                _t = VehicleData(self.getSensorsInfo(pid))
                self.__vehicles_data[pid] = _t

            try:
                cur.execute(" select time,_SENTENCE from {};".format("P_" + pid))
            except sqlite3.OperationalError as e:
                if 'no such table: P_' in str(e):
                    continue # no data/table for this payload_id
                else:
                    print(traceback.format_exc())
                    continue

            for time, sentence in cur.fetchall():
                try:
                    self.__vehicles_data[pid].add(sentence, time)
                    sentences_count[pid] += 1
                except:
                    print("Can't parse ", sentence)
                    print(traceback.format_exc())

            # if pid in self.__vehicles_data:                print( self.__vehicles_data[pid].to_str() )


        if sentences_count:
            print("Restored Vehicles Data from DB:")
            for k, v in sentences_count.items():
                callsign = self.payloadIdToCallsign(k)
                print("\t", callsign, v)

        # for pid in self.__vehicles_data:
        # 	print(pid)
        # 	print(self.__vehicles_data[pid])

        # for pid in self.__vehicles_data:
            # self.__vehicles_data[pid].verify()

    def callsignToPayloadId(self, i_callsign):
        if i_callsign in self.__callsignToPayloadId:
            return self.__callsignToPayloadId[i_callsign]
        return None

    def create_empty(self):
        self.__initSQLDB()


    def payloadIdToCallsign(self, i_payloadId):
        try:
            with self.__mutex:
                cur = self.__sqldb.cursor()
                cur.execute(
                    'SELECT callsign FROM PayloadInfo WHERE PayloadId is "{}";'.format(
                        str(i_payloadId)
                    )
                )
                return cur.fetchall()[0][0]
        except sqerr as e:
            print(e)
            import traceback
            print(traceback.format_exc())
            return None
        except IndexError:
            return None

    def updatePayloadInfo(self, i_payloadId, i_sentence=None):
        callsign = HabHubInterface.getCallsignsForPayloadId(i_payloadId)

        sentence_info = HabHubInterface.getSentenceInfo(i_payloadId, i_sentence)
        if not sentence_info:
            print("UpdatePayloadInfo - No Sentence Info for payload ", i_payloadId)
            return

        # HACK !
        # time field can have many names, lets always use 'time'
        for i in range(len(sentence_info)):
            if 'time' in sentence_info[i]['name']:
                sentence_info[i]['name'] = 'time'
                break


        sql_insert = (
            "REPLACE INTO PayloadInfo(PayloadId, callsign, SentenceInfo) VALUES(?,?,?)"
        )

        try:
            with self.__mutex:
                cur = self.__sqldb.cursor()
                cur.execute(
                    sql_insert,
                    (
                        i_payloadId,
                        callsign,
                        json.dumps(sentence_info, sort_keys=True, indent=4),
                    ),
                )
                self.__sqldb.commit()
        except sqerr as e:
            print(e)
            import traceback

            print(traceback.format_exc())

    def getAllPayloadIds(self):
        try:
            with self.__mutex:
                cur = self.__sqldb.cursor()
                cur.execute("select PayloadId, callsign from PayloadInfo;")
                res = [ [x[0], x[1]] for x in cur.fetchall()]
                return res
        except sqerr as e:
            print(e)
            import traceback

            print(traceback.format_exc())

    def getInfo(self):
        try:
            with self.__mutex:
                cur = self.__sqldb.cursor()
                cur.execute("select * from PayloadInfo;")
                res = [list(x) for x in cur.fetchall()]
                res = [ [x[0], x[1], json.loads(x[2])] for x in res]
                return res
        except sqerr as e:
            print(e)
            import traceback
            print(traceback.format_exc())

    def insert(self, i_sentence, i_RECEIVER="unknown"):
        if not i_sentence:
            return

        sentences = formatSentence.formatSentence(i_sentence)
        if not sentences:
            return

        with self.__mutex:
            for sentence in sentences:
                callsign = formatSentence.sentenceToCallsign(sentence)
                payload_id = self.callsignToPayloadId(callsign)
                if not payload_id:
                    print("DB Insert -- Unknown callsign: ", callsign)
                    continue

                sent_id = formatSentence.sentenceToId(sentence)

                if not self.__sensorsInfo:
                    print("DB Insert -- No sentence data info. returning.")
                    return

                # get data from sentence and convert from string to real types
                sensors_data = formatSentence.getData(sentence)
                try:
                    for i in range(len(sensors_data)):
                        converter = self.__sensorsInfo[payload_id][i]["converter"]
                        sensors_data[i] = converter(sensors_data[i])
                except:
                    print("DB Insert -- Error converting sentence fields to data.")
                    print(traceback.format_exc())
                    continue

                # _SENTENCE field
                sensors_data.append(sentence)

                # _RECEIVER field
                sensors_data.append(str(i_RECEIVER))

                # _INSERT_TIME field
                sensors_data.append(datetime.datetime.utcnow())


                sql_insert = "INSERT INTO {}(".format("P_" + payload_id)
                sql_insert += ",".join(
                    [sensor["name"] for sensor in self.__sensorsInfo[payload_id]]
                )
                sql_insert += ", _SENTENCE, _RECEIVER, _INSERT_TIME"
                sql_insert += ")"
                sql_insert += (
                    "\n\tVALUES(" + ",".join(["?"] * len(sensors_data)) + ")"
                )

                cur = self.__sqldb.cursor()
                try:
                    cur.execute(sql_insert, sensors_data)
                    self.__sqldb.commit()
                    # print( cur.lastrowid )
                except sqlite3.IntegrityError:
                    pass
                    # print("sqlite3.IntegrityError - already inserted ?")
                except sqerr as e:
                    print(e)

                # update vehicles data
                if payload_id not in self.__vehicles_data:
                    self.__vehicles_data[payload_id] = VehicleData(
                        self.getSensorsInfo(payload_id)
                    )
                try:
                    sentence_timestamp = sensors_data[ self.__sensorToPosition[payload_id]['time'] -1 ]
                    self.__vehicles_data[payload_id].add(sentence, sentence_timestamp)
                except:
                    print("DB Insert -- Can't parse ", sentence)
                    print(traceback.format_exc())
        return True

    def getSensorsList(self, i_payloadId):
        with self.__mutex:
            if i_payloadId in self.__vehicles_data:
                return deepcopy( self.__vehicles_data[i_payloadId].sensorsList() )
            else:
                pass
                # print(self.__vehicles_data.keys())
        return []

    def getSensorsInfo(self, i_payloadId):
        with self.__mutex:
            if i_payloadId in self.__sensorsInfo:
                return deepcopy( self.__sensorsInfo[i_payloadId] )
        return None

    def getTelemetryLast(self, i_payloadId, i_sensor_name):
        with self.__mutex:
            if not list(self.__vehicles_data.keys()):
                return {}

            if i_payloadId not in self.__vehicles_data:
                return {}

            return self.__vehicles_data[i_payloadId].get_last(i_sensor_name)

    def getTelemetryByTime(self, i_payloadId, i_sensor_name, i_time):
        _t = i_time
        if type(_t) == type(""):
            # _t = datetime.datetime.strptime(_t, "%Y-%m-%d %H:%M:%S")
            _t = dateutil.parser.parse(_t, ignoretz=1)

        with self.__mutex:
            if not list(self.__vehicles_data.keys()):
                return []

            if i_payloadId not in self.__vehicles_data:
                return []

            return self.__vehicles_data[i_payloadId].get_by_time(i_sensor_name, _t)

    def getLastSentence(self, i_payloadId):
        if not i_payloadId:
            print("getLastSentence: i_payloadId = ", i_payloadId)
            return

        if not self.__sqldb:
            return None

        with self.__mutex:
            tab_name = "P_" + i_payloadId
            cur = self.__sqldb.cursor()
            # cur.execute("select MAX(time) from {};".format(tab_name))
            cur.execute("select MAX(_INSERT_TIME) from {};".format(tab_name))
            last_time = cur.fetchone()[0]
            if last_time:
                cur.execute(
                    # "select * from {} where time is '{}';".format(
                    "select * from {} where _INSERT_TIME is '{}';".format(
                        tab_name, last_time
                    )
                )
                values = cur.fetchall()
                return dict(values[0])

    def getLastSentenceId(self, i_payloadId):
        if not i_payloadId:
            print("getLastSentenceId: i_payloadId = ", i_payloadId)
            return

        if not self.__sqldb:
            return

        with self.__mutex:
            tab_name = "P_" + i_payloadId
            cur = self.__sqldb.cursor()
            cur.execute("select MAX(sentence_id) from {};".format(tab_name))
            last_sentence_id = cur.fetchone()[0]
            if last_sentence_id:
                return last_sentence_id

        return

    def getReceiversStats(self, i_payloadId):
        if not i_payloadId:
            return

        if not self.__sqldb:
            return

        with self.__mutex:
            try:
                c = self.__sqldb.cursor()
                tab_name = "P_" + i_payloadId
                c.execute("SELECT DISTINCT _RECEIVER FROM {}".format(tab_name))
                all_receivers = c.fetchall()
                all_receivers = [a[0] for a in all_receivers]
                # print(all_receivers)

                receiver_stats = {}
                for r in all_receivers:
                    c.execute(
                        'SELECT COUNT(sentence_id) FROM "{}" WHERE _RECEIVER = "{}"'.format(
                            tab_name, r
                        )
                    )
                    receiver_stats[r] = int(c.fetchone()[0])

                # pprint(receiver_stats)
                return receiver_stats
            except sqlite3.OperationalError as e:
                if 'no such table: P_' in str(e):
                    return None # no data/table for this payload_id
                else:
                    print(traceback.format_exc())
                    return None

        return

if __name__ == "__main__":
    print(sentence_time_formatter('123456'))
    print(sentence_time_formatter('12:34:56'))