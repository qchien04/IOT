#include <Stepper.h>

// ====== Cấu hình cảm biến nước ======
#define WATER_SENSOR_PIN 32   // D32 (GPIO32)
#define WATER_THRESHOLD 1000  // Ngưỡng phát hiện nước (chỉnh theo thực tế)

// ====== Cấu hình động cơ bước 28BYJ-48 ======
#define STEPS_PER_REV 2048    // 1 vòng = 2048 bước
Stepper motor(STEPS_PER_REV, 14, 12, 13, 15); // IN1, IN2, IN3, IN4

// ====== Cài đặt ban đầu ======
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("=== He thong cam bien nuoc + dong co buoc (ULN2003) ===");

  // Cấu hình ADC của ESP32
  analogSetPinAttenuation(WATER_SENSOR_PIN, ADC_11db);

  // Cấu hình tốc độ quay (RPM)
  motor.setSpeed(10);  // 10 vòng/phút = chậm, dễ quan sát
}

// ====== Vòng lặp chính ======
void loop() {
  int waterValue = analogRead(WATER_SENSOR_PIN);

  Serial.print("Gia tri cam bien: ");
  Serial.println(waterValue);

  if (waterValue > WATER_THRESHOLD) {
    Serial.println("💧 Phat hien nuoc! Quay dong co 4 vong...");
    motor.step(4 * STEPS_PER_REV);  // Quay 4 vòng thuận
    delay(1000);                    // Nghỉ 1 giây
  } else {
    Serial.println("😶 Khong co nuoc.");
  }

  delay(1000);
}
