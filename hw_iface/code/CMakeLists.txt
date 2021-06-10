cmake_minimum_required( VERSION 3.8.2 )

project (habboy_hw_iface)
set ( CMAKE_CXX_STANDARD 17 )

# set ( CMAKE_BUILD_TYPE "Debug" )
# set ( CMAKE_BUILD_TYPE "Release" )
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE "Release")
endif()

if ( CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT )
    set ( CMAKE_INSTALL_PREFIX "${CMAKE_BINARY_DIR}/install" CACHE PATH "Install dir" FORCE)
endif()
message ( "CMAKE_INSTALL_PREFIX: " ${CMAKE_INSTALL_PREFIX} )



list(APPEND CMAKE_MODULE_PATH "${PROJECT_SOURCE_DIR}/CMake/")
include(GetGitRevisionDescription)
get_git_head_revision(GIT_REFSPEC GIT_SHA1)

include_directories( ${PROJECT_SOURCE_DIR} )
include_directories( ${CMAKE_CURRENT_SOURCE_DIR} )

# boost
set ( Boost_NO_BOOST_CMAKE ON )
set ( Boost_NO_SYSTEM_PATHS ON )
set ( Boost_USE_STATIC_LIBS ON )
add_definitions ( -DBOOST_ALL_NO_LIB )
find_package(Boost REQUIRED COMPONENTS program_options system date_time )
include_directories( ${Boost_INCLUDE_DIRS} )
message ( "Boost_INCLUDE_DIRS " ${Boost_INCLUDE_DIRS} )
message ( "Boost_LIBRARY_DIRS " ${Boost_LIBRARY_DIRS} )

set( CMAKE_CXX_FLAGS  " -O3 " )
if ("${CMAKE_CXX_COMPILER_ID}" STREQUAL "GNU")
	# set( CMAKE_CXX_FLAGS  "${CMAKE_CXX_FLAGS} -Wshadow" )
	set( CMAKE_CXX_FLAGS  "${CMAKE_CXX_FLAGS} -Wno-class-memaccess" )
	set( CMAKE_CXX_FLAGS  "${CMAKE_CXX_FLAGS} -Wno-unused-variable" )
	set( CMAKE_CXX_FLAGS  "${CMAKE_CXX_FLAGS} -Wno-unused-parameter" )
	set( CMAKE_CXX_FLAGS  "${CMAKE_CXX_FLAGS} -Werror=return-type" )
elseif ("${CMAKE_CXX_COMPILER_ID}" STREQUAL "MSVC")
	SET(CMAKE_CXX_FLAGS "/EHsc")
	add_definitions( -D_USE_MATH_DEFINES )
endif()

set (PlatformSpecificLinking "")
if ("${CMAKE_CXX_COMPILER_ID}" STREQUAL "GNU")
	set (PlatformSpecificLinking "pthread")
endif()

set ( habboy_hw_iface_src
					console_colors.h 	console_colors.cpp
					pystring.h 	pystring.cpp
					program_options.h 	program_options.cpp
					GpsState.h 	GpsState.cpp
					ws_server.h 	ws_server.cpp
					hb_serial.h 	hb_serial.cpp
					listener.h	listener.cpp
					http_session.h	http_session.cpp
					websocket_session.h	websocket_session.cpp
					msg_broker.h	msg_broker.cpp
					main.cpp
			)

# compile in git repo version
configure_file("${PROJECT_SOURCE_DIR}/git_repo_sha1.cpp.in" "${CMAKE_CURRENT_BINARY_DIR}/git_repo_sha1.cpp" @ONLY)
list(APPEND habboy_hw_iface_src "${CMAKE_CURRENT_BINARY_DIR}/git_repo_sha1.cpp" ${PROJECT_SOURCE_DIR}/git_repo_sha1.h)

add_executable ( 		habboy_hw_iface ${habboy_hw_iface_src} )
target_link_libraries( 	habboy_hw_iface
							${Boost_LIBRARIES}
							${PlatformSpecificLinking} )

install ( TARGETS habboy_hw_iface DESTINATION ${CMAKE_INSTALL_PREFIX} )
install ( 	FILES ${PROJECT_SOURCE_DIR}/habLogger/habLogger.py
		PERMISSIONS OWNER_EXECUTE OWNER_WRITE OWNER_READ
		DESTINATION  ${CMAKE_INSTALL_PREFIX} )


file( WRITE ${CMAKE_CURRENT_BINARY_DIR}/run_loop.sh "#!/bin/sh\n while true; do ./habboy_hw_iface --config ./habdechabboy_hw_iface.opts; done\n" )
install (       FILES ${CMAKE_CURRENT_BINARY_DIR}/run_loop.sh
                PERMISSIONS OWNER_EXECUTE OWNER_WRITE OWNER_READ
                DESTINATION  ${CMAKE_INSTALL_PREFIX} )

