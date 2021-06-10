#!/usr/bin/env python3

import string
import datetime
import math
from enum import Enum

def degree_2_decimal(i_pos):
	i_pos = float(i_pos)
	degs = math.trunc(i_pos / 100)
	mins = i_pos - 100.0 * degs
	res = degs + mins / 60.0
	return res


def NMEA_checksum(buff):
	c = 0
	for i in range(len(buff)):
		c ^= ord(buff[i])
	return hex(c)[2:]


class nmea_t(object):
	class fix_status_t(Enum):
		kInvalid = 0
		kValid = 1
	class fix_quality_t(Enum):
		kNoFix = 0
		kAutonomous = 1
		kDifferential = 2
		kRtkFixed = 4
		kRtkFloat = 5
		kEstimated = 6
	def __init__(self):
		self.msg = '$' # RMC or GGA
		self.parse_timestamp = datetime.datetime.utcnow()
		self.utc_str = ''
		self.utc_time = ''
		self.lat = 0.0
		self.lon = 0.0
		self.alt = 0.0
		self.sats = 0
		self.ground_speed_mps = 0.0
		self.heading = 0.0
		self.fix_status =  nmea_t.fix_status_t(  nmea_t.fix_status_t.kInvalid)
		self.fix_quality = nmea_t.fix_quality_t( nmea_t.fix_quality_t.kNoFix)
	def __str__(self):
		res = self.msg
		res += ' timestamp:' + str(self.parse_timestamp)
		res += ' UTC:' + str(self.utc_time)
		res += ' lat:' + str(self.lat)
		res += ' lon:' + str(self.lon)
		res += ' alt:' + str(self.alt)
		res += ' sats:' + str(self.sats)
		res += ' ground_speed_mps:' + str(self.ground_speed_mps)
		res += ' heading:' + str(self.heading)
		res += ' fix_status:' + str(self.fix_status)
		res += ' fix_quality:' + str(self.fix_quality)
		return res



def __utcstr2date__(i_utcstr):
	res_utc = datetime.datetime.utcnow() # 152041.00
	res_utc.replace(hour = int(i_utcstr[0:2]))
	res_utc.replace(minute = int(i_utcstr[2:4]))
	res_utc.replace(second = int(i_utcstr[5:6]))
	microsecs = i_utcstr[8:] #after .
	microsecs = int(float('0.' + microsecs) * 1000)
	res_utc.replace(microsecond = microsecs) # this does not work somehow
	return res_utc


class nmea_parser(object):
	def __init__(self):
		self.__valid_nmea__ = nmea_t()
		self.__valid_nmea__.fix_status =  nmea_t.fix_status_t(  nmea_t.fix_status_t.kInvalid)
		self.__valid_nmea__.fix_quality = nmea_t.fix_quality_t( nmea_t.fix_quality_t.kNoFix)

	def feed_line(self, line):
		line = line.decode('ascii').strip()
		if '*' not in line:
			return
		while line.startswith('$'):
			line = line[1:]

		data_str = line[:line.index('*')]
		chcksm = line[line.index('*')+1:]

		if NMEA_checksum(data_str).lower() != chcksm.lower():
			print("NMEA checksum fail:")
			print(line)
			return

		nmea_current = None
		if 'gga' in data_str.lower():
			nmea_current = self.parse_gga(data_str)
			# print(nmea_current)
		elif 'rmc' in data_str.lower():
			nmea_current = self.parse_rmc(data_str)
			# print(nmea_current)
		if nmea_current:
			if nmea_current.fix_status == nmea_t.fix_status_t.kValid or nmea_current.fix_quality != nmea_t.fix_quality_t.kNoFix:
				if nmea_current.msg == 'RMC':
					# copy previous values from GGA type
					nmea_current.alt = self.__valid_nmea__.alt
					nmea_current.sats = self.__valid_nmea__.sats
				elif nmea_current.msg == 'GGA':
					# copy previous values from RMC type
					nmea_current.ground_speed_mps  = self.__valid_nmea__.ground_speed_mps
					nmea_current.heading = self.__valid_nmea__.heading

				# print(nmea_current)
				self.__valid_nmea__ = nmea_current
				return self.__valid_nmea__


	def parse_gga(self, line):
		'''
		$GNGGA,152041.00,,,,,0,00,99.99,,,,,,*7B
		GNGGA,180602.00,5206.72454,N,01957.52547,E,1,12,0.95,87.8,M,35.6,M,,*7D
		return None when even UTC is not decoded
		'''
		res = nmea_t()
		res.msg = 'GGA'

		tokens = line.split(',') # should be 15 tokens
		# print(tokens, len(tokens))
		if len(tokens) != 15:
			return

		if not tokens[1]:
			return
		else:
			res.utc_str = tokens[1]
			res.utc_time = __utcstr2date__(res.utc_str)

		if(not tokens[2]):
			return res
		else:
			res.lat = degree_2_decimal(tokens[2])
			if tokens[3].lower() == 's':
				res.lat = -res.lat

		if(not tokens[4]):
			return res
		else:
			res.lon = degree_2_decimal(tokens[4])
			if tokens[5].lower() == 'w':
				res.lon = -res.lon

		quality = tokens[6]
		if not quality:
			return res
		else:
			quality = int(quality)
			if quality == 0:
				res.fix_quality = nmea_t.fix_quality_t.kNoFix
			if quality == 1:
				res.fix_quality = nmea_t.fix_quality_t.kAutonomous
			if quality == 2:
				res.fix_quality = nmea_t.fix_quality_t.kDifferential
			if quality == 4:
				res.fix_quality = nmea_t.fix_quality_t.kRtkFixed
			if quality == 5:
				res.fix_quality = nmea_t.fix_quality_t.kRtkFloat
			if quality == 6:
				res.fix_quality = nmea_t.fix_quality_t.kEstimated

		if not tokens[7]:
			return res
		else:
			res.sats = int(tokens[7])

		if not tokens[9]:
			return res
		else:
			res.alt = float(tokens[9])

		return res




	def parse_rmc(self, line):
		'''
		$GNRMC,154248.00,V,,,,,,,010620,,,N*68
		GNRMC,180602.00,A,5206.72454,N,01957.52547,E,0.023,,010620,,,A*6D
		return None when even UTC is not decoded
		'''
		res = nmea_t()
		res.msg = 'RMC'

		tokens = line.split(',') # should be 13 tokens
		# print(tokens, len(tokens))
		if len(tokens) != 13:
			return

		if not tokens[1]:
			return
		else:
			res.utc_str = tokens[1]
			res.utc_time = __utcstr2date__(res.utc_str)

		if not tokens[2]:
			return res
		else:
			if tokens[2].lower() == 'a':
				res.fix_status = nmea_t.fix_status_t.kValid
			elif tokens[2].lower() == 'v':
				res.fix_status = nmea_t.fix_status_t.kInvalid

		if(not tokens[3]):
			return res
		else:
			res.lat = degree_2_decimal(tokens[3])
			if tokens[4].lower() == 's':
				res.lat = -res.lat

		if(not tokens[5]):
			return res
		else:
			res.lon = degree_2_decimal(tokens[5])
			if tokens[6].lower() == 'w':
				res.lon = -res.lon

		if not tokens[7]:
			res.ground_speed_mps = 0
		else:
			res.ground_speed_mps = 0.514444444 * float(tokens[7]) # from knots to m/s

		if not tokens[8]:
			res.heading = 0
		else:
			res.heading = float(tokens[8])

		return res
