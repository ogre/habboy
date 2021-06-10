#!/usr/bin/python

import sys
import time
import serial
import random
import math
import time

s = serial.Serial(sys.argv[1])

def gps_loop():

	i = 0

	while(1):
		time.sleep(1)
		i += 1
		try:
			lat = 52.0 + .01 * math.sin(.1 * i)
			lon = 21.0 + .01 * math.cos(.1 * i)
			speed = 100.0 + 20.0 * math.cos(.1 * i)
			sats = random.randrange(4,9)

			msg = 'gps::' + 'time=%s,lat=%f,lon=%f,alt=180000,altmsl=190000,sats=%d,speed=%f,heading=160000' % ( time.strftime("%H%M%S", time.gmtime()), lat, lon, sats, speed )
			print msg
			s.write(msg + "\n")
		except KeyboardInterrupt:
			return

def cycle_tabs(_dir):
	msg = "tab::cycle=" + _dir
	s.write(msg + "\n")

if __name__ == "__main__":
	gps_loop()
	# cycle_tabs( sys.argv[2] )

