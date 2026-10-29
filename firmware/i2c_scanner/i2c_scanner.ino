#include <Wire.h>

void setup() {
  Serial.begin(115200);
  delay(1000);
  Wire.begin(21, 22);   // SDA = GPIO 21, SCL = GPIO 22
  Wire.setClock(100000);
}

void loop() {
  Serial.println("Scanning...");
  int found = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Found device at 0x%02X", address);
      if (address == 0x57) Serial.print("  <- MAX30102 (heart rate)");
      if (address == 0x68 || address == 0x69) Serial.print("  <- MPU6050 (motion)");
      if (address == 0x5A) Serial.print("  <- MLX90614 (temperature)");
      Serial.println();
      found++;
    }
  }
  if (found == 0) Serial.println("Nothing found. Check the wires.");
  Serial.println();
  delay(3000);
}