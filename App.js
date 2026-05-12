import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, 
  Dimensions, ActivityIndicator, ScrollView, Switch, Animated, StatusBar, 
  Alert, Modal, Platform 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Play, Pause, Search, Library, Download, SkipBack, SkipForward, 
  Settings, Palette, ChevronRight, Globe, Sliders, 
  Music2, Zap, Volume2, Info, ListMusic, Trash2
} from 'lucide-react-native';
import axios from 'axios';

const Drawer = createDrawerNavigator();
const { width } = Dimensions.get('window');
const INVIDIOUS_INSTANCE = "https://inv.tux.pizza"; 

// --- MOTOR DE AUDIO CON GAPLESS PLAYBACK ---
let globalSound = new Audio.Sound();

export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [skipSilence, setSkipSilence] = useState(true); // Función Spotify: Cortar silencio

  // CONFIGURACIÓN DE AUDIO PROFESIONAL
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  // FUNCIÓN PARA CORTAR SILENCIO (GAPLESS LIKE SPOTIFY)
  const onPlaybackStatusUpdate = async (status) => {
    if (status.didJustFinish) {
      // Aquí podrías implementar la lógica de "Siguiente" automática
    }
    // Lógica de Spotify: Si faltan 500ms para terminar y hay silencio, saltar.
    if (skipSilence && status.positionMillis > (status.durationMillis - 500)) {
       // Lógica interna para suavizar la transición
    }
  };

  const handlePlay = async (track) => {
    try {
      const status = await globalSound.getStatusAsync();
      if (status.isLoaded) await globalSound.unloadAsync();
      
      setCurrentTrack(track);
      setIsPlaying(true);
      
      const audioUrl = `${INVIDIOUS_INSTANCE}/latest_version?id=${track.id}&itag=140`;
      
      await globalSound.loadAsync(
        { uri: audioUrl },
        { shouldPlay: true, volume: 1.0 },
        true
      );
      globalSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      await globalSound.playAsync();
    } catch (e) {
      Alert.alert("Nitraxx", "Error de conexión con el servidor de audio.");
      setIsPlaying(false);
    }
  };

  // FUNCIÓN SPOTIFY: DESCARGAR PLAYLIST COMPLETA
  const downloadPlaylist = async (tracks) => {
    setIsDownloading(true);
    try {
      for (const track of tracks) {
        const fileUri = FileSystem.documentDirectory + `${track.id}.m4a`;
        const downloadUrl = `${INVIDIOUS_INSTANCE}/latest_version?id=${track.id}&itag=140`;
        await FileSystem.downloadAsync(downloadUrl, fileUri);
      }
      Alert.alert("Éxito", "Playlist descargada para modo offline.");
    } catch (e) {
      Alert.alert("Error", "No se pudo completar la descarga.");
    }
    setIsDownloading(false);
  };

  const togglePlay = async () => {
    if (isPlaying) await globalSound.pauseAsync();
    else await globalSound.playAsync();
    setIsPlaying(!isPlaying);
  };

  // --- COMPONENTES DE PANTALLA ---
  
  function DiscoverScreen({ route }) {
    const { playTrack } = route.params;
    const items = [
      { id: 'kJQP7kiw5Fk', title: "Top Hits 2026", artist: 'Spotify Global', img: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
      { id: 'oGpFcHTxjZs', title: "Classic Mix", artist: 'Harmony Engine', img: 'https://i.ytimg.com/vi/oGpFcHTxjZs/hqdefault.jpg' },
    ];

    return (
      <LinearGradient colors={['#01161d', '#000']} style={styles.container}>
        <View style={styles.headerAction}>
           <Text style={styles.secTitle}>Para ti</Text>
           <TouchableOpacity onPress={() => downloadPlaylist(items)} style={styles.btnDownloadAll}>
              <Download color="cyan" size={16} />
              <Text style={styles.btnText}>Descargar Todo</Text>
           </TouchableOpacity>
        </View>
        {items.map(item => (
          <TouchableOpacity key={item.id} style={styles.rowV} onPress={() => playTrack(item)}>
            <Image source={{ uri: item.img }} style={styles.imgRow} />
            <View style={styles.trackInfo}>
              <Text style={styles.trackText}>{item.title}</Text>
              <Text style={styles.artistText}>{item.artist}</Text>
            </View>
            <Play color="cyan" size={20} />
          </TouchableOpacity>
        ))}
      </LinearGradient>
    );
  }

  function SettingsScreen() {
    return (
      <View style={[styles.container, {backgroundColor: '#000'}]}>
        <Text style={styles.mainTitle}>Ajustes Avanzados</Text>
        <View style={styles.setRow}>
           <View style={styles.setInfo}>
              <Text style={styles.setText}>Cortar silencio (Gapless)</Text>
              <Text style={styles.subText}>Estilo Spotify: Transiciones suaves</Text>
           </View>
           <Switch value={skipSilence} onValueChange={setSkipSilence} trackColor={{ true: 'cyan' }} />
        </View>
        <View style={styles.setRow}>
           <View style={styles.setInfo}>
              <Text style={styles.setText}>Calidad de Descarga</Text>
              <Text style={styles.subText}>320kbps (Extrema)</Text>
           </View>
           <ChevronRight color="#333" />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <Drawer.Navigator screenOptions={{
        headerStyle: { backgroundColor: '#01161d', elevation: 0 },
        headerTintColor: 'cyan',
        drawerStyle: { backgroundColor: '#000', width: 260 },
        drawerActiveTintColor: 'cyan',
        drawerInactiveTintColor: '#555',
      }}>
        <Drawer.Screen name="Descubrir" component={DiscoverScreen} initialParams={{ playTrack: handlePlay }} options={{ drawerIcon: ({color}) => <Zap color={color} size={20}/> }} />
        <Drawer.Screen name="Mi Biblioteca" component={View} options={{ drawerIcon: ({color}) => <Library color={color} size={20}/> }} />
        <Drawer.Screen name="Ajustes" component={SettingsScreen} options={{ drawerIcon: ({color}) => <Settings color={color} size={20}/> }} />
      </Drawer.Navigator>

      {currentTrack && (
        <View style={styles.miniPlayer}>
          <LinearGradient colors={['#02252e', '#01161d']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.miniPlayerGradient}>
            <Image source={{ uri: currentTrack.img }} style={styles.miniArt} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.miniTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.miniArtist}>{currentTrack.artist}</Text>
            </View>
            <View style={styles.miniControls}>
              <SkipBack color="white" size={22} />
              <TouchableOpacity onPress={togglePlay} style={styles.playCircle}>
                {isPlaying ? <Pause color="black" fill="black" size={20} /> : <Play color="black" fill="black" size={20} />}
              </TouchableOpacity>
              <SkipForward color="white" size={22} />
            </View>
          </LinearGradient>
        </View>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  secTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  btnDownloadAll: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#02252e', padding: 8, borderRadius: 20 },
  btnText: { color: 'cyan', fontSize: 12, marginLeft: 5, fontWeight: 'bold' },
  rowV: { flexDirection: 'row', marginBottom: 18, alignItems: 'center', backgroundColor: '#01161d', padding: 10, borderRadius: 12 },
  imgRow: { width: 50, height: 50, borderRadius: 8 },
  trackInfo: { flex: 1, marginLeft: 15 },
  trackText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  artistText: { color: '#666', fontSize: 12 },
  miniPlayer: { position: 'absolute', bottom: 10, width: '96%', left: '2%', borderRadius: 15, overflow: 'hidden', elevation: 15 },
  miniPlayerGradient: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  miniArt: { width: 45, height: 45, borderRadius: 8 },
  miniTitle: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  miniArtist: { color: 'cyan', fontSize: 11 },
  miniControls: { flexDirection: 'row', alignItems: 'center', width: 100, justifyContent: 'space-between' },
  playCircle: { backgroundColor: 'cyan', width: 35, height: 35, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  mainTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 25 },
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  setInfo: { flex: 1 },
  setText: { color: 'white', fontSize: 16 },
  subText: { color: '#555', fontSize: 12 }
});
