import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, TextInput, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Search, Settings, Library, SkipBack, SkipForward, Download, Music } from 'lucide-react-native';
import axios from 'axios';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// --- PANTALLA DE BÚSQUEDA REAL ---
function SearchScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchMusic = async () => {
    if (!searchText) return;
    setLoading(true);
    try {
      // Usamos una instancia pública de Piped (como Harmony Music) para buscar en YT Music
      const response = await axios.get(`https://pipedapi.kavin.rocks/search?q=${searchText}&filter=music_songs`);
      setResults(response.data.items);
    } catch (error) {
      console.log("Error buscando música", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => alert('Cargando: ' + item.title)}>
      <Image source={{ uri: item.thumbnail }} style={styles.miniArt} />
      <View style={{ marginLeft: 15, flex: 1 }}>
        <Text style={styles.resTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resArtist}>{item.uploaderName}</Text>
      </View>
      <Play color="cyan" size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.searchBox}>
        <Search color="#00ffff" size={20} />
        <TextInput
          placeholder="Buscar artista o canción..."
          placeholderTextColor="#555"
          style={styles.input}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={searchMusic}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="cyan" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.url}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Music color="#222" size={100} />
              <Text style={{color: '#444', marginTop: 15}}>Busca en la librería de Nitraxx</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// (La PlayerScreen se mantiene con el diseño anterior, pero lista para recibir el link de Piped)
function PlayerScreen() {
  return (
    <LinearGradient colors={['#1a2a6c', '#000000']} style={styles.container}>
      <View style={styles.headerPlayer}><Text style={styles.nowPlaying}>NITRAXX PLAYER</Text></View>
      <View style={{ alignItems: 'center' }}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800' }} style={styles.mainArt} />
      </View>
      <View style={styles.infoArea}>
        <Text style={styles.mTitle}>Selecciona una canción</Text>
        <Text style={styles.mArtist}>Buscador Nitraxx Activo</Text>
      </View>
      <View style={styles.mainControls}>
        <SkipBack color="white" size={35} fill="white" />
        <TouchableOpacity style={styles.playCircle}><Play color="black" size={30} fill="black" /></TouchableOpacity>
        <SkipForward color="white" size={35} fill="white" />
      </View>
    </LinearGradient>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0, height: 65, paddingBottom: 10 },
        tabBarActiveTintColor: '#00ffff'
      }}>
        <Tab.Screen name="Inicio" component={PlayerScreen} options={{ tabBarIcon: ({color}) => <Library color={color} /> }} />
        <Tab.Screen name="Buscar" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Search color={color} /> }} />
        <Tab.Screen name="Ajustes" component={View} options={{ tabBarIcon: ({color}) => <Settings color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  searchBox: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  input: { color: 'white', marginLeft: 15, flex: 1 },
  resultItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#080808', padding: 10, borderRadius: 12 },
  miniArt: { width: 50, height: 50, borderRadius: 8 },
  resTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  resArtist: { color: 'gray', fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  headerPlayer: { alignItems: 'center', marginBottom: 20 },
  nowPlaying: { color: '#00ffff', letterSpacing: 4, fontSize: 12, fontWeight: 'bold' },
  mainArt: { width: width - 60, height: width - 60, borderRadius: 25 },
  infoArea: { marginTop: 30 },
  mTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  mArtist: { color: '#00ffff', fontSize: 16 },
  mainControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 50 },
  playCircle: { backgroundColor: '#00ffff', padding: 22, borderRadius: 50 }
});
