#pragma once

#include <cstdlib>
#include <memory>
#include <string>
#include <vector>

#include <boost/asio.hpp>
#include <boost/beast.hpp>

#include "ws_server.h"

namespace habboy_hw_iface
{

namespace net = boost::asio;                    // namespace asio
using tcp = net::ip::tcp;                       // from <boost/asio/ip/tcp.hpp>
using error_code = boost::system::error_code;   // from <boost/system/error_code.hpp>

class websocket_session : public std::enable_shared_from_this<websocket_session>
{
    boost::beast::flat_buffer buffer_;
    boost::beast::websocket::stream<tcp::socket> ws_;
    std::vector<std::shared_ptr<std::string const>> queue_;
    std::shared_ptr<habboy_hw_iface::WebsocketServer>   p_ws_server_;

    void fail(error_code ec, char const* what);
    void on_accept(error_code ec);
    void on_read(error_code ec, std::size_t bytes_transferred);
    void on_write(error_code ec, std::size_t bytes_transferred);

public:
    websocket_session(tcp::socket socket, std::shared_ptr<habboy_hw_iface::WebsocketServer> p_ws_server);
    ~websocket_session();

    template<class Body, class Allocator>
    void run(boost::beast::http::request<Body, boost::beast::http::basic_fields<Allocator>> req);

    void send(std::shared_ptr<std::string const> const& i_msg);
};

template<class Body, class Allocator>
void websocket_session::run(boost::beast::http::request<Body, boost::beast::http::basic_fields<Allocator>> req)
{
    ws_.async_accept(
        req,
        std::bind(
            &websocket_session::on_accept,
            shared_from_this(),
            std::placeholders::_1));
}


} //ns