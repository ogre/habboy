#!/usr/bin/env python
import string
import subprocess
import socket
import datetime
import re
import random

from sys import version_info

PY3K = version_info >= (3, 0)

if PY3K:
	import urllib.request as urllib
else:
	import urllib2 as urllib

__version__ = "0.6"


def myip():
	return IPgetter().get_externalip()


class IPgetter(object):

	'''
	This class is designed to fetch your external IP address from the internet.
	It is used mostly when behind a NAT.
	It picks your IP randomly from a serverlist to minimize request overhead
	on a single server
	'''

	def __init__(self):
		self.server_list = ['http://ip.dnsexit.com',
							'http://ifconfig.me/ip',
							'http://ipecho.net/plain',
							'http://checkip.dyndns.org/plain',
							'http://ipogre.com/linux.php',
							'http://whatismyipaddress.com/',
							'http://ip.my-proxy.com/',
							'http://websiteipaddress.com/WhatIsMyIp',
							'http://getmyipaddress.org/',
							'http://www.my-ip-address.net/',
							'http://myexternalip.com/raw',
							'http://www.canyouseeme.org/',
							'http://www.trackip.net/',
							'http://icanhazip.com/',
							'http://www.iplocation.net/',
							'http://www.howtofindmyipaddress.com/',
							'http://www.ipchicken.com/',
							'http://whatsmyip.net/',
							'http://www.ip-adress.com/',
							'http://checkmyip.com/',
							'http://www.tracemyip.org/',
							'http://checkmyip.net/',
							'http://www.lawrencegoetz.com/programs/ipinfo/',
							'http://www.findmyip.co/',
							'http://ip-lookup.net/',
							'http://www.dslreports.com/whois',
							'http://www.mon-ip.com/en/my-ip/',
							'http://www.myip.ru',
							'http://ipgoat.com/',
							'http://www.myipnumber.com/my-ip-address.asp',
							'http://www.whatsmyipaddress.net/',
							'http://formyip.com/',
							'https://check.torproject.org/',
							'http://www.displaymyip.com/',
							'http://www.bobborst.com/tools/whatsmyip/',
							'http://www.geoiptool.com/',
							'https://www.whatsmydns.net/whats-my-ip-address.html',
							'https://www.privateinternetaccess.com/pages/whats-my-ip/',
							'http://checkip.dyndns.com/',
							'http://myexternalip.com/',
							'http://www.ip-adress.eu/',
							'http://www.infosniper.net/',
							'http://wtfismyip.com/',
							'http://ipinfo.io/',
							'http://httpbin.org/ip']

	def get_externalip(self):
		'''
		This function gets your IP from a random server
		'''

		random.shuffle(self.server_list)
		myip = ''
		for server in self.server_list:
			myip = self.fetch(server)
			if myip != '':
				return myip
			else:
				continue
		return ''

	def fetch(self, server):
		'''
		This function gets your IP from a specific server
		'''
		url = None
		opener = urllib.build_opener()
		opener.addheaders = [('User-agent',
							  "Mozilla/5.0 (X11; Linux x86_64; rv:24.0) Gecko/20100101 Firefox/24.0")]

		try:
			url = opener.open(server)
			content = url.read()

			# Didn't want to import chardet. Prefered to stick to stdlib
			if PY3K:
				try:
					content = content.decode('UTF-8')
				except UnicodeDecodeError:
					content = content.decode('ISO-8859-1')

			m = re.search(
				'(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
				content)
			myip = m.group(0)
			return myip if len(myip) > 0 else ''
		except Exception:
			return ''
		finally:
			if url:
				url.close()

	def test(self):
		'''
		This functions tests the consistency of the servers
		on the list when retrieving your IP.
		All results should be the same.
		'''

		resultdict = {}
		for server in self.server_list:
			resultdict.update(**{server: self.fetch(server)})

		ips = sorted(resultdict.values())
		ips_set = set(ips)
		print('\nNumber of servers: {}'.format(len(self.server_list)))
		print("IP's :")
		for ip, ocorrencia in zip(ips_set, map(lambda x: ips.count(x), ips_set)):
			print('{0} = {1} ocurrenc{2}'.format(ip if len(ip) > 0 else 'broken server', ocorrencia, 'y' if ocorrencia == 1 else 'ies'))
		print('\n')
		print(resultdict)

# Change to your own account information

# Very Linux Specific
def get_ip():
	arg='ip route list'
	p=subprocess.Popen(arg,shell=True,stdout=subprocess.PIPE)
	data = p.communicate()
	split_data = data[0].split()
	ipaddr = split_data[split_data.index('src')+1]
	return ipaddr

def get_local_ips():
	arg='ip route list'
	p=subprocess.Popen(arg,shell=True,stdout=subprocess.PIPE)
	data = p.communicate()
	split_data = data[0].split()
	# ipaddr = split_data[split_data.index('src')+1]
	res = []
	for i in xrange(len(split_data)):
		if split_data[i] == 'src':
			res.append(split_data[i+1])
	return res

def send_to_www(IP):
	H = socket.gethostname()
	url = 'http://cgarea.com/ip/ip.php?HOST=%s&IP=%s' % (H, IP)
	print url

	hdr = {	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'Accept-Encoding': 'gzip, deflate, sdch',
			'Accept-Language': 'pl-PL,pl;q=0.8,en-US;q=0.6,en;q=0.4',
			'Cache-Control': 'max-age=0',
			'Connection': 'keep-alive',
			'Upgrade-Insecure-Requests': '1',
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
			}
	req = urllib.Request(url, headers = hdr)
	urllib.urlopen( req )

if __name__ == '__main__':
	ip = str( datetime.datetime.now() ).replace(' ', '|')
	# ip += '|' + get_ip()
	ip += '|' + string.join( get_local_ips(), '|')
	ip += '|' + myip()
	try:
		send_to_www(ip)
	except:
		import traceback
		print traceback.format_exc()
		pass
	print ip


