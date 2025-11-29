# 📱 Monitor de Calidad del Aire (IoT)

> Aplicación móvil desarrollada en **React Native** para visualizar en tiempo real datos de sensores ambientales y recibir alertas de seguridad.

## 📖 ¿De qué trata este proyecto?
Esta aplicación permite monitorear el estado del aire en un entorno específico (como una oficina o fábrica). Lee los datos enviados por sensores físicos (ESP32/Arduino) a una hoja de cálculo de Google Sheets y los presenta de forma gráfica en el celular.

Si los niveles de gases tóxicos o temperatura superan el límite seguro, el sistema envía una **Notificación Push** al celular, incluso si la app está cerrada.

## 🚀 Funcionalidades Principales
* **Lectura en Tiempo Real:** Actualización de datos cada 5 segundos desde la nube.
* **Visualización Gráfica:** Medidores circulares para CO2, Humo, Temperatura, Humedad y Gases (NH3, Benceno, etc.).
* **Sistema de Alertas Híbrido:**
    * *Local:* Vibración y aviso en pantalla si la app está abierta.
    * *Remoto (Push):* Notificaciones de emergencia gestionadas por un script en la nube (Google Apps Script).
* **Registro Automático:** El dispositivo se vincula al sistema de alertas automáticamente al abrir la aplicación.

|

*(Nota: Reemplaza estas imágenes con capturas reales de tu celular para la evidencia).*

## 🛠 Tecnologías Usadas
* **Frontend:** React Native + Expo.
* **Backend / Base de Datos:** Google Sheets (CSV).
* **Lógica de Nube:** Google Apps Script (JavaScript).
* **Notificaciones:** Expo Notifications Service.

## ⚙️ Cómo ejecutar el proyecto

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/Brayan-PS/Iot-Aplicativo.git](https://github.com/Brayan-PS/Iot-Aplicativo.git)
    cd Iot-Aplicativo
    ```

2.  **Instalar las dependencias:**
    ```bash
    npm install
    ```

3.  **Correr la aplicación:**
    ```bash
    npx expo start
    ```

