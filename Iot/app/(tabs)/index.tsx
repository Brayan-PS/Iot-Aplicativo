import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Vibration, Platform, Alert } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

// --- TUS ENLACES ---
const URL_PUBLICA_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRnDO-Ux7XutIZb44lZx8-2Rtu69ppKF4cLoTQac38xffnhRM6Rv1IGBH-KBc-fCxSmNPyX4KF_LJyE/pub?gid=0&single=true&output=csv';

// URL NUEVA 
const URL_WEB_APP_GOOGLE = 'https://script.google.com/macros/s/AKfycbytz7qaDsOwCPay4qzhYwbbN5R0X_2pUxTwihbe4Xav5gJ80JjwHQb1WZEF52YOYxGSMQ/exec';

// Configuración de notificaciones
Notifications.setNotificationHandler({
  // @ts-ignore
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Colores = {
  fondo: '#1a1d40',
  tarjeta: '#252957',
  textoPrincipal: '#fff',
  textoSecundario: '#aeb2e8',
  verde: '#00e676',
  amarillo: '#ffea00',
  rojo: '#ff1744',
  azul: '#2979ff',
  naranja: '#ff9100',
};

// ... (El componente MiniGauge se queda igual) ...
interface MiniGaugeProps {
  titulo: string;
  valor: number;
  maximo: number;
  unidad: string;
  minIdeal?: number;
  maxIdeal?: number;
  tipo?: 'temp' | 'hum' | 'nox' | string;
}

const MiniGauge = ({ titulo, valor, maximo, unidad, maxIdeal = 100, tipo }: MiniGaugeProps) => {
  let color = Colores.verde;
  if (tipo === 'temp') {
    if (valor < 18 || valor > 26) color = Colores.rojo;
    else if (valor < 20 || valor > 24) color = Colores.amarillo;
    else color = Colores.naranja;
  } else if (tipo === 'hum') {
    if (valor < 30 || valor > 70) color = Colores.rojo;
    else if (valor < 40 || valor > 60) color = Colores.amarillo;
    else color = Colores.azul;
  } else {
    if (valor > maxIdeal * 2) color = Colores.rojo;
    else if (valor > maxIdeal) color = Colores.amarillo;
  }

  return (
    <View style={styles.cardGauge}>
      <Text style={styles.cardTitulo}>{titulo}</Text>
      <View style={styles.gaugeWrapper}>
        <CircularProgress
          value={valor}
          maxValue={maximo}
          radius={35}
          duration={1000}
          activeStrokeColor={color}
          inActiveStrokeColor={'#3e416e'}
          activeStrokeWidth={6}
          inActiveStrokeWidth={6}
          showProgressValue={false}
          clockwise={true}
          rotation={0}
        />
        <View style={styles.valorAbsoluto}>
            <Text style={[styles.textoValor, {color: color}]}>{valor.toFixed(tipo === 'nox' ? 2 : 0)}</Text>
            <Text style={styles.textoUnidad}>{unidad}</Text>
        </View>
      </View>
    </View>
  );
};

interface SensorData {
  temp: number;
  hum: number;
  ppm: number;
  nh3: number;
  nox: number;
  alcohol: number;
  benceno: number;
  humo: number;
}

export default function HomeScreen() {
  
  const [data, setData] = useState<SensorData>({
    temp: 0, hum: 0, ppm: 400,
    nh3: 0, nox: 0, alcohol: 0, benceno: 0, humo: 0
  });

  const ultimaNotificacion = useRef<number>(0);
  const TIEMPO_ENTRE_ALERTAS = 5 * 60 * 1000; 

  // --- FUNCIÓN PARA REGISTRAR TOKEN EN GOOGLE SHEETS ---
  const registrarTokenEnNube = async (token: string) => {
    try {
      console.log("Enviando token a Google...");
      await fetch(URL_WEB_APP_GOOGLE, {
        method: 'POST',
        mode: 'no-cors', // Importante para evitar errores de CORS
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token }),
      });
      console.log("Token enviado correctamente.");
    } catch (error) {
      console.error("Error al guardar token:", error);
    }
  };

  // --- SOLICITAR PERMISOS Y REGISTRAR ---
  useEffect(() => {
    async function iniciarSistemaNotificaciones() {
      // 1. Pedir permiso
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        // 2. Obtener Token
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const miToken = tokenData.data;
        console.log("Token obtenido:", miToken);
        
        // 3. Enviar a Google Sheets automáticamente
        registrarTokenEnNube(miToken);
      } else {
        Alert.alert('Atención', 'Necesitas activar las notificaciones para recibir alertas de seguridad.');
      }
    }
    iniciarSistemaNotificaciones();
  }, []);

  // --- ALERTA LOCAL (SOLO SI LA APP ESTÁ ABIERTA) ---
  const enviarAlertaLocal = async (titulo: string, mensaje: string) => {
    const ahora = Date.now();
    if (ahora - ultimaNotificacion.current < TIEMPO_ENTRE_ALERTAS) return; 

    Vibration.vibrate([500, 500, 500]); 
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: mensaje, sound: true },
      trigger: null,
    });
    ultimaNotificacion.current = ahora;
  };

  const verificarPeligro = (d: SensorData) => {
    // Estas alertas son VISUALES para quien tiene la app abierta
    if (d.ppm > 1500) enviarAlertaLocal("⚠️ PELIGRO CO2", `Nivel crítico: ${d.ppm.toFixed(0)} PPM.`);
    if (d.humo > 500) enviarAlertaLocal("🔥 ALERTA DE HUMO", `Humo detectado: ${d.humo.toFixed(0)} PPM.`);
    if (d.temp > 35) enviarAlertaLocal("🌡️ Calor Extremo", `Temperatura: ${d.temp}°C.`);
  };

  const fetchDatos = async () => {
    try {
      const url = URL_PUBLICA_CSV + '&t=' + new Date().getTime();
      const respuesta = await fetch(url);
      const textoCSV = await respuesta.text();
      const filas = textoCSV.trim().split('\n');
      
      if (filas.length > 1) {
        const ultimaFila = filas[filas.length - 1];
        const v = ultimaFila.split(',');
        
        if (v.length >= 8) {
             const nuevosDatos: SensorData = {
                temp: parseFloat(v[1]) || 0,
                hum:  parseFloat(v[2]) || 0,
                ppm:  parseFloat(v[3]) || 400,
                nh3:  parseFloat(v[4]) || 0,
                nox:  parseFloat(v[5]) || 0,
                alcohol: parseFloat(v[6]) || 0,
                benceno: parseFloat(v[7]) || 0,
                humo:    parseFloat(v[8]) || 0,
             };
             setData(nuevosDatos);
             verificarPeligro(nuevosDatos);
        }
      }
    } catch (error) {
      console.error("Error leyendo CSV:", error);
    }
  };

  useEffect(() => {
    fetchDatos();
    const intervalo = setInterval(fetchDatos, 5000);
    return () => clearInterval(intervalo);
  }, []);

  let colorCO2 = Colores.verde;
  if (data.ppm > 1000) colorCO2 = Colores.rojo;
  else if (data.ppm > 800) colorCO2 = Colores.amarillo;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
            <Text style={styles.tituloPrincipal}>Monitoreo Ambiental</Text>
        </View>

        <View style={styles.seccionPrincipal}>
            <View style={styles.seccionPrincipalContainer}>
                <CircularProgress
                    value={data.ppm}
                    maxValue={2000}
                    radius={110}
                    activeStrokeColor={colorCO2}
                    inActiveStrokeColor={'#3e416e'}
                    activeStrokeWidth={20}
                    inActiveStrokeWidth={20}
                    showProgressValue={false}
                    clockwise={true}
                    rotation={0}
                />
                <View style={styles.co2ValorContainer}>
                    <Text style={styles.co2Valor}>{data.ppm.toFixed(0)}</Text>
                    <Text style={styles.co2Label}>PPM CO2</Text>
                </View>
            </View>
        </View>

        <View style={styles.seccionTitulo}>
            <Text style={styles.textoSeccion}>Confort Térmico</Text>
        </View>
        
        <View style={styles.filaGrid}>
            <View style={[styles.cardGauge, styles.cardAncha]}>
                <MiniGauge titulo="Temperatura" valor={data.temp} maximo={50} unidad="°C" tipo="temp" />
            </View>
            <View style={[styles.cardGauge, styles.cardAncha]}>
                <MiniGauge titulo="Humedad" valor={data.hum} maximo={100} unidad="%" tipo="hum" />
            </View>
        </View>

        <View style={styles.seccionTitulo}>
            <Text style={styles.textoSeccion}>Gases Detectados</Text>
        </View>

        <View style={styles.gridContainer}>
            <MiniGauge titulo="Amoníaco" valor={data.nh3} maximo={100} unidad="ppm" maxIdeal={20} />
            <MiniGauge titulo="Alcohol" valor={data.alcohol} maximo={500} unidad="val" maxIdeal={100} />
            <MiniGauge titulo="NOx" valor={data.nox} maximo={50} unidad="ppm" maxIdeal={10} tipo="nox" />
            <MiniGauge titulo="Benceno" valor={data.benceno} maximo={1200} unidad="ppm" maxIdeal={100} tipo="nox" />
            <MiniGauge titulo="Humo" valor={data.humo} maximo={1000} unidad="ppm" maxIdeal={200} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.fondo },
  scrollContent: { paddingBottom: 40, alignItems: 'center' },
  header: { marginTop: 10, marginBottom: 10, alignItems: 'center' },
  tituloPrincipal: { fontSize: 26, fontWeight: 'bold', color: Colores.textoPrincipal },
  seccionPrincipal: { marginVertical: 20, alignItems: 'center', justifyContent: 'center' },
  seccionPrincipalContainer: { width: 220, height: 220, position: 'relative' },
  co2ValorContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  co2Valor: {
    fontSize: 52,
    fontWeight: 'bold',
    color: Colores.textoPrincipal,
    lineHeight: 60,
  },
  co2Label: {
    fontSize: 16,
    color: Colores.textoSecundario,
    fontWeight: '600',
    marginTop: -5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  seccionTitulo: { width: '90%', borderBottomWidth: 1, borderBottomColor: '#3e416e', marginBottom: 15, marginTop: 10, paddingBottom: 5 },
  textoSeccion: { color: Colores.textoSecundario, fontSize: 16, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  filaGrid: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginBottom: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%', paddingHorizontal: 5 },
  cardGauge: { backgroundColor: Colores.tarjeta, borderRadius: 15, padding: 10, margin: 6, alignItems: 'center', width: '28%', minWidth: 100 },
  cardAncha: { width: '45%' },
  cardTitulo: { color: Colores.textoSecundario, fontSize: 12, marginBottom: 8, fontWeight: 'bold', textAlign: 'center' },
  gaugeWrapper: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  valorAbsoluto: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  textoValor: { fontSize: 16, fontWeight: 'bold' },
  textoUnidad: { fontSize: 9, color: Colores.textoSecundario }
});