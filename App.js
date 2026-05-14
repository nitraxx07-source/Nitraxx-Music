import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useState, useEffect, Component } from 'react';
import { 
  StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, 
  ActivityIndicator, Switch, StatusBar, Alert 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Play, Pause, Search, Download, Settings, Zap
} from 'lucide-react-native';
import axios from 'axios';

// --- TRUCO PARA ELIMINAR LA PANTALLA ROJA (TextImpl) ---
// Convertimos los iconos en Clases para que Reanimated los acepte
class SearchIcon extends Component { render() { return <Search color={this.props.color} size={20} /> } }
class ZapIcon extends Component { render() { return <Zap color={this.props.color} size={20} /> } }
class SettingsIcon extends Component { render() { return <Settings color={this.props.color} size={20} /> } }

const Drawer = createDrawerNavigator();
const INVIDIOUS_INSTANCE = "https://inv.tux.pizza"; 

let globalSound = new Audio.Sound();

function SettingsScreen({ skipSilence, setSkipSilence }) {
  return (
    <View style={[styles.container, {backgroundColor: '#000'}]}>
      <Text style={styles.mainTitle}>Configuración</Text>
      <View style={styles.setRow}>
        <View style={styles.setInfo}>
          <Text style={styles.setText}>Gapless Playback</Text>
          <Text style={styles.subText}>Cortar silencio entre canciones</Text>
        </View>
        <Switch 
          value={skipSilence} 
          onValueChange={setSkipSilence} 
          trackColor={{ true: 'cyan' }} 
        />
      </View>
    </View>
  );
}

export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [skipSilence, setSkipSilence] = useState(true);
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
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    }
    setLoading(false);
  };

  const handlePlay = async (track) => {
    try {
      const status = await globalSound.getStatusAsync();
      if (status.isLoaded) await globalSound.unloadAsync();
      
      setCurrentTrack(track);
      setIsPlaying(true);
      
      await globalSound.loadAsync(
        { uri: track.url },
        { shouldPlay: true },
        true
      );
    } catch (e) {
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) await globalSound.pauseAsync();
    else await globalSound.playAsync();
    setIsPlaying(!isPlaying);
  };

  function SearchScreen() {
    return (
      <LinearGradient colors={['#01161d', '#000']} style={styles.container}>
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
          <ActivityIndicator color="cyan" style={{marginTop: 20}} />
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
                <Download color="#222" size={20} />
              </TouchableOpacity>
            )}
          />
        )}
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <Drawer.Navigator screenOptions={{
        headerStyle: { backgroundColor: '#01161d' },
        headerTintColor: 'cyan',
        drawerStyle: { backgroundColor: '#000', width: 260 },
        drawerActiveTintColor: 'cyan',
        drawerInactiveTintColor: '#555',
      }}>
        <Drawer.Screen 
          name="Buscador" 
          component={SearchScreen} 
          options={{ drawerIcon: ({color}) => <SearchIcon color={color} /> }} 
        />
        <Drawer.Screen 
          name="Descubrir" 
          component={View} 
          options={{ drawerIcon: ({color}) => <ZapIcon color={color} /> }} 
        />
        <Drawer.Screen name="Ajustes" options={{ drawerIcon: ({color}) => <SettingsIcon color={color} /> }}>
          {props => <SettingsScreen {...props} skipSilence={skipSilence} setSkipSilence={setSkipSilence} />}
        </Drawer.Screen>
      </Drawer.Navigator>

      {currentTrack && (
        <View style={styles.miniPlayer}>
          <LinearGradient colors={['#02252e', '#01161d']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.miniPlayerGradient}>
            <Image source={{ uri: currentTrack.img }} style={styles.miniArt} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.miniTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.miniArtist}>{currentTrack.artist}</Text>
            </View>
            <TouchableOpacity onPress={togglePlay} style={styles.playCircle}>
              {isPlaying ? <Pause color="black" fill="black" size={20} /> : <Play color="black" fill="black" size={20} />}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  searchBox: { flexDirection: 'row', backgroundColor: '#0a2a33', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  input: { color: 'white', marginLeft: 10, flex: 1 },
  rowV: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  imgRow: { width: 55, height: 55, borderRadius: 10 },
  trackInfo: { flex: 1, marginLeft: 15 },
  trackText: { color: 'white', fontWeight: 'bold' },
  artistText: { color: '#666', fontSize: 12 },
  miniPlayer: { position: 'absolute', bottom: 10, width: '96%', left: '2%', borderRadius: 15, overflow: 'hidden' },
  miniPlayerGradient: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  miniArt: { width: 45, height: 45, borderRadius: 8 },
  miniTitle: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  miniArtist: { color: 'cyan', fontSize: 11 },
  playCircle: { backgroundColor: 'cyan', width: 35, height: 35, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  mainTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 25 },
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  setInfo: { flex: 1 },
  setText: { color: 'white', fontSize: 16 },
  subText: { color: '#555', fontSize: 12 }
});
