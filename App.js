import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, Dimensions, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Search, Settings, Library, SkipBack, SkipForward, Download, Repeat, Music } from 'lucide-react-native';
import ImageColors from 'react-native-image-colors';
import Slider from 'react-native-slider';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// --- PANTALLA DE REPRODUCTOR ---
function PlayerScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState(['#1a2a6c', '#000000']);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(225); // Segundos simulados

  const track = {
    title: "Nitraxx Dynamic",
    artist: "Harmony Engine Pro",
    artwork: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800"
  };

  useEffect(() => {
    ImageColors.getColors(track.artwork, { fallback: '#1a2a6c' }).then((colors) => {
      if (colors.platform === 'android') setTheme([colors.dominant, '#000000']);
    });
  }, []);

  return (
    <LinearGradient colors={theme} style={styles.container}>
      <View style={styles.headerPlayer}>
        <Text style={styles.nowPlaying}>NITRAXX MUSIC PRO</Text>
      </View>

      <View style={styles.artContainer}>
        <Image source={{ uri: track.artwork }} style={styles.mainArt} />
      </View>

      <View style={styles.infoArea}>
        <Text style={styles.mTitle}>{track.title}</Text>
        <Text style={styles.mArtist}>{track.artist}</Text>
      </View>

      <View style={styles.progressArea}>
        <Slider
          value={position}
          maximumValue={duration}
          onValueChange={(val) => setPosition(val)}
          minimumTrackTintColor="#00ffff"
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor="#00ffff"
        />
        <View style={styles.timeLabels}>
          <Text style={styles.timeText}>0:00</Text>
          <Text style={styles.timeText}>3:45</Text>
        </View>
      </View>

      <View style={styles.mainControls}>
        <Repeat color="white" size={24} />
        <SkipBack color="white" size={35} fill="white" />
        <TouchableOpacity style={styles.playCircle} onPress={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? <Pause color="black" size={30} fill="black" /> : <Play color="black" size={30} fill="black" />}
        </TouchableOpacity>
        <SkipForward color="white" size={35} fill="white" />
        <Download color="white" size={24} />
      </View>
    </LinearGradient>
  );
}

// --- PANTALLA DE BÚSQUEDA ---
function SearchScreen() {
  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.searchBox}>
        <Search color="#00ffff" size={20} />
        <TextInput
          placeholder="Buscar en YouTube Music..."
          placeholderTextColor="#555"
          style={styles.input}
        />
      </View>
      <View style={styles.emptyContainer}>
        <Music color="#222" size={100} />
        <Text style={{color: '#444', marginTop: 15}}>Busca artistas, álbumes o canciones</Text>
      </View>
    </View>
  );
}

// --- NAVEGADOR PRINCIPAL ---
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0, height: 65, paddingBottom: 10 },
        tabBarActiveTintColor: '#00ffff',
        tabBarInactiveTintColor: 'gray'
      }}>
        <Tab.Screen name="Inicio" component={PlayerScreen} options={{ tabBarIcon: ({color}) => <Library color={color} /> }} />
        <Tab.Screen name="Buscar" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
        <Tab.Screen name="Ajustes" component={View} options={{ tabBarIcon: ({color}) => <Settings color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 60 },
  headerPlayer: { alignItems: 'center', marginBottom: 20 },
  nowPlaying: { color: '#00ffff', letterSpacing: 4, fontSize: 12, fontWeight: 'bold' },
  artContainer: { alignItems: 'center', elevation: 25 },
  mainArt: { width: width - 60, height: width - 60, borderRadius: 25 },
  infoArea: { marginTop: 30 },
  mTitle: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  mArtist: { color: '#00ffff', fontSize: 18, marginTop: 4, opacity: 0.8 },
  progressArea: { marginTop: 30 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  timeText: { color: '#777', fontSize: 12 },
  mainControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 35 },
  playCircle: { backgroundColor: '#00ffff', padding: 22, borderRadius: 50 },
  searchBox: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center' },
  input: { color: 'white', marginLeft: 15, flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
