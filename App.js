import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, FlatList, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Search, Settings, Library, SkipBack, SkipForward, Download, Repeat } from 'lucide-react-native';
import ImageColors from 'react-native-image-colors';
import Slider from 'react-native-slider';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// PANTALLA DE REPRODUCTOR (Inspirada en Harmony)
function PlayerScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState(['#1a2a6c', '#000000']);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const track = {
    title: "Nitraxx Master Track",
    artist: "Harmony Logic Engine",
    artwork: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800"
  };

  useEffect(() => {
    ImageColors.getColors(track.artwork, { fallback: '#1a2a6c' }).then((colors) => {
      if (colors.platform === 'android') setTheme([colors.dominant, '#000000']);
    });
  }, []);

  return (
    <LinearGradient colors={theme} style={styles.container}>
      <View style={styles.playerHeader}>
        <Text style={styles.nowPlaying}>SONANDO AHORA</Text>
      </View>

      <Image source={{ uri: track.artwork }} style={styles.mainArt} />

      <View style={styles.infoArea}>
        <Text style={styles.mTitle}>{track.title}</Text>
        <Text style={styles.mArtist}>{track.artist}</Text>
      </View>

      <View style={styles.progressArea}>
        <Slider
          value={position}
          maximumValue={duration}
          minimumTrackTintColor="#00ffff"
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

// PANTALLA DE BÚSQUEDA (Conectada a la idea de Harmony)
function SearchScreen() {
  const [query, setQuery] = useState('');
  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.searchBox}>
        <Search color="cyan" size={20} />
        <TextInput
          placeholder="Buscar en YouTube Music..."
          placeholderTextColor="#666"
          style={styles.input}
          onChangeText={setQuery}
        />
      </View>
      <FlatList
        data={[]}
        renderItem={null}
        ListEmptyComponent={<Text style={styles.emptyText}>Escribe para buscar música sin anuncios...</Text>}
      />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0, height: 65 },
        tabBarActiveTintColor: '#00ffff'
      }}>
        <Tab.Screen name="Player" component={PlayerScreen} options={{ tabBarIcon: ({color}) => <Library color={color} /> }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
        <Tab.Screen name="Settings" component={View} options={{ tabBarIcon: ({color}) => <Settings color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 60 },
  playerHeader: { alignItems: 'center', marginBottom: 30 },
  nowPlaying: { color: '#00ffff', letterSpacing: 3, fontSize: 12, fontWeight: 'bold' },
  mainArt: { width: width - 50, height: width - 50, borderRadius: 30, elevation: 20 },
  infoArea: { marginTop: 35, alignItems: 'flex-start' },
  mTitle: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  mArtist: { color: '#00ffff', fontSize: 18, marginTop: 5, opacity: 0.8 },
  progressArea: { marginTop: 40 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { color: '#666', fontSize: 12 },
  mainControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  playCircle: { backgroundColor: '#00ffff', padding: 20, borderRadius: 50 },
  searchBox: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center' },
  input: { color: 'white', marginLeft: 15, flex: 1 },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 100 },
});
