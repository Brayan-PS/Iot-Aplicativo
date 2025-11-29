#define BLYNK_TEMPLATE_ID "TMPL2SXM5tLXD"
#define BLYNK_TEMPLATE_NAME "esp32 iot"
#define BLYNK_AUTH_TOKEN "4COs1e8eUtphD7jERdWkqrILDEyDf7NC"
#include <HTTPClient.h>
#include <WiFi.h>
#include <Wire.h>
#include <RTClib.h>
#include "DHT.h"
#include "time.h"
#include <BlynkSimpleEsp32.h>
char auth[] = "4COs1e8eUtphD7jERdWkqrILDEyDf7NC";

// --- Pines ---
#define DHTPIN 4
#define DHTTYPE DHT11
#define MQ135_PIN 34   // Aout MQ135 conectado al GPIO34

// --- Objetos ---
DHT dht(DHTPIN, DHTTYPE);
RTC_DS3231 rtc;

// --- WiFi / NTP ---
const char* ssid     = "Galaxy";
const char* password = "star5544";
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = -18000; // UTC-5
const int   daylightOffset_sec = 0;


// --- Constantes MQ135 ---
float RLOAD = 1000.0;   // RL medido (ohm)
float R0 = 4721.0;      // valor inicial (se recalibra si AUTOCALIBRATE_AT_START)

// Parámetros curvas 
struct GasCurve {
  float m;
  float b;
  float r0_factor; // valor Rs/R0 típico en aire limpio
};

GasCurve gases[] = {
  {-0.42, 1.92, 3.7},   // CO2
  {-0.45, 1.40, 3.7},   // NH3
  {-0.48, 1.30, 3.7},   // NOx
  {-0.38, 1.50, 3.7},   // Alcohol
  {-0.36, 1.62, 3.7},   // Benceno
  {-0.40, 1.70, 3.7}    // Humo
};

const char* gasNames[] = {"CO2", "NH3", "NOx", "Alcohol", "Benceno", "Humo"};

// --- Ajustes ---
const bool AUTOCALIBRATE_AT_START = true;
const int CALIB_SAMPLES = 300;

// --- WiFi helpers ---
void conectarWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("WiFi:");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis()-start < 20000) {
    Serial.print(".");
    delay(250);
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " OK" : " TIMEOUT");
}


bool syncTimeAndRTC() {
  if (WiFi.status() != WL_CONNECTED) conectarWiFi();
  if (WiFi.status() != WL_CONNECTED) return false;
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  struct tm ti;
  if (!getLocalTime(&ti)) return false;
  rtc.adjust(DateTime(ti.tm_year+1900, ti.tm_mon+1, ti.tm_mday, ti.tm_hour, ti.tm_min, ti.tm_sec));
  return true;
}

// --- Lectura MQ135 ---
float leerADCprom(int muestras) {
  long s = 0;
  for (int i=0;i<muestras;i++){
    s += analogRead(MQ135_PIN);
    delay(8);
  }
  return (float)s / (float)muestras;
}

void calibrarR0() {
  Serial.println("=== Calibrando R0 en aire limpio ===");
  float adcAvg = leerADCprom(CALIB_SAMPLES);
  float vout = adcAvg * (3.3 / 4095.0);
  if (vout < 0.001) vout = 0.001;
  float Rs_air = ((4.8 - vout) / vout) * RLOAD;
  const float RS_R0_AIR = 3.7;
  R0 = Rs_air / RS_R0_AIR;
  Serial.printf("ADCavg=%.1f Vout=%.3f Rs_air=%.1f R0=%.1f\n", adcAvg, vout, Rs_air, R0);
}

float aplicarCorreccion(float valor, float temp, float hum) {
  float factor = 1.0;
  if (hum > 75) factor *= 0.95;
  else if (hum > 65) factor *= 0.97;
  else if (hum < 30) factor *= 1.05;
  if (temp < 15) factor *= 0.95;
  else if (temp > 30) factor *= 0.97;
  return valor * factor;
}

float calcularPPM(float ratio, GasCurve curve) {
  return pow(10.0, (log10(ratio) - curve.b) / curve.m);
}

String clasificarCalidad(float ppm, int gasIndex) {
  if (gasIndex == 0) { // CO2
    if (ppm < 800) return "Bueno";
    if (ppm < 1200) return "Aceptable";
    return "Peligroso";
  }
  return "N/A"; // otros gases: sin tablas definidas
}

float co2_corr = 0;
float nh3_corr = 0;
float nox_corr = 0;
float alcohol_corr = 0;
float benceno_corr = 0;
float humo_corr = 0;

void setup() {
  Serial.begin(115200);
  delay(200);
  Wire.begin();
  dht.begin();

  conectarWiFi();
  Blynk.begin(auth, ssid, password);
  if (!rtc.begin()) { Serial.println("RTC no detectado"); while(1) delay(1000); }
  if (!syncTimeAndRTC()) Serial.println(" No se sincronizó NTP");

  if (AUTOCALIBRATE_AT_START) calibrarR0();
  else Serial.printf("Usando R0 fijo=%.1f\n", R0);

  Serial.println("Inicio completo.");
}

void enviarGoogleSheets(float temp, float hum, float co2, float nh3, float nox, float alcohol, float benceno, float humo_val) {
  if (WiFi.status() == WL_CONNECTED) {

    String url = "https://script.google.com/macros/s/AKfycbytz7qaDsOwCPay4qzhYwbbN5R0X_2pUxTwihbe4Xav5gJ80JjwHQb1WZEF52YOYxGSMQ/exec";

    url += "?temp=" + String(temp);
    url += "&hum=" + String(hum);
    url += "&co2=" + String(co2);
    url += "&nh3=" + String(nh3);
    url += "&nox=" + String(nox);
    url += "&alcohol=" + String(alcohol);
    url += "&benceno=" + String(benceno);
    url += "&humo=" + String(humo_val);

    HTTPClient http;
    http.begin(url);
    http.GET();
    http.end();
  }
}




void loop() {
  Blynk.run();
  DateTime now = rtc.now();

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();


  float adcAvg = leerADCprom(50);
  float vout = adcAvg * (3.3 / 4095.0);
  if (vout < 0.001) vout = 0.001;
  float Rs = ((4.8 - vout) / vout) * RLOAD;
  float ratio = Rs / R0;

  Serial.printf("[%02d/%02d/%04d %02d:%02d:%02d]\n",
                now.day(), now.month(), now.year(),
                now.hour(), now.minute(), now.second());

for (int i = 0; i < 6; i++) {

    float raw = calcularPPM(ratio, gases[i]);
    float corr = aplicarCorreccion(raw, temp, hum);

    // Guardar los valores corregidos en sus variables
    if (i == 0) { 
      if (corr < 350) corr = 350; 
      co2_corr = corr; 
    }
    else if (i == 1) nh3_corr = corr;
    else if (i == 2) nox_corr = corr;
    else if (i == 3) alcohol_corr = corr;
    else if (i == 4) benceno_corr = corr;
    else if (i == 5) humo_corr = corr;

    Serial.printf("%s: %.1f ppm", gasNames[i], corr);
    if (i == 0) Serial.printf(" (%s)", clasificarCalidad(corr, i).c_str());
    Serial.print(" | ");
}

  Serial.printf("\nTemp: %.2f °C | Hum: %.2f %%\n", temp, hum);
  Serial.println("--------------------------------------");
  
  Blynk.virtualWrite(V1, temp);
  Blynk.virtualWrite(V2, hum);
  Blynk.virtualWrite(V3, co2_corr); // ejemplo: CO2
  enviarGoogleSheets(temp, hum, co2_corr, nh3_corr, nox_corr, alcohol_corr, benceno_corr, humo_corr);

  delay(2000);
}
