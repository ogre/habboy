#pragma once

// modulowo.com mod 16-z
// https://kamami.pl/klawiatury-przyciski/557576-przelacznik-obrotowy-dzialajacy-w-oparciu-o-enkoder.html
// https://dl.btc.pl/kamami_wa/instrukcja-mod-16z.pdf

//  S1A, S1B – axis click
//  S2 i S3 – right/left rotation

short G_MOD16_ROT_LEFT_PIN = 0;
short G_MOD16_ROT_RIGHT_PIN = 0;
short G_MOD16_CLICK_PIN = 0;

void RotSwitchISR2();
void RotSwitchISR3();

void SetupMod16RotSwitch(short pinLeft, short pinRight, short pinClick)
{
	G_MOD16_ROT_LEFT_PIN = pinLeft;
	G_MOD16_ROT_RIGHT_PIN = pinRight;
	G_MOD16_CLICK_PIN = pinClick;

	// pinMode(0, INPUT);
	pinMode(G_MOD16_ROT_LEFT_PIN, INPUT);
	pinMode(G_MOD16_ROT_RIGHT_PIN, INPUT);

 	// digitalWrite (2, HIGH);
 	// digitalWrite (3, HIGH);
 	attachInterrupt(digitalPinToInterrupt(2), RotSwitchISR2, 	CHANGE);
	attachInterrupt(digitalPinToInterrupt(3), RotSwitchISR3, 	CHANGE);
}

volatile int G_ROT_SWITCH_COUNTER = 0;
void RotSwitchISR2()
{
	G_ROT_SWITCH_COUNTER += 1;
	// delayMicroseconds(1000);
}

void RotSwitchISR3()
{
	G_ROT_SWITCH_COUNTER -= 1;
	// delayMicroseconds(1000);
}
