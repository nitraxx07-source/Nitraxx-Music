import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, ScrollView, Dimensions, Modal, StatusBar, Alert, Switch } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Search, Pause, Play, SkipForward, SkipBack, Home, Library, 
  Settings, ListMusic, Heart, Repeat, Shuffle, Download, 
  MoreVertical, ChevronDown, ArrowLeft, Disc, Plus, Music, CheckCircle2, User, Bell, Shield, LogOut
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [tab, setTab] = useState('home');
  const [view, setView] = useState('results'); 
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [currentArtist, setCurrentArtist] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullPoster, setShowFullPoster] = useState(false);
  const [accentColor, setAccentColor] = useState('#BB86FC');

  // --- NUEVOS ESTADOS SOLICITADOS ---
  const [playlists, setPlaylists] = useState([{ id: '1', name: 'Favoritos', songs: [] }]);
  const [downloads, setDownloads] = useState({});
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);

  const sound = useRef(new Audio.Sound());

  const getRandomColor = () => {
    const colors = ['#BB86FC', '#03DAC6', '#FF0266', '#FFDE03', '#00E5FF', '#76FF03', '#FF9100', '#64FFDA'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // --- FUNCIONES DE DESCARGA Y PLAYLIST ---
  const handleDownload = (id) => {
    setDownloads(prev => ({ ...prev, [id]: 'loading' }));
    setTimeout(() => setDownloads(prev => ({ ...prev, [id]: 'done' })), 2000);
  };

  const createPlaylist = () => {
    Alert.prompt("Nueva Playlist", "Nombre de la lista:", (name) => {
      if (name) setPlaylists([...playlists, { id: Date.now().toString(), name, songs: [] }]);
    });
  };

  const addSongToPlaylist = (playlistId) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId && !p.songs.find(s => s.id === songToAdd.id)) {
        return { ...p, songs: [...p.songs, songToAdd] };
      }
      return p;
    });
    setPlaylists(updated);
    setShowPlaylistModal(false);
  };

  async function goToArtistProfile(artistName) {
    if (!artistName) return;
    setCurrentArtist(artistName);
    setAccentColor(getRandomColor());
    setView('artist_profile');
    try {
      const respSongs = await fetch(`https://itunes.apple.com/search?term=${artistName}&entity=song&limit=20`);
      const dataSongs = await respSongs.json();
      const respAlb = await fetch(`https://itunes.apple.com/search?term=${artistName}&entity=album&limit=10`);
      const dataAlb = await respAlb.json();

      setSongs(dataSongs.results.map(s => ({
        id: s.trackId.toString(),
        title: s.trackName,
        artist: s.artistName,
        image: s.artworkUrl100.replace('100x100', '1000x1000'),
        url: s.previewUrl
      })));

      setArtistAlbums(dataAlb.results.map(a => ({
        id: a.collectionId.toString(),
        name: a.collectionName,
        image: a.artworkUrl100.replace('100x100', '600x600'),
        year: new Date(a.releaseDate).getFullYear()
      })));
    } catch (e) { console.error(e); }
  }

  async function handleSearch() {
    if (!query) return;
    setView('results');
    goToArtistProfile(query);
  }

  async function loadAndPlay(item) {
    try {
      setAccentColor(getRandomColor());
      await sound.current.unloadAsync();
      await sound.current.loadAsync({ uri: item.url }, { shouldPlay: true });
      setCurrentSong(item);
      setIsPlaying(true);
    } catch (e) { console.log(e); }
  }

  async function togglePlay(item) {
    if (currentSong?.id === item.id) {
      isPlaying ? await sound.current.pauseAsync() : await sound.current.playAsync();
      setIsPlaying(!isPlaying);
    } else {
      await loadAndPlay(item);
    }
  }

  const changeSong = (direction) => {
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < songs.length) loadAndPlay(songs[nextIndex]);
  };

  // --- VISTAS ADICIONALES ---
  const renderSettings = () => (
    <View style={{paddingTop: 60, paddingHorizontal: 25}}>
      <Text style={styles.artistNameBig}>Ajustes</Text>
      <View style={{marginTop: 30}}>
        <View style={styles.settingItem}><User color="white" /><Text style={styles.settingText}>Perfil</Text></View>
        <View style={styles.settingItem}><Shield color="white" /><Text style={styles.settingText}>Privacidad</Text></View>
        <View style={styles.settingItem}><Bell color="white" /><Text style={styles.settingText}>Notificaciones</Text></View>
        <TouchableOpacity onPress={() => setTab('home')} style={[styles.settingItem, {marginTop: 20}]}><LogOut color={accentColor} /><Text style={[styles.settingText, {color: accentColor}]}>Cerrar Sesión</Text></TouchableOpacity>
      </View>
    </View>
  );

  const renderLibrary = () => (
    <View style={{paddingTop: 60, paddingHorizontal: 25}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={styles.artistNameBig}>Biblioteca</Text>
        <TouchableOpacity onPress={createPlaylist}><Plus color="white" size={30} /></TouchableOpacity>
      </View>
      <ScrollView style={{marginTop: 20}}>
        {playlists.map(p => (
          <View key={p.id} style={styles.playlistCard}>
            <View style={[styles.playlistIcon, {backgroundColor: accentColor+'44'}]}><Music color={accentColor} /></View>
            <View style={{flex: 1, marginLeft: 15}}>
              <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16}}>{p.name}</Text>
              <Text style={{color: '#888'}}>{p.songs.length} canciones</Text>
            </View>
            <TouchableOpacity onPress={() => handleDownload(p.id)}>
              {downloads[p.id] === 'done' ? <CheckCircle2 color={accentColor} size={24} /> : <Download color="#444" size={24} />}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0a0a0a', '#121212']} style={StyleSheet.absoluteFill} />

      {/* MODAL PARA AGREGAR A PLAYLIST */}
      <Modal visible={showPlaylistModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
           <View style={styles.modalMenu}>
              <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20}}>Añadir a playlist</Text>
              {playlists.map(p => (
                <TouchableOpacity key={p.id} style={styles.modalItem} onPress={() => addSongToPlaylist(p.id)}>
                  <Text style={{color: 'white'}}>{p.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowPlaylistModal(false)} style={{marginTop: 10}}><Text style={{color: accentColor, textAlign: 'center'}}>Cerrar</Text></TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* MODAL PÓSTER */}
      <Modal visible={showFullPoster} animationType="slide">
        <View style={styles.posterContainer}>
          <LinearGradient colors={[accentColor + '55', '#000']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowFullPoster(false)}><ChevronDown color="white" size={40} /></TouchableOpacity>
          <Image source={{ uri: currentSong?.image }} style={styles.bigArt} />
          <View style={styles.posterMeta}>
            <Text style={styles.posterTitle} numberOfLines={1}>{currentSong?.title}</Text>
            <TouchableOpacity onPress={() => { setShowFullPoster(false); goToArtistProfile(currentSong?.artist); }}>
              <Text style={[styles.posterArtist, {color: accentColor}]}>{currentSong?.artist} ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.posterControls}>
             <Shuffle color="#555" size={28} />
             <TouchableOpacity onPress={() => changeSong('prev')}><SkipBack color="white" fill="white" size={35} /></TouchableOpacity>
             <TouchableOpacity style={[styles.bigPlayBtn, {backgroundColor: accentColor}]} onPress={() => togglePlay(currentSong)}>
                {isPlaying ? <Pause color="black" fill="black" size={35} /> : <Play color="black" fill="black" size={35} />}
             </TouchableOpacity>
             <TouchableOpacity onPress={() => changeSong('next')}><SkipForward color="white" fill="white" size={35} /></TouchableOpacity>
             <Repeat color="#555" size={28} />
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'settings' ? renderSettings() : tab === 'library' ? renderLibrary() : (
          <>
            {view === 'artist_profile' && (
              <View style={styles.artistProfileHeader}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setView('results')}><ArrowLeft color="white" size={28} /></TouchableOpacity>
                <Text style={styles.artistNameBig}>{currentArtist}</Text>
                <View style={styles.verifiedContainer}><Disc color={accentColor} size={16} /><Text style={styles.verifiedText}> Artista verificado</Text></View>
              </View>
            )}

            {view === 'results' && (
              <View style={{paddingTop: 60}}>
                <View style={styles.header}>
                  <Text style={styles.logo}>NITRAXX <Text style={{color: accentColor}}>MUSIC</Text></Text>
                  <TouchableOpacity onPress={() => setTab('settings')}><Settings color="white" size={24} /></TouchableOpacity>
                </View>
                <View style={styles.searchBar}>
                  <Search color="#888" size={20} /><TextInput placeholder="Buscar..." placeholderTextColor="#444" style={styles.input} value={query} onChangeText={setQuery} onSubmitEditing={handleSearch}/>
                </View>
              </View>
            )}

            {artistAlbums.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Lanzamientos y Álbumes</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingLeft: 20}}>
                  {artistAlbums.map((album) => (
                    <TouchableOpacity key={album.id} style={styles.albumCard}>
                      <Image source={{uri: album.image}} style={styles.albumArt} />
                      <TouchableOpacity onPress={() => handleDownload(album.id)} style={styles.albumDownloadBtn}>
                        {downloads[album.id] === 'done' ? <CheckCircle2 color={accentColor} size={18} /> : <Download color="white" size={18} />}
                      </TouchableOpacity>
                      <Text style={styles.albumName} numberOfLines={1}>{album.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.sectionTitle}>Canciones Populares</Text>
            {songs.map((item, index) => (
              <TouchableOpacity key={item.id} style={styles.songRow} onPress={() => togglePlay(item)}>
                <Text style={styles.songIndex}>{index + 1}</Text>
                <Image source={{uri: item.image}} style={styles.songArt} />
                <View style={{flex: 1, marginLeft: 15}}>
                  <Text style={[styles.songTitle, {color: currentSong?.id === item.id ? accentColor : 'white'}]} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.songArtist}>{item.artist}</Text>
                </View>
                <TouchableOpacity onPress={() => { setSongToAdd(item); setShowPlaylistModal(true); }}><Plus color="#555" size={20} style={{marginRight: 10}}/></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDownload(item.id)}>
                   {downloads[item.id] === 'done' ? <CheckCircle2 color={accentColor} size={20} /> : <Download color="#444" size={20} />}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}
        <View style={{height: 200}} />
      </ScrollView>

      {/* MINI PLAYER */}
      {currentSong && (
        <View style={styles.miniPlayer}>
          <TouchableOpacity onPress={() => setShowFullPoster(true)}><Image source={{uri: currentSong.image}} style={styles.miniArt} /></TouchableOpacity>
          <View style={{flex: 1, marginLeft: 12}}>
            <Text style={styles.miniTitle} numberOfLines={1}>{currentSong.title}</Text>
            <Text style={[styles.miniArtist, {color: accentColor}]}>{currentSong.artist}</Text>
          </View>
          <TouchableOpacity onPress={() => togglePlay(currentSong)} style={[styles.playBtnCircle, {backgroundColor: accentColor}]}>
            {isPlaying ? <Pause color="black" fill="black" size={22} /> : <Play color="black" fill="black" size={22} />}
          </TouchableOpacity>
        </View>
      )}

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => { setView('results'); setTab('home'); }}>
          <Home color={tab === 'home' ? accentColor : '#888'} size={24} />
          <Text style={[styles.navLabel, {color: tab === 'home' ? accentColor : '#888'}]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setTab('library')}>
          <Library color={tab === 'library' ? accentColor : '#888'} size={24} />
          <Text style={[styles.navLabel, {color: tab === 'library' ? accentColor : '#888'}]}>Biblioteca</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: 'white', fontSize: 24, fontWeight: '900' },
  searchBar: { flexDirection: 'row', backgroundColor: '#161616', margin: 20, padding: 15, borderRadius: 20, alignItems: 'center' },
  input: { flex: 1, color: 'white', marginLeft: 12, fontSize: 16 },
  artistProfileHeader: { paddingTop: 60, paddingHorizontal: 25, paddingBottom: 20 },
  backBtn: { marginBottom: 15 },
  artistNameBig: { color: 'white', fontSize: 42, fontWeight: 'bold' },
  verifiedContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  verifiedText: { color: '#888', fontSize: 12 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 25, marginVertical: 15 },
  albumCard: { marginRight: 20, width: 140 },
  albumArt: { width: 140, height: 140, borderRadius: 10 },
  albumDownloadBtn: { position: 'absolute', top: 110, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 3 },
  albumName: { color: 'white', fontSize: 13, marginTop: 8, fontWeight: '600' },
  songRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 15 },
  songIndex: { color: '#444', width: 25 },
  songArt: { width: 50, height: 50, borderRadius: 8 },
  songTitle: { fontWeight: 'bold', fontSize: 15 },
  songArtist: { color: '#888', fontSize: 12 },
  miniPlayer: { position: 'absolute', bottom: 100, left: 10, right: 10, height: 75, backgroundColor: '#121212', borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  miniArt: { width: 50, height: 50, borderRadius: 12 },
  miniTitle: { color: 'white', fontWeight: 'bold' },
  miniArtist: { fontSize: 11 },
  playBtnCircle: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 95, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15 },
  navItem: { alignItems: 'center' },
  navLabel: { fontSize: 11, marginTop: 5, fontWeight: 'bold' },
  posterContainer: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, left: 20 },
  bigArt: { width: width * 0.85, height: width * 0.85, borderRadius: 25 },
  posterMeta: { width: '100%', marginTop: 30 },
  posterTitle: { color: 'white', fontSize: 26, fontWeight: 'bold' },
  posterArtist: { fontSize: 20, marginTop: 5 },
  posterControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 40 },
  bigPlayBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  // Estilos de Playlist y Modal
  playlistCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  playlistIcon: { width: 55, height: 55, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  settingText: { color: 'white', fontSize: 16, marginLeft: 15 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalMenu: { backgroundColor: '#1a1a1a', width: '80%', padding: 25, borderRadius: 20 },
  modalItem: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#333' }
});
