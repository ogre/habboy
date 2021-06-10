#pragma once

#include <string>

namespace habboy_hw_iface
{

class GpsState
{
public:
	int time = 0;
	float lat = 0;
	float lon = 0;
	float alt = 0;
	float altmsl = 0;
	int sats = -1;
	float speed = 0;
	float heading = 0;

	std::string to_str() const;
	void from_str(std::string str);
};

} //ns