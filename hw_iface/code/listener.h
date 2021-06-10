#pragma once

#include <memory>
#include <string>

#include <boost/asio.hpp>

#include "ws_server.h"

namespace net = boost::asio;                    // namespace asio
using tcp = net::ip::tcp;                       // from <boost/asio/ip/tcp.hpp>
using error_code = boost::system::error_code;   // from <boost/system/error_code.hpp>

namespace habboy_hw_iface
{

class listener : public std::enable_shared_from_this<listener>
{
    tcp::acceptor   acceptor_;
    tcp::socket     socket_;
    std::shared_ptr<habboy_hw_iface::WebsocketServer>   p_ws_server_;

    void fail(error_code ec, char const* what);
    void on_accept(error_code ec);

public:
    listener(net::io_context& ioc, tcp::endpoint endpoint, habboy_hw_iface::WebsocketServer& ws_server);
    void run();
};

} //ns