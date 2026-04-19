import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, ScrollView, Switch, Animated, Modal, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Play, Pause, Search, Library, Download, SkipBack, SkipForward, 
  Heart, Settings, Palette, ChevronRight, Globe, Sliders, 
  Music2, Check, Zap, ListMusic, Volume2 
} from 'lucide-react-native';
import axios from 'axios';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const { width, height } = Dimensions.get('window');

// Motor de Audio Global
let soundObject = new Audio.Sound();

// --- LOGO ANIMADO NITRAXX (Efecto Olas) ---
const AnimatedLogo = () => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  }, []);
  const scale = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Image source={require('./assets/icon.png')} style={styles.logoImg} />
    </Animated.View>
  );
};

// --- PANTALLA PRINCIPAL (ESTILO HARMONY / SPOTIFY) ---
function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 2000); }, []);

  const sections = [
    { title: "Quick Picks", data: [
      { id: '1', title: 'Si Antes Te Hubiera Co...', artist: 'KAROL G', img: 'https://i.ytimg.com/vi/5S_6Z_Z3_XI/hqdefault.jpg', provider: 'YouTube' },
      { id: '2', title: 'Flowers', artist: 'Miley Cyrus', img: 'https://i.ytimg.com/vi/G7KNmW9a75Y/hqdefault.jpg', provider: 'Spotify' },
      { id: '3', title: 'Stay', artist: 'Justin Bieber', img: 'https://i.ytimg.com/vi/kTJczUoc26U/hqdefault.jpg', provider: 'Amazon Music' }
    ]},
    { title: "Morning boost", horizontal: true, data: [
      { id: 'a', title: 'Spanish Pop hits', playlist: 'Pop Hits 2026', img: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
      { id: 'b', title: 'Rock Essentials', playlist: 'The Classics', img: 'https://i.ytimg.com/vi/1w7OgIMMRc4/hqdefault.jpg' }
    ]}
  ];

  if (loading) return (
    <View style={styles.loaderContainer}>
      <AnimatedLogo />
      <Text style={styles.loadText}>NITRAXX MUSIC PRO</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#021217', '#000']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <Text style={styles.mainTitle}>Nitraxx</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}><Settings color="white" /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map(sec => (
          <View key={sec.title} style={{ marginBottom: 30 }}>
            <Text style={styles.secTitle}>{sec.title}</Text>
            <FlatList 
              horizontal={sec.horizontal}
              data={sec.data}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <TouchableOpacity style={sec.horizontal ? styles.cardH : styles.rowV} onPress={() => navigation.navigate('Player', { track: item })}>
                  <Image source={{ uri: item.img }} style={sec.horizontal ? styles.imgCard : styles.imgRow} />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={styles.trackText} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.artistText}>{item.artist || item.playlist} • {item.provider || 'Nitraxx'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

// --- BUSCADOR GLOBAL ---
function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const onSearch = async () => {
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
      <View style={styles.searchBox}>
        <Search color="cyan" size={20} />
        <TextInput 
          style={styles.input} 
          placeholder="YouTube, Spotify, Amazon, Local..." 
          placeholderTextColor="#444"
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
        />
      </View>
      {loading ? <ActivityIndicator color="cyan" size="large" /> : (
        <FlatList 
          data={results} 
          keyExtractor={item => item.url}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.rowV} onPress={() => navigation.navigate('Player', { track: { title: item.title, artist: item.uploaderName, img: item.thumbnail, id: item.url.split('=')[1] } })}>
              <Image source={{ uri: item.thumbnail }} style={styles.imgRow} />
              <View style={{ marginLeft: 15, flex: 1 }}>
                <Text style={styles.trackText}>{item.title}</Text>
                <Text style={styles.artistText}>{item.uploaderName}</Text>
              </View>
              <Zap color="#111" size={16} />
            </TouchableOpacity>
          )} 
        />
      )}
    </View>
  );
}

// --- PANTALLA DE AJUSTES PREMIUM ---
function SettingsScreen() {
  const [config, setConfig] = useState({ language: 'Español', quality: '320kbps', eq: 'Normal', dynamic: true });
  const [modal, setModal] = useState(null);

  const SettingRow = ({ icon: Icon, title, sub, onPress, hasSwitch, value }) => (
    <TouchableOpacity style={styles.setRow} onPress={onPress}>
      <Icon color="cyan" size={22} />
      <View style={styles.setInfo}>
        <Text style={styles.setText}>{title}</Text>
        <Text style={styles.subText}>{sub}</Text>
      </View>
      {hasSwitch ? <Switch value={value} onValueChange={onPress} /> : <ChevronRight color="#333" />}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#021217', '#000']} style={styles.container}>
      <Text style={styles.mainTitle}>Ajustes</Text>
      <ScrollView>
        <Text style={styles.groupLabel}>Preferencia</Text>
        <SettingRow icon={Globe} title="Idioma" sub={config.language} onPress={() => setModal('lang')} />
        
        <Text style={styles.groupLabel}>Calidad de Audio</Text>
        <SettingRow icon={Music2} title="Calidad de descarga" sub={config.quality} onPress={() => setModal('qual')} />
        <SettingRow icon={Sliders} title="Ecualizador" sub={config.eq} onPress={() => setModal('eq')} />
        
        <Text style={styles.groupLabel}>Interfaz</Text>
        <SettingRow icon={Palette} title="Colores Dinámicos" sub="Estilo Harmony Music" hasSwitch value={config.dynamic} onPress={() => setConfig({...config, dynamic: !config.dynamic})} />
      </ScrollView>

      {/* MODAL SIMULADO PARA SELECCIÓN */}
      <Modal visible={modal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Opción</Text>
            <TouchableOpacity onPress={() => setModal(null)} style={styles.closeBtn}><Text style={{color: 'cyan'}}>Cerrar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// --- REPRODUCTOR ( PLAYER ) ---
function PlayerScreen({ route }) {
  const { track } = route.params || {};
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <LinearGradient colors={['#052a36', '#000']} style={styles.container}>
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <Image source={{ uri: track?.img || 'https://i.ytimg.com/vi/5S_6Z_Z3_XI/hqdefault.jpg' }} style={styles.playerArt} />
        <View style={styles.playerInfo}>
          <Text style={styles.pTitle}>{track?.title || "Nitraxx Master"}</Text>
          <Text style={styles.pArtist}>{track?.artist || "Desconocido"}</Text>
        </View>
        <View style={styles.pControls}>
          <SkipBack color="white" size={40} fill="white" />
          <TouchableOpacity style={styles.mainPlay} onPress={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause color="black" size={35} fill="black" /> : <Play color="black" size={35} fill="black" />}
          </TouchableOpacity>
          <SkipForward color="white" size={40} fill="white" />
        </View>
      </View>
    </LinearGradient>
  );
}

// --- NAVEGACIÓN ---
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0, height: 70, paddingBottom: 10 },
        tabBarActiveTintColor: 'cyan',
        tabBarInactiveTintColor: '#444'
      }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({color}) => <Library color={color} /> }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
        <Tab.Screen name="Player" component={PlayerScreen} options={{ tabBarIcon: ({color}) => <Volume2 color={color} /> }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({color}) => <Settings color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  loaderContainer: { flex: 1, backgroundColor: '#021217', justifyContent: 'center', alignItems: 'center' },
  loadText: { color: 'cyan', marginTop: 20, letterSpacing: 4, fontWeight: 'bold' },
  logoImg: { width: 100, height: 100, borderRadius: 25 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  mainTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  secTitle: { color: 'cyan', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  searchBox: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 25 },
  input: { color: '#fff', marginLeft: 15, flex: 1 },
  rowV: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  imgRow: { width: 55, height: 55, borderRadius: 10 },
  cardH: { width: 160, marginRight: 20 },
  imgCard: { width: 160, height: 160, borderRadius: 20 },
  trackText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  artistText: { color: '#888', fontSize: 13 },
  groupLabel: { color: 'cyan', fontSize: 12, fontWeight: 'bold', marginBottom: 15, marginTop: 25, textTransform: 'uppercase' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  setInfo: { flex: 1, marginLeft: 15 },
  setText: { color: '#fff', fontSize: 16 },
  subText: { color: '#666', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#111', borderRadius: 20, padding: 30 },
  modalTitle: { color: '#fff', fontSize: 20, marginBottom: 20 },
  playerArt: { width: width * 0.8, height: width * 0.8, borderRadius: 25 },
  playerInfo: { marginTop: 30, alignItems: 'center' },
  pTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  pArtist: { color: 'cyan', fontSize: 18, marginTop: 5 },
  pControls: { flexDirection: 'row', alignItems: 'center', marginTop: 40, width: '80%', justifyContent: 'space-between' },
  mainPlay: { backgroundColor: 'cyan', padding: 20, borderRadius: 50 }
});
