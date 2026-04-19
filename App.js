import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, ScrollView, Switch, Animated, Modal, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Play, Pause, Search, Library, Download, SkipBack, SkipForward, 
  Heart, Settings, Palette, ChevronRight, Globe, Sliders, 
  Music2, Check, Zap, Volume2, Layout, Database, History, MoreHorizontal
} from 'lucide-react-native';
import axios from 'axios';

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

// --- MOTOR DE AUDIO GLOBAL ---
let globalSound = new Audio.Sound();

// --- LOGO ANIMADO NITRAXX ---
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
      <LinearGradient colors={['#00ffff', '#008b8b']} style={styles.logoCircle}>
        <Music2 color="black" size={40} />
      </LinearGradient>
    </Animated.View>
  );
};

// --- PANTALLA: HOME (CON REPRODUCCIÓN AL CLICK) ---
function HomeScreen({ navigation, route }) {
  const { playTrack } = route.params;
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 2000); }, []);

  const sections = [
    { title: "Quick Picks", data: [
      { id: '5S_6Z_Z3_XI', title: 'Si Antes Te Hubiera Co...', artist: 'KAROL G', img: 'https://i.ytimg.com/vi/5S_6Z_Z3_XI/hqdefault.jpg' },
      { id: 'lFcSrYw-ARY', title: 'Relaxing Music', artist: 'Soothing Sounds', img: 'https://i.ytimg.com/vi/lFcSrYw-ARY/hqdefault.jpg' },
      { id: '6366DxVf-os', title: 'Llévame Contigo', artist: 'Romeo Santos', img: 'https://i.ytimg.com/vi/6366DxVf-os/hqdefault.jpg' }
    ]},
    { title: "Morning boost", horizontal: true, data: [
      { id: 'kJQP7kiw5Fk', title: 'Spanish Pop hits', artist: 'Lola Indigo', img: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
      { id: '1w7OgIMMRc4', title: 'Feel-Good Classic Rock', artist: 'The Doobie Brothers', img: 'https://i.ytimg.com/vi/1w7OgIMMRc4/hqdefault.jpg' }
    ]}
  ];

  if (loading) return (
    <View style={styles.loaderContainer}>
      <AnimatedLogo />
      <Text style={styles.loadText}>NITRAXX MUSIC PRO</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#01161d', '#000']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.brandText}>Nitraxx</Text>
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
                <TouchableOpacity 
                  style={sec.horizontal ? styles.cardH : styles.rowV} 
                  onPress={() => playTrack(item)}
                >
                  <Image source={{ uri: item.img }} style={sec.horizontal ? styles.imgCard : styles.imgRow} />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={styles.trackText} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.artistText}>{item.artist}</Text>
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

// --- PANTALLA: AJUSTES (ESTILO SPOTIFY COMPLETO) ---
function SettingsScreen() {
  const [config, setConfig] = useState({ language: 'Español', quality: '320kbps', eq: 'Normal', dynamic: true });
  
  const SettingRow = ({ icon: Icon, title, sub, hasSwitch, value, onPress }) => (
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
      <Text style={styles.mainTitle}>Ajustes</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.groupLabel}>Personalización</Text>
        <SettingRow icon={Palette} title="Colores Dinámicos" sub="Estilo Harmony" hasSwitch value={config.dynamic} onPress={() => setConfig({...config, dynamic: !config.dynamic})} />
        <SettingRow icon={Globe} title="Idioma" sub={config.language} />
        <SettingRow icon={Layout} title="Interfaz del Reproductor" sub="Estándar" />

        <Text style={styles.groupLabel}>Música y Reproducción</Text>
        <SettingRow icon={Music2} title="Calidad de Audio" sub={config.quality} />
        <SettingRow icon={Sliders} title="Ecualizador" sub={config.eq} />
        
        <Text style={styles.groupLabel}>Descargas y Almacenamiento</Text>
        <SettingRow icon={Download} title="Ruta de Descarga" sub="/Nitraxx/Music" />
        <SettingRow icon={Database} title="Uso de Almacenamiento" sub="1.2 GB usados" />

        <Text style={styles.groupLabel}>Otros</Text>
        <SettingRow icon={History} title="Copia de seguridad" />
      </ScrollView>
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

// --- NAVEGACIÓN PRINCIPAL ---
export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (track) => {
    try {
      await globalSound.unloadAsync();
      setCurrentTrack(track);
      setIsPlaying(true);
      // Simulación de carga de stream
      await globalSound.loadAsync({ uri: `https://www.yt-download.org/api/widget/mp3/${track.id}` });
      await globalSound.playAsync();
    } catch (e) { console.log("Error al reproducir"); }
  };

  const togglePlay = async () => {
    if (isPlaying) { await globalSound.pauseAsync(); }
    else { await globalSound.playAsync(); }
    setIsPlaying(!isPlaying);
  };

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: 'cyan',
      }}>
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          initialParams={{ playTrack: handlePlay }}
          options={{ tabBarIcon: ({color}) => <Library color={color} /> }} 
        />
        <Tab.Screen name="Search" component={HomeScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({color}) => <Settings color={color} /> }} />
      </Tab.Navigator>
      <MiniPlayer currentTrack={currentTrack} isPlaying={isPlaying} onToggle={togglePlay} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  loaderContainer: { flex: 1, backgroundColor: '#01161d', justifyContent: 'center', alignItems: 'center' },
  loadText: { color: 'cyan', marginTop: 20, letterSpacing: 4, fontWeight: 'bold' },
  logoCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  brandText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  secTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  rowV: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  imgRow: { width: 55, height: 55, borderRadius: 8 },
  cardH: { width: 160, marginRight: 20 },
  imgCard: { width: 160, height: 160, borderRadius: 15 },
  trackText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  artistText: { color: '#888', fontSize: 13 },
  mainTitle: { color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 25 },
  groupLabel: { color: 'cyan', fontSize: 12, fontWeight: 'bold', marginTop: 25, marginBottom: 10, textTransform: 'uppercase' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  setIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#02252e', justifyContent: 'center', alignItems: 'center' },
  setInfo: { flex: 1, marginLeft: 15 },
  setText: { color: 'white', fontSize: 16 },
  subText: { color: '#666', fontSize: 12 },
  tabBar: { backgroundColor: '#000', borderTopWidth: 0, height: 65, paddingBottom: 10 },
  miniPlayer: { position: 'absolute', bottom: 75, width: '94%', left: '3%', backgroundColor: '#02252e', borderRadius: 15, padding: 10, flexDirection: 'row', alignItems: 'center', elevation: 10 },
  miniArt: { width: 45, height: 45, borderRadius: 8 },
  miniTitle: { color: 'white', fontWeight: 'bold' },
  miniArtist: { color: 'cyan', fontSize: 11 },
  miniPlayBtn: { padding: 10 }
});
