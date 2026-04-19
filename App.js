import 'react-native-gesture-handler'; // IMPORTANTE: Debe ir primero
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, ScrollView, Switch, Animated, StatusBar, Alert, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Play, Pause, Search, Library, Download, SkipBack, SkipForward, 
  Heart, Settings, Palette, ChevronRight, Globe, Sliders, 
  Music2, Zap, Volume2, Layout, Database, History, Info
} from 'lucide-react-native';
import axios from 'axios';

const Drawer = createDrawerNavigator();
const { width } = Dimensions.get('window');

// --- MOTOR DE AUDIO GLOBAL Y ESTABLE (Invidious) ---
let globalSound = new Audio.Sound();
const INVIDIOUS_INSTANCE = "https://invidious.snopyta.org"; // Instancia estable

// --- CONFIGURACIÓN DE AJUSTES GLOBALES ---
const initialSettings = {
  language: 'Español',
  audioQuality: 'Alta (320kbps)',
  downloadQuality: 'Alta (320kbps)',
  isDynamic: true,
  offlineCache: true,
};

// --- LOGO ORIGINAL NITRAXX CON EFECTO ---
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

// --- PANTALLA: DISCOVER (HOME) ---
function HomeScreen({ navigation, route }) {
  const { playTrack } = route.params;
  const [loading, setLoading] = useState(true);

  // Datos simulados basados en tu imagen de referencia (image_8.png)
  const discoverTracks = [
    { id: '1', title: "What's Love Got to Do wit...", artist: 'Tina Turner', img: 'https://i.ytimg.com/vi/oGpFcHTxjZs/hqdefault.jpg', provider: 'YouTube' },
    { id: '2', title: 'Tennessee Whiskey', artist: 'Chris Stapleton', img: 'https://i.ytimg.com/vi/4zAThXFOy2c/hqdefault.jpg', provider: 'YouTube' },
    { id: '3', title: 'Someone Like You', artist: 'Adele', img: 'https://i.ytimg.com/vi/hLQl3WQQoQ0/hqdefault.jpg', provider: 'YouTube' },
    { id: '4', title: 'Everything', artist: 'Mary J. Blige', img: 'https://i.ytimg.com/vi/wO6L6i0fMms/hqdefault.jpg', provider: 'Spotify' },
  ];

  const essentials = [
    { id: 'e1', title: "Pop's Biggest Hits", artist: 'Justin Bieber,', img: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
    { id: 'e2', title: "Classic Rock's Greatest Hits", artist: 'Led Zeppelin, The', img: 'https://i.ytimg.com/vi/1w7OgIMMRc4/hqdefault.jpg' },
  ];

  useEffect(() => { setTimeout(() => setLoading(false), 2000); }, []);

  if (loading) return <View style={styles.loaderContainer}><AnimatedLogo /><Text style={styles.loadText}>NITRAXX MUSIC</Text></View>;

  return (
    <LinearGradient colors={['#01161d', '#000']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.secTitle}>Discover</Text>
        <FlatList data={discoverTracks} keyExtractor={item => item.id} renderItem={({item}) => (
          <TouchableOpacity style={styles.rowV} onPress={() => playTrack(item)}>
            <Image source={{ uri: item.img }} style={styles.imgRow} />
            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={styles.trackText} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.artistText}>{item.artist}</Text>
            </View>
          </TouchableOpacity>
        )} />

        <Text style={[styles.secTitle, { marginTop: 30 }]}>All-time essentials</Text>
        <FlatList horizontal data={essentials} keyExtractor={item => item.id} renderItem={({item}) => (
          <TouchableOpacity style={styles.cardH} onPress={() => Alert.alert("Nitraxx", "Playlist no disponible en esta demo")}>
            <Image source={{ uri: item.img }} style={styles.imgCard} />
            <Text style={styles.trackText} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.artistText}>{item.artist}</Text>
          </TouchableOpacity>
        )} />
      </ScrollView>
    </LinearGradient>
  );
}

// --- PANTALLA: BUSCADOR (CORREGIDA Y ESTABLE) ---
function SearchScreen({ navigation, route }) {
  const { playTrack } = route.params;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchAction = async () => {
    if (!query) return;
    setLoading(true);
    setResults([]);
    try {
      // Usamos Invidious para buscar (más estable)
      const res = await axios.get(`${INVIDIOUS_INSTANCE}/api/v1/search?q=${query}&type=video`);
      
      // Mapeamos los resultados para que incluyan "Spotify Playlist" simulada en los primeros resultados
      const formattedResults = (res.data || []).map((item, index) => ({
        id: item.videoId,
        title: item.title,
        artist: item.author,
        img: item.videoThumbnails[0].url,
        // Simulamos Spotify Playlists en los primeros 2 resultados
        type: index < 2 ? 'Spotify Playlist' : 'Song',
      }));
      
      setResults(formattedResults);
    } catch (e) { Alert.alert("Error de Búsqueda", "No se pudo conectar con el motor de búsqueda global."); }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.searchBox}>
        <Search color="cyan" size={20} />
        <TextInput placeholder="Busca en Spotify, YouTube o Amazon..." placeholderTextColor="#444" style={styles.input} onChangeText={setQuery} onSubmitEditing={searchAction} />
      </View>
      {loading ? <ActivityIndicator color="cyan" size="large" style={{ marginTop: 50 }} /> : (
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

// --- COMPONENTE: SELECTOR DE OPCIONES (MODAL) ---
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
  );
};

// --- PANTALLA: AJUSTES AVANZADOS (ESTILO HARMONY COMPLETO) ---
function SettingsScreen() {
  const [config, setConfig] = useState(initialSettings);
  const [modalType, setModalType] = useState(null); // 'lang', 'qual', 'dlQual'

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
      <StatusBar barStyle="light-content" />
      <Text style={styles.mainTitle}>Settings</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* SECCIÓN PERSONALIZACIÓN */}
        <Text style={styles.groupLabel}>Personalisation</Text>
        <SettingRow icon={Palette} title="Theme Mode" sub="Dynamic" hasSwitch value={config.isDynamic} onPress={() => setConfig({...config, isDynamic: !config.isDynamic})} />
        <SettingRow icon={Globe} title="Language" sub={config.language} onPress={() => setModalType('lang')} />
        <SettingRow icon={Layout} title="Player UI" sub="Standard" />

        {/* SECCIÓN MÚSICA & REPRODUCCIÓN */}
        <Text style={styles.groupLabel}>Music & Playback</Text>
        <SettingRow icon={Sliders} title="Equalizer" sub="Normal" />
        <SettingRow icon={Music2} title="Audio Quality" sub={config.audioQuality} onPress={() => setModalType('qual')} />

        {/* SECCIÓN DESCARGAS */}
        <Text style={styles.groupLabel}>Download</Text>
        <SettingRow icon={Download} title="Enable Download" sub="Save to local storage" hasSwitch value={config.offlineCache} onPress={() => setConfig({...config, offlineCache: !config.offlineCache})} />
        <SettingRow icon={Database} title="Download Quality" sub={config.downloadQuality} onPress={() => setModalType('dlQual')} />

        {/* SECCIÓN OTROS */}
        <Text style={styles.groupLabel}>Other</Text>
        <SettingRow icon={History} title="Backup & Restore" />
        <SettingRow icon={Info} title="Version" sub="v1.7.0 (Professional)" />
      </ScrollView>

      {/* MODALES DE SELECCIÓN */}
      <OptionSelector visible={modalType === 'lang'} onClose={() => setModalType(null)} title="Seleccionar Idioma" options={['Español', 'English', 'Português', 'Français']} onSelect={(val) => setConfig({...config, language: val})} />
      <OptionSelector visible={modalType === 'qual'} onClose={() => setModalType(null)} title="Calidad de Audio (Streaming)" options={['128kbps', '192kbps', '320kbps (Alta)']} onSelect={(val) => setConfig({...config, audioQuality: val})} />
      <OptionSelector visible={modalType === 'dlQual'} onClose={() => setModalType(null)} title="Calidad de Descarga" options={['128kbps', '192kbps', '320kbps (Alta)', 'Lossless']} onSelect={(val) => setConfig({...config, downloadQuality: val})} />
    </LinearGradient>
  );
}

// --- MINI REPRODUCTOR GLOBAL ---
const MiniPlayer = ({ currentTrack, isPlaying, onToggle }) => {
  if (!currentTrack) return null;
  return (
    <TouchableOpacity style={styles.miniPlayer}>
      <Image source={{ uri: currentTrack.img }} style={styles.miniArt} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.miniTitle} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.miniArtist}>{currentTrack.artist}</Text>
      </View>
      <TouchableOpacity onPress={onToggle} style={styles.miniPlayBtn}>
        {isPlaying ? <Pause color="white" fill="white" size={24} /> : <Play color="white" fill="white" size={24} />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// --- NAVEGACIÓN PRINCIPAL (DRAWER LATERAL) ---
export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (track) => {
    try {
      const status = await globalSound.getStatusAsync();
      if (status.isLoaded) { await globalSound.unloadAsync(); }
      
      setCurrentTrack(track);
      setIsPlaying(true);

      // Usamos el Proxy de Invidious para obtener el audio directo (más estable)
      const audioUrl = `${INVIDIOUS_INSTANCE}/latest_version?id=${track.id}&itag=140`; // itag=140 es audio-only
      await globalSound.loadAsync({ uri: audioUrl }, {}, true);
      await globalSound.playAsync();
    } catch (e) {
      Alert.alert("Error de Reproducción", "No se pudo cargar el audio de esta canción. Es posible que el servidor esté saturado.");
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) { await globalSound.pauseAsync(); }
    else { await globalSound.playAsync(); }
    setIsPlaying(!isPlaying);
  };

  return (
    <NavigationContainer>
      <Drawer.Navigator screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#000', width: 240 },
        drawerActiveTintColor: 'cyan',
        drawerInactiveTintColor: '#888',
        sceneContainerStyle: { backgroundColor: '#000' }
      }}>
        <Drawer.Screen name="Discover" component={HomeScreen} initialParams={{ playTrack: handlePlay }} options={{ drawerIcon: ({color}) => <Library color={color} size={20}/>}} />
        <Drawer.Screen name="Search" component={SearchScreen} initialParams={{ playTrack: handlePlay }} options={{ drawerIcon: ({color}) => <Search color={color} size={20}/>}} />
        <Drawer.Screen name="Settings" component={SettingsScreen} options={{ drawerIcon: ({color}) => <Settings color={color} size={20}/>}} />
      </Drawer.Navigator>
      <MiniPlayer currentTrack={currentTrack} isPlaying={isPlaying} onToggle={togglePlay} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  loaderContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadText: { color: 'cyan', marginTop: 25, letterSpacing: 5, fontWeight: 'bold' },
  logoImg: { width: 120, height: 120, borderRadius: 30 },
  secTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  rowV: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  imgRow: { width: 55, height: 55, borderRadius: 10 },
  trackText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  artistText: { color: '#888', fontSize: 13 },
  cardH: { width: 160, marginRight: 20 },
  imgCard: { width: 160, height: 160, borderRadius: 20, marginBottom: 10 },
  searchBox: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 25 },
  input: { color: 'white', marginLeft: 15, flex: 1, fontSize: 16 },
  tabBar: { backgroundColor: '#000', borderTopWidth: 0, height: 65, paddingBottom: 10 },
  miniPlayer: { position: 'absolute', bottom: 75, width: '94%', left: '3%', backgroundColor: '#02252e', borderRadius: 15, padding: 10, flexDirection: 'row', alignItems: 'center', elevation: 10 },
  miniArt: { width: 45, height: 45, borderRadius: 8 },
  miniTitle: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  miniArtist: { color: 'cyan', fontSize: 11 },
  miniPlayBtn: { padding: 10 },
  mainTitle: { color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 25 },
  groupLabel: { color: 'cyan', fontSize: 13, fontWeight: 'bold', marginTop: 25, marginBottom: 10, textTransform: 'uppercase' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  setIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#02252e', justifyContent: 'center', alignItems: 'center' },
  setInfo: { flex: 1, marginLeft: 15 },
  setText: { color: 'white', fontSize: 16 },
  subText: { color: '#666', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#111', borderRadius: 20, padding: 25 },
  modalTitle: { color: 'cyan', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modalOpt: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  closeBtn: { marginTop: 20, alignSelf: 'center', padding: 10 }
});
