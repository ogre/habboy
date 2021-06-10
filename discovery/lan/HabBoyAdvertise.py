#!/usr/bin/env python3

__all__ = ['RUN']

import argparse
import subprocess
import bottle

HELP_STRING = r'''HabBoyAdvertise
Simple HTTP server running on port 8889
Answers on "/habboy" URL and redirects to true HabBoy server
This is usefull if HabBoy runs on HTTPS and can't respond to HTTP requests
'''

def get_ip():
    p = subprocess.Popen("ip route list", shell=True, stdout=subprocess.PIPE)
    data = p.communicate()
    data = data[0].decode().split("\n")
    while "" in data:
        data.remove("")
    split_data = data[-1].split()

    ipaddr = split_data[split_data.index("src") + 1]
    return ipaddr


class EnableCors(object):
    name = "enable_cors"
    api = 2

    def apply(self, fn, context):
        def _enable_cors(*args, **kwargs):
            # set CORS headers
            bottle.response.headers["Access-Control-Allow-Origin"] = "*"
            bottle.response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, OPTIONS"
            bottle.response.headers["Access-Control-Allow-Headers"] = "Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token"

            # actual request; reply with the actual response
            if bottle.request.method != "OPTIONS":
                return fn(*args, **kwargs)

        return _enable_cors

application = bottle.app()
application.install(EnableCors())


# @application.route('/')
@application.route('/habboy')
def route_root():
    new_url = bottle.request.url[0:bottle.request.url.rindex(':')]
    new_port = '8888'
    res = '<meta http-equiv="refresh" content="0; url={}:{}" />'.format(new_url, new_port)
    return res


def RUN(host,port):
    bottle.run(host=host, port=port, debug=False, reloader=False)
    print(host,port)


def main():
    try:
        import setproctitle
        setproctitle.setproctitle("HabBoyAdvertise")
    except:
        print("No setproctitle")

    parser = argparse.ArgumentParser()
    parser.add_argument("--host", type=str, default="0.0.0.0", help="hostname")
    parser.add_argument("--port", type=int, default=8889, help="http port, default 8889")
    args = parser.parse_args()
    RUN(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
