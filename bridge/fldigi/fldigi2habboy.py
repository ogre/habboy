#!/bin/env python

# dl-fldigi.exe --hab --arq-server-address 127.0.0.1 --arq-server-port 7777
# fldigi.exe  --arq-server-address 127.0.0.1 --arq-server-port 7777

from __future__ import print_function

import string
import socket
import select
import time
import re
import traceback
import threading
import queue
import urllib3

def crc(i_str):
	def _hex(n): return hex(int(n))[2:]

	i_str = str(i_str)
	CRC = 0xffff
	for i in xrange(len(i_str)):
		CRC ^= ord(i_str[i]) << 8
		for j in xrange(8):
			if (CRC & 0x8000):
				CRC = (CRC << 1) ^ 0x1021
			else:
				CRC <<= 1
	result = ''
	result += _hex((CRC >> 12) & 15)
	result += _hex((CRC >> 8) & 15)
	result += _hex((CRC >> 4) & 15)
	result += _hex(CRC & 15)

	return result.lower()


def make_connection(host='localhost', port='7777'):
	sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	try:
		port = int(port)
		sock.connect(( host, port ))
		sock.setblocking(0)
	except:
		print("fldigi2habboy: make_connection failed.")
		print(traceback.format_exc())
	return sock


def read_from_fldigi(sock, callback = None):
	timeout_in_seconds = 10
	while 1:
		try:
			ready = select.select([sock], [], [], timeout_in_seconds)
			if ready[0]:
				chunk = sock.recv(4096)
				if callback:
					callback(chunk)
			else:
				print("Waiting for some fldigi data ...")
		except KeyboardInterrupt:
			return
		except:
			print(traceback.format_exc())


class UkhasSentenceScanner(object):
	'''
	1. push() some characters into internal buffer
	2. if a valid sentence is found, run callback(sentence)
	'''
	def __init__(self):
		self.__buff__ = ''
		self.__rex__ = re.compile( r'''(.*?)\$+(.+)(\*)(\w{4})(.*)''' )
		self.__sentence_callback__ = print

	def set_callback(self, cb):
		self.__sentence_callback__ = cb

	def push(self, chars):
		# print(chars, end='')
		if len(self.__buff__) > 5000:
			self.__buff__ = ''
		self.__buff__ += chars
		sentences = self.__scan__()
		for s in sentences:
			self.__sentence_callback__(s)

	def __scan__(self):
		sentences = []
		for line in string.split(self.__buff__, '\n'):
			mo = self.__rex__.match( string.strip(line), re.I )
			if not mo:
				self.__buff__ = line
				continue
			if len(mo.groups()) != 5:
				self.__buff__ = line #sentence might be not complete yet
				continue
			self.__buff__ = ''
			sentence_no_crc = mo.group(2)
			_crc = mo.group(4)
			if crc(sentence_no_crc).lower() == _crc.lower():
				sentences.append( (sentence_no_crc, _crc) )
			else:
				print('CRC not valid', sentence_no_crc, _crc, crc(sentence_no_crc) )
		return sentences


class HabBoyBridge(object):
	'''
	Sends sentences to HabBoy server.
	usage:
		hbb = HabBoyBridge(host,port)
		hbb.run() # run sending thread
		hbb.push(sentence) # adds sentence to internal que
	'''
	def __init__(self, host = 'localhost', port = 8888):
		self.__host__ = str(host)
		self.__port__ = int(port)
		self.__sentence_que__ = queue.Queue()
		self.__run__ = False #que sending thread
		self.__http__ = urllib3.PoolManager()

	def push(self, sentence):
		self.__sentence_que__.put(sentence)

	def run(self):
		self.__thread__ = threading.Thread(target = self.__send_loop__)
		try:
			self.__run__ = True
			self.__thread__.start()
		except KeyboardInterrupt:
			self.stop()

	def stop(self):
		self.__run__ = False
		if self.__thread__:
			self.__thread__.join()
			self.__thread__ = None

	def __send_loop__(self):
		while self.__run__:
			try:
				s = self.__sentence_que__.get(block=True, timeout=.5)
				is_success = self.send(s)
				print("send result OK ?", is_success)
			except queue.Empty:
				pass
			except KeyboardInterrupt:
				self.stop()
				return

	def send(self, sentence):
		_url = 'http://{}:{}'.format(self.__host__, self.__port__)
		_url += "/habboy/api/v1/sentence/fldigi/" + sentence
		print("Sending sentence ", sentence, ' to ', _url)
		try:
			r = self.__http__.request('PUT', _url, timeout=2.0)
		except:
			print("Failed sending to habboy")
			print(traceback.format_exc())
			return False
		return True

def main():
	print("HabBoy connection...")
	hbb = HabBoyBridge('habboy', 8888)
	hbb.run()

	print("Scanner")
	scanner = UkhasSentenceScanner()
	scanner.set_callback( lambda sent_and_crc:
							hbb.send( sent_and_crc[0] + '*' + sent_and_crc[1] ) )

	print("fldigi connection")
	con = make_connection()
	print("Connected to fldigi")

	print("Go !")
	read_from_fldigi( con, lambda chars: scanner.push(chars)  )

if __name__ == "__main__":
	main()