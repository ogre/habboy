#!/usr/bin/env python3

import os
import sys
import time
import threading
import functools
import traceback
import argparse
from pprint import pprint
import urllib3
import subprocess
from datetime import datetime as dtime
import string
import datetime
import math
import serial
from copy import deepcopy
import psutil
import platform

import formatSentence
import HabdecClient
import HabHubClient
import HabHubInterface
import SentencesDB
import HttpInterface
import nmea
from get_ip import get_ip_local

from DummySentenceCreator import DummySentenceCreator

G_RUN = True

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

# collect sentences from habitat and habdec
G_SENTENCES_DB = None
G_HABDEC_CLIENTS = {}
G_HABHUB_CLIENTS = {}
G_CLIENTS_MTX = threading.Lock()

# process statistics
G_HABBOY_STATS = {}
G_HABBOY_STATS_MTX = threading.Lock()

# flight prediction path
G_PREDICT_PATH = {}
G_PREDICT_PATH_MTX = threading.Lock()

# GPS for HABBOY/DEVICE
G_GPS_Data = {
	'time': datetime.datetime.utcnow(),
	'parse_timestamp': datetime.datetime.utcnow(),
	"latitude": 52,
	"longitude": 21,
	"altitude": 100,
	'heading': 0,
	'ground_speed_mps': 0,
	'sats': 0,
}

def get_ip():
	p = subprocess.Popen("ip route list", shell=True, stdout=subprocess.PIPE)
	data = p.communicate()
	data = data[0].decode().split("\n")
	while "" in data:
		data.remove("")
	split_data = data[-1].split()

	ipaddr = split_data[split_data.index("src") + 1]
	return ipaddr



def GpsDataFileRead(gps_data_file):
	if gps_data_file:
		with open(gps_data_file) as fh:
			lat_lon_alt = fh.read()
			sep = ',' if (',' in lat_lon_alt) else ' '
			lat_lon_alt = lat_lon_alt.split('\n')
			lat_lon_alt = [x.strip() for x in lat_lon_alt]
			while '' in lat_lon_alt:    lat_lon_alt.remove('')
			lat_lon_alt = [ l.split(sep) for l in lat_lon_alt ]
			lat_lon_alt = [ (float(t[1]), float(t[0]), float(t[2])) for t in lat_lon_alt]
			return lat_lon_alt


def DummySentenceThreadF(i_payloadId, interval_seconds, gps_data_file):
	callsign = G_SENTENCES_DB.payloadIdToCallsign(i_payloadId)
	sensors_info = G_SENTENCES_DB.getSensorsInfo(i_payloadId)

	lat_lon_alt = GpsDataFileRead(gps_data_file)

	global G_RUN
	while G_RUN:
		time.sleep(interval_seconds)
		lat, lon, alt = (0,0,0)
		if lat_lon_alt:
			lat, lon, alt = lat_lon_alt.pop(0)
		s = DummySentenceCreator(i_payloadId, callsign, sensors_info, lat, lon, alt)
		print(s)
		G_SENTENCES_DB.insert(s, "debug")


def SentenceGatherThreadF(habdec_addr_arr, i_payload_id):
	"""
	collect sentences from habitat and habdec
	"""

	global G_HABDEC_CLIENTS
	global G_HABHUB_CLIENTS

	with G_CLIENTS_MTX:
		for habdec_addr in habdec_addr_arr:
			G_HABDEC_CLIENTS[habdec_addr] = HabdecClient.HabdecClient(
				habdec_addr
			)  # "ws://localhost:5555"
			G_HABDEC_CLIENTS[habdec_addr].Start()

		G_HABHUB_CLIENTS[i_payload_id] = HabHubClient.HabHubClient(i_payload_id)
		G_HABHUB_CLIENTS[i_payload_id].Start()

	habdec_last_querry_time = dtime.utcnow()
	habhub_last_querry_time = dtime.utcnow()

	while G_RUN:
		time.sleep(1)

		with G_CLIENTS_MTX:
			if (dtime.utcnow() - habdec_last_querry_time).total_seconds() > 1:
				for habdec in G_HABDEC_CLIENTS:
					HabdecClient_GetLastSentence = G_HABDEC_CLIENTS[habdec].GetLastSentence()
					if HabdecClient_GetLastSentence:
						print(C_RED, "Habdec: " + habdec + " ", HabdecClient_GetLastSentence, C_OFF)
						G_SENTENCES_DB.insert(HabdecClient_GetLastSentence, habdec)
					else:
						pass
						# print("habdec no last sentence")
				habdec_last_querry_time = dtime.utcnow()

			if (dtime.utcnow() - habhub_last_querry_time).total_seconds() > 3:
				for payload_id in G_HABHUB_CLIENTS:
					HabHubClient_GetLastSentence = G_HABHUB_CLIENTS[payload_id].GetLastSentence()
					if HabHubClient_GetLastSentence:
						print(C_MAGENTA, "HabHub: ", HabHubClient_GetLastSentence, C_OFF)
						G_SENTENCES_DB.insert(HabHubClient_GetLastSentence, "habhub")
				habhub_last_querry_time = dtime.utcnow()

	with G_CLIENTS_MTX:
		if G_HABDEC_CLIENTS:
			for k, v in G_HABDEC_CLIENTS.items():
				v.Stop()
			G_HABDEC_CLIENTS = {}

		if G_HABHUB_CLIENTS:
			for k, v in G_HABHUB_CLIENTS.items():
				v.Stop()
			G_HABHUB_CLIENTS = {}


def GPSD_ReadThread():
	try:
		import gps
	except ImportError:
		print("No gps module")
		return
	session = gps.gps("localhost", "2947")
	session.stream(gps.WATCH_ENABLE | gps.WATCH_NEWSTYLE)
	global G_GPS_Data
	sats = 0
	while G_RUN:
		try:
			report = session.next()
			# print(report)

			if report['class'] == 'SKY':
				used = [s.used for s in report.satellites]
				sats = sum(used)
			elif report['class'] == 'TPV':
				_res = {
					'time': report.time, #probably need to convert from str to datetime
					"latitude": report.lat,
					"longitude": report.lon,
					"altitude": report.alt,
					'heading': report.track,
					'ground_speed_mps': report.speed,
					'sats': sats
				}
				G_GPS_Data = _res
		except KeyError:
			pass
		except StopIteration:
			session = None
			print("GPSD has terminated")
		except:
			# print(traceback.format_exc())
			# print(report)
			pass


def GPS_Serial_Thread(i_dev, line_callback):
	global G_GPS_Data
	nmea_parser = nmea.nmea_parser()
	_ser = None

	while G_RUN:

		if not _ser:
			try:
				_ser = serial.Serial(i_dev, 115200)
			except:
				print(traceback.format_exc())
				time.sleep(1)
				continue

		try:
			line = _ser.readline()
		except:
			print(traceback.format_exc())
			_ser = None

		if line:
			try:
				if line_callback:
					line_callback(line)
			except:
				pass

			try:
				nmea_data = nmea_parser.feed_line(line)
				if nmea_data:
					new_gps_data = {
						'time': nmea_data.utc_time,
						"latitude": nmea_data.lat,
						"longitude": nmea_data.lon,
						"altitude": nmea_data.alt,
						'heading': nmea_data.heading,
						'ground_speed_mps': nmea_data.ground_speed_mps,
						'sats': nmea_data.sats,
						'parse_timestamp': nmea_data.parse_timestamp
					}
					G_GPS_Data = new_gps_data
			except:
				print(traceback.format_exc())



def GPS_Serial_Thread_Fake():
	global G_GPS_Data
	while G_RUN:
		new_gps_data = {
			'time': datetime.datetime.utcnow(),
			"latitude": 52 + .01 * math.sin(.1 * GPS_Serial_Thread_Fake.T),
			"longitude": 21 + .01 *  math.cos(.1 * GPS_Serial_Thread_Fake.T),
			"altitude": 100,
			'heading': 0,
			'ground_speed_mps': 50,
			'sats': 11,
			'parse_timestamp': datetime.datetime.utcnow()
		}
		G_GPS_Data = new_gps_data
		GPS_Serial_Thread_Fake.T += 1
		time.sleep(1)

GPS_Serial_Thread_Fake.T = 0


def GET_HABBOY_GPS():
	'''
	get current HABBOY GPS
	add 'fix_age' and 'data_age' fields
	'''
	global G_GPS_Data
	gps = deepcopy(G_GPS_Data)
	_now = datetime.datetime.utcnow()
	gps['fix_age']  = (_now - gps['time']).total_seconds()
	gps['data_age'] = (_now - gps['parse_timestamp']).total_seconds()
	return gps



def get_process_stats(i_proc_name_list):
	start = datetime.datetime.utcnow()
	result = {}

	try:
		result['global'] = {}
		result['global']['cpu_load_%'] = psutil.cpu_percent(interval=1)
	except:
		pass

	try:
		vmem = psutil.virtual_memory()
		result['global']['mem_%'] = vmem.used / vmem.total * 100
	except:
		pass

	try:
		disk = psutil.disk_usage('/')
		result['global']['disk_%'] = disk.used / disk.total * 100
	except:
		pass

	try:
		temp = psutil.sensors_temperatures()
		result['global']['temp'] = 0
	except:
		pass

	try:
		result['global']['temp'] = temp['cpu_thermal'][0].current
	except:
		pass


	# processes
	procs_pid2name = {}
	for proc in psutil.process_iter(['pid', 'name']):
		procs_pid2name[proc.info['name']] = proc.info['pid']
	result['proc'] = {}
	for pname in i_proc_name_list:
		if pname not in procs_pid2name:
			print('not', pname)
			continue
		p = psutil.Process(procs_pid2name[pname])
		if not p:
			continue
		result['proc'][pname] = {}
		# result['proc'][pname]['stat'] = p.status()
		result['proc'][pname]['cpu_load_%'] = p.cpu_percent(interval=1)
		result['proc'][pname]['runtime'] = time.time() - p.create_time()
		result['proc'][pname]['mem_MB'] = p.memory_full_info().rss / 1e6
		# result['proc'][pname]['mem'] = p.memory_percent()
		result['proc'][pname]['connections'] = len( p.connections() )

	return result


def PROC_STATS_THREAD_F(proc_list):
	global G_RUN
	while G_RUN:
		stats = {}
		try:
			stats = get_process_stats(proc_list)
		except:
			print(traceback.format_exc())

		stats['telemetry'] = {}
		stats['telemetry']['habdec'] = {}
		stats['telemetry']['habhub'] = {}
		global G_HABDEC_CLIENTS
		global G_HABHUB_CLIENTS
		global G_CLIENTS_MTX
		try:
			with G_CLIENTS_MTX:
				now = datetime.datetime.utcnow()
				for hd in G_HABDEC_CLIENTS:
					stats['telemetry']['habdec'][hd] = {}
					stats['telemetry']['habdec'][hd]['connection_age'] = (now - G_HABDEC_CLIENTS[hd].GetLastConnectionTime()).total_seconds()
					stats['telemetry']['habdec'][hd]['sentence_age'] = (now - G_HABDEC_CLIENTS[hd].GetLastSentenceReceiveTime()).total_seconds()
				for hh in G_HABHUB_CLIENTS:
					stats['telemetry']['habhub'][hh] = {}
					stats['telemetry']['habhub'][hh]['connection_age'] = (now - G_HABHUB_CLIENTS[hh].GetLastConnectionTime()).total_seconds()
					stats['telemetry']['habhub'][hh]['sentence_age'] = (now - G_HABHUB_CLIENTS[hh].GetLastSentenceReceiveTime()).total_seconds()
		except:
			print(traceback.format_exc())

		global G_HABBOY_STATS
		global G_HABBOY_STATS_MTX
		with G_HABBOY_STATS_MTX:
			G_HABBOY_STATS = deepcopy(stats)

		time.sleep(5)


def GET_HABBOY_STATS():
	stats = {}
	global G_HABBOY_STATS
	global G_HABBOY_STATS_MTX
	with G_HABBOY_STATS_MTX:
		stats = deepcopy(G_HABBOY_STATS)
	return stats


def CalcPayloadPrediction(payload_id, predictor, expected_burst):
	if not predictor:
		print("NO PREDICTOR")
		return {}

	# https://github.com/projecthorus/chasemapper/blob/master/horusmapper.py#L341

	lat = G_SENTENCES_DB.getTelemetryLast(payload_id, "latitude")
	lon = G_SENTENCES_DB.getTelemetryLast(payload_id, "longitude")
	alt = G_SENTENCES_DB.getTelemetryLast(payload_id, "altitude")

	descent_rate = 6 # default value
	is_descending = False
	if alt['dVdT'][-1] < 0:
		descent_rate = abs(alt['dVdT'][-1])
		is_descending = True

	flight_path = predictor.predict(
		launch_lat = lat['values'][-1],
		launch_lon = lon['values'][-1],
		launch_alt = max(100, alt['values'][-1]),
		ascent_rate = max(3, abs(alt['dVdT'][-1])),
		descent_rate = descent_rate,
		burst_alt = max(alt['values'][-1]+100, expected_burst),
		launch_time = datetime.datetime.utcnow(), # this better be sentence time
		descent_mode = is_descending
	)
	return flight_path


def PREDICT_THREAD_F(payload_id, predictor, expected_burst):
	global G_RUN
	while G_RUN:
		path = {}
		try:
			path = CalcPayloadPrediction(payload_id, predictor, expected_burst)
		except:
			print(traceback.format_exc())

		global G_PREDICT_PATH
		global G_PREDICT_PATH_MTX
		with G_PREDICT_PATH_MTX:
			G_PREDICT_PATH = deepcopy(path)
		time.sleep(5)


def GetPayloadPredictPath():
	global G_PREDICT_PATH
	global G_PREDICT_PATH_MTX
	res = {}
	with G_PREDICT_PATH_MTX:
		res = deepcopy(G_PREDICT_PATH)
	return res


def CliArgs():
	parser = argparse.ArgumentParser()

	# if len(sys.argv)==1:
	#     parser.print_help()
	#     sys.exit(1)

	parser.add_argument(
		"--dbfile", nargs="?", type=str, const="", help="Sentences DB file"
	)
	parser.add_argument(
		"--initDB", action='store_true', help="Create empty DB"
	)
	parser.add_argument(
		"--updateDB", nargs="*", type=str, help="Update local DB from HABITAT. Optional args are payload_id."
	)
	parser.add_argument(
		"--dbinfo", action="store_true", help="print payloads from local DB file"
	)

	parser.add_argument(
		"--payloads", action="store_true", help="List flights from HABITAT"
	)
	parser.add_argument(
		"--payload_id", type=str, default="", help="Payload ID"
	)
	parser.add_argument(
		"--payloads_info", nargs="?", type=str, const="*", help="Show flights info from HABITAT"
	)


	# parser.add_argument('--callsign', nargs='?', type=str, const='*', help='callsign. if empty, deduce from payload_id')

	parser.add_argument(
		"--habdec",
		nargs="*",
		type=str,
		# default=["127.0.0.1:5555"],
		help="habdec WS addr. 127.0.0.1:5555",
	)

	parser.add_argument("--host", type=str, default = '0.0.0.0', help="hostname")
	parser.add_argument( "--port", type=int, default=8888, help="http port, default 8888" )
	parser.add_argument("--https", action="store_true", help="serve on https://")


	parser.add_argument("--test", type=int, help="generate fake sentence every N seconds")
	parser.add_argument("--test_file", type=str, help="replay GPS/alt from file. lat,lon,alt\\n")

	parser.add_argument("--burst", type=int, default=30000, help="expected burst alt" )

	parser.add_argument("--wind", type=str, help="NOAA wind dir")

	parser.add_argument( "--hab_interval", type=int,  help="Habitat query seconds interval" )

	args = parser.parse_args()

	return args


def CurDir():
	d = os.path.dirname(sys.argv[0])
	if d == '' or d == '.':
		if 'PWD' in os.environ:
			d = os.environ['PWD']
		else:
			d = os.getcwd()
	return d


def HABBOY_DATA_MAIN():
	os.chdir(CurDir())

	args = CliArgs()

	# payloads
	#
	payloads = []
	try:
		flights = HabHubInterface.getFlights()
		payloads = HabHubInterface.getPayloads(flights)
		if not payloads:
			print("HabHub - no current payloads.")
	except urllib3.exceptions.MaxRetryError:
		print(C_RED, "Failed connecting to HabHub", C_OFF)
		pass


	# print payloads info
	#
	if args.payloads:
		for p in payloads:
			if not p["doc"]["transmissions"]:
				continue

			for i in range(len(p["doc"]["transmissions"])):
				if p["doc"]["transmissions"][i]['modulation'].lower() != 'rtty':
					continue

				print(
					p["doc"]["name"],

					" --callsign:",
					C_MAGENTA, p["doc"]["sentences"][i]["callsign"], C_OFF,

					"--payload:",
					C_RED, p["doc"]["_id"], C_OFF,

					"--RTTY:",
					C_MAGENTA, "{}/{}/{}".format(
						p["doc"]["transmissions"][i]["baud"],
						p["doc"]["transmissions"][i]["encoding"],
						p["doc"]["transmissions"][i]["stop"] ), C_OFF,

					"--freq:",
					C_MAGENTA, p["doc"]["transmissions"][0]["frequency"], C_OFF,
				)
		return


	# DB object
	#
	dbfile = "habboy_data.db"
	if args.dbfile:
		dbfile = args.dbfile
	print("dbfile ", dbfile)

	global G_SENTENCES_DB
	G_SENTENCES_DB = SentencesDB.SentencesDB(dbfile)


	# print dbinfo
	#
	if args.dbinfo:
		info = G_SENTENCES_DB.getInfo()
		for i in info:
			print( C_RED, i[0], C_MAGENTA, i[1], C_OFF)
			pprint(i[2:])
		return


	# payloads info
	#
	if args.payloads_info:
		for p in payloads:
			if args.payloads_info != "*" and p["doc"]["_id"] != args.payloads_info:
				continue
			print("\n")
			print(C_MAGENTA, p["doc"]["name"], p["doc"]["_id"], C_OFF)
			pprint(p)
			print("\n")
		return

	if args.initDB:
		print("Init DB")
		G_SENTENCES_DB.create_empty()
		return

	if args.updateDB != None:
		update_payloads = args.updateDB
		if update_payloads == []:
			update_payloads = [p["doc"]["_id"] for p in HabHubInterface.getPayloads()]
		for pid in update_payloads:
			print("Updating Info on ", pid)
			G_SENTENCES_DB.updatePayloadInfo(pid)

		return


	# payload_id and callsign
	#
	payload_id = args.payload_id
	if payload_id:
		for p in payloads:
			if p["doc"]["_id"].startswith(payload_id):
				payload_id = p["doc"]["_id"]
				break
		print("payload_id ", payload_id)
	else:
		payload_id = 'NoPayload'
		# print(C_RED, "No --payload_id specified. List payloads with --payloads.", C_OFF)
		# return

	try:
		callsign_from_payload_id = HabHubInterface.getCallsignsForPayloadId(payload_id)
		print("callsign from payload_id (HabHub) ", callsign_from_payload_id)
	except urllib3.exceptions.MaxRetryError:
		print(
			C_RED,
			"HabHubInterface.getCallsignsForPayloadId  -- Failed connecting to HabHub",
			C_OFF,
		)
		callsign_from_payload_id = None

	if callsign_from_payload_id == None:
		callsign_from_payload_id = G_SENTENCES_DB.payloadIdToCallsign(payload_id)
		print("callsign from payload_id (DB) ", callsign_from_payload_id)

	if callsign_from_payload_id == None:
		callsign_from_payload_id = 'NoCallsign'
		print(C_RED, "NO CALLSIGN", C_OFF)


	# habdec addresses
	#
	habdec_addr_arr = []
	if args.habdec:
		habdec_addr_arr = args.habdec
	for i in range(len(habdec_addr_arr)):
		if habdec_addr_arr[i] and not habdec_addr_arr[i].startswith("ws://"):
			habdec_addr_arr[i] = "ws://" + habdec_addr_arr[i]


	# host and port
	#
	host = args.host or "0.0.0.0"
	# host = args.host or get_ip()
	if host.lower() == "ip":
		host = get_ip()
	is_https = args.https
	port = args.port or 8888


	# wind data
	#
	try:
		from cusfpredict.predict import Predictor
		try:
			wind = args.wind or os.path.join( os.environ['HOME'], 'data/noaa_wind/gfs' )
			print('Wind Dir:', wind)
			predictor = Predictor(bin_path = './pred', gfs_path = wind)
		except:
			print(traceback.format_exc())
			print("No Wind Dir")
			predictor = None
	except ImportError:
		print("Cusf Predictor import error")
		predictor = None


	# some globals
	#

	global G_RUN
	global G_HABDEC_CLIENTS
	global G_HABHUB_CLIENTS

	global_opts = {
		'payload_id': payload_id,
		'callsign': callsign_from_payload_id,
		'sentences_db': G_SENTENCES_DB,
		'habdec_clients': G_HABDEC_CLIENTS,
		'habhub_clients': G_HABHUB_CLIENTS,
		'clients_mutex': G_CLIENTS_MTX,
		'payloads': G_SENTENCES_DB.getAllPayloadIds(),
		'get_gps': GET_HABBOY_GPS,
		'get_predict': GetPayloadPredictPath,
		'get_stats': GET_HABBOY_STATS,
		'burst': args.burst
	}


	############################  START ALL THREADS  ############################


	# sentence gathering thread
	#
	HabHubClient.HabHubClient.interval_seconds = args.hab_interval or 15

	if args.test:
		test_file = args.test_file or ''
		sentence_gather_thread = threading.Thread(
			target=functools.partial(DummySentenceThreadF, payload_id, args.test, test_file)
		)
	else:
		sentence_gather_thread = threading.Thread(
			target=functools.partial(SentenceGatherThreadF, habdec_addr_arr, payload_id)
		)

	sentence_gather_thread.start()
	time.sleep(.25)


	# http thread
	#
	http_server_thread = threading.Thread(
		target=functools.partial(
			HttpInterface.RUN,
			host, port, is_https,
			global_opts,
			False, False,
		)
	)
	http_server_thread.start()
	time.sleep(.25)


	# GPS thread
	#
	# gps_thread = threading.Thread(target=GPSD_ReadThread)
	gps_device = '/dev/serial/by-id/usb-u-blox_AG_-_www.u-blox.com_u-blox_GNSS_receiver-if00'
	gps_thread = threading.Thread( target=functools.partial(GPS_Serial_Thread, gps_device, None) )
	# gps_thread = threading.Thread(target=GPS_Serial_Thread_Fake)
	if os.path.isfile(gps_device):
		gps_thread.start()
	else:
		print(gps_device, 'does not exits.')
	time.sleep(.25)

	# flight path predict thread
	predict_thread = threading.Thread( target=functools.partial(PREDICT_THREAD_F, payload_id, predictor, args.burst) )
	predict_thread.start()

	# proc stats thread
	#
	if (platform.system() != "Windows"):
		habboy_stats_thread = threading.Thread( target=functools.partial(PROC_STATS_THREAD_F, ['habboy_data', 'habdecWebsocketServer']) )
		habboy_stats_thread.start()


	# main loop
	#
	while G_RUN:
		try:
			time.sleep(1)
		except KeyboardInterrupt:
			print("\nExiting...\n")
			G_RUN = False
			if G_HABDEC_CLIENTS:
				for k, v in G_HABDEC_CLIENTS.items():
					v.Stop()
				G_HABDEC_CLIENTS = {}
			if G_HABHUB_CLIENTS:
				for k, v in G_HABHUB_CLIENTS.items():
					v.Stop()
				G_HABHUB_CLIENTS = {}

	# EXITING
	#
	if sentence_gather_thread and sentence_gather_thread.is_alive():
		sentence_gather_thread.join()

	if gps_thread and gps_thread.is_alive():
		gps_thread.join()

	if predict_thread and predict_thread.is_alive():
		predict_thread.join()

	if habboy_stats_thread and habboy_stats_thread.is_alive():
		habboy_stats_thread.join()


def test_gps():
	gps_device = '/dev/serial/by-id/usb-u-blox_AG_-_www.u-blox.com_u-blox_GNSS_receiver-if00'
	gps_thread = threading.Thread( target=functools.partial(GPS_Serial_Thread, gps_device, lambda l: None) )
	gps_thread.start()
	if gps_thread and gps_thread.is_alive():
		gps_thread.join()



if __name__ == "__main__":
	try:
		import setproctitle
		setproctitle.setproctitle("habboy_data")
	except:
		print("No setproctitle")

	HABBOY_DATA_MAIN()
	# test_gps()
