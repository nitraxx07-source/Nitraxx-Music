import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Play, SkipForward, SkipBack, Download, Heart, ListMusic, Repeat } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(new Audio.Sound());

  // Lógica de Crossfade (Spotify Style)
  const playWithCrossfade = async (nextSong) => {
    try {
      // Bajar volumen gradualmente antes de terminar (simulado)
      await soundRef.current.setStatusAsync({ volume: 0.5, shouldPlay: true });
      await soundRef.current.unloadAsync();
      
      await soundRef.current.loadAsync({ uri: nextSong.url });
      await soundRef.current.playAsync();
      setCurrentSong(nextSong);
      setIsPlaying(true);
    } catch (e) { console.log(e); }
  };

  // Función de Descarga
  const downloadSong = async (song) => {
    const fileUri = FileSystem.documentDirectory + `${song.title}.mp3`;
    const downloadResumable = FileSystem.createDownloadResumable(song.url, fileUri);
    try {
      const { uri } = await downloadResumable.downloadAsync();
      alert('Descargado en: ' + song.title);
    } catch (e) { console.error(e); }
  };

  const searchMusic = async (term) => {
    const resp = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=20`);
    const data = await resp.json();
    setSongs(data.results.map(s => ({
      id: s.trackId,
      title: s.trackName,
      artist: s.artistName,
      image: s.artworkUrl100.replace('100x100', '600x600'),
      url: s.previewUrl
    })));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={StyleSheet.absoluteFill} />
      
      {/* Header con tu Logo */}
      <View style={styles.header}>
        <Text style={styles.logoText}>NITRAXX <Text style={{color: '#E94560'}}>MUSIC</Text></Text>
        <TouchableOpacity><Heart color="white" /></TouchableOpacity>
      </View>

      {/* Buscador Estilo Harmony */}
      <View style={styles.searchBar}>
        <Search color="#888" size={20} />
        <TextInput 
          placeholder="Buscar en YouTube, Spotify..." 
          placeholderTextColor="#888" 
          style={styles.input}
          onSubmitEditing={(e) => searchMusic(e.nativeEvent.text)}
        />
      </View>

      <FlatList 
        data={songs}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.songCard} onPress={() => playWithCrossfade(item)}>
            <Image source={{uri: item.image}} style={styles.albumArt} />
            <View style={{flex:1, marginLeft: 15}}>
              <Text style={styles.songTitle}>{item.title}</Text>
              <Text style={styles.songArtist}>{item.artist}</Text>
            </View>
            <TouchableOpacity onPress={() => downloadSong(item)}>
              <Download color="#E94560" size={20} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Player Minimalista Harmony Style */}
      {currentSong && (
        <View style={styles.miniPlayer}>
          <LinearGradient colors={['#E94560', '#950740']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.playerGradient}>
            <Image source={{uri: currentSong.image}} style={styles.miniArt} />
            <View style={{flex:1, marginLeft: 10}}>
              <Text style={styles.miniTitle} numberOfLines={1}>{currentSong.title}</Text>
              <Text style={styles.miniArtist}>{currentSong.artist}</Text>
            </View>
            <View style={styles.controls}>
              <SkipBack color="white" fill="white" size={24} />
              <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)}>
                <Play color="white" fill="white" size={32} />
              </TouchableOpacity>
              <SkipForward color="white" fill="white" size={24} />
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, paddingTop: 50 },
  logoText: { color: 'white', fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  searchBar: { flexDirection: 'row', backgroundColor: '#16213e', margin: 20, padding: 12, borderRadius: 15, alignItems: 'center' },
  input: { flex: 1, color: 'white', marginLeft: 10 },
  songCard: { flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 10 },
  albumArt: { width: 55, height: 55, borderRadius: 10 },
  songTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  songArtist: { color: '#888', fontSize: 14 },
  miniPlayer: { position: 'absolute', bottom: 20, left: 10, right: 10, height: 70, borderRadius: 20, overflow: 'hidden' },
  playerGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  miniArt: { width: 45, height: 45, borderRadius: 10 },
  miniTitle: { color: 'white', fontWeight: 'bold' },
  miniArtist: { color: '#eee', fontSize: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', width: 120, justifyContent: 'space-between' }
});
