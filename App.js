import 'react-native-gesture-handler'; // IMPORTANTE: Debe ir primero
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, ScrollView, Switch, Animated, StatusBar, Alert, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Play, Pause, Search, Library, Download, SkipBack, SkipForward, 
  Heart, Settings, Palette, ChevronRight, Globe, Sliders, 
  Music2, Zap, Volume2, Layout, Database, History, Info, Menu
} from 'lucide-react-native';
import axios from 'axios';

const Drawer = createDrawerNavigator();
const { width } = Dimensions.get('window');

// --- MOTOR DE AUDIO GLOBAL ---
let globalSound = new Audio.Sound();
const INVIDIOUS_INSTANCE = "https://inv.tux.pizza"; 

const initialSettings = {
  language: 'Español',
  audioQuality: 'Alta (320kbps)',
  downloadQuality: 'Alta (320kbps)',
  isDynamic: true,
  offlineCache: true,
};

// --- LOGO ANIMADO NITRAXX ---
const AnimatedLogo = () => {
  const waveAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: waveAnim }] }}>
      <Image source={require('./assets/icon.png')} style={styles.logoImg} />
    </Animated.View>
  );
};

// --- PANTALLA: DISCOVER ---
function HomeScreen({ route }) {
  const { playTrack } = route.params;
  const [loading, setLoading] = useState(true);

  const discoverTracks = [
    { id: 'oGpFcHTxjZs', title: "What's Love Got to Do wit...", artist: 'Tina Turner', img: 'https://i.ytimg.com/vi/oGpFcHTxjZs/hqdefault.jpg' },
    { id: '4zAThXFOy2c', title: 'Tennessee Whiskey', artist: 'Chris Stapleton', img: 'https://i.ytimg.com/vi/4zAThXFOy2c/hqdefault.jpg' },
    { id: 'hLQl3WQQoQ0', title: 'Someone Like You', artist: 'Adele', img: 'https://i.ytimg.com/vi/hLQl3WQQoQ0/hqdefault.jpg' },
  ];

  const essentials = [
    { id: 'kJQP7kiw5Fk', title: "Pop's Biggest Hits", artist: 'Top Artists', img: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
    { id: '1w7OgIMMRc4', title: "Classic Rock", artist: 'Led Zeppelin & More', img: 'https://i.ytimg.com/vi/1w7OgIMMRc4/hqdefault.jpg' },
  ];

  useEffect(() => { setTimeout(() => setLoading(false), 2000); }, []);

  if (loading) return <View style={styles.loaderContainer}><AnimatedLogo /><Text style={styles.loadText}>NITRAXX MUSIC</Text></View>;

  return (
    <LinearGradient colors={['#01161d', '#000']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.secTitle}>Discover</Text>
        {discoverTracks.map(item => (
          <TouchableOpacity key={item.id} style={styles.rowV} onPress={() => playTrack(item)}>
            <Image source={{ uri: item.img }} style={styles.imgRow} />
            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={styles.trackText} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.artistText}>{item.artist}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={[styles.secTitle, { marginTop: 30 }]}>All-time essentials</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {essentials.map(item => (
            <TouchableOpacity key={item.id} style={styles.cardH} onPress={() => playTrack(item)}>
              <Image source={{ uri: item.img }} style={styles.imgCard} />
              <Text style={styles.trackText} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.artistText}>{item.artist}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </LinearGradient>
  );
}

// --- PANTALLA: BUSCADOR ---
function SearchScreen({ route }) {
  const { playTrack } = route.params;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchAction = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await axios.get(`${INVIDIOUS_INSTANCE}/api/v1/search?q=${query}&type=video`);
      const formatted = res.data.map((item, index) => ({
        id: item.videoId,
        title: item.title,
        artist: item.author,
        img: item.videoThumbnails[0].url,
        type: index < 2 ? 'Spotify Playlist' : 'Song',
      }));
      setResults(formatted);
    } catch (e) { Alert.alert("Nitraxx", "Servidor ocupado, intenta de nuevo."); }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.searchBox}>
        <Search color="cyan" size={20} />
        <TextInput placeholder="Busca en Spotify, YouTube o Amazon..." placeholderTextColor="#444" style={styles.input} onChangeText={setQuery} onSubmitEditing={searchAction} />
      </View>
      {loading ? <ActivityIndicator color="cyan" size="large" /> : (
        <FlatList data={results} keyExtractor={(item) => item.id} renderItem={({item}) => (
          <TouchableOpacity style={styles.rowV} onPress={() => playTrack(item)}>
            <Image source={{ uri: item.img }} style={styles.imgRow} />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.trackText} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.artistText}>{item.artist} • {item.type}</Text>
            </View>
            <Download color="#222" size={18} />
          </TouchableOpacity>
        )} />
      )}
    </View>
  );
}

// --- MODAL SELECTOR ---
const OptionSelector = ({ visible, onClose, title, options, onSelect }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        {options.map(opt => (
          <TouchableOpacity key={opt} style={styles.modalOpt} onPress={() => { onSelect(opt); onClose(); }}>
            <Text style={{color: 'white', fontSize: 16}}>{opt}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={{color: 'cyan'}}>Cerrar</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// --- PANTALLA: AJUSTES ---
function SettingsScreen() {
  const [config, setConfig] = useState(initialSettings);
  const [modalType, setModalType] = useState(null);

  const SettingRow = ({ icon: Icon, title, sub, onPress, hasSwitch, value }) => (
    <TouchableOpacity style={styles.setRow} onPress={onPress}>
      <View style={styles.setIconBg}><Icon color="cyan" size={20} /></View>
      <View style={styles.setInfo}>
        <Text style={styles.setText}>{title}</Text>
        {sub && <Text style={styles.subText}>{sub}</Text>}
      </View>
      {hasSwitch ? <Switch value={value} onValueChange={onPress} /> : <ChevronRight color="#333" />}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#01161d', '#000']} style={styles.container}>
      <Text style={styles.mainTitle}>Settings</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.groupLabel}>Personalisation</Text>
        <SettingRow icon={Palette} title="Theme Mode" sub="Dynamic" hasSwitch value={config.isDynamic} onPress={() => setConfig({...config, isDynamic: !config.isDynamic})} />
        <SettingRow icon={Globe} title="Language" sub={config.language} onPress={() => setModalType('lang')} />
        
        <Text style={styles.groupLabel}>Music & Playback</Text>
        <SettingRow icon={Sliders} title="Equalizer" sub="Normal" />
        <SettingRow icon={Music2} title="Audio Quality" sub={config.audioQuality} onPress={() => setModalType('qual')} />

        <Text style={styles.groupLabel}>Download</Text>
        <SettingRow icon={Download} title="Enable Download" sub="Local Storage" hasSwitch value={config.offlineCache} onPress={() => setConfig({...config, offlineCache: !config.offlineCache})} />
        <SettingRow icon={Info} title="Version" sub="v1.7.0 (Professional)" />
      </ScrollView>

      <OptionSelector visible={modalType === 'lang'} onClose={() => setModalType(null)} title="Idioma" options={['Español', 'English']} onSelect={(val) => setConfig({...config, language: val})} />
      <OptionSelector visible={modalType === 'qual'} onClose={() => setModalType(null)} title="Calidad" options={['128kbps', '320kbps (Alta)']} onSelect={(val) => setConfig({...config, audioQuality: val})} />
    </LinearGradient>
  );
}

// --- APP CORE ---
export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (track) => {
    try {
      const status = await globalSound.getStatusAsync();
      if (status.isLoaded) await globalSound.unloadAsync();
      setCurrentTrack(track);
      setIsPlaying(true);
      const audioUrl = `${INVIDIOUS_INSTANCE}/latest_version?id=${track.id}&itag=140`;
      await globalSound.loadAsync({ uri: audioUrl }, {}, true);
      await globalSound.playAsync();
    } catch (e) {
      Alert.alert("Nitraxx", "Error al cargar audio.");
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) await globalSound.pauseAsync();
    else await globalSound.playAsync();
    setIsPlaying(!isPlaying);
  };

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <Drawer.Navigator screenOptions={{
        headerShown: true,
        headerTitle: "NITRAXX MUSIC",
        headerStyle: { backgroundColor: '#01161d' },
        headerTintColor: 'cyan',
        drawerStyle: { backgroundColor: '#000', width: 250 },
        drawerActiveTintColor: 'cyan',
        drawerInactiveTintColor: '#888',
      }}>
        <Drawer.Screen name="Discover" component={HomeScreen} initialParams={{ playTrack: handlePlay }} options={{ drawerIcon: ({color}) => <Library color={color} size={20}/> }} />
        <Drawer.Screen name="Search" component={SearchScreen} initialParams={{ playTrack: handlePlay }} options={{ drawerIcon: ({color}) => <Search color={color} size={20}/> }} />
        <Drawer.Screen name="Settings" component={SettingsScreen} options={{ drawerIcon: ({color}) => <Settings color={color} size={20}/> }} />
      </Drawer.Navigator>

      {currentTrack && (
        <TouchableOpacity style={styles.miniPlayer} onPress={togglePlay}>
          <Image source={{ uri: currentTrack.img }} style={styles.miniArt} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.miniTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.miniArtist}>{currentTrack.artist}</Text>
          </View>
          {isPlaying ? <Pause color="white" fill="white" size={24} /> : <Play color="white" fill="white" size={24} />}
        </TouchableOpacity>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  loaderContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadText: { color: 'cyan', marginTop: 25, letterSpacing: 5, fontWeight: 'bold' },
  logoImg: { width: 100, height: 100, borderRadius: 25 },
  secTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginVertical: 15 },
  rowV: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  imgRow: { width: 55, height: 55, borderRadius: 10 },
  trackText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  artistText: { color: '#888', fontSize: 12 },
  cardH: { width: 140, marginRight: 15 },
  imgCard: { width: 140, height: 140, borderRadius: 15, marginBottom: 8 },
  searchBox: { flexDirection: 'row', backgroundColor: '#111', padding: 12, borderRadius: 12, alignItems: 'center', marginVertical: 10 },
  input: { color: 'white', marginLeft: 10, flex: 1 },
  miniPlayer: { position: 'absolute', bottom: 20, width: '94%', left: '3%', backgroundColor: '#02252e', borderRadius: 15, padding: 10, flexDirection: 'row', alignItems: 'center', elevation: 10 },
  miniArt: { width: 45, height: 45, borderRadius: 8 },
  miniTitle: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  miniArtist: { color: 'cyan', fontSize: 11 },
  mainTitle: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  groupLabel: { color: 'cyan', fontSize: 12, fontWeight: 'bold', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  setIconBg: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#02252e', justifyContent: 'center', alignItems: 'center' },
  setInfo: { flex: 1, marginLeft: 15 },
  setText: { color: 'white', fontSize: 16 },
  subText: { color: '#666', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#111', borderRadius: 20, padding: 20 },
  modalTitle: { color: 'cyan', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalOpt: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  closeBtn: { marginTop: 15, alignSelf: 'center' }
});
