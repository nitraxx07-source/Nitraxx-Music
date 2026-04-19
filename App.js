import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Search, Library, Download, SkipBack, SkipForward, Heart, Settings } from 'lucide-react-native';
import axios from 'axios';
import ImageColors from 'react-native-image-colors';
import Slider from 'react-native-slider';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Motor de Audio Global
let soundObject = new Audio.Sound();

function PlayerScreen({ route }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState(['#000044', '#000000']);
  const [track, setTrack] = useState(route?.params?.track || {
    title: "Nitraxx Music",
    uploaderName: "Listo para sonar",
    thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800",
    url: "default"
  });

  useEffect(() => {
    if (route?.params?.track) {
      setTrack(route.params.track);
      managePlayback(route.params.track);
      extractColors(route.params.track.thumbnail);
    }
  }, [route?.params?.track]);

  const extractColors = async (uri) => {
    const result = await ImageColors.getColors(uri, { fallback: '#000044' });
    if (result.platform === 'android') setTheme([result.dominant, '#000000']);
  };

  const managePlayback = async (item) => {
    try {
      const videoId = item.url.includes('=') ? item.url.split('=')[1] : 'default';
      const fileUri = `${FileSystem.documentDirectory}${videoId}.mp3`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      await soundObject.unloadAsync();
      let source = fileInfo.exists ? { uri: fileUri } : { uri: `https://pipedapi.kavin.rocks/streams/${videoId}` };

      await soundObject.loadAsync(source, { shouldPlay: true });
      // Lógica de Crossfade suave al inicio
      await soundObject.setVolumeAsync(0);
      setIsPlaying(true);
      for (let v = 0; v <= 1; v += 0.2) {
        await soundObject.setVolumeAsync(v);
        await new Promise(r => setTimeout(r, 150));
      }
    } catch (e) { console.log(e); }
  };

  const downloadTrack = async () => {
    const videoId = track.url.split('=')[1];
    const fileUri = `${FileSystem.documentDirectory}${videoId}.mp3`;
    try {
      await FileSystem.downloadAsync(`https://pipedapi.kavin.rocks/streams/${videoId}`, fileUri);
      Alert.alert("Nitraxx Music", "Canción descargada para modo offline.");
    } catch (e) { Alert.alert("Error", "No se pudo completar la descarga."); }
  };

  return (
    <LinearGradient colors={theme} style={styles.container}>
      <Text style={styles.headerLabel}>NITRAXX PRO PLAYER</Text>
      <View style={styles.iconSquare}>
        <Image source={{ uri: track.thumbnail }} style={styles.smallIconArt} />
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.trackArtist}>{track.uploaderName}</Text>
      </View>
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={downloadTrack}><Download color="white" size={28} /></TouchableOpacity>
        <SkipBack color="white" size={35} fill="white" />
        <TouchableOpacity style={styles.playCircle} onPress={async () => {
          isPlaying ? await soundObject.pauseAsync() : await soundObject.playAsync();
          setIsPlaying(!isPlaying);
        }}>
          {isPlaying ? <Pause color="black" size={30} fill="black" /> : <Play color="black" size={30} fill="black" />}
        </TouchableOpacity>
        <SkipForward color="white" size={35} fill="white" />
        <Heart color="white" size={28} />
      </View>
    </LinearGradient>
  );
}

function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchAction = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`https://pipedapi.kavin.rocks/search?q=${query}&filter=music_songs`);
      setResults(res.data.items);
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.searchBar}>
        <TextInput placeholder="Busca en Nitraxx..." placeholderTextColor="#444" style={styles.input} onChangeText={setQuery} onSubmitEditing={searchAction} />
        <TouchableOpacity onPress={searchAction}><Search color="cyan" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color="cyan" style={{marginTop: 50}} /> : (
        <FlatList data={results} keyExtractor={(item) => item.url} renderItem={({item}) => (
          <TouchableOpacity style={styles.resCard} onPress={() => navigation.navigate('Player', { track: item })}>
            <Image source={{ uri: item.thumbnail }} style={styles.resArt} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={{color: 'white', fontWeight: 'bold'}} numberOfLines={1}>{item.title}</Text>
              <Text style={{color: 'gray', fontSize: 12}}>{item.uploaderName}</Text>
            </View>
          </TouchableOpacity>
        )} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0 }, tabBarActiveTintColor: 'cyan' }}>
        <Tab.Screen name="Player" component={PlayerScreen} options={{ tabBarIcon: ({color}) => <Library color={color} /> }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 60 },
  headerLabel: { color: 'cyan', textAlign: 'center', fontWeight: 'bold', letterSpacing: 4, fontSize: 12, marginBottom: 30 },
  iconSquare: { width: width * 0.7, height: width * 0.7, alignSelf: 'center', backgroundColor: '#000011', borderRadius: 20, padding: 15, elevation: 20, justifyContent: 'center' },
  smallIconArt: { width: '100%', height: '100%', borderRadius: 10, resizeMode: 'contain' },
  infoBox: { marginTop: 30 },
  trackTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  trackArtist: { color: 'cyan', fontSize: 16, marginTop: 4 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  playCircle: { backgroundColor: 'cyan', padding: 20, borderRadius: 50 },
  searchBar: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  input: { color: 'white', flex: 1 },
  resCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#080808', padding: 10, borderRadius: 15 },
  resArt: { width: 50, height: 50, borderRadius: 8 }
});
