#!/usr/bin/env python
import os
import subprocess

# generate self-signed certificate

# Very Linux Specific
def get_ip():
	arg='ip route list'
	p = subprocess.Popen(arg,shell=True,stdout=subprocess.PIPE, universal_newlines=True)
	data = p.communicate()
	data = data[0].split('\n')
	while '' in data:
		data.remove('')
	split_data = data[-1].split()

	ipaddr = split_data[split_data.index('src')+1]
	return ipaddr

def keygen():
	cmd = 'openssl req -new -x509 -days 1095 -nodes -newkey rsa:2048 -out cacert.pem -keyout privkey.pem -subj "/CN={}"'
	cmd = cmd.format(get_ip())
	print(cmd)
	os.system(cmd)

if __name__ == "__main__":
	keygen()