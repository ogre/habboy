#!/usr/bin/env python3

'''
find habboy
and periodically add habdec to it
'''

import time
import argparse
import traceback

import urllib3
http = urllib3.PoolManager(cert_reqs='CERT_NONE')

import HabBoyDiscovery

HELP_STRING = r'''HabDecAdvertise
Loops over IP range to find running HabBoy server and inform it that habdec is running.
Parameters:
	--start_ip - scan for habboy from this address upward
	--disco_port - probe habboy on discovery port. 8888 if HabBoy works over HTTP or 8889 for HTTPS
	--habboy_port - port on which habboy runs
	--timeout_ms
	--pause
	--verbose
Habdec IP = habboy IP
Habdec port = 5555
'''

def RegisterHabDec(habboy_ip, habboy_port='8888', habdec_ip = None, habdec_port='5555' ):
	while not habdec_ip:
		habdec_ip = HabBoyDiscovery.get_ip()

	_url = '{}:{}/habboy/api/v1/habdec/add/{}:{}'.format(
		habboy_ip, habboy_port, habdec_ip, habdec_port
	)
	# print (_url)

	try:
		r = http.request('GET', 'http://' +  _url)
	except urllib3.exceptions.MaxRetryError:
		try:
			r = http.request('GET', 'https://' + _url)
		except:
			return False

	if r.status == 200:
		# print(r.data)
		return r.data == b'OK' or r.data == b'already exists'
	else:
		# print(r)
		return False

def RegisterHabDecLoop(i_start_ip, disco_port, habboy_port, pause = 1, timeout_ms = None, verbose=0):
	while True:
		try:
			habboy_ip = HabBoyDiscovery.habboy_discovery(start_ip = i_start_ip, port = disco_port, verbose = verbose, timeout_ms = timeout_ms)
			if habboy_ip:
				res = RegisterHabDec(habboy_ip, habboy_port)
				if verbose:
					print(habboy_ip, res)
		except:
			# print("Connection Error")
			print(traceback.format_exc())
			pass
		time.sleep(pause)

def test():
	habboy_ip = HabBoyDiscovery.habboy_discovery('192.168.2.170')
	print('habboy_ip: ', habboy_ip)
	print( RegisterHabDec(habboy_ip) )

def CliArgs():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start_ip", type=str, default="", help="Scan for HabBoy starting from this IP upward.")
    parser.add_argument("--disco_port", type=int, default=8888, help="Probe habboy on discovery port. 8888 for HTTP or 8889 for HTTPS. Default 8888.")
    parser.add_argument("--habboy_port", type=int, default=8888, help="habboy server port. Default 8888.")
    parser.add_argument("--timeout_ms", type=int, help="Probing timeout milliseconds")
    parser.add_argument("--pause", type=int, default=15, help="Looping interval pause")
    parser.add_argument("--verbose", action="store_true", help="Print IPs")

    args = parser.parse_args()
    return args


def main():
	try:
		import setproctitle
		setproctitle.setproctitle("HabDecAdvertise")
	except:
		print("No setproctitle")

	print(HELP_STRING)

	args = CliArgs()

	timeout_ms = args.timeout_ms


	RegisterHabDecLoop( args.start_ip, args.disco_port, args.habboy_port, args.pause, timeout_ms, args.verbose )


if __name__ == "__main__":
	main()