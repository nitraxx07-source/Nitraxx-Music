import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, ScrollView, Switch, Animated, Modal, StatusBar, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Play, Pause, Search, Library, Download, SkipBack, SkipForward, 
  Heart, Settings, Palette, ChevronRight, Globe, Sliders, 
  Music2, Zap, Volume2, Layout, Database, History
} from 'lucide-react-native';
import axios from 'axios';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');
let globalSound = new Audio.Sound();

// --- LOGO ORIGINAL NITRAXX ---
const AnimatedLogo = () => {
  const waveAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: waveAnim }] }}>
      <Image source={require('./assets/icon.png')} style={styles.logoImg} />
    </Animated.View>
  );
};

// --- PANTALLA: HOME ---
function HomeScreen({ navigation, route }) {
  const { playTrack } = route.params;
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 1500); }, []);

  const sections = [
    { title: "Quick Picks", data: [
      { id: '5S_6Z_Z3_XI', title: 'Si Antes Te Hubiera Co...', artist: 'KAROL G', img: 'https://i.ytimg.com/vi/5S_6Z_Z3_XI/hqdefault.jpg' },
      { id: 'lFcSrYw-ARY', title: 'Relaxing Music', artist: 'Soothing Sounds', img: 'https://i.ytimg.com/vi/lFcSrYw-ARY/hqdefault.jpg' },
      { id: '6366DxVf-os', title: 'Llévame Contigo', artist: 'Romeo Santos', img: 'https://i.ytimg.com/vi/6366DxVf-os/hqdefault.jpg' }
    ]}
  ];

  if (loading) return <View style={styles.loaderContainer}><AnimatedLogo /><Text style={styles.loadText}>NITRAXX MUSIC</Text></View>;

  return (
    <LinearGradient colors={['#01161d', '#000']} style={styles.container}>
      <View style={styles.header}><Text style={styles.brandText}>Nitraxx</Text><TouchableOpacity onPress={() => navigation.navigate('Settings')}><Settings color="white" /></TouchableOpacity></View>
      <ScrollView>
        {sections.map(sec => (
          <View key={sec.title}>
            <Text style={styles.secTitle}>{sec.title}</Text>
            <FlatList data={sec.data} keyExtractor={item => item.id} renderItem={({item}) => (
              <TouchableOpacity style={styles.rowV} onPress={() => playTrack(item)}>
                <Image source={{ uri: item.img }} style={styles.imgRow} />
                <View style={{ marginLeft: 15, flex: 1 }}>
                  <Text style={styles.trackText}>{item.title}</Text>
                  <Text style={styles.artistText}>{item.artist}</Text>
                </View>
              </TouchableOpacity>
            )} />
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

// --- PANTALLA: BUSCADOR (CORREGIDA PARA QUE NO SE CIERRE) ---
function SearchScreen({ navigation, route }) {
  const { playTrack } = route.params;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchAction = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://pipedapi.kavin.rocks/search?q=${query}&filter=music_songs`);
      setResults(res.data.items || []);
    } catch (e) { Alert.alert("Error", "Servidor ocupado, intenta de nuevo."); }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.searchBox}>
        <Search color="cyan" size={20} />
        <TextInput placeholder="Buscar en Nitraxx..." placeholderTextColor="#444" style={styles.input} onChangeText={setQuery} onSubmitEditing={searchAction} />
      </View>
      {loading ? <ActivityIndicator color="cyan" size="large" /> : (
        <FlatList data={results} keyExtractor={(item, index) => index.toString()} renderItem={({item}) => (
          <TouchableOpacity style={styles.rowV} onPress={() => playTrack({id: item.url.split('=')[1], title: item.title, artist: item.uploaderName, img: item.thumbnail})}>
            <Image source={{ uri: item.thumbnail }} style={styles.imgRow} />
            <View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.trackText}>{item.title}</Text></View>
          </TouchableOpacity>
        )} />
      )}
    </View>
  );
}

// --- PANTALLA: AJUSTES ---
function SettingsScreen() {
  return (
    <LinearGradient colors={['#01161d', '#000']} style={styles.container}>
      <Text style={styles.mainTitle}>Ajustes</Text>
      <ScrollView>
        <Text style={styles.groupLabel}>Audio</Text>
        <View style={styles.setRow}><Music2 color="cyan" /><View style={{flex:1, marginLeft:15}}><Text style={styles.setText}>Calidad</Text><Text style={styles.subText}>320kbps</Text></View></View>
        <View style={styles.setRow}><Sliders color="cyan" /><View style={{flex:1, marginLeft:15}}><Text style={styles.setText}>Ecualizador</Text></View></View>
      </ScrollView>
    </LinearGradient>
  );
}

export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (track) => {
    try {
      const status = await globalSound.getStatusAsync();
      if (status.isLoaded) { await globalSound.unloadAsync(); }
      setCurrentTrack(track);
      setIsPlaying(true);
      // Motor de audio corregido
      await globalSound.loadAsync({ uri: `https://convert.best/api/v1/get_audio_url?video_id=${track.id}` }, {}, true);
      await globalSound.playAsync();
    } catch (e) { Alert.alert("Nitraxx Music", "No se pudo cargar el audio de esta canción."); }
  };

  const togglePlay = async () => {
    if (isPlaying) { await globalSound.pauseAsync(); }
    else { await globalSound.playAsync(); }
    setIsPlaying(!isPlaying);
  };

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarActiveTintColor: 'cyan' }}>
        <Tab.Screen name="Home" component={HomeScreen} initialParams={{ playTrack: handlePlay }} options={{ tabBarIcon: ({color}) => <Library color={color} /> }} />
        <Tab.Screen name="Search" component={SearchScreen} initialParams={{ playTrack: handlePlay }} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({color}) => <Settings color={color} /> }} />
      </Tab.Navigator>
      {currentTrack && (
        <TouchableOpacity style={styles.miniPlayer} onPress={togglePlay}>
          <Image source={{ uri: currentTrack.img }} style={styles.miniArt} />
          <View style={{flex:1, marginLeft:10}}><Text style={styles.miniTitle}>{currentTrack.title}</Text></View>
          {isPlaying ? <Pause color="white" fill="white" /> : <Play color="white" fill="white" />}
        </TouchableOpacity>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  loaderContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadText: { color: 'cyan', marginTop: 20, fontWeight: 'bold' },
  logoImg: { width: 120, height: 120, borderRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  brandText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  secTitle: { color: 'white', fontSize: 18, marginBottom: 15 },
  rowV: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  imgRow: { width: 50, height: 50, borderRadius: 5 },
  trackText: { color: 'white', fontWeight: 'bold' },
  artistText: { color: '#888', fontSize: 12 },
  searchBox: { flexDirection: 'row', backgroundColor: '#111', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  input: { color: 'white', marginLeft: 10, flex: 1 },
  tabBar: { backgroundColor: '#000', height: 60 },
  miniPlayer: { position: 'absolute', bottom: 65, width: '94%', left: '3%', backgroundColor: '#02252e', borderRadius: 12, padding: 8, flexDirection: 'row', alignItems: 'center' },
  miniArt: { width: 40, height: 40, borderRadius: 5 },
  miniTitle: { color: 'white', fontSize: 12 },
  mainTitle: { color: 'white', fontSize: 28, marginBottom: 20 },
  setRow: { flexDirection: 'row', paddingVertical: 15 },
  setText: { color: 'white' },
  subText: { color: '#666', fontSize: 11 },
  groupLabel: { color: 'cyan', fontSize: 12, marginTop: 20 }
});
