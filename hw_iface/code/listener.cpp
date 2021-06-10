#include "listener.h"
#include "http_session.h"
#include <iostream>

namespace habboy_hw_iface
{

listener::listener(net::io_context& ioc, tcp::endpoint endpoint, habboy_hw_iface::WebsocketServer& ws_server)
                : acceptor_(ioc) , socket_(ioc), p_ws_server_(&ws_server)

{
    error_code ec;

    acceptor_.open(endpoint.protocol(), ec);
    if(ec)
    {
        fail(ec, "open");
        return;
    }

    acceptor_.set_option(net::socket_base::reuse_address(true));
    if(ec)
    {
        fail(ec, "set_option");
        return;
    }

    acceptor_.bind(endpoint, ec);
    if(ec)
    {
        fail(ec, "bind");
        return;
    }

    acceptor_.listen(
        net::socket_base::max_listen_connections, ec);
    if(ec)
    {
        fail(ec, "listen");
        return;
    }
}

void listener::run()
{
    acceptor_.async_accept(
        socket_,
        [self = shared_from_this()](error_code ec)
        {
            self->on_accept(ec);
        });
}

// Report a failure
void listener::fail(error_code ec, char const* what)
{
    if(ec == net::error::operation_aborted)
        return;
    std::cerr << what << ": " << ec.message() << "\n";
}

void listener::on_accept(error_code ec)
{
    if(ec)
        return fail(ec, "accept");
    else
        std::make_shared<http_session>(
                std::move(socket_), p_ws_server_
            )->run(); // moved-from socket is still valid

    // Accept another connection
    acceptor_.async_accept(
        socket_,
        [self = shared_from_this()](error_code ec)
        {
            self->on_accept(ec);
        });
}

} //ns