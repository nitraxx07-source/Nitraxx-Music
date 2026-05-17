import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, ScrollView, Dimensions, Modal, StatusBar, Alert, Switch } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { 
Search, Pause, Play, SkipForward, SkipBack, Home, Library, 
  Settings, ListMusic, Heart, Repeat, Shuffle, Download, 
  MoreVertical, ChevronDown, ArrowLeft, Disc, Languages,
  Sliders, Smartphone, Trash2, ShieldAlert, RotateCcw, Info, Github
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
  const [searchFilter, setSearchFilter] = useState('artist'); // 'artist' | 'album' | 'playlist'
  const [currentCollectionSongs, setCurrentCollectionSongs] = useState([]);
  const [trackProgress, setTrackProgress] = useState(35); // Porcentaje de la línea de tiempo (0-100)
  // --- AÑADE ESTAS LÍNEAS JUSTO AQUÍ ---
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [favoriteSongs, setFavoriteSongs] = useState([]);

  // --- NUEVOS ESTADOS SOLICITADOS ---
 const [playlists, setPlaylists] = useState([
  { id: 'fav_list', name: 'Favoritos', songs: [] }
]);
  const [downloads, setDownloads] = useState({});
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);
// --- ESTADOS DE CONFIGURACIÓN (NUEVOS) ---
  const [themeMode, setThemeMode] = useState('Dinámico');
  const [appLanguage, setAppLanguage] = useState('Spanish');
  const [playerUI, setPlayerUI] = useState('Estándar');
  const [navBarSwitch, setNavBarSwitch] = useState(false);
  const [disableAnimation, setDisableAnimation] = useState(false);
  const [enableSwipe, setEnableSwipe] = useState(true);
  
  // --- DATOS SIMULADOS PARA LA PANTALLA DE INICIO ---
  const [favoriteArtist, setFavoriteArtist] = useState('Maná'); // Puedes cambiarlo dinámicamente al entrar a un perfil

  // --- ÁLBUMES PARA LA PANTALLA INICIAL ---
  const homeAlbums = [
    { id: 'alb1', name: 'Sueños Líquidos', artist: 'Maná', year: '1997', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300' },
    { id: 'alb2', name: 'Canción Animal', artist: 'Soda Stereo', year: '1990', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300' },
    { id: 'alb3', name: 'Romance', artist: 'Luis Miguel', year: '1991', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' },
  ];

  const recommendedPlaylists = [
    { id: 'p1', name: 'Mix Diario', tracks: '50 canciones', color: '#1db954' },
    { id: 'p2', name: 'Éxitos de Rock', tracks: '32 canciones', color: '#e91e63' },
    { id: 'p3', name: 'Para Concentrarse', tracks: '40 canciones', color: '#00bcd4' },
  ];

  const topSongs = [
    { id: 'top1', title: 'Clavado En Un Bar', artist: 'Maná', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100' },
    { id: 'top2', title: 'La Incondicional', artist: 'Luis Miguel', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100' },
    { id: 'top3', title: 'De Música Ligera', artist: 'Soda Stereo', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100' },
  ];

  const genericRecommendations = [
    { id: 'rec1', title: 'Rayando El Sol', artist: 'Maná', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100' },
    { id: 'rec2', title: 'Persiana Americana', artist: 'Soda Stereo', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100' },
  ];
  
  const [initialCount, setInitialCount] = useState('3');
  const [homeCache, setHomeCache] = useState(true);
  
  const [streamQuality, setStreamQuality] = useState('Alta');
  const [volumeNorm, setVolumeNorm] = useState(false);
  const [cacheSongs, setCacheSongs] = useState(true);
  const [skipSilence, setSkipSilence] = useState(false);
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const [restoreSession, setRestoreSession] = useState(false);
  const [autoOpenPlayer, setAutoOpenPlayer] = useState(true);
  
  const [autoDownloadFavs, setAutoDownloadFavs] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('M4a');

  // Modales de selección para los desplegables
  const [activeModal, setActiveModal] = useState(null);
  

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

  const moveSongInPlaylist = (playlistId, songIndex, direction) => {
    setPlaylists(prevPlaylists => prevPlaylists.map(p => {
      if (p.id !== playlistId) return p;
      const newSongs = [...p.songs];
      const targetIndex = direction === 'up' ? songIndex - 1 : songIndex + 1;
      if (targetIndex >= 0 && targetIndex < newSongs.length) {
        const temp = newSongs[songIndex];
        newSongs[songIndex] = newSongs[targetIndex];
        newSongs[targetIndex] = temp;
      }
      return { ...p, songs: newSongs };
    }));
  };

  const removeSongFromPlaylist = (playlistId, songId) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.id === 'fav_list') {
          setFavoriteSongs(prevFavs => prevFavs.filter(id => id !== songId));
        }
        return { ...p, songs: p.songs.filter(s => s.id !== songId) };
      }
      return p;
    }));
  };
  // --- FUNCIÓN PARA DESCARGAR TODO UN ÁLBUM O PLAYLIST ---
  const downloadFullCollection = (collectionSongs) => {
    if (!collectionSongs || collectionSongs.length === 0) {
      Alert.alert("Descarga", "No hay canciones disponibles en esta colección para descargar.");
      return;
    }

    Alert.alert(
      "Descargar Todo", 
      `¿Deseas descargar las ${collectionSongs.length} canciones de esta lista?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Descargar", 
          onPress: () => {
            // Recorre cada canción y le activa el estado de descarga de 2 segundos que ya tienes
            collectionSongs.forEach(song => {
              handleDownload(song.id);
            });
            Alert.alert("Descarga", "Descargando colección en segundo plano...");
          }
        }
      ]
    );
  };
const downloadPlaylist = (playlist) => {
  if (!playlist || !playlist.songs || playlist.songs.length === 0) {
    Alert.alert("Descarga", "Esta playlist no tiene canciones para descargar.");
    return;
  }
  
  Alert.alert("Descarga", `Iniciando descarga de ${playlist.songs.length} canciones...`);
  
  playlist.songs.forEach(song => {
    handleDownload(song.id);
  });
};
  const createPlaylist = () => {
    Alert.prompt("Nueva Playlist", "Nombre de la lista:", (name) => {
      if (name) setPlaylists([...playlists, { id: Date.now().toString(), name, songs: [] }]);
    });
  };
const addSongToPlaylist = (playlistId) => {
    // 1. Buscamos la playlist para la alerta
    const playlist = playlists.find(p => p.id === playlistId);
    
    // 2. Modificamos el estado guardando la canción realmente
    const updated = playlists.map(p => {
      if (p.id === playlistId && !p.songs.find(s => s.id === songToAdd.id)) {
        return { ...p, songs: [...p.songs, songToAdd] };
      }
      return p;
    });
    setPlaylists(updated);

    // 3. Mostramos el mensaje y cerramos el modal
    Alert.alert("Playlist", `"${songToAdd?.title}" fue agregada con éxito a ${playlist?.name}`);
    setShowPlaylistModal(false);
    if (setSongToAdd) setSongToAdd(null); // Limpieza segura si existe el estado
  };

// --- NUEVO SISTEMA DE REPRODUCCIÓN (TIEMPO Y CAMBIO AUTOMÁTICO CORREGIDO) ---
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const playTrack = async (track) => {
    try {
      // 1. Detener y descargar el audio previo de forma segura si ya existe
      if (sound.current) {
        try {
          await sound.current.unloadAsync();
        } catch (e) {
          // Captura excepciones por si el audio previo ya se había liberado
        }
      }

      if (!track || !track.url) {
        console.warn("Esta canción no tiene un link de reproducción válido.");
        return;
      }

      // Asegurar que si vienes del buscador global, la colección activa tenga las canciones para cambiar de pista
      if (!currentCollectionSongs || currentCollectionSongs.length === 0) {
        setCurrentCollectionSongs(songs);
      }

      // 2. Crear y cargar la NUEVA instancia de sonido directamente en la referencia
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { shouldPlay: true }
      );

      sound.current = newSound;

      // 3. Sincronizar el estado visual de manera inmediata para pintar el mini-reproductor
      setCurrentSong(track); 
      setIsPlaying(true);

      // 4. Configurar el callback de actualización una vez que el objeto ya está inicializado y cargado
      sound.current.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 1);

          if (status.durationMillis > 0) {
            const progressPercent = (status.positionMillis / status.durationMillis) * 100;
            setTrackProgress(progressPercent);
          }

          // Al terminar la canción pasa automáticamente a la siguiente
          if (status.didJustFinish && !status.isLooping) {
            handleNextTrack();
          }
        }
      });

    } catch (error) {
      console.error("Error al reproducir audio:", error);
    }
  };

 // --- CONTROL DE FAVORITOS ---
 const toggleFavorite = (track) => {
  if (!track) return;

  const isAlreadyFav = favoriteSongs.includes(track.id);
  let updatedFavoritesIds;

  if (isAlreadyFav) {
    // Quitar de favoritos
    updatedFavoritesIds = favoriteSongs.filter(id => id !== track.id);
    
    // Remover físicamente de la playlist "Favoritos"
    setPlaylists(prev => prev.map(p => {
      if (p.id === 'fav_list') {
        return { ...p, songs: p.songs.filter(s => s.id !== track.id) };
      }
      return p;
    }));
    Alert.alert("Favoritos", `"${track.title}" eliminada de tus Favoritos`);
  } else {
    // Añadir a favoritos
    updatedFavoritesIds = [...favoriteSongs, track.id];
    
    // Agregar físicamente a la playlist "Favoritos"
    setPlaylists(prev => prev.map(p => {
      if (p.id === 'fav_list') {
        const alreadyIn = p.songs.some(s => s.id === track.id);
        return { ...p, songs: alreadyIn ? p.songs : [...p.songs, track] };
      }
      return p;
    }));
    Alert.alert("Favoritos", `"${track.title}" añadida a tu playlist de Favoritos`);
  }

  setFavoriteSongs(updatedFavoritesIds);
};
  // --- CONTROLADOR DE SIGUIENTE PISTA (CON SHUFFLE Y REPEAT) ---
  const handleNextTrack = () => {
    if (!songs || songs.length === 0 || !currentSong) return;
    
    if (isRepeat) {
      // Si está activo repetir, vuelve a reproducir la misma canción
      playTrack(currentSong);
      return;
    }

    if (isShuffle) {
      // Elige una canción al azar de la lista actual
      const randomIndex = Math.floor(Math.random() * songs.length);
      playTrack(songs[randomIndex]);
    } else {
      // Secuencia normal
      const currentIndex = songs.findIndex(s => s.id === currentSong.id);
      const nextIndex = (currentIndex + 1) % songs.length;
      playTrack(songs[nextIndex]);
    }
  };
   // --- BOTÓN PARA PREPARAR LA ADICIÓN A UNA PLAYLIST ---
  const openAddToPlaylistModal = (track) => {
    setSongToAdd(track); // Asigna la canción seleccionada [cite: 10]
    setShowPlaylistModal(true); // Muestra el modal de listas [cite: 10]
  };

  // --- VINCULACIÓN DE COLECCIONES ---
  const goToCollection = (title, type) => {
    setCurrentArtist(`${type}: ${title}`);
    setView('artist_profile');
    
    const collectionTracks = [
      { id: `track-${type}-1`, title: 'Track 01: Introducción Épica', artist: title, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { id: `track-${type}-2`, title: 'Track 02: Single Principal', artist: title, image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      { id: `track-${type}-3`, title: 'Track 03: Melodía Urbana', artist: title, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
      { id: `track-${type}-4`, title: 'Track 04: Cierre Acústico', artist: title, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
    ];
    
    setCurrentCollectionSongs(collectionTracks);
    setSongs(collectionTracks); 
  };

  // --- PERFIL DE ARTISTA (ITUNES) ---
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

      const mappedSongs = dataSongs.results.map(s => ({
        id: s.trackId.toString(),
        title: s.trackName,
        artist: s.artistName,
        image: s.artworkUrl100.replace('100x100', '1000x1000'),
        url: s.previewUrl
      }));

      setCurrentCollectionSongs(mappedSongs); // Fijamos la colección activa al entrar al perfil
      setSongs(mappedSongs);

      setArtistAlbums(dataAlb.results.map(a => ({
        id: a.collectionId.toString(),
        name: a.collectionName,
        image: a.artworkUrl100.replace('100x100', '600x600'),
        year: new Date(a.releaseDate).getFullYear()
      })));
    } catch (e) { 
      console.error(e); 
    }
  }

  async function handleSearch() {
    if (!query) return;
    setView('results');
    try {
      const respSongs = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=20`);
      const dataSongs = await respSongs.json();
      const respAlb = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=10`);
      const dataAlb = await respAlb.json();

      const mappedSongs = dataSongs.results.map(s => ({
        id: s.trackId.toString(),
        title: s.trackName,
        artist: s.artistName,
        image: s.artworkUrl100.replace('100x100', '600x600'),
        url: s.previewUrl
      }));

      setCurrentCollectionSongs(mappedSongs); // Sincroniza la colección del buscador principal
      setSongs(mappedSongs);

      setArtistAlbums(dataAlb.results.map(a => ({
        id: a.collectionId.toString(),
        name: a.collectionName,
        image: a.artworkUrl100.replace('100x100', '600x600'),
        year: new Date(a.releaseDate).getFullYear()
      })));
    } catch (e) { 
      console.error("Error buscando:", e); 
    }
  }

  // --- FORMATEADOR DE TIEMPO Y AVANCE ---
  const formatTime = (millis) => {
    if (!millis || isNaN(millis)) return "0:00";
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeek = async (percentage) => {
    try {
      if (sound.current && duration > 0) {
        const newPositionMillis = (percentage / 100) * duration;
        await sound.current.setPositionAsync(newPositionMillis);
        setPosition(newPositionMillis);
      }
    } catch (e) {
      console.error("Error al mover la línea de tiempo:", e);
    }
  };

  // --- CONTROLADORES DE REPRODUCCIÓN UNIFICADOS ---
  async function loadAndPlay(item) {
    if (!item) return;
    await playTrack(item);
    setAccentColor(getRandomColor());
  }

  async function togglePlay(item) {
    if (!item) return;

    if (!currentSong || currentSong.id !== item.id) {
      await loadAndPlay(item);
      return;
    }

    try {
      if (sound.current) {
        if (isPlaying) {
          await sound.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.error("Error en togglePlay:", e);
    }
  }
  
  const handlePrevTrack = () => {
    const activeList = (currentCollectionSongs && currentCollectionSongs.length > 0) ? currentCollectionSongs : songs;
    
    if (!activeList || activeList.length === 0 || !currentSong) return;

    const currentIndex = activeList.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + activeList.length) % activeList.length;
    const prevTrack = activeList[prevIndex];

    if (prevTrack) {
      loadAndPlay(prevTrack);
    }
  };

  // --- VISTA DETALLADA DE AJUSTES (ACCIONES DE BOTONES ACTIVADAS) ---
  const renderSettingsView = () => {
    const renderOptionRow = (label, sublabel, element) => (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.3, borderBottomColor: '#222' }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>{label}</Text>
          {sublabel ? <Text style={{ color: '#777', fontSize: 12, marginTop: 2 }}>{sublabel}</Text> : null}
        </View>
        {element}
      </View>
    );

    const renderSelector = (label, value, options, setter) => (
      renderOptionRow(label, null, 
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
          onPress={() => setActiveModal({ label, options, current: value, setter })}
        >
          <Text style={{ color: 'white', marginRight: 5, fontSize: 14 }}>{value}</Text>
          <ChevronDown color="#777" size={16} />
        </TouchableOpacity>
      )
    );
    return (
      
      <View style={{ flex: 1, paddingBottom: 100 }}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20}}>
          <TouchableOpacity onPress={() => setTab('home')} style={{marginRight: 15}}>
            <ArrowLeft color="white" size={28} />
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>Ajustes</Text>
        </View>

        {/* SECCIÓN: PERSONALIZACIÓN */}
        <View style={{ backgroundColor: '#0f0f11', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Personalización</Text>
          {renderSelector('Modo del tema', themeMode, ['Dinámico', 'Oscuro', 'Claro'], setThemeMode)}
          {renderSelector('Idioma', appLanguage, ['Spanish', 'English', 'Portuguese'], setAppLanguage)}
          {renderSelector('Interfaz de usuario del reproductor', playerUI, ['Estándar', 'Minimalista', 'Completa'], setPlayerUI)}
          {renderOptionRow('Barra inferior de navegación', 'Cambiar a la barra de navegación inferior', <Switch value={navBarSwitch} onValueChange={setNavBarSwitch} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Desactivar la animación de la transición', 'Active esta opción para desactivar transiciones de las pestañas', <Switch value={disableAnimation} onValueChange={setDisableAnimation} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Habilitar acciones deslizables', 'Activar acciones deslizables en el mosaico de las canciones', <Switch value={enableSwipe} onValueChange={setEnableSwipe} trackColor={{ true: accentColor }} />)}
        </View>

        {/* SECCIÓN: CONTENIDO */}
        <View style={{ backgroundColor: '#0f0f11', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Contenido</Text>
          {renderOptionRow('Como se detecta el contenido', 'Selecciones rápidas', <Text style={{ color: '#777' }}>Automático</Text>)}
          {renderSelector('Recuento de contenidos', initialCount, ['3', '5', '10', '15'], setInitialCount)}
          {renderOptionRow('Caché de datos de la pantalla de inicio', 'Si esta opción está activada, la pantalla de inicio se cargará instantáneamente', <Switch value={homeCache} onValueChange={setHomeCache} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Canalizado', 'Enlace con las listas de reproducción', <TouchableOpacity onPress={() => Alert.alert("Sincronización", "Listas vinculadas exitosamente.")}><Text style={{ color: accentColor, fontWeight: 'bold' }}>Enlace</Text></TouchableOpacity>)}
          {renderOptionRow('Borrar caché de imágenes', 'Haga clic aquí para borrar las imágenes en caché.', <TouchableOpacity onPress={() => Alert.alert("Limpieza", "Caché de imágenes vaciada de forma segura.")}><Trash2 color="#ef4444" size={20} /></TouchableOpacity>)}
        </View>

        {/* SECCIÓN: MÚSICA Y REPRODUCCIÓN */}
        <View style={{ backgroundColor: '#0f0f11', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Música y reproducción</Text>
          {renderSelector('Calidad de la transmisión', streamQuality, ['Baja', 'Media', 'Alta', 'Ultra'], setStreamQuality)}
          {renderOptionRow('Normalización del volumen', 'Establece el mismo nivel de volumen para todas las canciones', <Switch value={volumeNorm} onValueChange={setVolumeNorm} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Canciones en caché', 'Almacenamiento de las canciones en la caché durante la reproducción', <Switch value={cacheSongs} onValueChange={setCacheSongs} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Omitir el silencio', 'El silencio se omitirá en la reproducción de la música', <Switch value={skipSilence} onValueChange={setSkipSilence} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Mantener la pantalla encendida mientras se reproduce', 'Si está activado, la pantalla permanecerá despierta', <Switch value={keepScreenOn} onValueChange={setKeepScreenOn} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Restaurar la última sesión de reproducción', 'Restaura automáticamente la última sesión al iniciar la aplicación', <Switch value={restoreSession} onValueChange={setRestoreSession} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Abrir automáticamente pantalla del reproductor', 'Activar/desactivar la apertura automática a pantalla completa al seleccionar una canción', <Switch value={autoOpenPlayer} onValueChange={setAutoOpenPlayer} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Ecualizador', 'Abrir ecualizador del sistema', <TouchableOpacity onPress={() => Alert.alert("Ecualizador", "Abriendo el ecualizador del dispositivo...")}><Sliders color="white" size={20} /></TouchableOpacity>)}
        </View>

        {/* SECCIÓN: DESCARGAR */}
        <View style={{ backgroundColor: '#0f0f11', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Descargar</Text>
          {renderOptionRow('Descarga automática de canciones favoritas', 'Descarga automática de canciones cuando se añaden a favoritas', <Switch value={autoDownloadFavs} onValueChange={setAutoDownloadFavs} trackColor={{ true: accentColor }} />)}
          {renderSelector('Descargando formato del archivo', downloadFormat, ['M4a', 'Opus', 'MP3'], setDownloadFormat)}
          {renderOptionRow('Ubicación de la descarga', 'In App storage directory', <TouchableOpacity onPress={() => Alert.alert("Almacenamiento", "Ubicación por defecto restablecida.")}><Text style={{ color: 'white', textDecorationLine: 'underline' }}>Restablecer</Text></TouchableOpacity>)}
          {renderOptionRow('Exportar archivos descargados', 'Haga clic aquí para exportar el archivo descargado al directorio público', <TouchableOpacity style={{backgroundColor: '#222', padding: 8, borderRadius: 8}} onPress={() => Alert.alert("Exportar", "Canciones exportadas a tu carpeta de Música.")}><Text style={{color: 'white', fontSize: 12}}>Exportar</Text></TouchableOpacity>)}
        </View>

        {/* SECCIÓN: COPIA DE SEGURIDAD */}
        <View style={{ backgroundColor: '#0f0f11', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Copia de seguridad & Restaurar</Text>
          {renderOptionRow('Copia de seguridad de datos de la aplicación', 'Guarda configuraciones, listas de reproducción y datos de inicio', <TouchableOpacity style={{backgroundColor: '#222', padding: 8, borderRadius: 8}} onPress={() => Alert.alert("Copia", "Copia de seguridad guardada localmente.")}><Text style={{color: 'white', fontSize: 12}}>Respaldar</Text></TouchableOpacity>)}
          {renderOptionRow('Restaurar datos de la aplicación', 'Restaura configuraciones y listas desde un archivo', <TouchableOpacity style={{backgroundColor: '#222', padding: 8, borderRadius: 8}} onPress={() => Alert.alert("Restaurar", "Datos sincronizados y restaurados correctamente.")}><Text style={{color: 'white', fontSize: 12}}>Restaurar</Text></TouchableOpacity>)}
        </View>

        {/* SECCIÓN: VARIOS */}
        <View style={{ backgroundColor: '#0f0f11', borderRadius: 16, padding: 16, marginBottom: 40 }}>
          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Varios</Text>
          {renderOptionRow('Restaurar configuración por defecto', 'Restaura la configuración a los valores predeterminados', <TouchableOpacity onPress={() => Alert.alert("Limpieza", "Se ha restablecido la configuración original.")}><RotateCcw color="#ef4444" size={20} /></TouchableOpacity>)}
          
          <View style={{ marginTop: 20, alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#333', paddingTop: 15 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Nitraxx Music</Text>
            <Text style={{ color: '#555', fontSize: 12, marginTop: 4 }}>V1.12.2 por Nitraxx</Text>
          </View>
        </View>
      </View>
    );

  };
return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0a0a0a', '#121212']} style={StyleSheet.absoluteFill} />

      {/* DISEÑO ESTRUCTURAL */}
      <View style={styles.mainLayout}>
        
        {/* ================= BARRA LATERAL IZQUIERDA ================= */}
        <View style={styles.sidebar}>
          <TouchableOpacity onPress={() => { setSongs([]); setCurrentCollectionSongs([]); setArtistAlbums([]); setView('results'); setTab('home'); }}>
            <Disc color={accentColor} size={28} />
          </TouchableOpacity>

          <View style={styles.sidebarCenterOptions}>
            <TouchableOpacity style={styles.verticalNavButton} onPress={() => { setSongs([]); setCurrentCollectionSongs([]); setArtistAlbums([]); setView('results'); setTab('home'); }}>
              <Text style={[styles.verticalText, tab === 'home' && view === 'results' && styles.verticalTextActive]}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.verticalNavButton} onPress={() => { setView('results'); setTab('songs'); }}>
              <Text style={[styles.verticalText, tab === 'songs' && styles.verticalTextActive]}>Canciones</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.verticalNavButton} onPress={() => setTab('library')}>
              <Text style={[styles.verticalText, tab === 'library' && styles.verticalTextActive]}>Listas de reproducción</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.verticalNavButton} onPress={() => { setView('results'); setTab('albums'); }}>
              <Text style={[styles.verticalText, tab === 'albums' && styles.verticalTextActive]}>Álbumes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.verticalNavButton} onPress={() => { setView('results'); setTab('artists'); }}>
              <Text style={[styles.verticalText, tab === 'artists' && styles.verticalTextActive]}>Artistas</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setTab('settings')} style={{ paddingBottom: 10 }}>
            <Settings color={tab === 'settings' ? accentColor : '#888'} size={24} />
          </TouchableOpacity>
        </View>

        {/* ================= CONTENIDO DE LA PANTALLA (DERECHA) ================= */}
        <View style={styles.rightContentContainer}>
          <ScrollView 
    showsVerticalScrollIndicator={false} 
    style={{ flex: 1 }}
    contentContainerStyle={{ paddingBottom: currentSong ? 120 : 30 }}
  >
            {tab === 'settings' ? (
              renderSettingsView()
            ) : tab === 'library' ? (
              <View style={{ padding: 10, paddingTop: 60 }}>
                <Text style={styles.artistNameBig}>Biblioteca</Text>
                <Text style={{ color: '#666', marginTop: 20, fontSize: 16 }}>Tus playlists y canciones guardadas aparecerán aquí.</Text>
              </View>
            ) : (
              <>
                {/* ENCABEZADO ESTÁNDAR */}
                {view === 'results' && (
                  <View style={[styles.header, {paddingHorizontal: 10, paddingTop: 50}]}>
                    <Text style={styles.logo}>NITRAXX <Text style={{color: accentColor}}>MUSIC</Text></Text>
                  </View>
                )}

                {/* ================= VISTA ESTILO SPOTIFY: PERFIL / PLAYLIST / ÁLBUM ================= */}
                {view === 'artist_profile' && (
  <View style={{paddingTop: 50, paddingHorizontal: 10, marginBottom: 20}}>
    <TouchableOpacity style={{marginBottom: 15, backgroundColor: '#1c1c1e', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center'}} onPress={() => setView('results')}>
      <ArrowLeft color="white" size={24} />
    </TouchableOpacity>
    
    {/* Contenedor horizontal para el título y el botón Descargar Todo */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
      <Text style={[styles.artistNameBig, {fontSize: 26, marginBottom: 0, flex: 1, marginRight: 10}]}>{currentArtist}</Text>

      {/* ====== BOTÓN INTEGRADO: DESCARGAR TODO EL ÁLBUM/PLAYLIST ====== */}
      <TouchableOpacity 
        style={{ 
          flexDirection: 'row', 
          backgroundColor: '#161616', 
          paddingHorizontal: 14, 
          paddingVertical: 8, 
          borderRadius: 20, 
          alignItems: 'center',
          gap: 6,
          borderWidth: 0.5,
          borderColor: '#333'
        }}
        onPress={() => downloadFullCollection(currentCollectionSongs)}
      >
        <Download color={accentColor} size={16} />
        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Descargar Todo</Text>
      </TouchableOpacity>
      {/* =============================================================== */}
    </View>

    <View style={[styles.verifiedContainer, {marginBottom: 15}]}>
      <Disc color={accentColor} size={16} />
      <Text style={styles.verifiedText}> Contenido Sincronizado • {currentCollectionSongs.length} temas</Text>
    </View>

    <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10, paddingHorizontal: 10 }}>
      <TouchableOpacity 
        style={[styles.chip, searchFilter === 'artist' && { backgroundColor: accentColor }]} 
        onPress={() => setSearchFilter('artist')}
      >
        <Text style={[styles.chipText, searchFilter === 'artist' && { color: '#000' }]}>Artistas</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.chip, searchFilter === 'album' && { backgroundColor: accentColor }]} 
        onPress={() => setSearchFilter('album')}
      >
        <Text style={[styles.chipText, searchFilter === 'album' && { color: '#000' }]}>Álbumes</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.chip, searchFilter === 'playlist' && { backgroundColor: accentColor }]} 
        onPress={() => setSearchFilter('playlist')}
      >
        <Text style={[styles.chipText, searchFilter === 'playlist' && { color: '#000' }]}>Playlists</Text>
      </TouchableOpacity>
    </View>

    <Text style={styles.sectionTitle}>Canciones</Text>
    {currentCollectionSongs.map((item, index) => {
      // Validaciones visuales en tiempo real para descargas y favoritos
      const isDownloaded = downloads[item.id] === 'completed';
      const isFav = favoriteSongs.includes(item.id);

      return (
        <TouchableOpacity key={item.id} style={styles.songRow} onPress={() => togglePlay(item)}>
          <Text style={styles.songIndex}>{index + 1}</Text>
          <Image source={{uri: item.image}} style={styles.songArt} />
          
          <View style={{flex: 1, marginLeft: 15}}>
            <Text style={[styles.songTitle, {color: currentSong?.id === item.id ? accentColor : 'white'}]} numberOfLines={1}>{item.title}</Text>
            <TouchableOpacity onPress={() => goToArtistProfile(item.artist)}>
              <Text style={styles.songArtist}>{item.artist}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Botones de acción de la canción conectados a tus funciones reales */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 14, marginRight: 5}}>
            <TouchableOpacity onPress={() => handleDownload(item.id)}>
              <Download color={isDownloaded ? accentColor : "#777"} size={18} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => toggleFavorite(item)}>
              <Heart color={isFav ? accentColor : "#777"} fill={isFav ? accentColor : "transparent"} size={18} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
)}

                {/* BARRA DE BÚSQUEDA AVANZADA CON SELECTORES */}
                {view === 'results' && (
                  <View style={{marginBottom: 15}}>
                    <View style={[styles.searchBar, {marginHorizontal: 10, marginBottom: 10}]}>
                      <Search color="#888" size={20} />
                      <TextInput 
                        placeholder={`Buscar por ${searchFilter === 'artist' ? 'artista' : searchFilter === 'album' ? 'álbum' : 'playlist'}...`} 
                        placeholderTextColor="#444" 
                        style={styles.input}
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={() => {
                          handleSearch();
                          if(query.trim() && searchFilter === 'artist') setFavoriteArtist(query); 
                        }}
                      />
                    </View>

                    {/* FILTROS MULTI-OPCIÓN */}
                    <View style={{flexDirection: 'row', justifyContent: 'flex-start', gap: 10, paddingHorizontal: 10}}>
                      {['artist', 'album', 'playlist'].map((filterType) => (
                        <TouchableOpacity 
                          key={filterType} 
                          style={{
                            backgroundColor: searchFilter === filterType ? accentColor : '#121212', 
                            paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                            borderWidth: 0.5, borderColor: '#333'
                          }}
                          onPress={() => setSearchFilter(filterType)}
                        >
                          <Text style={{color: searchFilter === filterType ? 'black' : 'white', fontWeight: 'bold', fontSize: 12, textTransform: 'capitalize'}}>
                            {filterType === 'artist' ? 'Artistas' : filterType === 'album' ? 'Álbumes' : 'Playlists'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
            
                {/* RESPUESTA DE BÚSQUEDAS EN MÓDULO PRINCIPAL */}
                {view === 'results' && (songs.length > 0 || artistAlbums.length > 0) ? (
                  <View style={{marginTop: 10}}>
                    {artistAlbums.length > 0 && (
                      <View>
                        <Text style={[styles.sectionTitle, {marginLeft: 10}]}>Álbumes y Lanzamientos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingLeft: 10, marginBottom: 20}}>
                          {artistAlbums.map((album) => (
                            <TouchableOpacity key={album.id} style={styles.albumCard} onPress={() => goToCollection(album.name, 'Álbum')}>
                              <Image source={{uri: album.image}} style={styles.albumArt} />
                              <Text style={styles.albumName} numberOfLines={1}>{album.name}</Text>
                              <Text style={styles.albumYear}>{album.year}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {songs.length > 0 && (
                      <View>
                        <Text style={[styles.sectionTitle, {marginLeft: 10}]}>Canciones Encontradas</Text>
                        {songs.map((item, index) => (
                          <TouchableOpacity 
                            key={item.id} 
                            style={styles.songRow} 
                            onPress={() => {
                              setCurrentCollectionSongs(songs); // Mantiene la cola de reproducción actualizada
                              togglePlay(item);
                            }}
                          >
                            <Text style={styles.songIndex}>{index + 1}</Text>
                            <Image source={{uri: item.image}} style={styles.songArt} />
                            <View style={{flex: 1, marginLeft: 15}}>
                              <Text style={[styles.songTitle, {color: currentSong?.id === item.id ? accentColor : 'white'}]} numberOfLines={1}>{item.title}</Text>
                              <TouchableOpacity onPress={() => goToArtistProfile(item.artist)}>
                                <Text style={styles.songArtist}>{item.artist}</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14, marginRight: 5}}>
                              <TouchableOpacity onPress={() => Alert.alert("Descarga", `Descargando...`)}><Download color="#777" size={18} /></TouchableOpacity>
                              <TouchableOpacity onPress={() => Alert.alert("Favoritos", `Añadido`)}><Heart color="#777" size={18} /></TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  /* RECOMENDACIONES POR DEFECTO DEL HOME */
                  view === 'results' && (
                    <View>
                      <Text style={[styles.sectionTitle, { marginLeft: 10, marginTop: 10 }]}>Selecciones rápidas</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 10, marginBottom: 20 }}>
                        {recommendedPlaylists.map((p) => (
                          <TouchableOpacity
                            key={p.id}
                            style={[{ backgroundColor: '#121212', width: 140, padding: 15, borderRadius: 15, marginRight: 15, borderLeftWidth: 4, borderLeftColor: p.color }]}
                            onPress={() => goToCollection(p.name, 'Lista')}
                          >
                            <ListMusic color="white" size={24} style={{ marginBottom: 10 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{p.name}</Text>
                            <Text style={{ color: '#666', fontSize: 11, marginTop: 4 }}>{p.tracks}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <Text style={[styles.sectionTitle, { marginLeft: 10 }]}>Álbumes recomendados</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 10, marginBottom: 20 }}>
                        {homeAlbums.map((album) => (
                          <TouchableOpacity
                            key={album.id}
                            style={{ width: 140, marginRight: 15 }}
                            onPress={() => goToCollection(album.name, 'Álbum')}
                          >
                            <Image source={{ uri: album.image }} style={{ width: 140, height: 140, borderRadius: 10 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14, marginTop: 8 }} numberOfLines={1}>{album.name}</Text>
                            <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }} numberOfLines={1}>{album.artist}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* ================= MODAL DEL REPRODUCTOR GRANDE (COMPLETAMENTE INDEPENDIENTE) ================= */}
      <Modal visible={showFullPoster} animationType="slide">
        <View style={styles.posterContainer}>
          <LinearGradient colors={[accentColor + '55', '#000']} style={StyleSheet.absoluteFill} />
          
          {/* BOTÓN DE LA FLECHITA ATRÁS - CORREGIDA POSICIÓN ABSOLUTA */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowFullPoster(false)}>
            <ArrowLeft color="white" size={32} />
          </TouchableOpacity>
          
          <Image source={{ uri: currentSong?.image }} style={styles.bigArt} />
          
          <View style={styles.posterMeta}>
  <View style={{ flex: 1 }}>
    <Text style={styles.posterTitle} numberOfLines={1}>{currentSong?.title}</Text>
    <TouchableOpacity onPress={() => { setShowFullPoster(false); goToArtistProfile(currentSong?.artist); }}>
      <Text style={[styles.posterArtist, {color: accentColor}]}>{currentSong?.artist} ›</Text>
    </TouchableOpacity>
  </View>
  
  {/* ====== CORAZÓN DEL REPRODUCTOR GRANDE CONECTADO ====== */}
  <TouchableOpacity onPress={() => toggleFavorite(currentSong)}>
    <Heart 
      color={favoriteSongs.includes(currentSong?.id) ? accentColor : "white"} 
      fill={favoriteSongs.includes(currentSong?.id) ? accentColor : "transparent"} 
      size={26} 
    />
  </TouchableOpacity>
  {/* ====================================================== */}
</View>

          {/* LÍNEA DE TIEMPO INTERACTIVA Y TIEMPOS (SOPORTA ARRASTRE Y DESLIZAMIENTO) */}
          <View style={{ width: '90%', alignItems: 'center', alignSelf: 'center', marginTop: 15, marginBottom: 5 }}>
            <View 
              style={{ width: '100%', height: 30, justifyContent: 'center' }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderRelease={(e) => {
                const touchX = e.nativeEvent.locationX;
                // CORRECCIÓN: Usamos directamente Dimensions aquí para evitar el error de variable inexistente
                const barWidth = Dimensions.get('window').width * 0.9;
                const percentage = (touchX / barWidth) * 100;
                handleSeek(Math.max(0, Math.min(100, percentage)));
              }}
              onResponderMove={(e) => {
                const touchX = e.nativeEvent.locationX;
                // CORRECCIÓN: Usamos directamente Dimensions aquí también
                const barWidth = Dimensions.get('window').width * 0.9;
                const percentage = (touchX / barWidth) * 100;
                const safePercentage = Math.max(0, Math.min(100, percentage));
                setTrackProgress(safePercentage); 
                if (duration > 0) setPosition((safePercentage / 100) * duration);
              }}
            >
              {/* Fondo de la barra */}
              <View style={{ width: '100%', height: 4, backgroundColor: '#333', borderRadius: 2 }}>
                <View style={{ width: `${Math.max(0, Math.min(100, trackProgress))}%`, height: '100%', backgroundColor: accentColor, borderRadius: 2 }} />
              </View>
              
              {/* Indicador flotante (Círculo de arrastre) */}
              <View style={{ 
                position: 'absolute', 
                left: `${Math.max(0, Math.min(96, trackProgress))}%`, 
                width: 14, 
                height: 14, 
                borderRadius: 7, 
                backgroundColor: 'white',
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3
              }} />
            </View>

            {/* Textos de Minutos/Segundos Dinámicos */}
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
              <Text style={{ color: '#888', fontSize: 12 }}>{formatTime(position)}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* CONTROLES PRINCIPALES ASOCIADOS A ESTADOS REALES */}
          <View style={styles.posterControls}>
            <TouchableOpacity onPress={() => setIsShuffle(!isShuffle)}>
              <Shuffle color={isShuffle ? accentColor : "white"} size={24} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePrevTrack}>
              <SkipBack color="white" size={36} fill="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => togglePlay(currentSong)} style={[styles.bigPlayBtn, { backgroundColor: accentColor }]}>
              {isPlaying ? <Pause color="black" size={32} fill="black" /> : <Play color="black" size={32} fill="black" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNextTrack}>
              <SkipForward color="white" size={36} fill="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsRepeat(!isRepeat)}>
              <Repeat color={isRepeat ? accentColor : "white"} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MINI REPRODUCTOR FLOTANTE TRASERO (SIEMPRE DISPONIBLE) ================= */}
      {currentSong && (
        <TouchableOpacity 
          style={styles.miniPlayer} 
          onPress={() => setShowFullPoster(true)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: currentSong.image }} style={styles.miniArt} />
          
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.miniTitle} numberOfLines={1}>{currentSong.title}</Text>
            <Text style={[styles.miniArtist, { color: accentColor }]} numberOfLines={1}>{currentSong.artist}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={() => togglePlay(currentSong)} style={[styles.playBtnCircle, { backgroundColor: '#1c1c1e' }]}>
              {isPlaying ? <Pause color="white" size={20} fill="white" /> : <Play color="white" size={20} fill="white" />}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleNextTrack}>
              <SkipForward color="white" size={22} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* ================= MODAL DE GESTIÓN ADAPTADO (PLAYLISTS / AGREGAR) ================= */}
<Modal visible={showPlaylistModal} transparent={true} animationType="fade">
  <View style={styles.modalBackdrop}>
    <View style={styles.modalMenu}>
      
      {/* MODO EDICIÓN: Si seleccionamos una playlist para organizar sus canciones */}
      {songToAdd && songToAdd.songs ? (
        <>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' }}>Organizar Playlist</Text>
          <Text style={{ color: accentColor, fontSize: 13, marginBottom: 15, textAlign: 'center' }}>{songToAdd.name}</Text>
          
          <ScrollView style={{ maxHeight: 300 }}>
            {playlists.find(pl => pl.id === songToAdd.id)?.songs.map((song, idx, arr) => (
              <View key={`${song.id}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#222' }}>
                <Image source={{ uri: song.image }} style={{ width: 30, height: 30, borderRadius: 4 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{song.title}</Text>
                </View>
                
                {/* Flechas compactas de ordenamiento */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {idx > 0 && (
                    <TouchableOpacity onPress={() => moveSongInPlaylist(songToAdd.id, idx, 'up')} style={{ padding: 2 }}>
                      <Text style={{ color: accentColor, fontSize: 18, fontWeight: 'bold' }}>↑</Text>
                    </TouchableOpacity>
                  )}
                  {idx < arr.length - 1 && (
                    <TouchableOpacity onPress={() => moveSongInPlaylist(songToAdd.id, idx, 'down')} style={{ padding: 2 }}>
                      <Text style={{ color: accentColor, fontSize: 18, fontWeight: 'bold' }}>↓</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => removeSongFromPlaylist(songToAdd.id, song.id)} style={{ padding: 2, marginLeft: 4 }}>
                    <Text style={{ color: '#ff4444', fontSize: 12, marginTop: 4 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {(!songToAdd.songs || songToAdd.songs.length === 0) && (
              <Text style={{ color: '#555', textAlign: 'center', marginVertical: 20, fontStyle: 'italic' }}>No hay canciones en esta lista</Text>
            )}
          </ScrollView>
        </>
      ) : (
        /* MODO NORMAL: Tu lógica previa de agregar canción a playlist */
        <>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>Agregar a Playlist</Text>
          <ScrollView style={{ maxHeight: 200 }}>
            {playlists.map(p => (
              <TouchableOpacity key={p.id} style={styles.modalItem} onPress={() => addSongToPlaylist(p.id)}>
                <Text style={{ color: 'white', fontSize: 16 }}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Botón de cierre común */}
      <TouchableOpacity 
        style={{ backgroundColor: '#222', padding: 12, borderRadius: 10, marginTop: 15, alignItems: 'center' }}
        onPress={() => {
          setShowPlaylistModal(false);
          setSongToAdd(null); // Reseteamos el estado al salir
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Cerrar listo</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </View>
  ); // <--- AQUÍ TERMINA EL RETURN GENERAL
} // <--- AQUÍ CIERRA DEFINTIVAMENTE LA FUNCIÓN APP
// ================= ESTILOS GENERALES DE LA APLICACIÓN =================
const styles = StyleSheet.create({
  chip: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  backgroundColor: '#1a1a1a',
  justifyContent: 'center',
  alignItems: 'center'
},
chipText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold'
},
  mainLayout: {
    flex: 1,
    flexDirection: 'row', 
    backgroundColor: '#000',
  },
  sidebar: {
    width: 65, 
    backgroundColor: '#090a0a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 30,
    borderRightWidth: 0.5,
    borderRightColor: '#151515',
  },
  sidebarCenterOptions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 35, 
    marginVertical: 20,
  },
  verticalNavButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    width: 50,
  },
  verticalText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    transform: [{ rotate: '-90deg' }], 
    width: 120, 
    textAlign: 'center',
  },
  verticalTextActive: {
    color: 'white', 
    fontWeight: 'bold',
  },
  rightContentContainer: {
    flex: 1, 
    backgroundColor: '#000',
  },
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
miniPlayer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 80, // <--- CAMBIA ESTO (Antes era 10, ahora deja libre el espacio de la barra lateral)
    right: 15, // <--- AJUSTA ESTO (Le da un margen limpio al borde derecho)
    height: 75, 
    backgroundColor: '#121212', 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    zIndex: 10 
  },
  miniArt: { width: 50, height: 50, borderRadius: 12 },
  miniTitle: { color: 'white', fontWeight: 'bold' },
  miniArtist: { fontSize: 11 },
  playBtnCircle: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 95, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15 },
  navItem: { alignItems: 'center' },
  navLabel: { fontSize: 11, marginTop: 5, fontWeight: 'bold' },
  posterContainer: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 40, left: 25, padding: 10, zIndex: 20 },
  bigArt: { width: width * 0.85, height: width * 0.85, borderRadius: 25, marginTop: 40 },
  posterMeta: { width: '100%', marginTop: 25 },
  posterTitle: { color: 'white', fontSize: 26, fontWeight: 'bold' },
  posterArtist: { fontSize: 20, marginTop: 5 },
  posterControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 30 },
  bigPlayBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  playlistCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  playlistIcon: { width: 55, height: 55, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  settingText: { color: 'white', fontSize: 16, marginLeft: 15 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalMenu: { backgroundColor: '#1a1a1a', width: '80%', padding: 25, borderRadius: 20 },
  modalItem: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#333' }
});
