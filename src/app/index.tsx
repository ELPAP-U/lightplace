import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {Zone, mapHtmlTemplate} from "../constants/map"
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';

console.log()



const generateMapHtml = (zones: Zone[]) => mapHtmlTemplate(zones);

export default function LightPlaceScreen() {
  
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const insets = useSafeAreaInsets(); // Variable para obtener los insets de seguridad del dispositivo (para manejar el notch y la barra de navegación)

  useEffect(()=>{
    //Funcion asicrona que espera la respuesta a la solicitud de permisos
    //Esta en el useEffect para que se ejecute cada vez que se abre la app
    async function getCurrentLocation() {
      let {status} = await Location.requestForegroundPermissionsAsync(); //Solicitud de permiso
      if (status !== 'granted') {
        setErrorMessage('No se permitio el acceso a la ubicacion')
        return errorMessage;
      }
      let location = await Location.getCurrentPositionAsync(); //Variable que contiene la ubicacion actual del usuario
      setLocation(location)
    }
    getCurrentLocation()

    async function safeAccounting() {
      const {data: {session}} = await supabase.auth.getSession()
      if (!session) {
        const {data, error} = await supabase.auth.signInAnonymously()

        console.log('Inicializando conexion, resultado: ' + error)
      } else {
        console.log("Sesion ya existente", session.user.id)
      }
    }
    safeAccounting()
  },[])

  
  //Objeto que solicita la ubicacion, mas especificamente la latitud y longitud de esta, ya que la ubicacion completa la tiene location
  let myUbication = {
    'latitude': location?.coords.latitude,
    'longitude': location?.coords.longitude
  }
    //Lista de objetos, en el cual cada objeto representa una ubicacion y su estado.
    const ZONES: Zone[] = [
  { id: '1', title: 'Condado Norte', status: 'active', details: 'Energía estable', latitude: 10.21, longitude: -68.00 },
  { id: '2', title: 'Zona Comercial', status: 'outage', details: 'Corte hace 45 min', latitude: 10.20, longitude: -67.98 },
  { id: '3', title: 'Barrio Industrial', status: 'outage', details: 'Corte programado', latitude: 10.18, longitude: -67.99 },
  { id: '7', title: '', status: 'active', details:'', latitude: (myUbication.latitude || "Latitud no disponible"), longitude:(myUbication.longitude || 'Longitud no disponible')}
];
  //Funcion encargada de actualizar el estado de selectedZone al tocar un punto en el mapa el cual este marcado, si no lo esta, no mostrara informacion ni actualizara el selectedZone
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_ZONE') {
        setSelectedZone(data.zone);
        console.log('Zona seleccionada:', data.zone, data.type, data);
      } else if (data.type === 'DESELECT_ZONE') {
        setSelectedZone(null);
        console.log('Zona deseleccionada:', data);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* 1. Mapa Leaflet en WebView */}
      <WebView
        originWhitelist={['*']}
        source={{ html: generateMapHtml(ZONES) }}
        style={StyleSheet.absoluteFill}
        onMessage={handleWebViewMessage}
        containerStyle={{ backgroundColor: '#0F172A' }}
        scrollEnabled={false}
      />

      {/* 2. Top Header flotante */}
      <View style={[styles.topHeader, { top: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Tu ubicacion actual es: {[myUbication.latitude, myUbication.longitude]}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statTextSuccess}>● 84% Con luz</Text>
          <Text style={styles.statTextDanger}>● 16% Sin luz</Text>
        </View>
      </View>

      {/* 3. Panel de detalle al seleccionar zona */}
      {selectedZone && (
        <View style={[styles.detailCard, { bottom: insets.bottom + 110 }]}>
          <Text style={styles.zoneTitle}>{selectedZone.title}</Text>
          <Text style={selectedZone.status === 'active' ? styles.textSuccess : styles.textDanger}>
            {selectedZone.status === 'active' ? '● Servicio Activo' : '● Sin Electricidad'}
          </Text>
          <Text style={styles.zoneDetails}>{selectedZone.details}</Text>
        </View>
      )}

      {/* 4. Barra inferior de reporte rápido */}
      <View style={[styles.actionContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.actionPrompt}>¿Cuál es tu estado actual?</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, styles.bgSuccess]} activeOpacity={0.8}>
            <Text style={styles.btnText}>Tengo luz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.bgDanger]} activeOpacity={0.8}>
            <Text style={styles.btnText}>Sin luz</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  topHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  headerTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statTextSuccess: { color: '#10B981', fontWeight: '700', fontSize: 13 },
  statTextDanger: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  detailCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 10,
  },
  zoneTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  zoneDetails: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  textSuccess: { color: '#10B981', fontWeight: '600', marginTop: 2 },
  textDanger: { color: '#EF4444', fontWeight: '600', marginTop: 2 },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    zIndex: 10,
  },
  actionPrompt: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 12, fontWeight: '500' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  bgSuccess: { backgroundColor: '#10B981' },
  bgDanger: { backgroundColor: '#EF4444' },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});