#include <msg_broker.h>

#include <thread>
#include <mutex>
#include <chrono>
#include <iostream>

#include "GLOBALS.h"

namespace habboy_hw_iface
{


MessageBroker::MessageBroker(habboy_hw_iface::WebsocketServer& ws_server)
{
	p_ws_server_.reset(&ws_server);
}


void MessageBroker::push(std::string msg)
{
	using Ms = std::chrono::milliseconds;

	/*
	if( msg_que_mtx_.try_lock_for(Ms(100)) )
	{
		std::lock_guard<std::mutex> _lock(msg_que_mtx_);
		msg_que_.push(msg);
		msg_que_mtx_.unlock();
	}
	else
	{
		std::cout<<"push timed out: "<<msg<<std::endl;
	}
	*/


	{
		std::lock_guard<std::mutex> _lock(msg_que_mtx_);
		msg_que_.push(msg);
	}
	msg_que_cv_.notify_one();
}


void MessageBroker::operator()()
{
	while(keep_running_)
	{
		using namespace std;
		using Ms = std::chrono::milliseconds;

		// this_thread::sleep_for(std::chrono::milliseconds(100));

		queue<string> msgs;

		/*
		if( msg_que_mtx_.try_lock_for(Ms(1000)) )
		{
			msg_que_cv_.wait( msg_que_mtx_ );
			msgs = std::move(msg_que_);
			msg_que_mtx_.unlock();
		}
		else
		{
			std::cout<<"consume timed out."<<std::endl;
		}
		*/


		{
			std::unique_lock<std::mutex>	lock_(msg_que_mtx_);
			msg_que_cv_.wait(lock_);

			msgs = std::move(msg_que_);

			lock_.unlock();
			msg_que_cv_.notify_one();
		}

		while(msgs.size())
		{
			bool handled = handle_msg( msgs.front() );
			msgs.pop();
		}
	}
}


bool MessageBroker::handle_msg(const std::string msg)
{
	using namespace  std;

	// p_ws_server_->sessions_send(msg);


	auto type_split = msg.find("::");
	if(type_split == string::npos)
		return false;

	string m_type = msg.substr(0, type_split);
	string m_body = msg.substr(type_split+2);

	if(m_type == "gps")
	{
		GpsState _gps = GLOBALS::get().gps_;
		_gps.from_str(m_body);
		_gps.alt /= 1000;
		_gps.altmsl /= 1000;
		_gps.heading /= 1000;
		GLOBALS::get().gps_ = _gps;
		p_ws_server_->sessions_send( "gps::" + _gps.to_str() );
	}
	else
	{
		// unknown -- just send
		p_ws_server_->sessions_send( msg );
	}


	return true;

}


} //ns