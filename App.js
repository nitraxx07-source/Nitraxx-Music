import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, Dimensions, ScrollView, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Play, Pause, Search, Library, Download, SkipBack, SkipForward } from 'lucide-react-native';
import axios from 'axios';
import ImageColors from 'react-native-image-colors';
import Slider from 'react-native-slider';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Lógica de Audio Global
let soundObject = new Audio.Sound();

// --- PANTALLA DE REPRODUCTOR (Fusión Harmony/Nitraxx con Icono Pequeño) ---
function PlayerScreen({ route }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState(['#000044', '#000000']);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(215); // Simulados

  const track = {
    title: "Nitraxx Master",
    uploaderName: "Listo para sonar offline",
    thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800"
  };

  useEffect(() => {
    extractColors(track.thumbnail);
  }, []);

  const extractColors = async (uri) => {
    const result = await ImageColors.getColors(uri, { fallback: '#000044' });
    if (result.platform === 'android') setTheme([result.dominant, '#000000']);
  };

  return (
    <LinearGradient colors={theme} style={styles.container}>
      <Text style={styles.headerLabel}>NITRAXX MUSIC PRO</Text>
      
      {/* CONTENEDOR DEL ICONO: AHORA PEQUEÑO Y CUADRADO */}
      <View style={styles.iconArtContainer}>
        <View style={styles.iconSquare}>
          <Image source={{ uri: track.thumbnail }} style={styles.smallIconArt} />
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.trackArtist}>{track.uploaderName}</Text>
      </View>

      <View style={styles.progressArea}>
        <Slider value={position} maximumValue={duration} minimumTrackTintColor="#00ffff" thumbTintColor="#00ffff" />
      </View>

      <View style={styles.controlsRow}>
        <SkipBack color="white" size={35} fill="white" />
        <TouchableOpacity style={styles.playCircle} onPress={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? <Pause color="black" size={30} fill="black" /> : <Play color="black" size={30} fill="black" />}
        </TouchableOpacity>
        <SkipForward color="white" size={35} fill="white" />
        <Download color="white" size={24} />
      </View>
    </LinearGradient>
  );
}

// --- PANTALLA DE BÚSQUEDA ---
function SearchScreen() { return ( <View style={[styles.container, { backgroundColor: '#000' }]}></View> ); }

// --- NAVEGADOR PRINCIPAL ---
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#000', height: 60 }, tabBarActiveTintColor: 'cyan' }}>
        <Tab.Screen name="Inicio" component={PlayerScreen} options={{ tabBarIcon: ({color}) => <Library color={color} /> }} />
        <Tab.Screen name="Buscar" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 60 },
  headerLabel: { color: '#00ffff', textAlign: 'center', fontWeight: 'bold', letterSpacing: 4, fontSize: 12, marginBottom: 30 },
  
  // NUEVOS ESTILOS PARA EL ICONO PEQUEÑO
  iconArtContainer: { alignItems: 'center', marginVertical: 40 },
  iconSquare: { width: width * 0.6, height: width * 0.6, backgroundColor: '#000022', borderRadius: 15, padding: 15, elevation: 25, shadowColor: '#00ffff', shadowOpacity: 0.7, shadowRadius: 15, justifyContent: 'center', alignItems: 'center' },
  smallIconArt: { width: '100%', height: '100%', resizeMode: 'contain' },

  infoBox: { marginTop: 10 },
  trackTitle: { color: 'white', fontSize: 26, fontWeight: 'bold' },
  trackArtist: { color: '#00ffff', fontSize: 18, marginTop: 5 },
  progressArea: { marginTop: 30 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 35 },
  playCircle: { backgroundColor: '#00ffff', padding: 22, borderRadius: 50 },
});
