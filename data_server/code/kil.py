#!/usr/bin/env python

import os
import string
import subprocess
from pprint import pprint

def get_proc():
	res = []
	p = subprocess.Popen("ps",stdout=subprocess.PIPE)
	line = p.stdout.readline()
	while line:
		res.append(line)
		line = p.stdout.readline()
	return res

def get_dsp_id(p_arr, p_name = "habboy_data"):
	for p in p_arr:
		if p_name in p:
			tokens = p.split()
			pid = int(tokens[0])
			return pid
	return None

if __name__ == '__main__':
	pid = get_dsp_id(get_proc())
	while pid:
		print(pid)
		os.system('kill -9 %d' % pid)
		pid = get_dsp_id(get_proc())
