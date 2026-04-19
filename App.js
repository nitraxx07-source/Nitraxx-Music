import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, ScrollView, Switch, Animated, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Search, Library, Download, SkipBack, SkipForward, Heart, Settings, Palette, ChevronRight, MoreVertical, ListMusic, Database, Globe, Music2 } from 'lucide-react-native';
import axios from 'axios';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');
let soundObject = new Audio.Sound();

// --- LOGO ANIMADO NITRAXX ---
const AnimatedLogo = () => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(waveAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
    ])).start();
  }, []);
  const scale = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Image source={require('./assets/icon.png')} style={{ width: 100, height: 100, borderRadius: 25 }} />
    </Animated.View>
  );
};

// --- PANTALLA PRINCIPAL (DISEÑO HARMONY) ---
function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 2000); }, []);

  const sections = [
    { title: "Quick Picks", data: [
      { id: '1', title: 'Si Antes Te Hubiera Co...', artist: 'KAROL G', img: 'https://i.ytimg.com/vi/5S_6Z_Z3_XI/hqdefault.jpg', provider: 'YouTube' },
      { id: '2', title: 'Flowers', artist: 'Miley Cyrus', img: 'https://i.ytimg.com/vi/G7KNmW9a75Y/hqdefault.jpg', provider: 'Spotify' },
      { id: '3', title: 'Stay', artist: 'Justin Bieber', img: 'https://i.ytimg.com/vi/kTJczUoc26U/hqdefault.jpg', provider: 'Amazon' }
    ]},
    { title: "Morning boost", horizontal: true, data: [
      { id: 'a', title: 'Pop Hits', playlist: 'Ecuador Top 50', img: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
      { id: 'b', title: 'Classic Rock', playlist: 'The 80s', img: 'https://i.ytimg.com/vi/1w7OgIMMRc4/hqdefault.jpg' }
    ]}
  ];

  if (loading) return <View style={styles.loaderContainer}><AnimatedLogo /><Text style={styles.loadText}>NITRAXX MUSIC PRO</Text></View>;

  return (
    <LinearGradient colors={['#021217', '#000']} style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.mainTitle}>Nitraxx</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}><Settings color="white" /></TouchableOpacity>
      </View>
      <ScrollView>
        {sections.map(sec => (
          <View key={sec.title} style={{ marginBottom: 30 }}>
            <Text style={styles.secTitle}>{sec.title}</Text>
            <FlatList 
              horizontal={sec.horizontal}
              data={sec.data}
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

// --- BUSCADOR MULTI-PLATAFORMA ---
function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const globalSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      // Integrando motor de búsqueda global (YouTube, Spotify API Wrapper)
      const res = await axios.get(`https://pipedapi.kavin.rocks/search?q=${query}&filter=music_songs`);
      setResults(res.data.items);
    } catch (e) { Alert.alert("Error de Conexión", "No se pudo conectar con los servidores de música."); }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.searchBox}>
        <Search color="cyan" size={20} />
        <TextInput 
          style={styles.input} 
          placeholder="Search YouTube, Spotify, Amazon..." 
          placeholderTextColor="#666"
          onChangeText={setQuery}
          onSubmitEditing={globalSearch}
        />
      </View>
      {loading ? <ActivityIndicator color="cyan" size="large" /> : (
        <FlatList data={results} renderItem={({item}) => (
          <TouchableOpacity style={styles.rowV} onPress={() => navigation.navigate('Player', { track: { title: item.title, artist: item.uploaderName, img: item.thumbnail, id: item.url.split('=')[1] } })}>
            <Image source={{ uri: item.thumbnail }} style={styles.imgRow} />
            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={styles.trackText}>{item.title}</Text>
              <Text style={styles.artistText}>{item.uploaderName}</Text>
            </View>
            <Download color="#444" size={20} />
          </TouchableOpacity>
        )} />
      )}
    </View>
  );
}

// --- CONFIGURACIÓN AVANZADA (ESTILO HARMONY) ---
function SettingsScreen() {
  const [switches, setSwitches] = useState({ theme: true, cache: true, data: false });
  const toggle = (key) => setSwitches({...switches, [key]: !switches[key]});

  return (
    <LinearGradient colors={['#021217', '#000']} style={styles.container}>
      <Text style={styles.mainTitle}>Settings</Text>
      <ScrollView>
        <View style={styles.setGroup}>
          <Text style={styles.groupLabel}>Personalisation</Text>
          <View style={styles.setRow}><Palette color="cyan" size={22} /><View style={styles.setInfo}><Text style={styles.setText}>Theme Mode</Text><Text style={styles.subText}>Dynamic (Harmony UI)</Text></View><Switch value={switches.theme} onValueChange={() => toggle('theme')} /></View>
          <View style={styles.setRow}><Globe color="cyan" size={22} /><View style={styles.setInfo}><Text style={styles.setText}>Language</Text><Text style={styles.subText}>Spanish / English</Text></View><ChevronRight color="#444" /></View>
        </View>

        <View style={styles.setGroup}>
          <Text style={styles.groupLabel}>Content & Sources</Text>
          <View style={styles.setRow}><Database color="cyan" size={22} /><View style={styles.setInfo}><Text style={styles.setText}>Include Spotify Results</Text></View><Switch value={true} /></View>
          <View style={styles.setRow}><Music2 color="cyan" size={22} /><View style={styles.setInfo}><Text style={styles.setText}>Audio Quality</Text><Text style={styles.subText}>High (320kbps)</Text></View><ChevronRight color="#444" /></View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0, height: 70 },
        tabBarActiveTintColor: 'cyan'
      }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({color}) => <Library color={color} /> }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({color}) => <Settings color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  loaderContainer: { flex: 1, backgroundColor: '#021217', justifyContent: 'center', alignItems: 'center' },
  loadText: { color: 'cyan', marginTop: 25, letterSpacing: 3, fontWeight: 'bold' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  mainTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  secTitle: { color: 'cyan', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  searchBox: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 25 },
  input: { color: '#fff', marginLeft: 15, flex: 1 },
  rowV: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  imgRow: { width: 55, height: 55, borderRadius: 10 },
  cardH: { width: 160, marginRight: 20 },
  imgCard: { width: 160, height: 160, borderRadius: 20 },
  trackText: { color: '#fff', fontWeight: 'bold' },
  artistText: { color: '#888', fontSize: 12 },
  setGroup: { marginBottom: 30 },
  groupLabel: { color: 'cyan', fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  setInfo: { flex: 1, marginLeft: 15 },
  setText: { color: '#fff', fontSize: 16 },
  subText: { color: '#666', fontSize: 12 }
});
