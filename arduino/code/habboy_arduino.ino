
#include "helpers/gps.h"
#include "helpers/rotary_mod16.h"



void setup()
{
    // Serial.begin(115200);
    Serial.begin(9600);
    while (!Serial)
        ; //Wait for user to open terminal

    Serial.println(F("interrupts()"));
    interrupts();

    Serial.println(F("Wire.begin()"));
    Wire.begin();

    Serial.println(F("SetupUBlox()"));
    bool gps_ok = SetupUBlox();
    while(!gps_ok)
    {
        Serial.println(F("err::gps"));
        delay(1000);
    }

    Serial.println(F("SetupMod16RotSwitch()"));
    SetupMod16RotSwitch(11, 12, 0);

    Serial.println(F("setup() done"));

}


long G_GPS_WAIT = 0;
long G_ROT_WAIT = 0;
void loop()
{
    /*if( G_ROT_SWITCH_COUNTER && (millis()-G_GPS_WAIT)>50 )
    {
        {
            int rot_switch_counter = G_ROT_SWITCH_COUNTER;
            G_ROT_SWITCH_COUNTER = 0;
            Serial.print(F("rot::"));	Serial.println(rot_switch_counter/2);
            G_ROT_WAIT = millis();
        }
    }
    */

    if (millis() - G_GPS_WAIT > 300)
    {
        UpdateGps();
        PrintGpsState();
        Serial.println();

        G_GPS_WAIT = millis();
    }

}