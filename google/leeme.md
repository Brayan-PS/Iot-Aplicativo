# ☁️ Backend IoT - Receptor de Datos (Google Apps Script)

Este directorio contiene el script del lado del servidor (Serverless) alojado en **Google Apps Script**. Su función principal es actuar como una **API Web** que recibe las mediciones enviadas por el hardware (ESP32/Arduino) y las almacena automáticamente en **Google Sheets**.

## 📋 Funcionalidad del Script (`doGet`)

El script utiliza la función `doGet(e)` para procesar peticiones **HTTP GET**. Cuando el microcontrolador accede a la URL del script con parámetros, el código:

1.  **Conecta** con la Hoja de Cálculo específica mediante su ID.
2.  **Selecciona** la hoja de trabajo llamada `"hoja"`.
3.  **Extrae** los valores enviados en la URL (temperatura, humedad, gases, etc.).
4.  **Inserta** una nueva fila con la fecha/hora actual (`new Date()`) y todos los valores recibidos.
5.  **Responde** con un mensaje `"OK"` para confirmar al ESP32 que los datos se guardaron.

## 🔗 Parámetros de la API
El script espera recibir los siguientes parámetros en la URL (Query Parameters):

| Parámetro | Descripción | Unidad |
| :--- | :--- | :--- |
| `temp` | Temperatura ambiente | °C |
| `hum` | Humedad relativa | % |
| `co2` | Dióxido de Carbono | PPM |
| `nh3` | Amoníaco | PPM |
| `nox` | Óxidos de Nitrógeno | PPM |
| `alcohol` | Concentración de Alcohol | Val/PPM |
| `benceno` | Benceno | PPM |
| `humo` | Humo / Partículas | PPM |

### Ejemplo de Petición URL
Así es como el ESP32 envía los datos:
```http
[https://script.google.com/macros/s/TU_ID_DE_SCRIPT/exec?temp=24.5&hum=60&co2=450&nh3=0.5&nox=0.1&alcohol=0&benceno=0&humo=10](https://script.google.com/macros/s/TU_ID_DE_SCRIPT/exec?temp=24.5&hum=60&co2=450&nh3=0.5&nox=0.1&alcohol=0&benceno=0&humo=10)