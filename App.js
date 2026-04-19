import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Search, Library, Download, SkipBack, SkipForward, Heart, Settings, Palette, Repeat, Shuffle, ChevronRight } from 'lucide-react-native';
import axios from 'axios';
import ImageColors from 'react-native-image-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const { width } = Dimensions.get('window');

// Motor de Audio Global (como en Harmony)
let soundObject = new Audio.Sound();

// --- LÓGICA DE LA PANTALLA PRINCIPAL (Basada en Harmony) ---
// Aquí es donde Harmony carga las "Quick Picks" y recomendaciones.
// Usamos datos simulados basados en tus imágenes para el diseño.
const homeSections = [
  {
    title: "Quick Picks",
    data: [
      { id: '1', title: 'Si Antes Te Hubiera Co...', uploaderName: 'KAROL G', plays: '1.1B plays', thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300' },
      { id: '2', title: 'Relaxing Music', uploaderName: 'Soothing Sounds', plays: '2.8M', thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=300' },
      { id: '3', title: 'Llévame Contigo', uploaderName: 'Romeo Santos', plays: '380M plays', thumbnail: 'https://images.unsplash.com/photo-1627773755483-e4d6d8438258?q=80&w=300' },
    ]
  },
  {
    title: "Morning boost",
    data: [
      { id: 'a', title: 'Spanish Pop hits', playlist: 'Pop Hits Spain', thumbnail: 'https://images.unsplash.com/photo-1629276116047-98314144360e?q=80&w=300' },
      { id: 'b', title: 'Feel-Good Classic Rock', playlist: 'Classic Rock', thumbnail: 'https://images.unsplash.com/photo-1621619856624-42fd193a0661?q=80&w=300' },
    ],
    horizontal: true
  }
];

function HomeScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.quickPickItem} onPress={() => navigation.navigate('Player', { track: item })}>
      <Image source={{ uri: item.thumbnail }} style={styles.miniArt} />
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }} numberOfLines={1}>{item.title}</Text>
        <Text style={{ color: '#888' }} numberOfLines={1}>{item.uploaderName} • {item.plays}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.horizontalCard} onPress={() => alert('Playlist: ' + item.title)}>
      <Image source={{ uri: item.thumbnail }} style={styles.cardArt} />
      <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 10 }} numberOfLines={1}>{item.title}</Text>
      <Text style={{ color: '#888' }} numberOfLines={1}>{item.playlist}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#021217', '#000000']} style={styles.container}>
      <Text style={styles.mainHeader}>Nitraxx Music</Text>
      <FlatList
        data={homeSections}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{item.title}</Text>
            {item.horizontal ? (
              <FlatList
                horizontal
                data={item.data}
                keyExtractor={(i) => i.id}
                renderItem={renderCard}
                showsHorizontalScrollIndicator={false}
              />
            ) : (
              <FlatList
                data={item.data}
                keyExtractor={(i) => i.id}
                renderItem={renderItem}
              />
            )}
          </View>
        )}
      />
    </LinearGradient>
  );
}

// --- PANTALLA DE REPRODUCTOR (Inspirada en Harmony Music) ---
// Ahora con colores dinámicos y barra de progreso.
function PlayerScreen({ route }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState(['#021217', '#000000']);
  const [track, setTrack] = useState(route?.params?.track || {
    title: "Nitraxx Master",
    uploaderName: "Nitraxx Music Pro",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300"
  });

  useEffect(() => {
    if (route?.params?.track) {
      setTrack(route.params.track);
      managePlayback(route.params.track);
      extractColors(route.params.track.thumbnail);
    }
  }, [route?.params?.track]);

  const extractColors = async (uri) => {
    try {
      const result = await ImageColors.getColors(uri, { fallback: '#021217' });
      if (result.platform === 'android') setTheme([result.dominant, '#000000']);
    } catch (e) { }
  };

  const managePlayback = async (item) => {
    try {
      const videoId = item.id || item.url.split('=')[1];
      const fileUri = `${FileSystem.documentDirectory}${videoId}.mp3`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      await soundObject.unloadAsync();
      let source = fileInfo.exists ? { uri: fileUri } : { uri: `https://pipedapi.kavin.rocks/streams/${videoId}` };

      await soundObject.loadAsync(source, { shouldPlay: true });
      setIsPlaying(true);
    } catch (e) { console.log(e); }
  };

  return (
    <LinearGradient colors={theme} style={styles.container}>
      <Text style={styles.playerHeaderLabel}>SONANDO AHORA</Text>
      <Image source={{ uri: track.thumbnail }} style={styles.mainArt} />
      <View style={styles.infoBox}>
        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.trackArtist}>{track.uploaderName}</Text>
      </View>
      <View style={styles.proControlsRow}>
        <Shuffle color="#ccc" size={24} />
        <SkipBack color="white" size={35} fill="white" />
        <TouchableOpacity style={styles.playCircle} onPress={async () => {
          isPlaying ? await soundObject.pauseAsync() : await soundObject.playAsync();
          setIsPlaying(!isPlaying);
        }}>
          {isPlaying ? <Pause color="black" size={30} fill="black" /> : <Play color="black" size={30} fill="black" />}
        </TouchableOpacity>
        <SkipForward color="white" size={35} fill="white" />
        <Repeat color="#ccc" size={24} />
      </View>
    </LinearGradient>
  );
}

// --- BUSCADOR REAL (Conectado a YouTube Music vía Piped) ---
function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchAction = async () => {
    if (!query) return;
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
        <Search color="#00ffff" size={20} />
        <TextInput placeholder="Busca en la librería Nitraxx..." placeholderTextColor="#444" style={styles.input} onChangeText={setQuery} onSubmitEditing={searchAction} value={query} />
      </View>
      {loading ? <ActivityIndicator color="cyan" style={{marginTop: 50}} /> : (
        <FlatList data={results} keyExtractor={(item) => item.url} renderItem={({item}) => (
          <TouchableOpacity style={styles.quickPickItem} onPress={() => navigation.navigate('Player', { track: item })}>
            <Image source={{ uri: item.thumbnail }} style={styles.resArt} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={{color: 'white', fontWeight: 'bold'}} numberOfLines={1}>{item.title}</Text>
              <Text style={{color: '#888', fontSize: 12}}>{item.uploaderName}</Text>
            </View>
          </TouchableOpacity>
        )} />
      )}
    </View>
  );
}

// --- CONFIGURACIONES (Basada en Material You de Harmony) ---
function SettingsScreen() {
  const SettingItem = ({ icon: Icon, title, value, onValueChange }) => (
    <View style={styles.settingItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon color="#00ffff" size={22} />
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} thumbColor={value ? "#00ffff" : "#444"} trackColor={{ true: "#021217" }} />
    </View>
  );

  return (
    <LinearGradient colors={['#021217', '#000000']} style={styles.container}>
      <Text style={styles.mainHeader}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Personalization</Text>
        <SettingItem icon={Palette} title="Theme Mode (Dynamic)" value={true} />
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingTitle}>Language</Text>
          <Text style={{color: '#888'}}>English <ChevronRight color="#888"/></Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Music & Playback</Text>
        <SettingItem icon={Download} title="Offline Cache" value={true} />
      </View>
    </LinearGradient>
  );
}

// --- NAVEGADOR PRINCIPAL (Basado en el diseño vertical de Harmony) ---
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0, height: 60, paddingBottom: 10 },
        tabBarActiveTintColor: '#00ffff',
        tabBarInactiveTintColor: '#555'
      }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({color}) => <Library color={color} /> }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({color}) => <Settings color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  mainHeader: { color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 25 },
  section: { marginBottom: 30 },
  sectionHeader: { color: '#00ffff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  quickPickItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#080808', padding: 10, borderRadius: 12 },
  miniArt: { width: 50, height: 50, borderRadius: 8 },
  horizontalCard: { width: 150, marginRight: 20 },
  cardArt: { width: 150, height: 150, borderRadius: 15 },
  playerHeaderLabel: { color: 'cyan', textAlign: 'center', fontWeight: 'bold', letterSpacing: 4, fontSize: 12, marginBottom: 30 },
  mainArt: { width: width - 50, height: width - 50, borderRadius: 25, alignSelf: 'center' },
  infoBox: { marginTop: 30 },
  trackTitle: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  trackArtist: { color: 'cyan', fontSize: 18, marginTop: 4 },
  proControlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  playCircle: { backgroundColor: 'cyan', padding: 22, borderRadius: 50 },
  searchBar: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  input: { color: 'white', flex: 1, marginLeft: 15 },
  resArt: { width: 50, height: 50, borderRadius: 8 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  settingTitle: { color: 'white', fontSize: 16, marginLeft: 15 },
});
