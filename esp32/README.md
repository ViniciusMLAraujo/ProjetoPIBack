# ESP32 — Smart Campus Catraca

## Hardware

| Componente | Modelo |
|---|---|
| Microcontrolador | ESP32-WROVER-DEV |
| Câmera | OV2640 (conector FPC 24 pinos) |
| Atuador | Servo motor (SG90 / MG996R) |
| Botão | Pushbutton momentâneo (NO) |
| LED | LED embutido na placa (GPIO 2) |
| Buzzer | Buzzer passivo 3.3V/5V (opcional) |
| Fonte | 5V 2A (servo + câmera exigem corrente suficiente) |

---

## Esquema de ligação

```
ESP32-WROVER-DEV
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Câmera OV2640 ──── conector FPC 24 pinos da placa  │
│  (pinos de câmera já mapeados no firmware)           │
│                                                      │
│  GPIO 13 ──── Servo (fio amarelo/laranja = sinal)   │
│  3.3V    ──── Servo (fio vermelho = VCC)  *          │
│  GND     ──── Servo (fio marrom/preto = GND)         │
│                                                      │
│  GPIO 14 ──── Botão ──── GND  (pull-up interno)     │
│  GPIO  2 ──── LED verde (embutido na placa)          │
│  GPIO 12 ──── Buzzer + ──── GND                     │
│  GND     ──── GND comum de todos os componentes      │
│                                                      │
└──────────────────────────────────────────────────────┘

* SG90 funciona em 3.3V. MG996R (maior torque) requer 5V externo —
  use fonte separada e compartilhe apenas o GND com o ESP32.
```

---

## Pinos usados pela câmera OV2640 no WROVER-DEV

Os pinos abaixo são **reservados pela câmera** — não os use para outros fins:

| Função | GPIO |
|---|---|
| XCLK | 21 |
| SIOD (SDA) | 26 |
| SIOC (SCL) | 27 |
| D0–D7 | 4, 5, 18, 19, 34, 35, 36, 39 |
| VSYNC | 25 |
| HREF | 23 |
| PCLK | 22 |

**GPIOs livres disponíveis:** 0, 2, 12, 13, 14, 15, 32, 33

---

## Configuração do Arduino IDE

### 1. Instalar suporte ao ESP32

**File → Preferences → Additional Boards Manager URLs:**
```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

**Tools → Board → Boards Manager:** instale `esp32 by Espressif Systems` (versão **2.x**)

### 2. Selecionar a placa

```
Tools → Board          → ESP32 Arduino → ESP32 Wrover Module
Tools → Port           → (porta COM da sua placa)
Tools → Upload Speed   → 921600
Tools → Flash Mode     → QIO
Tools → Flash Size     → 4MB (32Mb)
Tools → Partition Scheme → Huge APP (3MB No OTA/1MB SPIFFS)
Tools → PSRAM          → Enabled   ← IMPORTANTE para câmera
```

### 3. Instalar bibliotecas

No **Library Manager** (`Ctrl+Shift+I`):

| Biblioteca | Autor | Versão |
|---|---|---|
| `ArduinoJson` | Benoit Blanchon | 6.x |
| `ESP32Servo` | Kevin Harrington | qualquer |

> `WiFi`, `HTTPClient` e `esp_camera` já vêm com o pacote ESP32.

---

## Variáveis para configurar no `.ino`

```cpp
#define WIFI_SSID      "SEU_WIFI_SSID"       // Nome da rede Wi-Fi
#define WIFI_PASSWORD  "SUA_SENHA_WIFI"      // Senha do Wi-Fi
#define SERVER_HOST    "192.168.101.4"       // IP da máquina com o backend Node.js
#define SERVER_PORT    3100
#define DEVICE_KEY     "esp32-secret-key"   // igual ao ESP32_DEVICE_KEY no .env do backend
#define DEVICE_ID      "catraca-01"         // identificador desta catraca

#define SERVO_FECHADO  0    // ângulo do servo na posição fechada (graus)
#define SERVO_ABERTO   90   // ângulo do servo na posição aberta  (graus)
#define SERVO_OPEN_MS  3000 // ms que a catraca fica aberta antes de fechar
```

---

## Fluxo de comunicação

```
Estudante exibe QR no celular
         │
         ▼
  Pressiona botão físico
         │
         ▼
  OV2640 captura JPEG (640×480)
  2 frames descartados p/ estabilizar exposição
         │
         ▼
  POST http://<SERVER_HOST>:3100/api/qrcode/scan-image
  Header: X-Device-Key: esp32-secret-key
  Body (multipart/form-data):
    ├── deviceId = "catraca-01"
    └── image    = <JPEG binário>
         │
         ▼
  Backend (Node.js):
    decodifica QR da imagem (jimp + jsQR)
    valida token no PostgreSQL
         │
    ┌────┴────────────┐
    ▼                 ▼
{ action: "OPEN" }  { action: "DENY" }
    │                 │
    ▼                 ▼
Servo → 90°        Servo permanece em 0°
LED acende         Buzzer: 2 bipes
Aguarda 3s         LED pisca 3×
Servo → 0°
```

---

## Testando sem ESP32 (curl)

Simula o envio da imagem como se fosse o ESP32:

```bash
# Gere um QR Code de teste primeiro (pegue o token do banco ou do app)
# Depois salve a imagem do QR e envie:

curl -X POST http://192.168.101.4:3100/api/qrcode/scan-image \
  -H "X-Device-Key: esp32-secret-key" \
  -F "deviceId=catraca-teste" \
  -F "image=@./qrcode.jpg"
```

**Resposta OPEN:**
```json
{
  "valid": true,
  "action": "OPEN",
  "student": { "name": "João Silva", "enrollment": "2024001" },
  "schedule": { "course": "Eng. de Software", "room": "Sala 101" },
  "deviceId": "catraca-teste"
}
```

**Resposta DENY:**
```json
{
  "valid": false,
  "action": "DENY",
  "reason": "Token expirado",
  "deviceId": "catraca-teste"
}
```

---

## Monitor Serial esperado (115200 baud)

```
=== Smart Campus — Catraca QR Code ===
Board: ESP32-WROVER-DEV | Câmera: OV2640 | Atuador: Servo
[CAM] PSRAM detectada — usando VGA + duplo buffer.
[CAM] OV2640 iniciada.
[WIFI] Conectando a 'MinhaRede'..........
[WIFI] Conectado! IP: 192.168.101.45
[PRONTO] Aguardando leitura de QR Code...

[CICLO] Iniciando leitura...
[CAM] Frame capturado: 28432 bytes
[HTTP] Enviando → http://192.168.101.4:3100/api/qrcode/scan-image
[HTTP] Status: 200
[HTTP] Resposta: {"valid":true,"action":"OPEN","student":{"name":"João Silva"},...}
[QR] ✅ ACESSO LIBERADO — João Silva
[SERVO] → ABRINDO
[SERVO] → FECHADO
```
