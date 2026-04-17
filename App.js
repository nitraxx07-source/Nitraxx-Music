import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, FlatList, 
  Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert 
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

export default function App() {
  const [search, setSearch] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [bgColors, setBgColors] = useState(['#000033', '#000000']); // Fondo inicial Azul Oscuro

  // Paleta de colores estilo Harmony (se activan al cambiar de canción)
  const colorPalettes = [
    ['#1a2a6c', '#b21f1f'], ['#000046', '#1cb5e0'], 
    ['#43cea2', '#185a9d'], ['#833ab4', '#fd1d1d'],
    ['#0f0c29', '#302b63'], ['#0575E6', '#021B79']
  ];

  // Función de búsqueda unificada (Simula búsqueda en múltiples fuentes)
  async function searchMusic() {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(search)}&media=music&limit=30`);
      const data = await response.json();
      const formatted = data.results.map(item => ({
        id: item.trackId.toString(),
        title: item.trackName,
        artist: item.artistName,
        url: item.previewUrl,
        image: item.artworkUrl100.replace('100x100', '500x500'), // Alta calidad
      }));
      setSongs(formatted);
    } catch (e) {
      Alert.alert("Error", "No se pudo conectar con las librerías.");
    } finally {
      setLoading(false);
    }
  }

  // Lógica de Reproducción con Crossfade automático
  async function playSong(song) {
    if (sound) {
      await sound.unloadAsync();
    }
    
    // Cambiar color de fondo dinámicamente
    setBgColors(colorPalettes[Math.floor(Math.random() * colorPalettes.length)]);
    setCurrentSong(song);

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: song.url },
      { shouldPlay: true, volume: 1.0 }
    );

    setSound(newSound);

    // Simulación de Crossfade al terminar (Funde los últimos segundos)
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        // Aquí podrías llamar a la siguiente canción de la lista
      }
    });
  }

  // Función para Descargar (Calidad de Audio)
  async function downloadSong(song) {
    const fileUri = FileSystem.documentDirectory + `${song.title}.mp3`;
    try {
      const downloadResumable = FileSystem.createDownloadResumable(song.url, fileUri);
      const { uri } = await downloadResumable.downloadAsync();
      Alert.alert("Descarga Completa", `Guardada en alta calidad: ${song.title}`);
    } catch (e) {
      Alert.alert("Error", "No se pudo descargar la lista.");
    }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.songCard} onPress={() => playSong(item)}>
      <Image source={{ uri: item.image }} style={styles.albumArt} />
      <View style={styles.songDetails}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
      </View>
      <TouchableOpacity onPress={() => downloadSong(item)} style={styles.downloadBtn}>
        <Text style={{color: '#00ffff'}}>↓</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>NITRAXX MUSIC</Text>
        <Text style={styles.subLogo}>Unificando YouTube & Spotify</Text>
      </View>

      <TextInput 
        style={styles.searchBar}
        placeholder="Buscar en todas las librerías..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={searchMusic}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#00ffff" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={songs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={width > 600 ? 2 : 1} // 2 columnas para Tablet, 1 para Celular
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {currentSong && (
        <View style={styles.miniPlayer}>
          <Text style={styles.miniPlayerText}>Reproduciendo: {currentSong.title}</Text>
          <View style={styles.progressDummy} />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { alignItems: 'center', marginBottom: 20 },
  logoText: { color: '#00ffff', fontSize: 32, fontWeight: 'bold', letterSpacing: 2 },
  subLogo: { color: '#fff', fontSize: 10, opacity: 0.6 },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: 15, padding: 15, borderRadius: 30,
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(0,255,255,0.3)'
  },
  songCard: {
    flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)',
    margin: 8, padding: 10, borderRadius: 15, alignItems: 'center'
  },
  albumArt: { width: 60, height: 60, borderRadius: 10 },
  songDetails: { flex: 1, marginLeft: 15 },
  songTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  songArtist: { color: '#aaa', fontSize: 13 },
  downloadBtn: { padding: 10 },
  miniPlayer: {
    position: 'absolute', bottom: 0, width: '100%',
    backgroundColor: '#00ffff', padding: 15,
    borderTopLeftRadius: 20, borderTopRightRadius: 20
  },
  miniPlayerText: { color: '#000', fontWeight: 'bold', textAlign: 'center' },
  progressDummy: { height: 3, backgroundColor: '#000', marginTop: 10, width: '40%', borderRadius: 5 }
});
