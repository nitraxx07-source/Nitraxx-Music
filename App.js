import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, SkipForward, SkipBack, ListMusic, Heart, Settings, Download } from 'lucide-react-native';
import ImageColors from 'react-native-image-colors';

const { width } = Dimensions.get('window');

export default function App() {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [themeColor, setThemeColor] = useState('#000022'); // Color inicial neón
  
  // Simulación de Track (Aquí se integrará el importador de YouTube/Spotify)
  const currentTrack = {
    title: "Nitraxx Dynamic Beat",
    artist: "Nitraxx Master",
    artwork: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800",
    lyrics: "[00:10.00] Iniciando ritmo neón...\n[00:15.00] Nitraxx Music en el aire\n[00:20.00] Sin anuncios, pura calidad"
  };

  // EFECTO: Tema Dinámico basado en la imagen
  useEffect(() => {
    const fetchColors = async () => {
      const result = await ImageColors.getColors(currentTrack.artwork, {
        fallback: '#000022',
        cache: true,
        key: 'unique_key',
      });
      if (result.platform === 'android') {
        setThemeColor(result.dominant);
      }
    };
    fetchColors();
  }, [currentTrack.artwork]);

  // FUNCIÓN: Reproducción con soporte para Background y Crossfade
  async function togglePlayback() {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'URL_DE_STREAMING_AQUÍ' },
        { shouldPlay: true, volume: 1.0 }
      );
      setSound(newSound);
      setIsPlaying(true);
      // Configuración para segundo plano
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });
    }
  }

  return (
    <LinearGradient colors={[themeColor, '#000000']} style={styles.container}>
      {/* Header - Navegación */}
      <View style={styles.header}>
        <Settings color="white" size={28} />
        <Text style={styles.logoText}>NITRAXX MUSIC</Text>
        <ListMusic color="white" size={28} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Carátula con Efecto Neón */}
        <View style={[styles.artWrapper, { shadowColor: themeColor }]}>
          <Image source={{ uri: currentTrack.artwork }} style={styles.albumArt} />
        </View>

        {/* Info de Canción */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>{currentTrack.title}</Text>
          <Text style={styles.trackArtist}>{currentTrack.artist}</Text>
        </View>

        {/* Letras Sincronizadas (Placeholder) */}
        <View style={styles.lyricsBox}>
          <Text style={styles.lyricsText}>{currentTrack.lyrics}</Text>
        </View>

        {/* Controles Principales */}
        <View style={styles.playerControls}>
          <SkipBack color="white" size={40} />
          <TouchableOpacity onPress={togglePlayback} style={styles.mainPlayBtn}>
            <Play color="black" fill="black" size={35} />
          </TouchableOpacity>
          <SkipForward color="white" size={40} />
        </View>

        {/* Funciones Extra */}
        <View style={styles.extraFeatures}>
          <TouchableOpacity style={styles.iconBtn}><Heart color="white" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><Download color="white" /></TouchableOpacity>
          <Text style={styles.featureText}>Calidad: Alta (320kbps)</Text>
        </View>
      </ScrollView>

      {/* Barra Inferior Flexible */}
      <View style={styles.bottomNav}>
        <Text style={styles.navItem}>Inicio</Text>
        <Text style={styles.navItem}>Explorar</Text>
        <Text style={styles.navItem}>Biblioteca</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, alignItems: 'center' },
  logoText: { color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  scrollContent: { alignItems: 'center', paddingTop: 40 },
  artWrapper: { width: width * 0.8, height: width * 0.8, borderRadius: 20, elevation: 25, shadowOpacity: 0.8, shadowRadius: 20 },
  albumArt: { width: '100%', height: '100%', borderRadius: 20 },
  trackInfo: { marginTop: 30, alignItems: 'center' },
  trackTitle: { color: 'white', fontSize: 26, fontWeight: 'bold' },
  trackArtist: { color: '#bbb', fontSize: 18, marginTop: 5 },
  lyricsBox: { height: 150, width: '90%', marginTop: 30, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 15 },
  lyricsText: { color: 'white', textAlign: 'center', fontSize: 16, opacity: 0.8, lineHeight: 24 },
  playerControls: { flexDirection: 'row', alignItems: 'center', marginTop: 40, width: '70%', justifyContent: 'space-between' },
  mainPlayBtn: { backgroundColor: 'white', padding: 20, borderRadius: 50 },
  extraFeatures: { flexDirection: 'row', marginTop: 30, alignItems: 'center', width: '90%', justifyContent: 'space-around' },
  featureText: { color: 'white', opacity: 0.6 },
  bottomNav: { height: 70, backgroundColor: 'rgba(0,0,0,0.8)', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  navItem: { color: 'white', fontWeight: '500' }
});
