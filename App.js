import React, { useState } from 'react';
import { StyleSheet, View, TextInput, FlatList, Text, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import { Search, Play, Pause, Music, Disc, LayoutGrid } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Tab = createBottomTabNavigator();

// --- Pantalla de Búsqueda (Inspirada en Harmony Music) ---
function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [platform, setPlatform] = useState('All'); // All, YT, Spotify, Deezer

  const handleSearch = (text) => {
    setQuery(text);
    // Aquí conectarías con tu API. Por ahora simulamos resultados:
    if (text.length > 2) {
      setResults([
        { id: '1', title: 'Song Example', artist: 'Artist One', source: 'YouTube' },
        { id: '2', title: 'Music Flow', artist: 'Beat Maker', source: 'Spotify' },
      ]);
    }
  };

  return (
    <LinearGradient colors={['#041d24', '#021217']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search color="#888" size={20} />
          <TextInput
            placeholder="Search Music, Artists, Albums..."
            placeholderTextColor="#555"
            style={styles.input}
            onChangeText={handleSearch}
          />
        </View>
        <View style={styles.filterRow}>
          {['All', 'YouTube', 'Spotify', 'Deezer'].map((p) => (
            <TouchableOpacity 
              key={p} 
              onPress={() => setPlatform(p)}
              style={[styles.filterBtn, platform === p && styles.filterBtnActive]}
            >
              <Text style={styles.filterText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.songItem}>
            <View style={styles.songArt}><Music color="#fff" /></View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{item.title}</Text>
              <Text style={styles.songArtist}>{item.artist} • {item.source}</Text>
            </View>
            <Play color="#1DB954" size={24} />
          </TouchableOpacity>
        )}
      />
    </LinearGradient>
  );
}

// --- Componente Principal ---
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: '#021217', borderTopWidth: 0, height: 60 },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#555',
        }}
      >
        <Tab.Screen 
          name="Discover" 
          component={SearchScreen} 
          options={{ tabBarIcon: ({ color }) => <LayoutGrid color={color} size={24} /> }} 
        />
        <Tab.Screen 
          name="Library" 
          component={View} 
          options={{ tabBarIcon: ({ color }) => <Disc color={color} size={24} /> }} 
        />
      </Tab.Navigator>
      
      {/* Mini Player Persistente */}
      <View style={styles.miniPlayer}>
        <Text style={styles.miniText}>No playing - Nitraxx Music</Text>
        <Play color="#fff" size={28} />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { paddingHorizontal: 20, marginBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#0a2a33',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center'
  },
  input: { flex: 1, marginLeft: 10, color: '#fff', fontSize: 16 },
  filterRow: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#0a2a33' },
  filterBtnActive: { backgroundColor: '#1DB954' },
  filterText: { color: '#fff', fontSize: 12 },
  songItem: { flexDirection: 'row', padding: 15, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#111' },
  songArt: { width: 50, height: 50, backgroundColor: '#111', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  songInfo: { flex: 1, marginLeft: 15 },
  songTitle: { color: '#fff', fontWeight: 'bold' },
  songArtist: { color: '#888', fontSize: 12 },
  miniPlayer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    height: 60,
    backgroundColor: '#0a2a33',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#111'
  },
  miniText: { color: '#fff', fontSize: 14 }
});
