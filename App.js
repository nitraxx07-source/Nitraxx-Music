import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, ScrollView, Switch, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Search, Library, Download, SkipBack, SkipForward, Heart, Settings, Palette, ChevronRight, MoreVertical, ListMusic } from 'lucide-react-native';
import axios from 'axios';
import ImageColors from 'react-native-image-colors';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');
let soundObject = new Audio.Sound();

// --- COMPONENTE DE LOGO ANIMADO (Olas de Nitraxx) ---
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

  const scale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15]
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Image source={require('./assets/icon.png')} style={{ width: 80, height: 80, borderRadius: 20 }} />
    </Animated.View>
  );
};

// --- PANTALLA PRINCIPAL (HOME - Estilo Harmony) ---
function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000); // Simulando carga inicial
  }, []);

  const sections = [
    { title: "Quick Picks", data: [
      { id: '1', title: 'Si Antes Te Hubiera Co...', artist: 'KAROL G', img: 'https://i.ytimg.com/vi/5S_6Z_Z3_XI/hqdefault.jpg', plays: '1.1B' },
      { id: '2', title: 'Relaxing Music', artist: 'Soothing Sounds', img: 'https://i.ytimg.com/vi/lFcSrYw-ARY/hqdefault.jpg', plays: '2.8M' },
      { id: '3', title: 'Llévame Contigo', artist: 'Romeo Santos', img: 'https://i.ytimg.com/vi/6366DxVf-os/hqdefault.jpg', plays: '380M' }
    ]},
    { title: "Morning boost", horizontal: true, data: [
      { id: 'a', title: 'Spanish Pop hits', playlist: 'Lola Indigo, Rvfv', img: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
      { id: 'b', title: 'Feel-Good Classic Rock', playlist: 'The Doobie Brothers', img: 'https://i.ytimg.com/vi/1w7OgIMMRc4/hqdefault.jpg' },
      { id: 'c', title: 'Mellow Pop Classics', playlist: 'Take That, James Blunt', img: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' }
    ]}
  ];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#021217' }]}>
        <AnimatedLogo />
        <Text style={{ color: 'cyan', marginTop: 20, letterSpacing: 2 }}>NITRAXX LOADING...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#021217', '#000']} style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.mainTitle}>Nitraxx Music</Text>
        <TouchableOpacity><Image source={require('./assets/icon.png')} style={styles.miniLogo} /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map(sec => (
          <View key={sec.title} style={{ marginBottom: 30 }}>
            <View style={styles.secHeaderRow}>
              <Text style={styles.secTitle}>{sec.title}</Text>
              <ChevronRight color="#444" size={20} />
            </View>
            <FlatList 
              horizontal={sec.horizontal}
              data={sec.data}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({item}) => (
                <TouchableOpacity style={sec.horizontal ? styles.cardH : styles.rowV} onPress={() => navigation.navigate('Player', { track: item })}>
                  <Image source={{ uri: item.img }} style={sec.horizontal ? styles.imgCard : styles.imgRow} />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={styles.trackText} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.artistText} numberOfLines={1}>{item.artist || item.playlist} {item.plays ? `• ${item.plays}` : ''}</Text>
                  </View>
                  {!sec.horizontal && <MoreVertical color="#555" size={20} />}
                </TouchableOpacity>
              )}
            />
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

// --- BUSCADOR CON FILTROS (Real) ---
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
    } catch (e) { console.log("Search error"); }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.searchBox}>
        <Search color="cyan" size={20} />
        <TextInput 
          style={styles.input} 
          placeholder="Search songs, artists, albums..." 
          placeholderTextColor="#666"
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          value={query}
        />
      </View>
      {loading ? <ActivityIndicator color="cyan" size="large" style={{ marginTop: 50 }} /> : (
        <FlatList 
          data={results} 
          keyExtractor={item => item.url}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.rowV} onPress={() => navigation.navigate('Player', { track: { title: item.title, artist: item.uploaderName, img: item.thumbnail, id: item.url.split('=')[1] } })}>
              <Image source={{ uri: item.thumbnail }} style={styles.imgRow} />
              <View style={{ marginLeft: 15, flex: 1 }}>
                <Text style={styles.trackText} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.artistText}>{item.uploaderName}</Text>
              </View>
              <Download color="#444" size={20} />
            </TouchableOpacity>
          )} 
        />
      )}
    </View>
  );
}

// --- AJUSTES (Estilo Harmony Material You) ---
function SettingsScreen() {
  const [isDynamic, setIsDynamic] = useState(true);
  const [offline, setOffline] = useState(false);

  return (
    <LinearGradient colors={['#021217', '#000']} style={styles.container}>
      <Text style={styles.mainTitle}>Settings</Text>
      <ScrollView>
        <View style={styles.settingsGroup}>
          <Text style={styles.groupLabel}>Personalisation</Text>
          <View style={styles.setRow}><Palette color="cyan" size={22} /><View style={styles.setInfo}><Text style={styles.setText}>Theme Mode</Text><Text style={styles.subText}>Dynamic</Text></View><Switch value={isDynamic} onValueChange={setIsDynamic} /></View>
          <View style={styles.setRow}><ListMusic color="cyan" size={22} /><View style={styles.setInfo}><Text style={styles.setText}>Player UI</Text><Text style={styles.subText}>Standard</Text></View><ChevronRight color="#444" /></View>
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.groupLabel}>Music & Playback</Text>
          <View style={styles.setRow}><Download color="cyan" size={22} /><View style={styles.setInfo}><Text style={styles.setText}>Enable Download</Text><Text style={styles.subText}>Save to local storage</Text></View><Switch value={offline} onValueChange={setOffline} /></View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// --- NAVEGADOR ---
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
        <Tab.Screen name="Songs" component={SearchScreen} options={{ tabBarIcon: ({color}) => <ListMusic color={color} /> }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({color}) => <Settings color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  mainTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  miniLogo: { width: 35, height: 35, borderRadius: 10 },
  secHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  secTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  searchBox: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 25 },
  input: { color: '#fff', marginLeft: 15, flex: 1, fontSize: 16 },
  rowV: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  imgRow: { width: 55, height: 55, borderRadius: 10 },
  cardH: { width: 160, marginRight: 20 },
  imgCard: { width: 160, height: 160, borderRadius: 20 },
  trackText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  artistText: { color: '#888', fontSize: 13, marginTop: 2 },
  settingsGroup: { marginBottom: 35 },
  groupLabel: { color: 'cyan', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  setInfo: { flex: 1, marginLeft: 20 },
  setText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  subText: { color: '#666', fontSize: 12 }
});
