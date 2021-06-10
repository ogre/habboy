
#pragma once

#include <string>
#include <iomanip>
#include <fstream>
#include <vector>
#include <mutex>
#include <unordered_set>

#include "websocket_session.h"
#include "GpsState.h"
#include "hb_serial.h"


// singleton class keeping all global data
class GLOBALS
{
public:
	GLOBALS(GLOBALS const&)			= delete;
	void operator=(GLOBALS const&)	= delete;

	static GLOBALS& get()
	{
		static GLOBALS instance_;
		return instance_;
	}

	// CLI parameters
	struct PARAMS
	{
		std::string 	ws_host_ = "0.0.0.0";	//websocket
		int 		 	ws_port_ = 5565;		//websocket
		std::string		serial_ = "/dev/ttySAC0"; // serial port to arduino
		habboy_hw_iface::SerialConnection::Baud baud_ = habboy_hw_iface::SerialConnection::Baud::b9600;
	};
	PARAMS par_;

	// state
	habboy_hw_iface::GpsState gps_;

	static bool DumpToFile(std::string fName)
	{
		using namespace std;
		try{
			fstream oFile(fName, fstream::out);
			oFile<<"port = "<<GLOBALS::get().par_.ws_host_<<":"<<GLOBALS::get().par_.ws_port_<<endl;
			oFile<<"serial = "<<GLOBALS::get().par_.serial_<<endl;
		}
		catch (exception& e) {
			cout<<"Can't save config "<<fName<<endl;
			return false;
		}
		return true;
	}

	static void Print()
	{
		using namespace std;
		cout<<"\tws_host: "<<GLOBALS::get().par_.ws_host_<<endl;
		cout<<"\tws_port: "<<GLOBALS::get().par_.ws_port_<<endl;
		cout<<"\tserial: "<<GLOBALS::get().par_.serial_<<endl;
		cout<<"\tbaud: "<<GLOBALS::get().par_.baud_<<endl;
	}


private:
	GLOBALS() {};
};