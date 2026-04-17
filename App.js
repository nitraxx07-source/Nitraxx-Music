import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Audio } from 'expo-av';

export default function App() {
  const [sound, setSound] = useState();
  const [search, setSearch] = useState('');
  
  // Simulación de base de datos unificada (Aquí conectaremos las APIs luego)
  const [songs, setSongs] = useState([
    { id: '1', title: 'Canción Unificada 1', artist: 'Nitraxx Source', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: '2', title: 'Canción Unificada 2', artist: 'External Library', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  ]);

  async function playMusic(uri) {
    if (sound) {
      await sound.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    setSound(newSound);
    await newSound.playAsync();
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.songItem} onPress={() => playMusic(item.url)}>
      <Text style={styles.songTitle}>{item.title}</Text>
      <Text style={styles.songArtist}>{item.artist}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nitraxx Music</Text>
      <TextInput 
        style={styles.searchBar} 
        placeholder="Buscar en todas las librerías..." 
        placeholderTextColor="#888"
        onChangeText={text => setSearch(text)}
      />
      <FlatList
        data={songs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
      <View style={styles.playerBar}>
        <Text style={styles.playerText}>Reproduciendo ahora en Nitraxx...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 50 },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginLeft: 20, marginBottom: 10 },
  searchBar: { backgroundColor: '#111', color: '#fff', margin: 15, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  songItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  songTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  songArtist: { color: '#aaa', fontSize: 14 },
  playerBar: { height: 60, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderTopWidth: 2, borderTopColor: '#ff0055' },
  playerText: { color: '#ff0055', fontWeight: 'bold' }
});
