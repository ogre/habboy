#pragma once

#include <cstdlib>
#include <memory>

#include <boost/asio.hpp>
#include <boost/beast.hpp>

#include "ws_server.h"

namespace net = boost::asio;                    // namespace asio
using tcp = net::ip::tcp;                       // from <boost/asio/ip/tcp.hpp>
using error_code = boost::system::error_code;   // from <boost/system/error_code.hpp>


namespace habboy_hw_iface
{

class http_session : public std::enable_shared_from_this<http_session>
{
    tcp::socket socket_;
    boost::beast::flat_buffer buffer_;
    boost::beast::http::request<boost::beast::http::string_body> req_;
    std::shared_ptr<habboy_hw_iface::WebsocketServer>   p_ws_server_;

    void fail(error_code ec, char const* what);
    void on_read(error_code ec, std::size_t);
    void on_write(error_code ec, std::size_t, bool close);

public:
    http_session(tcp::socket socket, std::shared_ptr<habboy_hw_iface::WebsocketServer> p_ws_server);
    void run();
};

} //ns