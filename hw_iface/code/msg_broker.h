#pragma once

#include <string>
#include <queue>
#include <vector>
#include <mutex>
#include <condition_variable>

#include "ws_server.h"
#include "GpsState.h"

namespace habboy_hw_iface
{

class MessageBroker
{
public:
	MessageBroker() = delete;
	MessageBroker(const MessageBroker&) = delete;
	MessageBroker& operator=(const MessageBroker&) = delete;

	MessageBroker(habboy_hw_iface::WebsocketServer& ws_server);

	void push(std::string msg);
	void operator()();
	void Stop() { keep_running_=false; }

private:
	std::queue<std::string>	msg_que_;
	// std::timed_mutex		msg_que_mtx_;
	std::mutex				msg_que_mtx_;
	std::condition_variable msg_que_cv_;

	bool					keep_running_ = true;

	std::shared_ptr<habboy_hw_iface::WebsocketServer> 	p_ws_server_;

	bool handle_msg(const std::string msg);
};

} //ns