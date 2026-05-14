import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, 
  ActivityIndicator, Switch, StatusBar, Alert 
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Download, Play, Pause, Settings } from 'lucide-react-native';
import axios from 'axios';

const INVIDIOUS_INSTANCE = "https://inv.tux.pizza"; 
let globalSound = new Audio.Sound();

export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  const performSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      const res = await axios.get(`${INVIDIOUS_INSTANCE}/api/v1/search?q=${searchQuery}&type=video`);
      const formatted = res.data.map(item => ({
        id: item.videoId,
        title: item.title,
        artist: item.author,
        img: item.videoThumbnails[0].url,
        url: `${INVIDIOUS_INSTANCE}/latest_version?id=${item.videoId}&itag=140`
      }));
      setSearchResults(formatted);
    } catch (e) {
      Alert.alert("Error", "No se pudo conectar.");
    }
    setLoading(false);
  };

  const handlePlay = async (track) => {
    try {
      const status = await globalSound.getStatusAsync();
      if (status.isLoaded) await globalSound.unloadAsync();
      setCurrentTrack(track);
      setIsPlaying(true);
      await globalSound.loadAsync({ uri: track.url }, { shouldPlay: true }, true);
    } catch (e) {
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) await globalSound.pauseAsync();
    else await globalSound.playAsync();
    setIsPlaying(!isPlaying);
  };

  return (
    <LinearGradient colors={['#01161d', '#000']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Text style={styles.logoText}>Nitraxx Music</Text>

      <View style={styles.searchBox}>
        <Search color="cyan" size={20} />
        <TextInput 
          placeholder="Buscar música..." 
          placeholderTextColor="#444" 
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={performSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="cyan" size="large" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={searchResults}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.rowV} onPress={() => handlePlay(item)}>
              <Image source={{ uri: item.img }} style={styles.imgRow} />
              <View style={styles.trackInfo}>
                <Text style={styles.trackText} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.artistText}>{item.artist}</Text>
              </View>
              <Download color="cyan" size={20} />
            </TouchableOpacity>
          )}
        />
      )}

      {currentTrack && (
        <View style={styles.miniPlayer}>
          <LinearGradient colors={['#02252e', '#01161d']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.miniPlayerGradient}>
            <Image source={{ uri: currentTrack.img }} style={styles.miniArt} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.miniTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.miniArtist}>{currentTrack.artist}</Text>
            </View>
            <TouchableOpacity onPress={togglePlay} style={styles.playCircle}>
              {isPlaying ? <Pause color="black" size={20} /> : <Play color="black" size={20} />}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  logoText: { color: 'cyan', fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  searchBox: { flexDirection: 'row', backgroundColor: '#0a2a33', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  input: { color: 'white', marginLeft: 10, flex: 1 },
  rowV: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  imgRow: { width: 55, height: 55, borderRadius: 10 },
  trackInfo: { flex: 1, marginLeft: 15 },
  trackText: { color: 'white', fontWeight: 'bold' },
  artistText: { color: '#666', fontSize: 12 },
  miniPlayer: { position: 'absolute', bottom: 20, width: '100%', alignSelf: 'center', borderRadius: 15, overflow: 'hidden' },
  miniPlayerGradient: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  miniArt: { width: 45, height: 45, borderRadius: 8 },
  miniTitle: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  miniArtist: { color: 'cyan', fontSize: 11 },
  playCircle: { backgroundColor: 'cyan', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }
});
