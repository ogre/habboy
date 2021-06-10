### HabDecAdvertise.py
	HabDec Advertise
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

### HabBoyAdvertise.py
	HabBoy Advertise
	Simple HTTP server running on port 8889
	Answers on "/habboy" URL and redirects to true HabBoy server
	This is usefull if HabBoy runs on HTTPS and can't respond to HTTP requests

##### HabBoy Advertise - Install As Service
	sudo cp ./discovery/lan/HabBoyAdvertise.service /etc/systemd/system/
	sudo systemctl enable HabBoyAdvertise.service
	sudo systemctl daemon-reload
	sudo systemctl start HabBoyAdvertise.service
	sudo journalctl -u HabBoyAdvertise.service

	Open index.html in browser - it will find HabBoy in your LAN


### HabBoyDiscovery.py
	HabBoy Discovery
	Attempts to find running HabBoy server in local network.
	Loop over IP addresses starting from start_IP.
	Probes for Habboy or HabboyAdvertise server on port 8888 or 8889
	If not found, increments IP address and scans again.

### index.html
	Scans over IP range looking for running HabBoy server.
	Probes http://IP:8888/habboy
	This is javascript equvalent of HabBoyDiscovery.py
	URL parameter: ip - scan from this IP upwards HabBoyDiscovery.py
	For example: http://index.html?ip=192.168.88.235