#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
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
#define DOOR_SERVO_PIN 2  // Chân D2 trên ESP32
#define FAN_PIN 4
#define GAS_SENSOR 34  // MQ-2 analog output
#define BUZZER_PIN 26  // Buzzer pin
#define LED_PIN 27     // LED pin
#define PIR_PIN 25     // Chân OUT của cảm biến chuyển động

#define DOOR_OPEN_CORNER 180
#define DOOR_CLOSE_CORNER 100

Servo roofServo;
Servo doorServo;
bool fanState = false;
int gasValue = 0;
int threshold = 2000;

int motionState = LOW;
int val = 0;

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

  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  pinMode(PIR_PIN, INPUT);

  // Kết nối WebSocket
  connectServer();
}

void connectServer() {
  client.onMessage([](WebsocketsMessage message) {
    Serial.println(message.data());

    StaticJsonDocument<200> doc;
    deserializeJson(doc, message.data());
    const char* type = doc["type"];

    if (type && strcmp(type, "door") == 0) {
      int pos = doc["position"];
      doorServo.write(pos);
    }

    // Điều khiển quạt
    if (type && strcmp(type, "fan") == 0) {
      bool value = doc["value"];
      fanState = value;
      digitalWrite(FAN_PIN, fanState ? HIGH : LOW);
      Serial.print("Quạt: ");
      Serial.println(fanState ? "BẬT" : "TẮT");
    }

    // Loại lệnh mái che mưa vẫn giữ như cũ
    if (type && strcmp(type, "servo") == 0) {
      int pos = doc["position"];
      roofServo.write(pos);
    }
  });

  while (!client.connect(serverUrl)) {
    Serial.println("Kết nối server thất bại, thử lại...");
    delay(1000);
  }
  Serial.println("Đã kết nối server!");
}

void gasModule() {
  gasValue = analogRead(GAS_SENSOR);
  Serial.print("Giá trị khí gas: ");
  Serial.println(gasValue);

  if (gasValue > threshold) {
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println("⚠️ CẢNH BÁO: PHÁT HIỆN KHÍ GAS!");
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void PIRModule() {
  val = digitalRead(PIR_PIN);  // Đọc giá trị cảm biến (HIGH = phát hiện)

  if (val == HIGH) {
    if (motionState == LOW) {
      Serial.println("🚨 PHÁT HIỆN CHUYỂN ĐỘNG!");
      digitalWrite(LED_PIN, HIGH);
      motionState = HIGH;
    }
  } else {
    if (motionState == HIGH) {
      Serial.println("✅ Không còn chuyển động.");
      digitalWrite(LED_PIN, LOW);
      motionState = LOW;
    }
  }
}

void loop() {
  client.poll();  // Giữ kết nối WebSocket

  // Đọc cảm biến mưa
  int rainValue = analogRead(RAIN_SENSOR_PIN);

  // Điều khiển servo mái che mưa
  if (rainValue < 1500) roofServo.write(110);  // Có mưa
  else roofServo.write(20);                    // Không mưa

  // Gửi dữ liệu mưa lên server
  if (client.available()) {
    String payload = "{\"rainValue\":" + String(rainValue) + ",\"gas\":" + String(gasValue) + "}";
    client.send(payload);
    Serial.print(payload );
  }
  digitalWrite(FAN_PIN, HIGH);
  PIRModule();
  gasModule();
  delay(2000);
}
