#include "ws_server.h"
#include "listener.h"
#include "websocket_session.h"

namespace habboy_hw_iface
{


void WebsocketServer::operator()()
{
	using namespace std;
	using tcp = boost::asio::ip::tcp;

	auto const address = boost::asio::ip::make_address( host_ );
	auto const port = static_cast<unsigned short>( port_ );

	make_shared<habboy_hw_iface::listener>(
			ioc_,
			tcp::endpoint{address, port},
			*this
		)->run();

	ioc_.run();
}

void WebsocketServer::sessions_send  (std::string message)
{
	auto const ss = std::make_shared<std::string const>(std::move(message));
	{
		std::lock_guard<std::mutex> lock(sessions_mtx_);
		for(auto session : sessions_)
			session->send(ss);
	}
}


} //ns