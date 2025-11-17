#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include "DHT.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

using namespace websockets;

// WiFi
const char* ssid = "OPPO A53";
const char* password = "123456789";

// WebSocket server
const char* serverUrl = "ws://10.40.190.232:8080";

WebsocketsClient client;

// Servo & Rain Sensor
#define RAIN_SENSOR_PIN 33
#define ROOF_SERVO_PIN 14
#define DOOR_SERVO_PIN 2   // Chân D2 trên ESP32
#define GAS_SENSOR 34    // MQ-2 analog output
#define BUZZER_PIN 26    // Buzzer pin
#define LED_PIN 27       // LED pin
#define PIR_PIN 25  // Chân OUT của cảm biến chuyển động


#define DHTPIN 15       // chân DATA nối vào ESP32
#define DHTTYPE DHT11   // đổi thành DHT11 nếu bạn dùng DHT11

#define BUZZER_PIN_CAM 12

#define SDA_PIN 21
#define SCL_PIN 22

DHT dht(DHTPIN, DHTTYPE);
Servo roofServo;
Servo doorServo;


LiquidCrystal_I2C lcd(0x27, 16, 2);
int motionState = LOW; 
int val = 0; 
int rainValue= 0;
int gasValue = 0;
float h = 0;
float t = 0;

int ROOF_OPEN_CORNER = 110;
int ROOF_CLOSE_CORNER = 20;
int DOOR_OPEN_CORNER = 180;
int DOOR_CLOSE_CORNER = 100;
int RAIN_THRESHOLD = 2000;
int GAS_THRESHOLD = 200;

unsigned long lastSendTime = 0;
unsigned long lastDHTTime = 0;
unsigned long lastLCDTime = 0;
unsigned long lastGasTime = 0;

unsigned long sendInterval = 500;     // 0.5s gửi dữ liệu
unsigned long dhtInterval  = 2000;    // 2s đọc DHT
unsigned long lcdInterval  = 2000;    // 2s update LCD
unsigned long gasInterval  = 500;     // 0.5s đọc gas

unsigned long lastMotionTime = 0;
const unsigned long motionHoldTime = 2000;

bool autoRoof = true;
bool autoDoor = true;
bool autoGasBuzzer = true;
bool autoPIR = true;

bool gasBuzzer = false;
bool ledPIR = false;
bool roofOpen = false;
bool doorOpen= false;

void setup() {
  Serial.begin(115200);

  // Kết nối WiFi
  WiFi.begin(ssid, password);
  Serial.print("Đang kết nối WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Đã kết nối WiFi!");

  // Khởi tạo Servo
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);

  roofServo.setPeriodHertz(50);
  roofServo.attach(ROOF_SERVO_PIN, 500, 2400);
  roofServo.write(0);

  doorServo.setPeriodHertz(50);
  doorServo.attach(DOOR_SERVO_PIN, 500, 2400);
  doorServo.write(180);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  pinMode(BUZZER_PIN_CAM, OUTPUT);
  digitalWrite(BUZZER_PIN_CAM, LOW);

  digitalWrite(LED_PIN, LOW);

  pinMode(PIR_PIN, INPUT);
  dht.begin();

  Wire.begin(SDA_PIN, SCL_PIN);

  lcd.init();
  lcd.backlight();
  // Kết nối WebSocket
  connectServer();
}

void connectServer() {
  client.onMessage([](WebsocketsMessage message) {
    Serial.println(message.data());

    StaticJsonDocument<200> doc;
    deserializeJson(doc, message.data());
    const char* type = doc["type"];

    if (type && strcmp(type, "doorOpen") == 0) {
      int pos = doc["position"];
      doorServo.write(pos);
    }

    // Loại lệnh mái che mưa vẫn giữ như cũ
    if (type && strcmp(type, "roofOpen") == 0) {
      int pos = doc["position"];
      roofServo.write(pos);
    }

    if (type && strcmp(type, "gasBuzzer") == 0) {
      gasBuzzer = doc["value"];
      digitalWrite(BUZZER_PIN, gasBuzzer ? HIGH : LOW);
      Serial.print("Còi GAS: ");
      Serial.println(gasBuzzer ? "BẬT" : "TẮT");
    }

    if (type && strcmp(type, "ledPIR") == 0) {
      ledPIR = doc["value"];
      digitalWrite(LED_PIN, ledPIR ? HIGH : LOW);
      Serial.print("Led cầu thang: ");
      Serial.println(ledPIR ? "BẬT" : "TẮT");
    }

    if (type && strcmp(type, "mode") == 0) {
      const char* module = doc["module"];
      bool autoMode = doc["auto"];

      if (strcmp(module, "roof") == 0) autoRoof = autoMode;
      if (strcmp(module, "door") == 0) autoDoor = autoMode;
      if (strcmp(module, "gas") == 0) autoGasBuzzer = autoMode;
      if (strcmp(module, "pir") == 0) autoPIR = autoMode;

      Serial.print("Chế độ ");
      Serial.print(module);
      Serial.print(": ");
      Serial.println(autoMode ? "AUTO" : "MANUAL");
    }

    if (type && strcmp(type, "config") == 0) {
      if (doc.containsKey("DOOR_CLOSE_CORNER")) DOOR_CLOSE_CORNER = doc["DOOR_CLOSE_CORNER"];
      if (doc.containsKey("DOOR_OPEN_CORNER")) DOOR_OPEN_CORNER = doc["DOOR_OPEN_CORNER"];
      if (doc.containsKey("ROOF_CLOSE_CORNER")) ROOF_CLOSE_CORNER = doc["ROOF_CLOSE_CORNER"];
      if (doc.containsKey("ROOF_OPEN_CORNER")) ROOF_OPEN_CORNER = doc["ROOF_OPEN_CORNER"];
      if (doc.containsKey("GAS_THRESHOLD")) GAS_THRESHOLD = doc["GAS_THRESHOLD"];
      if (doc.containsKey("RAIN_THRESHOLD")) RAIN_THRESHOLD = doc["RAIN_THRESHOLD"];

      if (doc.containsKey("sendInterval")) sendInterval = doc["sendInterval"];
      if (doc.containsKey("dhtInterval")) dhtInterval = doc["dhtInterval"];
      if (doc.containsKey("lcdInterval")) lcdInterval = doc["lcdInterval"];
      if (doc.containsKey("gasInterval")) gasInterval = doc["gasInterval"];

      Serial.println("Cập nhật Config:");
      Serial.print("DOOR_CLOSE_CORNER: "); Serial.println(DOOR_CLOSE_CORNER);
      Serial.print("DOOR_OPEN_CORNER: "); Serial.println(DOOR_OPEN_CORNER);
      Serial.print("ROOF_CLOSE_CORNER: "); Serial.println(ROOF_CLOSE_CORNER);
      Serial.print("ROOF_OPEN_CORNER: "); Serial.println(ROOF_OPEN_CORNER);
    }
  });

  while(!client.connect(serverUrl)) {
    Serial.println("Kết nối server thất bại, thử lại...");
    delay(1000);
  }
  Serial.println("Đã kết nối server!");
}

void gasModule(){
  gasValue = analogRead(GAS_SENSOR);
  Serial.print("Giá trị khí gas: ");
  Serial.println(gasValue);

  if(autoGasBuzzer){
    if (gasValue > GAS_THRESHOLD) {
      digitalWrite(BUZZER_PIN, HIGH);
      gasBuzzer = true;
      Serial.println("⚠️ CẢNH BÁO: PHÁT HIỆN KHÍ GAS!");
    } else {
      digitalWrite(BUZZER_PIN, LOW);
      gasBuzzer = false;
    }
  }
  else{
    digitalWrite(BUZZER_PIN, gasBuzzer ? HIGH : LOW);
  }
}

void CamModule(int num){
  if (num%2==0) {
    digitalWrite(BUZZER_PIN_CAM, HIGH);
  } else {
    digitalWrite(BUZZER_PIN_CAM, LOW);
  }

}

void PIRModule() {
  val = digitalRead(PIR_PIN);

  if(autoPIR){
    if (val == HIGH) {
      // phát hiện chuyển động
      digitalWrite(LED_PIN, HIGH);
      lastMotionTime = millis();  // reset thời gian giữ LED
      if (motionState == LOW) {
        Serial.println("🚨 PHÁT HIỆN CHUYỂN ĐỘNG!");
        motionState = HIGH;
      }
    }

    // Nếu không còn chuyển động, nhưng chưa hết thời gian giữ LED
    if (motionState == HIGH && millis() - lastMotionTime > motionHoldTime) {
      digitalWrite(LED_PIN, LOW);
      Serial.println("✅ Không còn chuyển động.");
      motionState = LOW;
    }
  }
  else{
    digitalWrite(LED_PIN, ledPIR ? HIGH : LOW);
  }
  
}

void DHTModule(){
  h = dht.readHumidity();
  t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("❌ Lỗi đọc cảm biến!");
    return;
  }

  Serial.print("Nhiệt độ: ");
  Serial.print(t);
  Serial.println("°C");

  Serial.print("Độ ẩm: ");
  Serial.print(h);
  Serial.println("%");
}

void LCDModule(){
  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Nhiet do: ");
  lcd.print(t);
  lcd.print((char)223); // Ký hiệu độ
  lcd.print("C");

  // ----- Dòng 2: ĐỘ ẨM -----
  lcd.setCursor(0, 1);
  lcd.print("Do am: ");
  lcd.print(h);
  lcd.print("%");
}

void RoofModule(){
  rainValue = analogRead(RAIN_SENSOR_PIN);

  if (autoRoof) {
    if (rainValue < RAIN_THRESHOLD) roofServo.write(ROOF_OPEN_CORNER);
    else roofServo.write(ROOF_CLOSE_CORNER);
  }
  else{
    roofServo.write(roofOpen ? ROOF_OPEN_CORNER : ROOF_CLOSE_CORNER);
  }
  // nếu manual → servo được điều khiển bởi server
}

void loop() {
  client.poll();
  unsigned long now = millis();

  if (now - lastDHTTime >= dhtInterval) {
    lastDHTTime = now;
    DHTModule();
  }

  if (now - lastGasTime >= gasInterval) {
    lastGasTime = now;
    gasModule();
  }

  if (now - lastLCDTime >= lcdInterval) {
    lastLCDTime = now;
    LCDModule();
  }

  PIRModule();
  RoofModule();

  if (now - lastSendTime >= sendInterval) {
    lastSendTime = now;

   String payload = 
                  "{\"rainValue\":" + String(rainValue) + 
                  ",\"humidity\":" + String(h) + 
                  ",\"temperature\":" + String(t) + 
                  ",\"gas\":" + String(gasValue) +

                  ",\"gasBuzzer\":" + String(gasBuzzer) +
                  ",\"ledPIR\":" + String(ledPIR) +
                  ",\"roofOpen\":" + String(roofOpen) +
                  ",\"doorOpen\":" + String(doorOpen) +
                  
                  ",\"autoRoof\":" + String(autoRoof) +
                  ",\"autoDoor\":" + String(autoDoor) +
                  ",\"autoGas\":" + String(autoGasBuzzer) +
                  ",\"autoPIR\":" + String(autoPIR) +
                  "}";

    client.send(payload);
    Serial.println(payload);
  }
}
