#pragma once

#include <string>
#include <thread>
#include <mutex>
#include <unordered_set>

#include <boost/asio/ip/tcp.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/signal_set.hpp>

// #include "websocket_session.h"


/*
using boost::asio::ip::tcp;
namespace beast = 		boost::beast;
namespace websocket = 	boost::beast::websocket;
*/

namespace habboy_hw_iface
{

class websocket_session;

class WebsocketServer : public std::enable_shared_from_this<WebsocketServer>
{

public:
	WebsocketServer() = delete;
	WebsocketServer(const WebsocketServer&) = delete;
	WebsocketServer& operator=(const WebsocketServer&) = delete;

	WebsocketServer(std::string host, unsigned int port) : host_(host), port_(port) {}

	void operator()();

	// sessions
	void session_add  (habboy_hw_iface::websocket_session& session)		{ sessions_.insert(&session); }
    void session_delete (habboy_hw_iface::websocket_session& session)	{ sessions_.erase(&session);  }
    void sessions_send  (std::string message);

private:
	std::string 	host_{"0.0.0.0"};
	unsigned int	port_{5565};
	boost::asio::io_context ioc_{1};

	// sessions
	std::unordered_set<habboy_hw_iface::websocket_session*> sessions_;
	std::mutex sessions_mtx_;
};

} //ns