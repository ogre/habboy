

#include <string>
#include <iostream>
#include <thread>
#include <chrono>


#include "program_options.h"
#include "console_colors.h"
#include "GLOBALS.h"
#include "git_repo_sha1.h"
#include "ws_server.h"
#include "hb_serial.h"
#include "msg_broker.h"
#include "GpsState.h"


bool G_KEEP_RUNNING;


int MAIN(int argc, char** argv)
{
	using namespace std;
	using namespace habboy_hw_iface;

	cout<<"git version: "<<g_GIT_SHA1<<endl;

	// setup GLOBALS
	//
	prog_opts(argc, argv);
	cout<<"Current Options: "<<endl;
	GLOBALS::Print();

	G_KEEP_RUNNING = 1;


	// signals
	//
	signal( SIGINT, 	[](int){G_KEEP_RUNNING = 0; exit(0);} );
	signal( SIGILL, 	[](int){G_KEEP_RUNNING = 0; exit(0);} );
	signal( SIGFPE, 	[](int){G_KEEP_RUNNING = 0; exit(0);} );
	signal( SIGSEGV, 	[](int){G_KEEP_RUNNING = 0; exit(0);} );
	signal( SIGTERM, 	[](int){G_KEEP_RUNNING = 0; exit(0);} );
	signal( SIGABRT, 	[](int){G_KEEP_RUNNING = 0; exit(0);} );


	// MAIN THREADS
	//

	std::unordered_set<thread*> threads;


	// websocket server
	WebsocketServer ws_server(GLOBALS::get().par_.ws_host_, GLOBALS::get().par_.ws_port_);
	threads.emplace( new thread(
		[&ws_server]() { ws_server(); }
	) );


	// message broker
	MessageBroker msg_broker(ws_server);
	threads.emplace( new thread(
		[&msg_broker]() { msg_broker(); }
	) );


	// serial connection -- use 'msg_broker.push()' as callback
	SerialConnection srl( GLOBALS::get().par_.serial_, GLOBALS::get().par_.baud_ );
	srl.add_callback(
		[&msg_broker](const std::string& msg) {	msg_broker.push(msg); }
	);
	threads.emplace( new thread(
		[&srl]() { srl(); }
	) );


	// print some info
	/*
	threads.emplace( new thread(
		[]()
		{
			while(G_KEEP_RUNNING)
			{
				this_thread::sleep_for(std::chrono::milliseconds(1000));
				cout<<GLOBALS::get().gps_.to_str()<<endl;
			}
		}
	));
	*/


	// finish
	//
	for(auto t : threads)
		t->join();

	return 0;
}


int main(int argc, char** argv)
{
	return MAIN(argc,argv);
}