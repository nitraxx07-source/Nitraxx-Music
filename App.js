import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Play, Pause, Search, Library, Download, Heart, SkipForward, SkipBack } from 'lucide-react-native';
import axios from 'axios';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// --- MOTOR DE AUDIO CON CROSSFADE ---
let soundObject = new Audio.Sound();

function PlayerScreen({ route }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack] = useState(route?.params?.track || { title: "Nitraxx Music", uploaderName: "Listo para sonar" });
  
  useEffect(() => {
    if (route?.params?.track) {
      setTrack(route.params.track);
      managePlayback(route.params.track);
    }
  }, [route?.params?.track]);

  const managePlayback = async (item) => {
    try {
      const videoId = item.url.split('=')[1];
      const fileUri = `${FileSystem.documentDirectory}${videoId}.mp3`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      await soundObject.unloadAsync();

      let source = { uri: `https://pipedapi.kavin.rocks/streams/${videoId}` };
      
      // Si ya existe localmente, usamos el archivo del celular (Offline)
      if (fileInfo.exists) {
        source = { uri: fileUri };
        console.log("Reproduciendo desde memoria interna (Sin Internet)");
      }

      await soundObject.loadAsync(source, { shouldPlay: true });
      
      // Lógica de CROSSFADE (Efecto de fundido al iniciar)
      await soundObject.setVolumeAsync(0);
      setIsPlaying(true);
      await soundObject.playAsync();
      
      // Sube el volumen gradualmente en 2 segundos
      for (let v = 0; v <= 1; v += 0.1) {
        await soundObject.setVolumeAsync(v);
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (e) { console.log(e); }
  };

  const downloadTrack = async (item) => {
    const videoId = item.url.split('=')[1];
    const fileUri = `${FileSystem.documentDirectory}${videoId}.mp3`;
    const downloadUrl = `https://pipedapi.kavin.rocks/streams/${videoId}`;

    try {
      const downloadRes = await FileSystem.downloadAsync(downloadUrl, fileUri);
      Alert.alert("Nitraxx Music", "Canción guardada para escuchar sin internet.");
    } catch (e) { Alert.alert("Error", "No se pudo descargar."); }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: track.thumbnail }} style={styles.mainArt} />
      <Text style={styles.tTitle}>{track.title}</Text>
      <Text style={styles.tArtist}>{track.uploaderName}</Text>
      
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => downloadTrack(track)}>
          <Download color="cyan" size={30} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playBtn} onPress={async () => {
          isPlaying ? await soundObject.pauseAsync() : await soundObject.playAsync();
          setIsPlaying(!isPlaying);
        }}>
          {isPlaying ? <Pause color="black" fill="black" /> : <Play color="black" fill="black" />}
        </TouchableOpacity>
        <Heart color="white" size={30} />
      </View>
    </View>
  );
}

// --- BUSCADOR ---
function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = async () => {
    const res = await axios.get(`https://pipedapi.kavin.rocks/search?q=${query}&filter=music_songs`);
    setResults(res.data.items);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput 
          placeholder="Busca en Nitraxx (YT/Spotify)..." 
          placeholderTextColor="#444" 
          style={styles.input}
          onChangeText={setQuery}
          onSubmitEditing={search}
        />
      </View>
      <FlatList 
        data={results}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Player', { track: item })}>
            <Image source={{ uri: item.thumbnail }} style={styles.miniArt} />
            <View style={{flex: 1, marginLeft: 10}}>
              <Text style={{color: 'white'}} numberOfLines={1}>{item.title}</Text>
              <Text style={{color: 'gray'}}>{item.uploaderName}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#000' }, tabBarActiveTintColor: 'cyan' }}>
        <Tab.Screen name="Player" component={PlayerScreen} options={{ tabBarIcon: ({color}) => <Library color={color} /> }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 25, paddingTop: 60 },
  mainArt: { width: width - 50, height: width - 50, borderRadius: 20 },
  tTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  tArtist: { color: 'cyan', fontSize: 16 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 40 },
  playBtn: { backgroundColor: 'cyan', padding: 20, borderRadius: 50 },
  searchBar: { backgroundColor: '#111', padding: 15, borderRadius: 10, marginBottom: 20 },
  input: { color: 'white' },
  row: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  miniArt: { width: 50, height: 50, borderRadius: 5 }
});
