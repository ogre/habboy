#pragma once

#include <string>
#include <vector>
#include <functional>

#include <termios.h>

namespace habboy_hw_iface
{

// void RunSerialConnection( std::function<void(const std::string&)> msg_callback);

class SerialConnection
{
public:
	typedef std::function<void (const std::string&)> 	callback_type;
	enum Baud {
		b0 = B0,
		b50 = B50,
		b75 = B75,
		b110 = B110,
		b134 = B134,
		b150 = B150,
		b200 = B200,
		b300 = B300,
		b600 = B600,
		b1200 = B1200,
		b1800 = B1800,
		b2400 = B2400,
		b4800 = B4800,
		b9600 = B9600,
		b19200 = B19200,
		b38400 = B38400,
		b57600 = B57600,
		b115200 = B115200,
		b230400 = B230400
	};

	SerialConnection() = delete;
	SerialConnection(const SerialConnection&) = delete;
	SerialConnection& operator=(const SerialConnection&) = delete;

	SerialConnection(std::string port, Baud baud) : port_(port), baud_(baud) {};

	void add_callback(callback_type);
	void operator()();
	void Stop() {keep_running_ = false;}

private:
	std::string 	port_{""};
	// unsigned int 	baud_{0};
	Baud baud_{Baud::b115200};
	std::vector<callback_type> 	callbacks_;
	bool keep_running_ = true;
};


// needed for boost::program_options
std::istream& operator>>(std::istream& in, SerialConnection::Baud& b);
std::ostream& operator<<(std::ostream& os, const SerialConnection::Baud& b);


}