# 📡 Firmware ESP32 - Nodo de Sensores IoT

Este directorio contiene el código fuente en **C++ (PlatformIO / Arduino IDE)** cargado en el microcontrolador ESP32. Su función es adquirir datos de los sensores físicos, procesarlos y enviarlos a la nube.

## 📋 Descripción Técnica
El firmware gestiona la lectura de calidad del aire y variables ambientales. Realiza una **calibración automática** del sensor MQ-135 al inicio y aplica **factores de corrección** basados en la temperatura y humedad actuales para obtener mediciones de gases más precisas (PPM).

Los datos recolectados se transmiten simultáneamente a:
1.  **Blynk:** Para visualización rápida en tiempo real.
2.  **Google Sheets:** Para registro histórico y activación del sistema de alertas (backend).

## ⚡ Hardware Utilizado
* **Microcontrolador:** ESP32 Dev Kit V1.
* **Sensor de Gases:** MQ-135 (Analógico).
* **Sensor Ambiental:** DHT11 (Temperatura y Humedad).
* **Reloj en Tiempo Real:** RTC DS3231 (I2C) para mantener la hora exacta.

## 🔌 Diagrama de Conexiones (Pinout)

| Componente | Pin Sensor | Pin ESP32 (GPIO) | Notas |
| :--- | :--- | :--- | :--- |
| **MQ-135** | A0 (Analog) | **GPIO 34** | Entrada analógica (ADC) |
| **DHT11** | DATA | **GPIO 4** | Sensor digital |
| **DS3231** | SDA | **GPIO 21** | Comunicación I2C |
| **DS3231** | SCL | **GPIO 22** | Comunicación I2C |

## 📚 Librerías Requeridas
Para compilar este código en Arduino IDE, necesitas instalar las siguientes librerías desde el **Gestor de Librerías**:

1.  `DHT sensor library` (por Adafruit).
2.  `RTClib` (por Adafruit).
3.  `Blynk` (por Volodymyr Shymanskyy).
4.  `Adafruit Unified Sensor`.
5.  *Las librerías `WiFi.h`, `HTTPClient.h` y `Wire.h` vienen instaladas por defecto en el núcleo ESP32.*

## 📚 Dependencias y Librerías

Para compilar este proyecto, necesitas instalar las siguientes librerías en tu entorno de desarrollo (Arduino IDE o PlatformIO).

### 1. Librerías Externas (Requieren Instalación)
Debes instalarlas desde el **Gestor de Librerías** (*Programa > Incluir Librería > Administrar Bibliotecas*):

| Librería | Autor Recomendado | Descripción |
| :--- | :--- | :--- |
| **Blynk** | *Volodymyr Shymanskyy* | Permite la conexión con la app móvil de Blynk (`BlynkSimpleEsp32.h`). |
| **DHT sensor library** | *Adafruit* | Para leer el sensor de temperatura y humedad (`DHT.h`). |
| **Adafruit Unified Sensor**| *Adafruit* | **Requisito obligatorio** para que funcione la librería DHT. |
| **RTClib** | *Adafruit* | Para manejar el módulo de reloj en tiempo real DS3231 (`RTClib.h`). |

### 2. Librerías Nativas (Vienen con el Core ESP32)
Estas librerías **NO necesitan instalación**, ya están incluidas al seleccionar la tarjeta ESP32:

* `<WiFi.h>`: Gestión de conexión inalámbrica.
* `<HTTPClient.h>`: Para realizar peticiones GET a Google Sheets.
* `<Wire.h>`: Protocolo I2C (para el reloj RTC).
* `<time.h>`: Funciones de tiempo estándar.

---

### 🔧 Cómo instalar las librerías en Arduino IDE
1.  Abre Arduino IDE.
2.  Ve al menú **Herramientas** (Tools) > **Administrar Bibliotecas** (Manage Libraries).
3.  Escribe el nombre de la librería (ej: *Blynk*) en la barra de búsqueda.
4.  Haz clic en **Instalar** (selecciona la última versión disponible).