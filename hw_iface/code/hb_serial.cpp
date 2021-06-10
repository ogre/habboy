#include <hb_serial.h>

#include <thread>
#include <chrono>
#include <string>
#include <iostream>

// serial
#include <stdio.h>
#include <errno.h>
#include <fcntl.h>
#include <string.h>
#include <termios.h>
#include <unistd.h>

namespace
{

void error_message(const char* err_m, int _errno, ...)
{
	printf(err_m);
	// printf("\n");
}

int set_interface_attribs(int fd, int speed, int parity)
{
	struct termios tty;
	memset(&tty, 0, sizeof tty);
	if (tcgetattr(fd, &tty) != 0)
	{
		error_message("error %d from tcgetattr", errno);
		return -1;
	}

	cfsetospeed(&tty, speed);
	cfsetispeed(&tty, speed);

	tty.c_cflag = (tty.c_cflag & ~CSIZE) | CS8; // 8-bit chars
	// disable IGNBRK for mismatched speed tests; otherwise receive break
	// as \000 chars
	tty.c_iflag &= ~IGNBRK; // disable break processing
	tty.c_lflag = 0;		// no signaling chars, no echo,
							// no canonical processing
	tty.c_oflag = 0;		// no remapping, no delays
	tty.c_cc[VMIN] = 0;		// read doesn't block
	tty.c_cc[VTIME] = 5;	// 0.5 seconds read timeout

	tty.c_iflag &= ~(IXON | IXOFF | IXANY); // shut off xon/xoff ctrl

	tty.c_cflag |= (CLOCAL | CREAD);   // ignore modem controls,
									   // enable reading
	tty.c_cflag &= ~(PARENB | PARODD); // shut off parity
	tty.c_cflag |= parity;
	tty.c_cflag &= ~CSTOPB;
	tty.c_cflag &= ~CRTSCTS;

	if (tcsetattr(fd, TCSANOW, &tty) != 0)
	{
		error_message("error %d from tcsetattr", errno);
		return -1;
	}
	return 0;
}


void set_blocking(int fd, int should_block)
{
	struct termios tty;
	memset(&tty, 0, sizeof tty);
	if (tcgetattr(fd, &tty) != 0)
	{
		error_message("error %d from tggetattr", errno);
		return;
	}

	tty.c_cc[VMIN] = should_block ? 1 : 0;
	tty.c_cc[VTIME] = 5; // 0.5 seconds read timeout

	if (tcsetattr(fd, TCSANOW, &tty) != 0)
		error_message("error %d setting term attributes", errno);
}


} //ns


namespace habboy_hw_iface
{

void SerialConnection::add_callback(callback_type cb)
{
	callbacks_.push_back(cb);
}

void SerialConnection::operator()()
{
	using namespace std;

	int fd = open(port_.c_str(), O_RDWR | O_NOCTTY | O_SYNC);
	if (fd < 0)
	{
		cerr<<("error opening serial port. ", errno, port_, strerror(errno));
		return;
	}

	set_interface_attribs(fd, baud_, 0); // set speed to 115,200 bps, 8n1 (no parity)
	set_blocking(fd, 0);				   // set no blocking

	// write(fd, "hello!\n", 7); // send 7 character greeting

	char buf[100];
	string buf_str;
	while(keep_running_)
	{
		// usleep((7 + 25) * 100); // sleep enough to transmit the 7 plus
							// receive 25:  approx 100 uS per char transmit

		usleep(1 * 100000); // sleep enough to transmit the 7 plus

		int n = read(fd, buf, sizeof buf); // read up to 100 characters if ready to read
		string part(buf, n);
		buf_str += part;

		auto _end = buf_str.find("\n");
		if(_end != std::string::npos)
		{
			string msg = buf_str.substr(0, _end);
			std::cout<<"SERIAL	:    "<<msg<<std::endl;
			buf_str = buf_str.substr(_end+1);

			for(auto cb : callbacks_)
				cb(msg);
		}
	}

}

// needed for boost::program_options
std::istream& operator>>(std::istream& in, SerialConnection::Baud& b)
{
	std::string token;
	in >> token;

	if 		(token == "0")	b = SerialConnection::Baud::b0;
	else if (token == "1")	b = SerialConnection::Baud::b50;
	else if (token == "2")	b = SerialConnection::Baud::b75;
	else if (token == "3")	b = SerialConnection::Baud::b110;
	else if (token == "4")	b = SerialConnection::Baud::b134;
	else if (token == "5")	b = SerialConnection::Baud::b150;
	else if (token == "6")	b = SerialConnection::Baud::b200;
	else if (token == "7")	b = SerialConnection::Baud::b300;
	else if (token == "8")	b = SerialConnection::Baud::b600;
	else if (token == "9")	b = SerialConnection::Baud::b1200;
	else if (token == "10")	b = SerialConnection::Baud::b1800;
	else if (token == "10")	b = SerialConnection::Baud::b2400;
	else if (token == "12")	b = SerialConnection::Baud::b4800;
	else if (token == "13")	b = SerialConnection::Baud::b9600;
	else if (token == "14")	b = SerialConnection::Baud::b19200;
	else if (token == "15")	b = SerialConnection::Baud::b38400;
	else if (token == "16")	b = SerialConnection::Baud::b57600;
	else if (token == "17")	b = SerialConnection::Baud::b115200;
	else if (token == "18")	b = SerialConnection::Baud::b230400;
	return in;
}

std::ostream& operator<<(std::ostream& os, const SerialConnection::Baud& b)
{
	if 		(b == SerialConnection::Baud::b0)			os<<"B0";
	else if (b == SerialConnection::Baud::b50)			os<<"B50";
	else if (b == SerialConnection::Baud::b75)			os<<"B75";
	else if (b == SerialConnection::Baud::b110)			os<<"B110";
	else if (b == SerialConnection::Baud::b134)			os<<"B134";
	else if (b == SerialConnection::Baud::b150)			os<<"B150";
	else if (b == SerialConnection::Baud::b200)			os<<"B200";
	else if (b == SerialConnection::Baud::b300)			os<<"B300";
	else if (b == SerialConnection::Baud::b600)			os<<"B600";
	else if (b == SerialConnection::Baud::b1200)		os<<"B1200";
	else if (b == SerialConnection::Baud::b1800)		os<<"B1800";
	else if (b == SerialConnection::Baud::b2400)		os<<"B2400";
	else if (b == SerialConnection::Baud::b4800)		os<<"B4800";
	else if (b == SerialConnection::Baud::b9600)		os<<"B9600";
	else if (b == SerialConnection::Baud::b19200)		os<<"B19200";
	else if (b == SerialConnection::Baud::b38400)		os<<"B38400";
	else if (b == SerialConnection::Baud::b57600)		os<<"B57600";
	else if (b == SerialConnection::Baud::b115200)		os<<"B115200";
	else if (b == SerialConnection::Baud::b230400)		os<<"B230400";

	return os;
}

} //ns habboy_hw_iface