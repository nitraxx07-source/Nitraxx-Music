import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient'; // Para fondos dinámicos

const { width } = Dimensions.get('window');

export default function App() {
  const [songs, setSongs] = useState([]);
  const [bgColor, setBgColor] = useState(['#000033', '#000000']); // Color inicial
  const [quality, setQuality] = useState('128kbps');

  // Colores para el efecto Harmony (cambian por canción)
  const harmonyColors = [
    ['#1a2a6c', '#b21f1f'], ['#000046', '#1cb5e0'], 
    ['#0f0c29', '#302b63'], ['#134e5e', '#71b280']
  ];

  const changeSongStyle = () => {
    const randomColor = harmonyColors[Math.floor(Math.random() * harmonyColors.length)];
    setBgColor(randomColor);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => { playMusic(item); changeSongStyle(); }}
    >
      <Image source={{ uri: item.image }} style={styles.thumb} />
      <View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.artist}>{item.artist}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={bgColor} style={styles.container}>
      <Text style={styles.logoText}>NITRAXX</Text>
      <TextInput 
        style={styles.search} 
        placeholder="YouTube, Spotify, Amazon..." 
        placeholderTextColor="#aaa"
      />
      <FlatList 
        data={songs}
        renderItem={renderItem}
        numColumns={width > 600 ? 2 : 1} // Ajuste automático para Tablet o Celular
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  logoText: { color: '#00ffff', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  search: { backgroundColor: 'rgba(255,255,255,0.1)', margin: 15, padding: 15, borderRadius: 25, color: '#fff' },
  card: { flexDirection: 'row', padding: 10, margin: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 15 },
  thumb: { width: 60, height: 60, borderRadius: 10, marginRight: 15 },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  artist: { color: '#ccc', fontSize: 14 }
});
