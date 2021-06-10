
#include <string>
#include <iostream>
#include <fstream>
#include <regex>

#include <boost/program_options.hpp>

#include "console_colors.h"
#include "GLOBALS.h"
#include "hb_serial.h"

void prog_opts(int ac, char* av[])
{
	namespace po = boost::program_options;
	using namespace std;
	using namespace habboy_hw_iface;

	try
	{
		po::options_description generic("CLI opts");
		generic.add_options()
			("help", "Display help message")
			("wsport",	po::value<string>(),	"websocket Port, example: --wsport 127.0.0.1:5565")
			("serial",	po::value<string>(),	"arduino serial port. defaults to /dev/ttyUSB0")
			("baud", 	po::value<string>(), 	"Serial Baud speed - defaults to 115200")
		;

		po::options_description cli_options("Command Line Interface options");
		cli_options.add(generic);

		string config_file;
		cli_options.add_options()
            ("config", po::value<string>(&config_file), "Config file.");

		po::options_description file_options;
        file_options.add(generic);

		po::variables_map vm;
		store( po::command_line_parser(ac, av).options(cli_options).allow_unregistered().run(), vm );
		notify(vm);

		if(vm.count("help"))
        {
            cout<<cli_options<<endl;
			exit(0);
		}

		if(config_file != "")
		{
			ifstream ifs(config_file.c_str());
			if (!ifs)
			{
				cout << "Can not open config file: " << config_file << endl;
			}
			else
			{
				cout<<C_RED<<"Reading config from file "<<config_file<<C_OFF<<endl;
				store(parse_config_file(ifs, file_options, 1), vm);
				notify(vm);
			}
		}

		if (vm.count("wsport")) // [host:][port]
		{
			smatch match;
			regex_match( vm["wsport"].as<string>(), match, std::regex(R"_(([\w\.]*)(\:?)(\d*))_") );

			if(match.size() == 4)
			{
				if(match[2] == "" && match[3] == "") // special case when only port is given: --port 5565
				{
					GLOBALS::get().par_.ws_port_ = stoi(match[1]);
				}
				else
				{
					if(match[1] != "")	GLOBALS::get().par_.ws_host_ = match[1];
					if(match[3] != "")	GLOBALS::get().par_.ws_port_ = stoi(match[3]);
				}
			}
		}
		if (vm.count("serial"))
		{
			GLOBALS::get().par_.serial_ = vm["serial"].as<string>();
		}
		if (vm.count("baud"))
		{
			std::string b = vm["baud"].as<string>();

			if(b == "0")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b0;
			if(b == "50")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b50;
			if(b == "75")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b75;
			if(b == "110")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b110;
			if(b == "134")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b134;
			if(b == "150")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b150;
			if(b == "200")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b200;
			if(b == "300")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b300;
			if(b == "600")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b600;
			if(b == "1200")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b1200;
			if(b == "1800")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b1800;
			if(b == "2400")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b2400;
			if(b == "4800")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b4800;
			if(b == "9600")		GLOBALS::get().par_.baud_ = SerialConnection::Baud::b9600;
			if(b == "19200")	GLOBALS::get().par_.baud_ = SerialConnection::Baud::b19200;
			if(b == "38400")	GLOBALS::get().par_.baud_ = SerialConnection::Baud::b38400;
			if(b == "57600")	GLOBALS::get().par_.baud_ = SerialConnection::Baud::b57600;
			if(b == "115200")	GLOBALS::get().par_.baud_ = SerialConnection::Baud::b115200;
			if(b == "230400")	GLOBALS::get().par_.baud_ = SerialConnection::Baud::b230400;
		}
	}
	catch(exception& e)
	{
		cout << e.what() << "\n";
	}

	GLOBALS::DumpToFile("./habboy_hw_iface.opts");
}