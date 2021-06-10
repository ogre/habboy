### BROWSER SETTINGS for relaxed HTTPS

#### FIREFOX:
		about:config -->
			- security.mixed_content.block_active_content = false
			- network.websocket.allowInsecureFromHTTPS = true  <<< this should be enough for habdec websocket
		network.stricttransportsecurity.preloadlist = false

#### CHROME:
		chrome://flags -->
			- Insecure origins treated as secure



### SSL cert generate - for data server

	openssl req -new -x509 -days 1095 -nodes -newkey rsa:2048 -out cacert.pem -keyout privkey.pem -subj "/CN=192.168.100.53"



### UBUNTU SERVER CONFIG

### disable firewall: ```sudo ufw disable```

### apache ssl:
```
su -
a2enmod ssl
systemctl restart apache2
openssl genrsa -out ca.key 2048
openssl req -nodes -new -key ca.key -out ca.csr
openssl x509 -req -days 365 -in ca.csr -signkey ca.key -out ca.crt
mkdir /etc/apache2/ssl/
cp ca.crt ca.key ca.csr /etc/apache2/ssl/
```

```
nano /etc/apache2/sites-enable/000-default.conf

	"Comment out all the lines by adding a “#” in front of each line and add the following lines:"
	<VirtualHost *:443>
		ServerAdmin webmaster@localhost
		DocumentRoot /var/www/html
		ErrorLog ${APACHE_LOG_DIR}/error.log
		CustomLog ${APACHE_LOG_DIR}/access.log combined
		SSLEngine on
		SSLCertificateFile /etc/apache2/ssl/ca.crt
		SSLCertificateKeyFile /etc/apache2/ssl/ca.key
	</VirtualHost>

systemctl restart apache2
```

### Disable Unattended Upgrade in Ubuntu 16.04
https://askubuntu.com/questions/953779/programmatically-disable-apt-unattended-upgrades

```
sudo nano /etc/apt/apt.conf.d/10periodic

APT::Periodic::Update-Package-Lists "0";
APT::Periodic::Unattended-Upgrade "0";
```

```
sudo nano /etc/apt/apt.conf.d/20auto-upgrades

APT::Periodic::Update-Package-Lists "0";
APT::Periodic::Unattended-Upgrade "0";
```

```
sudo cp  /usr/share/unattended-upgrades/20auto-upgrades-disabled  /etc/apt/apt.conf.d/
```