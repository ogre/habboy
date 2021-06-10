#!/usr/bin/env python3


import sys
import subprocess
import socket
import urllib3
import traceback
import argparse
import time

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
http = urllib3.PoolManager(cert_reqs='CERT_NONE')

__all__ = ['habboy_discovery', 'is_habboy', 'get_ip', 'ip_increment']

HELP_STRING = r'''
HabBoy Discovery
Attempts to find running HabBoy server in local network.
Loop over IP addresses starting from start_IP.
Probes for Habboy or HabboyAdvertise server on port 8888 or 8889
If not found, increments IP address and scans again.
'''


def get_ip_old():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1)) # doesn't even have to be reachable
        IP = s.getsockname()[0]
    except:
        IP = None
    finally:
        s.close()
    return IP


def get_ip():
	try:
		arg='ip route list'
		p=subprocess.Popen(arg,shell=True,stdout=subprocess.PIPE, universal_newlines='\n')
		data = p.communicate()
		data = data[0].split('\n')
		while '' in data:
			data.remove('')
		split_data = data[-1].split()

		ipaddr = split_data[split_data.index('src')+1]
		return ipaddr
	except:
		return None

def ip_increment(i_ip):
    tokens = i_ip.split('.')
    tokens[3] = int(tokens[3]) + 1
    if tokens[3] > 254:
        return ""
        # do not increment to next network
        '''
        tokens[3] = 2
        tokens[2] = int(tokens[2]) + 1
        if tokens[2] > 254:
            return ""
        '''
    tokens = map(str, tokens)
    return '.'.join(tokens)


def test_ip_increment(i_ip):
    ip = i_ip
    while ip != "":
        # print(ip)
        ip = ip_increment(ip)
    return ""


def is_habboy(i_url, timeout_ms = 2000):
    timeout_ms = timeout_ms or 2000

    try:
        try:
            r = http.request('GET', 'http://' + i_url, timeout=.001 * timeout_ms)
        except urllib3.exceptions.MaxRetryError:
            r = http.request('GET', 'https://' + i_url, timeout=.001 * timeout_ms)
    except KeyboardInterrupt:
        sys.exit(0)
    except:
        return False

    if r.status == 200:
        return True

    return False


def habboy_discovery(start_ip = '', port = 8888, timeout_ms = None, verbose = False):

    while not start_ip:
        start_ip = get_ip()
        if start_ip:
            start_ip = start_ip.split('.')
            start_ip[-1] = '2'
            start_ip = '.'.join(start_ip)
            break
        time.sleep(1)

    ip = start_ip

    while True:
        if not ip:
            break

        _url = '{}:{}/habboy'.format(ip, port)
        if verbose:
            print(_url)

        if is_habboy(_url, timeout_ms):
            return ip

        ip = ip_increment(ip)

    return None


def CliArgs():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start_ip",   type=str, default="", help="Scan for HabBoy/HabBoyAdvertise server starting from IP upwards.")
    parser.add_argument("--port",       type=int, default=8888, help="habboy discovery port. 8888 or 8889. default 8888.")
    parser.add_argument("--timeout_ms", type=int, help="probing timeout milliseconds")
    parser.add_argument("--verbose",    action="store_true", help="print IPs")

    args = parser.parse_args()
    return args


def main():
    args = CliArgs()
    start_ip = args.start_ip
    port = args.port
    verbose = args.verbose
    timeout = args.timeout_ms

    try:
        while(True):
            res = habboy_discovery(start_ip = start_ip, port=port, verbose = verbose, timeout_ms = timeout)
            if verbose:
                print(res)
            if res:
                print(res)
                sys.exit(0)
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == "__main__":
    main()

