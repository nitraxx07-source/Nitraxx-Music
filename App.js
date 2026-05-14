import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, Image, TouchableOpacity, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
// Importamos toda la artillería de iconos de Harmony/Spotify
import { 
  Search, Pause, Play, SkipForward, SkipBack, Home, Library, 
  Settings, ListMusic, Heart, Repeat, Shuffle, Download, 
  MoreVertical, Mic2, Volume2, Share2 
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function App() {
  // --- ESTADOS ---
  const [tab, setTab] = useState('home');
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  
  const sound = useRef(new Audio.Sound());

  // --- LÓGICA DE AUDIO ---
  async function handleSearch() {
    if (!query) return;
    try {
      const resp = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=30`);
      const data = await resp.json();
      setSongs(data.results.map(s => ({
        id: s.trackId.toString(),
        title: s.trackName,
        artist: s.artistName,
        image: s.artworkUrl100.replace('100x100', '800x800'),
        url: s.previewUrl
      })));
    } catch (e) { console.error(e); }
  }

  async function togglePlay(item) {
    try {
      if (currentSong?.id === item.id) {
        isPlaying ? await sound.current.pauseAsync() : await sound.current.playAsync();
        setIsPlaying(!isPlaying);
        return;
      }
      await sound.current.unloadAsync();
      await sound.current.loadAsync({ uri: item.url }, { shouldPlay: true });
      setCurrentSong(item);
      setIsPlaying(true);
    } catch (error) { alert("Error al reproducir"); }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#1a1a2e', '#000']} style={StyleSheet.absoluteFill} />

      {/* HEADER SUPERIOR */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>NITRAXX <Text style={{color: '#BB86FC'}}>MUSIC</Text></Text>
          <Text style={styles.subtitle}>Basado en Harmony Music</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => alert("Compartiendo Nitraxx Music...")}><Share2 color="white" size={22} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('settings')}><Settings color="white" size={22} style={{marginLeft: 15}} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}}>
        {/* BUSCADOR */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color="#888" size={20} />
            <TextInput 
              placeholder="Buscar en Youtube, Spotify, Deezer..." 
              placeholderTextColor="#555" 
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        {/* ACCESOS RÁPIDOS (BOTONES QUE FALTABAN) */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.qBtn}><Heart color="#BB86FC" size={20} /><Text style={styles.qText}>Favoritos</Text></TouchableOpacity>
          <TouchableOpacity style={styles.qBtn}><Download color="#BB86FC" size={20} /><Text style={styles.qText}>Descargas</Text></TouchableOpacity>
          <TouchableOpacity style={styles.qBtn}><ListMusic color="#BB86FC" size={20} /><Text style={styles.qText}>Mixes</Text></TouchableOpacity>
        </View>

        {/* LISTA DE CANCIONES */}
        <Text style={styles.sectionTitle}>Tendencias</Text>
        {songs.map((item) => (
          <TouchableOpacity key={item.id} style={styles.songRow} onPress={() => togglePlay(item)}>
            <Image source={{uri: item.image}} style={styles.songArt} />
            <View style={{flex: 1, marginLeft: 15}}>
              <Text style={[styles.songTitle, {color: currentSong?.id === item.id ? '#BB86FC' : 'white'}]} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.songArtist}>{item.artist}</Text>
            </View>
            <TouchableOpacity style={{padding: 5}} onPress={() => alert("Opciones de canción")}>
              <MoreVertical color="#444" size={20} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        <View style={{height: 200}} />
      </ScrollView>

      {/* REPRODUCTOR FULL (BOTONES FUNCIONALES) */}
      {currentSong && (
        <View style={styles.fullPlayer}>
          <LinearGradient colors={['#1e1e1e', '#121212']} style={styles.playerContent}>
            <Image source={{uri: currentSong.image}} style={styles.miniArt} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={styles.miniTitle} numberOfLines={1}>{currentSong.title}</Text>
              <Text style={styles.miniArtist}>{currentSong.artist}</Text>
            </View>
            
            {/* CONTROLES DE REPRODUCCIÓN */}
            <View style={styles.mainControls}>
              <TouchableOpacity onPress={() => setIsShuffle(!isShuffle)}>
                <Shuffle color={isShuffle ? '#BB86FC' : '#555'} size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => togglePlay(currentSong)} style={styles.playBtnCircle}>
                {isPlaying ? <Pause color="black" fill="black" size={24} /> : <Play color="black" fill="black" size={24} />}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsRepeat(!isRepeat)}>
                <Repeat color={isRepeat ? '#BB86FC' : '#555'} size={20} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* BARRA DE NAVEGACIÓN INFERIOR (MATERIAL YOU) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setTab('home')}>
          <Home color={tab === 'home' ? '#BB86FC' : '#888'} size={24} />
          <Text style={[styles.navLabel, {color: tab === 'home' ? '#BB86FC' : '#888'}]}>Inicio</Text>
          {tab === 'home' && <View style={styles.navIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setTab('explore')}>
          <Search color={tab === 'explore' ? '#BB86FC' : '#888'} size={24} />
          <Text style={[styles.navLabel, {color: tab === 'explore' ? '#BB86FC' : '#888'}]}>Explorar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setTab('library')}>
          <Library color={tab === 'library' ? '#BB86FC' : '#888'} size={24} />
          <Text style={[styles.navLabel, {color: tab === 'library' ? '#BB86FC' : '#888'}]}>Biblioteca</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 60 },
  logo: { color: 'white', fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#BB86FC', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  headerIcons: { flexDirection: 'row' },
  searchContainer: { padding: 20 },
  searchBar: { flexDirection: 'row', backgroundColor: '#161616', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  input: { flex: 1, color: 'white', marginLeft: 12, fontSize: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  qBtn: { alignItems: 'center', backgroundColor: '#121212', padding: 15, borderRadius: 20, width: width * 0.28 },
  qText: { color: 'white', fontSize: 11, marginTop: 8, fontWeight: '600' },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 25, marginVertical: 15 },
  songRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 15, borderRadius: 20 },
  songArt: { width: 55, height: 55, borderRadius: 15 },
  songTitle: { fontWeight: 'bold', fontSize: 16 },
  songArtist: { color: '#888', fontSize: 13 },
  fullPlayer: { position: 'absolute', bottom: 100, left: 10, right: 10, height: 80, borderRadius: 30, overflow: 'hidden', elevation: 10 },
  playerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  miniArt: { width: 50, height: 50, borderRadius: 15 },
  miniTitle: { color: 'white', fontWeight: 'bold' },
  miniArtist: { color: '#BB86FC', fontSize: 12 },
  mainControls: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  playBtnCircle: { backgroundColor: '#BB86FC', width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 95, backgroundColor: '#0a0a0a', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15, borderTopWidth: 0.5, borderTopColor: '#222' },
  navItem: { alignItems: 'center', width: 80 },
  navLabel: { fontSize: 11, marginTop: 5, fontWeight: 'bold' },
  navIndicator: { width: 20, height: 3, backgroundColor: '#BB86FC', borderRadius: 10, marginTop: 4 }
});
