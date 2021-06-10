#include "websocket_session.h"
#include "GLOBALS.h"

namespace habboy_hw_iface
{

websocket_session::websocket_session(
    tcp::socket socket,
    std::shared_ptr<habboy_hw_iface::WebsocketServer> p_ws_server  )
        : ws_(std::move(socket))
{
    p_ws_server_ = p_ws_server;
}

websocket_session::~websocket_session()
{
    // Remove this session from the list of active sessions
    // state_->leave(*this);
    p_ws_server_->session_delete(*this);
}

void websocket_session::fail(error_code ec, char const* what)
{
    if( ec == net::error::operation_aborted ||
        ec == boost::beast::websocket::error::closed)
        return;
    std::cerr << what << ": " << ec.message() << "\n";
}

void websocket_session::on_accept(error_code ec)
{
    if(ec)
        return fail(ec, "accept");

    p_ws_server_->session_add(*this);

    // Read a message
    ws_.async_read(
        buffer_,
        [sp = shared_from_this()](
            error_code ec, std::size_t bytes)
        {
            sp->on_read(ec, bytes);
        });
}

void websocket_session::on_read(error_code ec, std::size_t)
{
    if(ec)
        return fail(ec, "read");

    // GLOBALS::get().sessions_send( boost::beast::buffers_to_string(buffer_.data()) );
    p_ws_server_->sessions_send( boost::beast::buffers_to_string( buffer_.data()) );

    std::string msg = boost::beast::buffers_to_string( buffer_.data() );
    std::cout<<"received message: "<<msg<<std::endl;

    buffer_.consume(buffer_.size());

    ws_.async_read(
        buffer_,
        [sp = shared_from_this()](
            error_code ec, std::size_t bytes)
        {
            sp->on_read(ec, bytes);
        });
}

void websocket_session::send(std::shared_ptr<std::string const> const& ss)
{
    queue_.push_back(ss);
    if(queue_.size() > 1)
        return;

    ws_.async_write(
        net::buffer(*queue_.front()),
        [sp = shared_from_this()](error_code ec, std::size_t bytes)
        {
            sp->on_write(ec, bytes);
        });
}

void websocket_session::on_write(error_code ec, std::size_t)
{
    if(ec)
        return fail(ec, "write");

    queue_.erase(queue_.begin());

    if(! queue_.empty())
        ws_.async_write(
            net::buffer(*queue_.front()),
            [sp = shared_from_this()](error_code ec, std::size_t bytes)
            {
                sp->on_write(ec, bytes);
            });
}

} // ns