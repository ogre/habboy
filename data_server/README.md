# data_server

```data_server``` is a backend of HabBoy. It's responsibility is:
* collects telemetry from multiple HABDECs, Habitat (and others sources)
* saves telemetry to SQLITE database
* computes telemetry dynamics (change over time, etc.)
* calculate landing prediction
* get HabBoy position from USB gps receiver
* upload HabBoy position as Habitat ChaseCar
* serves data over http REST (used by webUI)


## Installation

### data_server dependencies
	sudo pip3 install python-dateutil ws4py bottle cheroot setproctitle pyserial psutil urllib3

### data_server - Install As Service
	sudo cp ./data_server/code/HabBoy.service /etc/systemd/system/
	sudo systemctl enable HabBoy.service
	sudo systemctl daemon-reload
	sudo systemctl start HabBoy.service
	sudo journalctl -u HabBoy.service


## Usage

### First Use
```data_server``` saves telemetry to SQLite database. Before first use, you need to initialise DB with `main.py --initDB`, this command will create a ```habboy_data.db```.

### Updating database with payloads info
```data_server``` needs to know what flights are currently available and some information about sentence structure for each flight. Use command `main.py --updateDB` to download that information from UKHAS Habitat. Only approved flights will be downloaded, and only those with RTTY payloads.

After update, you can list what payloads are saved in DB file: `main.py --dbinfo`

If you wish to test your payload before it is approved by UKHAS admins, you need to manualy edit DB file with tool like [SQLiteBrowser](https://sqlitebrowser.org/). Edit ```PayloadInfo``` table providing PayloadId, callsign and SentenceInfo as ukhas JSON string. Use existing flights as template or look into file ```data_server/code/example_payload.info.json```.


### cusf predictor installation

To use landspot prediction, you need [cusf predictor with python wrapper](https://github.com/darksidelemm/cusf_predictor_wrapper).

After successful compilation, create symlink to cusf predictor executable:

```ln -s cusfpredict habboy_sw/data_server/code/cusfpredict```

### Downloading wind data

cusf predictor needs wind data to operate.
Here is example command to download it for Poland:

```python get_wind_data.py --lat=52 --lon=21 --latdelta=10 --londelta=10 -f 24 -m 0p25_1hr -o ~/data/noaa_wind/gfs```

### IMPORTANT
Currently prediction gives incorrect results, and until this is fixed, HabBoy connects to UKHAS Habitat for landspot data (requires internet connection).

### Launching HabBoy
After updating DB with your payload info and downloading wind data, you can start data_server with command ```./main.py --payload_id 2441777fbce3ce296e079b39ddb41a4a --wind ~/data/noaa_wind/gfs```

## HTTPS vs HTTPS
```data_server``` is a REST server over HTTP. It is possible to run it in HTTPS mode with ```--https``` flag, but you need to generate self signed certificate.

`openssl req -new -x509 -days 1095 -nodes -newkey rsa:2048 -out cacert.pem -keyout privkey.pem -subj "/CN=192.168.100.53"`

Running in HTTPS mode is not recommended. It is needed only if you wish to embed external HTTPS website as one of tabs in webUI (like www.spacenear.us).
It is also needed if you would like to use GPS build in your tablet/smartphone.
