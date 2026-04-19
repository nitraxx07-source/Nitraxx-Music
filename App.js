import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, FlatList, 
  Dimensions, ActivityIndicator, Alert, Animated, TouchableOpacity 
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Paleta de colores estilo Harmony (Cian Neón y Azul Oscuro Profundo)
const COLOR_NEON = '#00ffff'; // Cian Neón
const COLOR_BG_DARK = ['#000022', '#000011']; // Azul oscuro profundo

// COMPONENTE DEL LOGO PROGRAMADO (Retumbo)
const LogoRetumbo = ({ text, style }) => {
  const tiltAnim = useRef(new Animated.Value(0)).current;

  // Efecto de retumbo suave al montar
  useEffect(() => {
    Animated.sequence([
      Animated.timing(tiltAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(tiltAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(tiltAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
      Animated.timing(tiltAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
      Animated.timing(tiltAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  }, [tiltAnim]);

  const rumbleStyle = {
    transform: [{ translateX: tiltAnim }]
  };

  return (
    <Animated.Text style={[styles.logoText, rumbleStyle, style]}>
      {text}
    </Animated.Text>
  );
};

export default function App() {
  const [search, setSearch] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [bgColors, setBgColors] = useState(COLOR_BG_DARK);

  // Animación para el efecto de onda al presionar
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Función para retumbar el logo al reproducir
  const rumbleLogo = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Función de búsqueda unificada (Música)
  async function searchMusic() {
    if (!search.trim()) return;
    setLoading(true);
    try {
      // Usamos la API de iTunes como ejemplo de servidor externo
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(search)}&media=music&limit=25`);
      const data = await response.json();
      const formatted = data.results.map(item => ({
        id: item.trackId.toString(),
        title: item.trackName,
        artist: item.artistName,
        url: item.previewUrl,
        image: item.artworkUrl100,
      }));
      setSongs(formatted);
    } catch (e) {
      Alert.alert("Error", "No se pudo conectar con las librerías.");
    } finally {
      setLoading(false);
    }
  }

  // Reproducción con efecto Harmony (Retumbo y Colores)
  async function playSong(song) {
    if (sound) {
      await sound.unloadAsync();
    }
    
    // Cambiar color de fondo dinámicamente al azar (estilo Harmony)
    const randomColor = `hsl(${Math.random() * 360}, 100%, 10%)`; // Tono al azar
    setBgColors([randomColor, '#000000']);
    setCurrentSong(song);
    
    // Activar retumbo del logo
    rumbleLogo();

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: song.url },
      { shouldPlay: true }
    );
    setSound(newSound);
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.songCard} onPress={() => playSong(item)}>
      <View style={styles.songDetails}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
      </View>
      <Text style={{color: COLOR_NEON, fontSize: 18}}>▶</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      {/* SECCIÓN DEL LOGO PROGRAMADO (Retumbo) */}
      <View style={styles.header}>
        <Animated.View style={{transform: [{scale: scaleAnim}]}}>
          <LogoRetumbo text="NItraxx Music" />
          <Text style={styles.subLogo}>Unificando YouTube & Spotify</Text>
        </Animated.View>
      </View>

      <TextInput 
        style={styles.searchBar}
        placeholder="Buscar en YouTube, Spotify..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={searchMusic}
      />

      {loading ? (
        <ActivityIndicator size="large" color={COLOR_NEON} style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={songs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={width > 600 ? 2 : 1} // Adaptable Tablet o Celular
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {currentSong && (
        <View style={styles.miniPlayer}>
          <Text style={styles.miniPlayerText}>Reproduciendo: {currentSong.title}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: '#000' },
  header: { alignItems: 'center', marginBottom: 20 },
  logoText: { 
    color: COLOR_NEON, 
    fontSize: 34, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', // Efecto Harmony
    letterSpacing: 1,
    textShadowColor: COLOR_NEON, // EFECTO DE RESPLANDOR NEÓN
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10,
  },
  subLogo: { color: '#fff', fontSize: 10, opacity: 0.6, textAlign: 'center' },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: 15, padding: 15, borderRadius: 25,
    color: '#fff', fontSize: 16
  },
  songCard: {
    flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)',
    margin: 8, padding: 15, borderRadius: 15, alignItems: 'center'
  },
  songDetails: { flex: 1, marginLeft: 10 },
  songTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  songArtist: { color: '#aaa', fontSize: 13 },
  miniPlayer: {
    position: 'absolute', bottom: 0, width: '100%',
    backgroundColor: COLOR_NEON, padding: 15,
    borderTopLeftRadius: 15, borderTopRightRadius: 15
  },
  miniPlayerText: { color: '#000', fontWeight: 'bold', textAlign: 'center' }
});
