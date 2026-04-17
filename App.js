import React, { useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Image 
} from 'react-native';
import { Audio } from 'expo-av';

export default function App() {
  const [sound, setSound] = useState();
  const [search, setSearch] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);

  // Función para buscar música en librerías externas (iTunes API)
  async function searchMusic(term) {
    if (!term.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=25`
      );
      const data = await response.json();
      const results = data.results.map(item => ({
        id: item.trackId.toString(),
        title: item.trackName,
        artist: item.artistName,
        url: item.previewUrl,
        image: item.artworkUrl100
      }));
      setSongs(results);
    } catch (error) {
      alert("Error al conectar con la red. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  // Función para reproducir audio nativo
  async function playMusic(song) {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      setCurrentSong(song);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.url },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (e) {
      alert("No se pudo reproducir esta pista.");
    }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.songItem, 
        currentSong?.id === item.id && { backgroundColor: '#1a1a1a' }
      ]} 
      onPress={() => playMusic(item)}
    >
      <Image source={{ uri: item.image }} style={styles.albumArt} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
      </View>
      <Text style={styles.playIcon}>{currentSong?.id === item.id ? '🔊' : '▶'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nitraxx Music</Text>
      
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchBar} 
          placeholder="Busca artista o canción..." 
          placeholderTextColor="#666"
          onChangeText={setSearch}
          onSubmitEditing={() => searchMusic(search)}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff0055" />
          <Text style={styles.loadingText}>Unificando librerías...</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Busca algo para empezar a escuchar</Text>
          }
        />
      )}

      {currentSong && (
        <View style={styles.playerBar}>
          <Text style={styles.playerText} numberOfLines={1}>
            Reproduciendo: {currentSong.title}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 50 },
  header: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  searchContainer: { paddingHorizontal: 15, marginBottom: 10 },
  searchBar: { 
    backgroundColor: '#111', 
    color: '#fff', 
    padding: 12, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#333',
    fontSize: 16
  },
  songItem: { 
    flexDirection: 'row', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#111', 
    alignItems: 'center' 
  },
  albumArt: { width: 50, height: 50, borderRadius: 5, marginRight: 15 },
  songInfo: { flex: 1 },
  songTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  songArtist: { color: '#888', fontSize: 14 },
  playIcon: { color: '#ff0055', fontSize: 20, marginLeft: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 10 },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 50, fontSize: 16 },
  playerBar: { 
    height: 50, 
    backgroundColor: '#ff0055', 
    justifyContent: 'center', 
    paddingHorizontal: 20 
  },
  playerText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});
