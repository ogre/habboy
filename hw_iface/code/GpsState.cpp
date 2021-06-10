#include "GpsState.h"

#include <iostream>
#include <vector>
#include "pystring.h"

namespace habboy_hw_iface
{

std::string GpsState::to_str() const
{
	using namespace std;

	string res;
	res += "time=" + to_string(time) + ",";
	res += "lat=" + to_string(lat) + ",";
	res += "lon=" + to_string(lon) + ",";
	res += "alt=" + to_string(alt) + ",";
	res += "altmsl=" + to_string(altmsl) + ",";
	res += "sats=" + to_string(sats) + ",";
	res += "speed=" + to_string(speed) + ",";
	res += "heading=" + to_string(heading);
	return res;
}

void GpsState::from_str(std::string str)
{
	using namespace std;

	vector<string> tokens;
	pystring::split( str, tokens, "," );
	for(auto t : tokens)
	{
		vector<string> kv;
		pystring::split( t, kv, "=" );
		if(kv.size() == 2)
		{
			if( kv[0] == "time" )		try { time = 	stoi(kv[1]); }	catch(exception& e) { cout<<"ERR "<<e.what()<<". "<<kv[0]<<" "<<kv[1]<<endl; }
			if( kv[0] == "lat" )		try { lat =  	stof(kv[1]); }	catch(exception& e) { cout<<"ERR "<<e.what()<<". "<<kv[0]<<" "<<kv[1]<<endl; }
			if( kv[0] == "lon" )		try { lon =  	stof(kv[1]); }	catch(exception& e) { cout<<"ERR "<<e.what()<<". "<<kv[0]<<" "<<kv[1]<<endl; }
			if( kv[0] == "alt" )		try { alt =  	stof(kv[1]); }	catch(exception& e) { cout<<"ERR "<<e.what()<<". "<<kv[0]<<" "<<kv[1]<<endl; }
			if( kv[0] == "altmsl" )		try { altmsl =  stof(kv[1]); }	catch(exception& e) { cout<<"ERR "<<e.what()<<". "<<kv[0]<<" "<<kv[1]<<endl; }
			if( kv[0] == "sats" )		try { sats =  	stoi(kv[1]); }	catch(exception& e) { cout<<"ERR "<<e.what()<<". "<<kv[0]<<" "<<kv[1]<<endl; }
			if( kv[0] == "speed" )		try { speed =  	stof(kv[1]); }	catch(exception& e) { cout<<"ERR "<<e.what()<<". "<<kv[0]<<" "<<kv[1]<<endl; }
			if( kv[0] == "heading" )	try { heading = stof(kv[1]); }	catch(exception& e) { cout<<"ERR "<<e.what()<<". "<<kv[0]<<" "<<kv[1]<<endl; }
		}
	}
}

} //ns