// Checks GPIO 21 (SDA) and GPIO 22 (SCL) themselves, then scans both ways round.
//
// Part 1 needs NOTHING connected to P21 and P22 (unplug every sensor wire).
// Each pin is read with its internal pull-up on. A healthy, free pin reads HIGH.
// A pin that reads LOW is held down by something: a short, a damaged pin,
// or a sensor still connected.
//
// Part 2 scans the bus with SDA/SCL as normal and then reversed, so a crossed
// wiring shows up as a device found only in the reversed scan.

#include <Wire.h>

const int PIN_A = 21;  // SDA
const int PIN_B = 22;  // SCL

void checkPin(const char* name, int pin) {
  pinMode(pin, INPUT_PULLUP);
  delay(50);
  int level = digitalRead(pin);
  Serial.printf("GPIO %d (%s) reads %s\n", pin, name, level ? "HIGH (free)" : "LOW (held down)");
}

void scan(const char* label, int sda, int scl) {
  Wire.begin(sda, scl);
  Wire.setClock(100000);
  Serial.printf("Scan %s (SDA=%d, SCL=%d): ", label, sda, scl);
  int found = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("0x%02X ", address);
      found++;
    }
  }
  Serial.println(found ? "" : "nothing");
  Wire.end();
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println();
  Serial.println("=== Part 1: pin levels (no sensors on P21/P22) ===");
  checkPin("SDA", PIN_A);
  checkPin("SCL", PIN_B);
}

void loop() {
  Serial.println("=== Part 2: scan ===");
  scan("normal  ", PIN_A, PIN_B);
  scan("reversed", PIN_B, PIN_A);
  Serial.println();
  delay(3000);
}
