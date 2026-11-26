// CAPartner Smart Cap firmware (ESP32 DevKit, 38 pins).
//
// Reads the sensors and sends one JSON reading to the phone app over
// Bluetooth Low Energy every 5 seconds, and an SOS when the SOS button is
// held for 3 seconds. The packet format and the Bluetooth details are in
// docs/cap-data-format.md.
//
// Wiring (every sensor: VCC to 3V3, GND to GND, unless said otherwise):
//   MAX30102 heart rate     VIN to 5V, SDA P21, SCL P22
//                           (on 3V3 its SDA/SCL signals are too weak for the
//                           ESP32 to see; its own regulator keeps them safe)
//   MPU6050 motion          SDA P21, SCL P22 (shared)
//   MLX90614 temperature    SDA P21, SCL P22 (shared)
//     or DS18B20            DATA P4, 4.7k resistor from DATA to 3V3
//   NEO-6M GPS              GPS TX to P16, GPS RX to P17
//   SOS button module       VCC to 3V3, OUT to P27, GND to GND
//   Battery level           P34, through two equal resistors
//   Blue LED (on board)     P2: on while the phone is connected
//
// Libraries (Arduino IDE: Tools > Manage Libraries):
//   SparkFun MAX3010x Pulse and Proximity Sensor Library
//   Adafruit MPU6050
//   Adafruit MLX90614 Library      (for the MLX90614)
//   OneWire, DallasTemperature     (for the DS18B20)
//   TinyGPSPlus
//
// A sensor that is missing or not working is left out of the readings; the
// rest still go. When one says NOT FOUND at startup, run
// firmware/i2c_scanner to check its wires.

#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <Adafruit_MPU6050.h>
#include <TinyGPSPlus.h>

// ---- Settings ---------------------------------------------------------------

// Each cap's own code, as the admin knows it. Change it for every cap.
#define CAP_CODE "CAP-001"

// Which temperature sensor is fitted: 1 = MLX90614, 0 = DS18B20.
#define USE_MLX90614 1

// SOS button module (VCC, OUT, GND): 1 = OUT goes HIGH while pressed (most
// modules). If the SOS fires without touching it, set this to 0.
#define SOS_MODULE_HIGH_WHEN_PRESSED 1
const int SOS_PRESSED_LEVEL = SOS_MODULE_HIGH_WHEN_PRESSED ? HIGH : LOW;

const unsigned long SEND_EVERY_MS = 5000;
const unsigned long TEMP_EVERY_MS = 10000;
const unsigned long BATTERY_EVERY_MS = 60000;
const unsigned long SOS_HOLD_MS = 3000;

// ---- Pins -------------------------------------------------------------------

const int PIN_SDA = 21;
const int PIN_SCL = 22;
const int PIN_DS18B20 = 4;
const int PIN_GPS_RX = 16;  // to the GPS's TX
const int PIN_GPS_TX = 17;  // to the GPS's RX
const int PIN_SOS = 27;
const int PIN_BATTERY = 34;
const int PIN_LED = 2;

// ---- Bluetooth (must match the app) -----------------------------------------

#define SERVICE_UUID  "8f3a1c20-5b7e-4d2a-9c61-0e4b7f2a1d00"
#define READINGS_UUID "8f3a1c21-5b7e-4d2a-9c61-0e4b7f2a1d00"

BLECharacteristic* readings;
bool phoneConnected = false;

class ServerEvents : public BLEServerCallbacks {
  void onConnect(BLEServer*) override {
    phoneConnected = true;
    digitalWrite(PIN_LED, HIGH);
    Serial.println("Phone connected");
  }
  void onDisconnect(BLEServer*) override {
    phoneConnected = false;
    digitalWrite(PIN_LED, LOW);
    Serial.println("Phone disconnected");
    BLEDevice::startAdvertising();  // let the phone connect again
  }
};

void send(const char* json) {
  Serial.println(json);
  if (!phoneConnected) return;
  readings->setValue((uint8_t*)json, strlen(json));
  readings->notify();
}

// ---- Sensors ----------------------------------------------------------------

#if USE_MLX90614
#include <Adafruit_MLX90614.h>
Adafruit_MLX90614 mlx;
#else
#include <OneWire.h>
#include <DallasTemperature.h>
OneWire oneWire(PIN_DS18B20);
DallasTemperature ds18b20(&oneWire);
#endif

MAX30105 heartSensor;
Adafruit_MPU6050 mpu;
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

bool hasHeart = false, hasMotion = false, hasTemp = false;

// Latest values; NAN / -1 = none yet.
float heartRateBpm = NAN;
float bodyTempC = NAN;
int batteryPct = -1;
bool moving = false;

// Heart rate: the average of the last few beats.
const int BEATS_AVERAGED = 4;
float beats[BEATS_AVERAGED];
int beatCount = 0, beatSlot = 0;
unsigned long lastBeatMs = 0;
const long NO_FINGER_IR = 50000;  // below this the sensor is not on skin

// Motion: the largest shake seen since the last reading.
float biggestShake = 0;
const float MOVING_SHAKE = 1.5;  // m/s^2 away from gravity

void setupSensors() {
  Wire.begin(PIN_SDA, PIN_SCL);
  Wire.setClock(100000);  // the MLX90614 cannot go faster

  hasHeart = heartSensor.begin(Wire, I2C_SPEED_STANDARD);
  if (hasHeart) {
    heartSensor.setup();
    heartSensor.setPulseAmplitudeRed(0x0A);
    heartSensor.setPulseAmplitudeGreen(0);
  }

  hasMotion = mpu.begin(0x68, &Wire);
  if (hasMotion) {
    mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

#if USE_MLX90614
  hasTemp = mlx.begin(MLX90614_I2CADDR, &Wire);
#else
  ds18b20.begin();
  ds18b20.setWaitForConversion(false);
  ds18b20.requestTemperatures();
  hasTemp = ds18b20.getDeviceCount() > 0;
#endif

  gpsSerial.begin(9600, SERIAL_8N1, PIN_GPS_RX, PIN_GPS_TX);
  analogReadResolution(12);

  Serial.printf("Heart rate: %s, motion: %s, temperature: %s\n",
                hasHeart ? "OK" : "NOT FOUND",
                hasMotion ? "OK" : "NOT FOUND",
                hasTemp ? "OK" : "NOT FOUND");
}

// Runs as often as possible: the heart rate needs about 100 samples a second.
void readHeart() {
  if (!hasHeart) return;
  long ir = heartSensor.getIR();
  if (ir < NO_FINGER_IR) {
    beatCount = 0;
    heartRateBpm = NAN;
    return;
  }
  if (!checkForBeat(ir)) return;
  unsigned long now = millis();
  unsigned long gap = now - lastBeatMs;
  lastBeatMs = now;
  float bpm = 60000.0 / gap;
  if (bpm < 30 || bpm > 220) return;  // a missed or doubled beat
  beats[beatSlot] = bpm;
  beatSlot = (beatSlot + 1) % BEATS_AVERAGED;
  if (beatCount < BEATS_AVERAGED) beatCount++;
  float sum = 0;
  for (int i = 0; i < beatCount; i++) sum += beats[i];
  heartRateBpm = sum / beatCount;
}

// About 50 times a second.
void readMotion() {
  static unsigned long last = 0;
  if (!hasMotion || millis() - last < 20) return;
  last = millis();
  sensors_event_t a, g, t;
  mpu.getEvent(&a, &g, &t);
  float total = sqrt(a.acceleration.x * a.acceleration.x +
                     a.acceleration.y * a.acceleration.y +
                     a.acceleration.z * a.acceleration.z);
  float shake = fabs(total - 9.81);
  if (shake > biggestShake) biggestShake = shake;
}

void readTemperature() {
  static unsigned long last = 0;
  if (!hasTemp || (last != 0 && millis() - last < TEMP_EVERY_MS)) return;
  last = millis();
#if USE_MLX90614
  float c = mlx.readObjectTempC();
#else
  float c = ds18b20.getTempCByIndex(0);
  ds18b20.requestTemperatures();  // ready for the next time
#endif
  // Outside 25-45 °C the cap is not being worn (or the reading is wrong),
  // and the app would refuse the whole packet.
  bodyTempC = (c >= 25 && c <= 45) ? c : NAN;
}

// Battery through two equal resistors: the pin sees half the voltage.
// A Li-ion cell: 3.3 V = empty, 4.2 V = full.
void readBattery() {
  static unsigned long last = 0;
  if (last != 0 && millis() - last < BATTERY_EVERY_MS) return;
  last = millis();
  float volts = analogReadMilliVolts(PIN_BATTERY) * 2 / 1000.0;
  if (volts < 2.5) {  // nothing connected
    batteryPct = -1;
    return;
  }
  int pct = (int)((volts - 3.3) / (4.2 - 3.3) * 100);
  batteryPct = constrain(pct, 0, 100);
}

void readGps() {
  while (gpsSerial.available()) gps.encode(gpsSerial.read());
}

// ---- SOS button -------------------------------------------------------------

void checkSos() {
  static unsigned long pressedAt = 0;
  static bool sent = false;
  if (digitalRead(PIN_SOS) != SOS_PRESSED_LEVEL) {  // let go
    if (pressedAt != 0) digitalWrite(PIN_LED, phoneConnected ? HIGH : LOW);
    pressedAt = 0;
    sent = false;
    return;
  }
  if (pressedAt == 0) pressedAt = millis();
  // Blink fast while held, so the wearer knows it is counting.
  if (!sent) digitalWrite(PIN_LED, (millis() / 100) % 2);
  if (!sent && millis() - pressedAt >= SOS_HOLD_MS) {
    char json[48];
    snprintf(json, sizeof json, "{\"type\":\"sos\",\"holdSeconds\":%lu}",
             SOS_HOLD_MS / 1000);
    send(json);
    sent = true;
    digitalWrite(PIN_LED, phoneConnected ? HIGH : LOW);
  }
}

// ---- The reading ------------------------------------------------------------

// Adds ,"key":value to the packet.
void addField(char* json, size_t size, const char* field) {
  size_t used = strlen(json);
  snprintf(json + used, size - used, "%s%s", used > 1 ? "," : "", field);
}

void sendReading() {
  char json[240] = "{";
  char field[64];

  // The time from the GPS; without it the phone uses its own.
  if (gps.date.isValid() && gps.time.isValid() && gps.date.year() >= 2024 &&
      gps.time.age() < 2000) {
    snprintf(field, sizeof field,
             "\"recordedAt\":\"%04d-%02d-%02dT%02d:%02d:%02dZ\"",
             gps.date.year(), gps.date.month(), gps.date.day(),
             gps.time.hour(), gps.time.minute(), gps.time.second());
    addField(json, sizeof json, field);
  }
  if (!isnan(heartRateBpm)) {
    snprintf(field, sizeof field, "\"heartRateBpm\":%d",
             (int)round(heartRateBpm));
    addField(json, sizeof json, field);
  }
  if (!isnan(bodyTempC)) {
    snprintf(field, sizeof field, "\"bodyTempC\":%.1f", bodyTempC);
    addField(json, sizeof json, field);
  }
  if (hasMotion) {
    moving = biggestShake > MOVING_SHAKE;
    biggestShake = 0;
    snprintf(field, sizeof field, "\"motion\":\"%s\"",
             moving ? "moving" : "stationary");
    addField(json, sizeof json, field);
  }
  if (gps.location.isValid() && gps.location.age() < 10000) {
    snprintf(field, sizeof field, "\"latitude\":%.6f,\"longitude\":%.6f",
             gps.location.lat(), gps.location.lng());
    addField(json, sizeof json, field);
  }
  if (batteryPct >= 0) {
    snprintf(field, sizeof field, "\"batteryPct\":%d", batteryPct);
    addField(json, sizeof json, field);
  }
  addField(json, sizeof json, "\"connection\":\"internet\"");
  strncat(json, "}", sizeof json - strlen(json) - 1);
  send(json);
}

// ---- Setup and loop -----------------------------------------------------------

void setup() {
  Serial.begin(115200);
  // The button module drives OUT itself, so no pull-up is wanted.
  pinMode(PIN_SOS, SOS_MODULE_HIGH_WHEN_PRESSED ? INPUT : INPUT_PULLUP);
  pinMode(PIN_LED, OUTPUT);

  setupSensors();

  BLEDevice::init("CAPartner-" CAP_CODE);
  BLEDevice::setMTU(247);  // one reading fits in one message
  BLEServer* server = BLEDevice::createServer();
  server->setCallbacks(new ServerEvents());
  BLEService* service = server->createService(SERVICE_UUID);
  readings = service->createCharacteristic(
      READINGS_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  readings->addDescriptor(new BLE2902());
  service->start();
  BLEDevice::getAdvertising()->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();
  Serial.println("Waiting for a phone...");
}

void loop() {
  readHeart();
  readMotion();
  readTemperature();
  readBattery();
  readGps();
  checkSos();

  static unsigned long lastSent = 0;
  if (millis() - lastSent >= SEND_EVERY_MS) {
    lastSent = millis();
    sendReading();
  }
}
