/**
 * Smart Campus — Leitor de QR Code para Catraca
 * Hardware: ESP32-WROVER-DEV + câmera OV2640 + servo motor + botão
 *
 * Fluxo:
 *   1. Estudante exibe o QR Code no celular na frente da câmera
 *   2. Pressiona o botão (ou usa trigger automático)
 *   3. ESP32 captura imagem JPEG via OV2640
 *   4. Envia via HTTP multipart/form-data → POST /api/qrcode/scan-image
 *   5. Backend decodifica o QR, valida o token, responde { action: "OPEN" | "DENY" }
 *   6. OPEN  → servo vai para posição ABERTO (3s) e retorna para FECHADO
 *      DENY  → buzzer bipa + LED vermelho pisca
 */

// ══════════════════════════════════════════════════════════════════════════════
//  CONFIGURAÇÕES — edite aqui antes de gravar
// ══════════════════════════════════════════════════════════════════════════════

#define WIFI_SSID      "SEU_WIFI_SSID"
#define WIFI_PASSWORD  "SUA_SENHA_WIFI"
#define SERVER_HOST    "192.168.101.4"   // IP LAN da máquina com o Node.js
#define SERVER_PORT    3100
#define DEVICE_KEY     "esp32-secret-key"  // igual ao ESP32_DEVICE_KEY no .env
#define DEVICE_ID      "catraca-01"

// ── Pinos livres no WROVER-DEV (câmera usa: 4,5,18,19,21-27,34-39) ──────────
#define PIN_BUTTON     14   // Botão de leitura — outro terminal no GND
#define PIN_SERVO      13   // Sinal PWM do servo
#define PIN_LED_OK      2   // LED verde (LED embutido na maioria dos WROVER-DEV)
#define PIN_BUZZER     12   // Buzzer passivo (comente PIN_BUZZER se não usar)

// ── Servo ─────────────────────────────────────────────────────────────────────
#define SERVO_FECHADO   0   // ângulo = portão fechado (graus)
#define SERVO_ABERTO   90   // ângulo = portão aberto  (graus)
#define SERVO_OPEN_MS 3000  // tempo que fica aberto antes de fechar automaticamente

// ── Câmera OV2640 — pinout padrão ESP32-WROVER-DEV ───────────────────────────
#define CAM_PIN_PWDN    -1
#define CAM_PIN_RESET   -1
#define CAM_PIN_XCLK    21
#define CAM_PIN_SIOD    26
#define CAM_PIN_SIOC    27
#define CAM_PIN_D7      35
#define CAM_PIN_D6      34
#define CAM_PIN_D5      39
#define CAM_PIN_D4      36
#define CAM_PIN_D3      19
#define CAM_PIN_D2      18
#define CAM_PIN_D1       5
#define CAM_PIN_D0       4
#define CAM_PIN_VSYNC   25
#define CAM_PIN_HREF    23
#define CAM_PIN_PCLK    22

// ══════════════════════════════════════════════════════════════════════════════

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>   // Biblioteca: "ESP32Servo" by Kevin Harrington

Servo portaoServo;

// ─────────────────────────────────────────────────────────────────────────────
//  CÂMERA
// ─────────────────────────────────────────────────────────────────────────────
bool initCamera() {
  camera_config_t cfg;
  cfg.ledc_channel  = LEDC_CHANNEL_0;
  cfg.ledc_timer    = LEDC_TIMER_0;
  cfg.pin_d0        = CAM_PIN_D0;
  cfg.pin_d1        = CAM_PIN_D1;
  cfg.pin_d2        = CAM_PIN_D2;
  cfg.pin_d3        = CAM_PIN_D3;
  cfg.pin_d4        = CAM_PIN_D4;
  cfg.pin_d5        = CAM_PIN_D5;
  cfg.pin_d6        = CAM_PIN_D6;
  cfg.pin_d7        = CAM_PIN_D7;
  cfg.pin_xclk      = CAM_PIN_XCLK;
  cfg.pin_pclk      = CAM_PIN_PCLK;
  cfg.pin_vsync     = CAM_PIN_VSYNC;
  cfg.pin_href      = CAM_PIN_HREF;
  cfg.pin_sscb_sda  = CAM_PIN_SIOD;
  cfg.pin_sscb_scl  = CAM_PIN_SIOC;
  cfg.pin_pwdn      = CAM_PIN_PWDN;
  cfg.pin_reset     = CAM_PIN_RESET;
  cfg.xclk_freq_hz  = 20000000;
  cfg.pixel_format  = PIXFORMAT_JPEG;

  // WROVER-DEV tem PSRAM de 8 MB — aproveita para alta resolução
  if (psramFound()) {
    cfg.frame_size   = FRAMESIZE_VGA;  // 640×480 — ótimo para leitura de QR
    cfg.jpeg_quality = 10;
    cfg.fb_count     = 2;
    cfg.fb_location  = CAMERA_FB_IN_PSRAM;
    Serial.println("[CAM] PSRAM detectada — usando VGA + duplo buffer.");
  } else {
    cfg.frame_size   = FRAMESIZE_QVGA; // 320×240 — fallback
    cfg.jpeg_quality = 12;
    cfg.fb_count     = 1;
    cfg.fb_location  = CAMERA_FB_IN_DRAM;
    Serial.println("[CAM] Sem PSRAM — usando QVGA.");
  }

  esp_err_t err = esp_camera_init(&cfg);
  if (err != ESP_OK) {
    Serial.printf("[CAM] ERRO ao inicializar: 0x%x\n", err);
    return false;
  }

  // Ajustes do sensor OV2640 para QR em tela de celular
  sensor_t* s = esp_camera_sensor_get();
  if (s) {
    s->set_brightness(s,  1);   // leve aumento de brilho
    s->set_contrast(s,    1);   // mais contraste → QR mais legível
    s->set_saturation(s, -1);   // menos cor → foco em preto/branco
    s->set_sharpness(s,   2);   // mais nitidez
    s->set_whitebal(s,    1);   // auto white-balance
    s->set_awb_gain(s,    1);
    s->set_exposure_ctrl(s, 1); // auto exposição
    s->set_aec2(s,        1);   // AEC DSP
    s->set_gain_ctrl(s,   1);   // auto gain
  }

  Serial.println("[CAM] OV2640 iniciada.");
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HTTP — envia imagem e retorna "OPEN", "DENY" ou "ERROR"
// ─────────────────────────────────────────────────────────────────────────────
String sendImageToBackend(camera_fb_t* fb) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Wi-Fi desconectado.");
    return "ERROR";
  }

  String url = "http://" + String(SERVER_HOST) + ":" + String(SERVER_PORT)
             + "/api/qrcode/scan-image";
  Serial.println("[HTTP] Enviando → " + url);
  Serial.printf("[HTTP] Tamanho da imagem: %d bytes\n", fb->len);

  const String boundary      = "SmartCampusBoundary";
  const String contentType   = "multipart/form-data; boundary=" + boundary;

  // ── Partes do multipart ───────────────────────────────────────────────────
  String partDeviceId =
    "--" + boundary + "\r\n"
    "Content-Disposition: form-data; name=\"deviceId\"\r\n\r\n"
    + String(DEVICE_ID) + "\r\n";

  String partImageHeader =
    "--" + boundary + "\r\n"
    "Content-Disposition: form-data; name=\"image\"; filename=\"qr.jpg\"\r\n"
    "Content-Type: image/jpeg\r\n\r\n";

  String partFooter = "\r\n--" + boundary + "--\r\n";

  size_t totalLen = partDeviceId.length()
                  + partImageHeader.length()
                  + fb->len
                  + partFooter.length();

  // ── Aloca body na PSRAM se disponível, senão na heap normal ───────────────
  uint8_t* body = psramFound()
    ? (uint8_t*)ps_malloc(totalLen)
    : (uint8_t*)malloc(totalLen);

  if (!body) {
    Serial.printf("[HTTP] Sem memória para o body (%d bytes).\n", totalLen);
    return "ERROR";
  }

  size_t off = 0;
  memcpy(body + off, partDeviceId.c_str(),    partDeviceId.length());    off += partDeviceId.length();
  memcpy(body + off, partImageHeader.c_str(), partImageHeader.length()); off += partImageHeader.length();
  memcpy(body + off, fb->buf,                 fb->len);                  off += fb->len;
  memcpy(body + off, partFooter.c_str(),      partFooter.length());

  // ── Envia ─────────────────────────────────────────────────────────────────
  WiFiClient client;
  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type",   contentType);
  http.addHeader("X-Device-Key",   DEVICE_KEY);
  http.setTimeout(10000); // 10s timeout

  int httpCode = http.POST(body, totalLen);
  free(body);

  Serial.printf("[HTTP] Status: %d\n", httpCode);

  String action = "ERROR";

  if (httpCode == 200 || httpCode == 403 || httpCode == 400) {
    String resp = http.getString();
    Serial.println("[HTTP] Resposta: " + resp);

    StaticJsonDocument<512> doc;
    if (!deserializeJson(doc, resp)) {
      action = doc["action"] | "DENY";

      if (action == "OPEN") {
        Serial.printf("[QR] ✅ ACESSO LIBERADO — %s\n",
          doc["student"]["name"] | "Aluno");
      } else {
        Serial.printf("[QR] ❌ ACESSO NEGADO — %s\n",
          doc["reason"] | "Token inválido");
      }
    }
  } else {
    Serial.printf("[HTTP] Erro inesperado: %d\n", httpCode);
  }

  http.end();
  return action;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SERVO — controle do portão
// ─────────────────────────────────────────────────────────────────────────────
void abrirPortao() {
  Serial.println("[SERVO] → ABRINDO");
  portaoServo.write(SERVO_ABERTO);
  digitalWrite(PIN_LED_OK, HIGH);
  delay(SERVO_OPEN_MS);
  portaoServo.write(SERVO_FECHADO);
  digitalWrite(PIN_LED_OK, LOW);
  Serial.println("[SERVO] → FECHADO");
}

void negarAcesso() {
  Serial.println("[SERVO] → NEGADO (servo não movimenta)");
#ifdef PIN_BUZZER
  // Dois bipes curtos
  for (int i = 0; i < 2; i++) {
    tone(PIN_BUZZER, 900, 250);
    delay(350);
  }
  noTone(PIN_BUZZER);
#endif
  // Pisca LED 3× para feedback visual
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_LED_OK, HIGH); delay(120);
    digitalWrite(PIN_LED_OK, LOW);  delay(120);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CICLO: captura → envia → aciona servo
// ─────────────────────────────────────────────────────────────────────────────
void readAndProcess() {
  Serial.println("\n[CICLO] Iniciando leitura...");

  // Descarta 2 frames para estabilizar a auto-exposição do OV2640
  for (int i = 0; i < 2; i++) {
    camera_fb_t* discard = esp_camera_fb_get();
    if (discard) esp_camera_fb_return(discard);
    delay(80);
  }

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[CAM] Falha ao capturar frame.");
    negarAcesso();
    return;
  }

  Serial.printf("[CAM] Frame capturado: %d bytes\n", fb->len);

  String action = sendImageToBackend(fb);
  esp_camera_fb_return(fb); // SEMPRE devolve antes de qualquer delay/ação

  if (action == "OPEN") {
    abrirPortao();
  } else {
    negarAcesso();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SETUP
// ══════════════════════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== Smart Campus — Catraca QR Code ===");
  Serial.println("Board: ESP32-WROVER-DEV | Câmera: OV2640 | Atuador: Servo");

  // ── GPIOs ────────────────────────────────────────────────────────────────
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_LED_OK, OUTPUT);
  digitalWrite(PIN_LED_OK, LOW);

  // Servo começa na posição fechada
  portaoServo.attach(PIN_SERVO, 500, 2400); // pulso mínimo/máximo em µs
  portaoServo.write(SERVO_FECHADO);
  delay(300);

  // ── Câmera ───────────────────────────────────────────────────────────────
  if (!initCamera()) {
    Serial.println("[ERRO FATAL] Câmera não iniciada. Verifique o cabeamento.");
    // Erro fatal: pisca LED infinitamente
    while (true) {
      digitalWrite(PIN_LED_OK, HIGH); delay(150);
      digitalWrite(PIN_LED_OK, LOW);  delay(150);
    }
  }

  // ── Wi-Fi ─────────────────────────────────────────────────────────────────
  Serial.printf("[WIFI] Conectando a '%s'", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 30) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Falha na conexão. Reiniciando em 3s...");
    delay(3000);
    ESP.restart();
  }

  Serial.printf("[WIFI] Conectado! IP: %s\n", WiFi.localIP().toString().c_str());

  // ── Pronto: 2 piscadas no LED ──────────────────────────────────────────────
  for (int i = 0; i < 2; i++) {
    digitalWrite(PIN_LED_OK, HIGH); delay(200);
    digitalWrite(PIN_LED_OK, LOW);  delay(200);
  }

  Serial.println("[PRONTO] Aguardando leitura de QR Code...\n");
}

// ══════════════════════════════════════════════════════════════════════════════
//  LOOP
// ══════════════════════════════════════════════════════════════════════════════
static unsigned long ultimoTrigger = 0;
#define DEBOUNCE_MS 2500  // intervalo mínimo entre leituras (ms)

void loop() {
  // Reconecta automaticamente se Wi-Fi cair
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Reconectando...");
    WiFi.reconnect();
    delay(3000);
    return;
  }

  unsigned long agora = millis();

  // ── TRIGGER POR BOTÃO ──────────────────────────────────────────────────────
  // Botão pressionado = LOW (pull-up interno)
  if (digitalRead(PIN_BUTTON) == LOW && (agora - ultimoTrigger > DEBOUNCE_MS)) {
    ultimoTrigger = agora;
    readAndProcess();
  }

  // ── (OPCIONAL) TRIGGER AUTOMÁTICO ─────────────────────────────────────────
  // Descomente para capturar a cada 4 segundos sem botão físico:
  /*
  static unsigned long ultimoAuto = 0;
  if (agora - ultimoAuto > 4000) {
    ultimoAuto = agora;
    readAndProcess();
  }
  */

  delay(50);
}
