#pragma once

#include <Wire.h> //Needed for I2C to GPS

// https://github.com/sparkfun/SparkFun_Ublox_Arduino_Library
// http://librarymanager/All#SparkFun_Ublox_GPS

#include "SparkFun_Ublox_Arduino_Library.h"
SFE_UBLOX_GPS myGPS;

bool SetupUBlox()
{
	Wire.begin();

	if (myGPS.begin() == false) //Connect to the Ublox module using Wire port
		return false;

	myGPS.setI2COutput(COM_TYPE_UBX); //Set the I2C port to output UBX only (turn off NMEA noise)
	myGPS.setNavigationFrequency(3);  //Set output to X times a second
	myGPS.setAutoPVT(true);			  //Tell the GPS to "send" each solution -- NONBLOCKING

	return true;
}

/*
void PrintGps()
{
	Serial.print(F("gps::"));

	long latitude = myGPS.getLatitude();
	Serial.print(F("lat="));
	Serial.print(latitude);

	long longitude = myGPS.getLongitude();
	Serial.print(F(",lon="));
	Serial.print(longitude);
	// Serial.print(F(" (degrees * 10^-7)"));

	long altitude = myGPS.getAltitude();
	Serial.print(F(",alt="));
	Serial.print(altitude);
	// Serial.print(F(" (mm)"));

	long altitudeMSL = myGPS.getAltitudeMSL();
	Serial.print(F(",altmsl="));
	Serial.print(altitudeMSL);

	byte SIV = myGPS.getSIV();
	Serial.print(F(",siv="));
	Serial.print(SIV);

	long speed = myGPS.getGroundSpeed();
	Serial.print(F(",speed="));
	Serial.print(speed);
	// Serial.print(F(" (mm/s)"));

	long heading = myGPS.getHeading();
	Serial.print(F(",heading="));
	Serial.print(heading);
	// Serial.print(F(" (degrees * 10^-5)"));

	uint32_t acu = myGPS.getPositionAccuracy();
	Serial.print(F(",acu="));
	Serial.print(acu);

	uint8_t fixtype = myGPS.getFixType();
	Serial.print(F(",fixtype="));
	Serial.print(fixtype);

	Serial.print(F("\n"));
}
*/

struct GPS_STATE_T
{
	long latitude;
	long longitude;
	int16_t altitude;
	int16_t altitudeMSL;
	uint8_t SIV;
	uint16_t speed;
	uint16_t heading;
	uint32_t acu;
	uint8_t fixtype;
};

GPS_STATE_T G_GPS_STATE;

void UpdateGps() // this takes 500ms
{
	G_GPS_STATE.latitude = myGPS.getLatitude();
	G_GPS_STATE.longitude = myGPS.getLongitude();
	G_GPS_STATE.altitude = myGPS.getAltitude();
	G_GPS_STATE.altitudeMSL = myGPS.getAltitudeMSL();
	G_GPS_STATE.SIV = myGPS.getSIV();
	G_GPS_STATE.speed = myGPS.getGroundSpeed();
	G_GPS_STATE.heading = myGPS.getHeading();
	G_GPS_STATE.acu = myGPS.getPositionAccuracy();
	G_GPS_STATE.fixtype = myGPS.getFixType();
}

void PrintGpsState()
{
	Serial.print(F("gps::"));

	Serial.print(F("lat="));
	Serial.print(G_GPS_STATE.latitude);

	Serial.print(F(",lon="));
	Serial.print(G_GPS_STATE.longitude);

	Serial.print(F(",alt="));
	Serial.print(G_GPS_STATE.altitude);

	Serial.print(F(",altmsl="));
	Serial.print(G_GPS_STATE.altitudeMSL);

	Serial.print(F(",siv="));
	Serial.print(G_GPS_STATE.SIV);

	Serial.print(F(",speed="));
	Serial.print(G_GPS_STATE.speed);

	Serial.print(F(",heading="));
	Serial.print(G_GPS_STATE.heading);

	Serial.print(F(",acu="));
	Serial.print(G_GPS_STATE.acu);

	Serial.print(F(",fixtype="));
	Serial.print(G_GPS_STATE.fixtype);
}