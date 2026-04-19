import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Search, Settings, Library, SkipBack, SkipForward, Heart, Download, Music } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// --- LÓGICA GLOBAL DE AUDIO ---
let playbackInstance = null;

function PlayerScreen({ route }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(route?.params?.track || {
    title: "Nitraxx Music",
    artist: "Busca una canción",
    thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800"
  });

  useEffect(() => {
    if (route?.params?.track) {
      setCurrentTrack(route.params.track);
      playTrack(route.params.track.url);
    }
  }, [route?.params?.track]);

  async function playTrack(url) {
    if (playbackInstance) await playbackInstance.unloadAsync();
    const { sound } = await Audio.Sound.createAsync(
      { uri: `https://pipedapi.kavin.rocks/streams/${url.split('=')[1]}` }, // Stream directo
      { shouldPlay: true }
    );
    playbackInstance = sound;
    setIsPlaying(true);
  }

  return (
    <LinearGradient colors={['#000044', '#000']} style={styles.container}>
      <Text style={styles.nowPlaying}>EN REPRODUCCIÓN</Text>
      <Image source={{ uri: currentTrack.thumbnail }} style={styles.mainArt} />
      <View style={styles.infoArea}>
        <Text style={styles.mTitle}>{currentTrack.title}</Text>
        <Text style={styles.mArtist}>{currentTrack.uploaderName || currentTrack.artist}</Text>
      </View>
      <View style={styles.mainControls}>
        <SkipBack color="white" size={35} />
        <TouchableOpacity style={styles.playCircle} onPress={async () => {
          if (isPlaying) { await playbackInstance.pauseAsync(); } 
          else { await playbackInstance.playAsync(); }
          setIsPlaying(!isPlaying);
        }}>
          {isPlaying ? <Pause color="black" size={30} fill="black" /> : <Play color="black" size={30} fill="black" />}
        </TouchableOpacity>
        <SkipForward color="white" size={35} />
      </View>
    </LinearGradient>
  );
}

function SearchScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Si el link es de Spotify, aquí se activaría el convertidor (lógica simplificada)
      const isSpotify = searchText.includes('spotify.com');
      const query = isSpotify ? "Spotify Playlist Import" : searchText; 
      
      const res = await axios.get(`https://pipedapi.kavin.rocks/search?q=${searchText}&filter=music_songs`);
      setResults(res.data.items);
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const saveToLibrary = async (item) => {
    try {
      const existing = await AsyncStorage.getItem('@my_library');
      let library = existing ? JSON.parse(existing) : [];
      library.push(item);
      await AsyncStorage.setItem('@my_library', JSON.stringify(library));
      alert("Guardado en tu Biblioteca");
    } catch (e) { console.log(e); }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.searchBox}>
        <TextInput 
          placeholder="Busca o pega link de Spotify/YT" 
          placeholderTextColor="#555" 
          style={styles.input}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch}><Search color="cyan" /></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="cyan" /> : (
        <FlatList 
          data={results}
          keyExtractor={(item) => item.url}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.resItem} onPress={() => navigation.navigate('Inicio', { track: item })}>
              <Image source={{ uri: item.thumbnail }} style={styles.miniArt} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }} numberOfLines={1}>{item.title}</Text>
                <Text style={{ color: 'gray' }}>{item.uploaderName}</Text>
              </View>
              <TouchableOpacity onPress={() => saveToLibrary(item)}><Heart color="cyan" size={20} /></TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  nowPlaying: { color: 'cyan', textAlign: 'center', letterSpacing: 3, marginBottom: 20, fontWeight: 'bold' },
  mainArt: { width: width - 40, height: width - 40, borderRadius: 20 },
  infoArea: { marginTop: 25 },
  mTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  mArtist: { color: 'cyan', fontSize: 16, marginTop: 5 },
  mainControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 40 },
  playCircle: { backgroundColor: 'cyan', padding: 20, borderRadius: 50 },
  searchBox: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  input: { color: 'white', flex: 1 },
  resItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#0a0a0a', padding: 10, borderRadius: 10 },
  miniArt: { width: 50, height: 50, borderRadius: 5 }
});
