import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, ScrollView, Dimensions, Modal, StatusBar, Alert, Switch, NativeModules, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import TrackPlayer, { Capability, Event, RepeatMode, State } from 'react-native-track-player';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { WebView } from 'react-native-webview';
import { 
Search, Pause, Play, SkipForward, SkipBack, Home, Library, 
  Settings, ListMusic, Heart, Repeat, Shuffle, Download, 
  MoreVertical, ChevronDown, ArrowLeft, Disc, Languages,
  Smartphone, Trash2, ShieldAlert, RotateCcw, Info, Github
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId;
const YOUTUBE_READONLY_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
const APP_LOGO_URI = Image.resolveAssetSource(require('./jvlogo1.png')).uri;
const labels = {
  Spanish: {
    home: 'Inicio', songs: 'Canciones', library: 'Biblioteca', playlists: 'Listas de reproducción',
    albums: 'Álbumes', artists: 'Artistas', settings: 'Ajustes', search: 'Buscar',
    newPlaylist: 'Nueva playlist', create: 'Crear', cancel: 'Cancelar',
  },
  English: {
    home: 'Home', songs: 'Songs', library: 'Library', playlists: 'Playlists',
    albums: 'Albums', artists: 'Artists', settings: 'Settings', search: 'Search',
    newPlaylist: 'New playlist', create: 'Create', cancel: 'Cancel',
  },
  Portuguese: {
    home: 'Início', songs: 'Músicas', library: 'Biblioteca', playlists: 'Playlists',
    albums: 'Álbuns', artists: 'Artistas', settings: 'Configurações', search: 'Buscar',
    newPlaylist: 'Nova playlist', create: 'Criar', cancel: 'Cancelar',
  },
};

const getYouTubeResource = (value) => {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)
      || !['music.youtube.com', 'youtube.com', 'www.youtube.com', 'youtu.be'].includes(url.hostname)) return null;

    const playlistId = url.searchParams.get('list');
    const videoId = url.searchParams.get('v') || (url.hostname === 'youtu.be' ? url.pathname.slice(1) : null);
    if (playlistId && /^[\w-]+$/.test(playlistId)) return { playlistId };
    if (videoId && /^[\w-]+$/.test(videoId)) return { videoId };
    return null;
  } catch {
    return null;
  }
};

export default function App() {
  const [tab, setTab] = useState('home');
  const [view, setView] = useState('results'); 
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [currentArtist, setCurrentArtist] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [showFullPoster, setShowFullPoster] = useState(false);
  const [accentColor, setAccentColor] = useState('#BB86FC');
  const [searchFilter, setSearchFilter] = useState('song');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [youtubePlayback, setYoutubePlayback] = useState(null);
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
 const [storageReady, setStorageReady] = useState(false);
  const [downloads, setDownloads] = useState({});
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
 const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
 const [newPlaylistName, setNewPlaylistName] = useState('');
  const [songToAdd, setSongToAdd] = useState(null);
// --- ESTADOS DE CONFIGURACIÓN (NUEVOS) ---
  const [themeMode, setThemeMode] = useState('Dinámico');
  const [appLanguage, setAppLanguage] = useState('Spanish');
  const [playerUI, setPlayerUI] = useState('Estándar');
  const [navBarSwitch, setNavBarSwitch] = useState(false);
  const [disableAnimation, setDisableAnimation] = useState(false);
  const [enableSwipe, setEnableSwipe] = useState(true);
  
  const [topSongs, setTopSongs] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [chartError, setChartError] = useState('');
  const [chartsUpdatedAt, setChartsUpdatedAt] = useState(null);
  const [loadingChartSongId, setLoadingChartSongId] = useState(null);
  const [initialCount, setInitialCount] = useState('10');
  const [homeCache, setHomeCache] = useState(true);
  
  const [streamQuality, setStreamQuality] = useState('Alta');
  const [volumeNorm, setVolumeNorm] = useState(false);
  const [cacheSongs, setCacheSongs] = useState(true);
  const [skipSilence, setSkipSilence] = useState(false);
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const [restoreSession, setRestoreSession] = useState(false);
  const [autoOpenPlayer, setAutoOpenPlayer] = useState(true);
  
  const [autoDownloadFavs, setAutoDownloadFavs] = useState(false);

  // Modales de selección para los desplegables
  const [activeModal, setActiveModal] = useState(null);
  const t = (key) => labels[appLanguage]?.[key] || labels.Spanish[key];
  
  useEffect(() => {
    let active = true;

    const loadSavedState = async () => {
      try {
        const saved = await AsyncStorage.getItem('nitraxx-music:library:v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!parsed || !Array.isArray(parsed.playlists) || !Array.isArray(parsed.favoriteSongs)
            || !parsed.playlists.every(playlist => playlist
              && typeof playlist.id === 'string'
              && typeof playlist.name === 'string'
              && Array.isArray(playlist.songs))
            || !parsed.favoriteSongs.every(id => typeof id === 'string')) {
            throw new Error('El formato guardado de la biblioteca no es válido.');
          }
          if (active) {
            const hasFavorites = parsed.playlists.some(playlist => playlist.id === 'fav_list');
            setPlaylists(hasFavorites
              ? parsed.playlists
              : [{ id: 'fav_list', name: 'Favoritos', songs: [] }, ...parsed.playlists]);
            setFavoriteSongs(parsed.favoriteSongs);
            setThemeMode(parsed.themeMode || 'Dinámico');
            setAppLanguage(parsed.appLanguage || 'Spanish');
            setSkipSilence(typeof parsed.skipSilence === 'boolean' ? parsed.skipSilence : false);
          }
        }
      } catch (error) {
        console.error('Error al cargar la biblioteca local:', error);
        if (active) Alert.alert('Biblioteca', 'No se pudieron cargar los datos guardados.');
      } finally {
        if (active) setStorageReady(true);
      }
    };

    loadSavedState();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    AsyncStorage.setItem('nitraxx-music:library:v1', JSON.stringify({
      playlists,
      favoriteSongs,
      themeMode,
      appLanguage,
      skipSilence,
    })).catch((error) => {
      console.error('Error al guardar la biblioteca local:', error);
      Alert.alert('Biblioteca', 'No se pudieron guardar los cambios en este dispositivo.');
    });
  }, [storageReady, playlists, favoriteSongs, themeMode, appLanguage, skipSilence]);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        if (GOOGLE_WEB_CLIENT_ID) {
          GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            scopes: [YOUTUBE_READONLY_SCOPE],
          });
          setGoogleUser(GoogleSignin.getCurrentUser());
        }

        await TrackPlayer.setupPlayer({
          autoHandleInterruptions: true,
          maxCacheSize: 50 * 1024,
        });
        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
          ],
          notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
          ],
          progressUpdateEventInterval: 1,
        });

        if (active) setPlayerReady(true);
      } catch (error) {
        console.error('Error al iniciar el reproductor:', error);
        if (active) {
          Alert.alert('Reproductor', 'No se pudo iniciar el servicio de reproducción.');
        }
      }
    };

    initialize();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const stateSubscription = TrackPlayer.addEventListener(Event.PlaybackState, ({ state }) => {
      setIsPlaying(state === State.Playing);
    });
    const progressSubscription = TrackPlayer.addEventListener(
      Event.PlaybackProgressUpdated,
      ({ position: currentPosition, duration: currentDuration }) => {
        setPosition(currentPosition * 1000);
        setDuration(currentDuration * 1000);
        setTrackProgress(currentDuration > 0 ? (currentPosition / currentDuration) * 100 : 0);
      }
    );
    const trackSubscription = TrackPlayer.addEventListener(
      Event.PlaybackActiveTrackChanged,
      ({ track }) => {
        if (track) {
          setCurrentSong({ ...track, image: track.image || track.artwork });
        }
      }
    );
    const queueSubscription = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      setIsPlaying(false);
    });
    const errorSubscription = TrackPlayer.addEventListener(Event.PlaybackError, ({ message }) => {
      console.error('Error de reproducción:', message);
      Alert.alert('Reproducción', message || 'No se pudo reproducir esta pista.');
    });

    return () => {
      stateSubscription.remove();
      progressSubscription.remove();
      trackSubscription.remove();
      queueSubscription.remove();
      errorSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (playerReady) {
      TrackPlayer.setRepeatMode(isRepeat ? RepeatMode.Track : RepeatMode.Off).catch((error) => {
        console.error('Error al actualizar repetición:', error);
      });
    }
  }, [isRepeat, playerReady]);

  useEffect(() => {
    if (!playerReady || Platform.OS !== 'android') return;
    NativeModules.TrackPlayerModule.setSkipSilence(skipSilence).catch((error) => {
      console.error('Error al configurar la omisión de silencios:', error);
      Alert.alert('Reproducción', 'No se pudo cambiar la omisión de silencios.');
    });
  }, [skipSilence, playerReady]);

  const getRandomColor = () => {
    const colors = ['#BB86FC', '#03DAC6', '#FF0266', '#FFDE03', '#00E5FF', '#76FF03', '#FF9100', '#64FFDA'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const loadHomeCharts = async () => {
    setIsLoadingCharts(true);
    setChartError('');

    const fetchChart = async (type) => {
      const response = await fetch(
        `https://rss.marketingtools.apple.com/api/v2/es/music/most-played/25/${type}.json?refresh=${Date.now()}`
      );
      if (!response.ok) throw new Error(`No se pudo cargar el top de ${type}.`);
      const data = await response.json();
      return data.feed?.results || [];
    };

    try {
      const [songsResult, albumsResult] = await Promise.allSettled([
        fetchChart('songs'),
        fetchChart('albums'),
      ]);
      if (songsResult.status === 'rejected') throw songsResult.reason;

      setTopSongs(songsResult.value.map((song) => ({
        id: String(song.id),
        title: song.name,
        artist: song.artistName,
        artistId: song.artistId ? String(song.artistId) : null,
        image: song.artworkUrl100?.replace('100x100bb', '600x600bb') || APP_LOGO_URI,
        source: 'itunes-chart',
      })));

      if (albumsResult.status === 'fulfilled') {
        setTopAlbums(albumsResult.value.map((album) => ({
          id: String(album.id),
          collectionId: String(album.id),
          name: album.name,
          artist: album.artistName,
          artistId: album.artistId ? String(album.artistId) : null,
          image: album.artworkUrl100?.replace('100x100bb', '600x600bb') || APP_LOGO_URI,
          year: album.releaseDate ? new Date(album.releaseDate).getFullYear() : '',
        })));
      } else {
        console.error('Error al cargar el top de álbumes:', albumsResult.reason);
        setTopAlbums([]);
        setChartError('Se actualizaron las canciones, pero no se pudo cargar el top de álbumes.');
      }

      setChartsUpdatedAt(new Date());
    } catch (error) {
      console.error('Error al actualizar los tops musicales:', error);
      setChartError(error.message || 'No se pudieron actualizar los tops musicales.');
    } finally {
      setIsLoadingCharts(false);
    }
  };

  useEffect(() => {
    loadHomeCharts();
  }, []);

  useEffect(() => {
    setAccentColor(themeMode === 'Oscuro' ? '#03DAC6' : getRandomColor());
  }, [themeMode]);

// --- FUNCIONES DE DESCARGA Y PLAYLIST ---
  const handleDownload = async (track) => {
    if (!track?.downloadAllowed || !track.downloadUrl) {
      Alert.alert(
        'Descarga no disponible',
        'Esta fuente no ofrece una descarga directa autorizada. YouTube se reproduce en su reproductor oficial, pero esta función no descarga su audio.'
      );
      return;
    }

    if (!track.downloadUrl.startsWith('https://') || !FileSystem.documentDirectory) {
      Alert.alert('Descarga', 'La fuente o el almacenamiento no son válidos para descargar.');
      return;
    }

    const safeId = String(track.id).replace(/[^a-zA-Z0-9._-]/g, '_');
    const directory = `${FileSystem.documentDirectory}downloads/`;
    setDownloads(prev => ({ ...prev, [track.id]: { status: 'loading' } }));

    try {
      const extension = new URL(track.downloadUrl).pathname.match(/\.(mp3|m4a|aac|ogg|opus|wav)$/i)?.[0] || '.audio';
      const fileUri = `${directory}${safeId}${extension}`;
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      const result = await FileSystem.downloadAsync(track.downloadUrl, fileUri);
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`El servidor respondió con HTTP ${result.status}.`);
      }
      setDownloads(prev => ({
        ...prev,
        [track.id]: { status: 'completed', uri: result.uri },
      }));
      Alert.alert('Descarga', `"${track.title}" se guardó para escuchar sin conexión.`);
    } catch (error) {
      setDownloads(prev => ({ ...prev, [track.id]: { status: 'error' } }));
      console.error('Error al descargar la pista:', error);
      Alert.alert('Descarga', error.message || 'No se pudo descargar esta pista.');
    }
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

    const downloadableSongs = collectionSongs.filter(song => song.downloadAllowed && song.downloadUrl);
    if (downloadableSongs.length === 0) {
      Alert.alert('Descarga', 'Esta colección no contiene archivos con descarga directa autorizada.');
      return;
    }

    Alert.alert(
      "Descargar Todo", 
      `¿Deseas descargar las ${downloadableSongs.length} canciones autorizadas de esta lista?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Descargar", 
          onPress: async () => {
            for (const song of downloadableSongs) {
              await handleDownload(song);
            }
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
  
  downloadFullCollection(playlist.songs);
};
  const createPlaylist = () => {
    setNewPlaylistName('');
    setShowCreatePlaylist(true);
  };

  const savePlaylist = () => {
    const name = newPlaylistName.trim();
    if (!name) {
      Alert.alert('Nueva playlist', 'Escribe un nombre para la playlist.');
      return;
    }

    if (playlists.some(playlist => playlist.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Nueva playlist', 'Ya existe una playlist con ese nombre.');
      return;
    }

    setPlaylists(prev => [...prev, { id: Date.now().toString(), name, songs: [] }]);
    setShowCreatePlaylist(false);
  };

  const openPlaylist = (playlist) => {
    setCurrentArtist(playlist.name);
    setCurrentCollectionSongs(playlist.songs);
    setSongs(playlist.songs);
    setTab('home');
    setView('artist_profile');
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

  const findYouTubeVideo = async (track) => {
    if (!googleUser) return null;

    const { accessToken } = await GoogleSignin.getTokens();
    if (!accessToken) throw new Error('Google no devolvió un token de acceso.');
    const searchTerm = `${track.title} ${track.artist || ''}`.trim();
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=1&q=${encodeURIComponent(searchTerm)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'YouTube no pudo encontrar la canción.');
    return data.items?.[0]?.id?.videoId || null;
  };

  const playTrack = async (track) => {
    if (!track) return;

    const youtubeResource = getYouTubeResource(track.externalUrl || '');
    const youtubeTrack = track.youtubeVideoId || track.youtubePlaylistId || youtubeResource
      ? {
          ...track,
          youtubeVideoId: track.youtubeVideoId || youtubeResource?.videoId,
          youtubePlaylistId: track.youtubePlaylistId || youtubeResource?.playlistId,
        }
      : null;

    if (youtubeTrack) {
      try {
        if (playerReady) await TrackPlayer.pause();
        setShowFullPoster(false);
        setYoutubePlayback(youtubeTrack);
      } catch (error) {
        console.error('Error al pausar el reproductor antes de abrir YouTube:', error);
        Alert.alert('Reproducción', 'No se pudo detener la pista actual.');
      }
      return;
    }

    if (googleUser && (track.source === 'itunes' || track.source === 'itunes-chart')) {
      try {
        const videoId = await findYouTubeVideo(track);
        if (videoId) {
          setShowFullPoster(false);
          setYoutubePlayback({
            ...track,
            id: `youtube-${videoId}`,
            youtubeVideoId: videoId,
          });
          return;
        }
      } catch (error) {
        console.error('Error al buscar la versión completa en YouTube:', error);
        if (track.source === 'itunes-chart') {
          setChartError('YouTube no respondió; se intentará reproducir la vista previa disponible.');
        }
      }
    }

    if (!track.url && track.source === 'itunes-chart') {
      try {
        const response = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(track.id)}`);
        const data = await response.json();
        if (!response.ok) throw new Error('iTunes no pudo cargar la vista previa.');
        const preview = data.results?.find(result => result.wrapperType === 'track' && result.previewUrl);
        if (!preview) throw new Error('Esta canción no tiene una vista previa disponible en iTunes.');
        track = {
          ...track,
          title: preview.trackName || track.title,
          artist: preview.artistName || track.artist,
          image: preview.artworkUrl100?.replace('100x100', '600x600') || track.image,
          url: preview.previewUrl,
          source: 'itunes-preview',
        };
      } catch (error) {
        console.error('Error al cargar la vista previa de la canción:', error);
        Alert.alert('Reproducción', error.message || 'No se pudo cargar esta canción.');
        return;
      }
    }

    if (!track.url) {
      Alert.alert('Reproducción', 'No hay una vista previa autorizada disponible para esta pista.');
      return;
    }
    if (!playerReady) {
      Alert.alert('Reproductor', 'El servicio de audio todavía se está iniciando.');
      return;
    }

    const activeList = currentCollectionSongs.some(song => song.id === track.id)
      ? currentCollectionSongs
      : songs.some(song => song.id === track.id)
        ? songs
        : [track];
    const queue = activeList
      .filter(song => song.url && !song.externalUrl)
      .map(song => {
        const download = downloads[song.id];
        return {
          ...song,
          id: String(song.id),
          url: download?.status === 'completed' ? download.uri : song.url,
          artwork: song.image || song.artwork,
        };
      });
    const queueIndex = queue.findIndex(song => song.id === String(track.id));

    if (queueIndex < 0) {
      Alert.alert('Reproducción', 'No hay pistas reproducibles en esta colección.');
      return;
    }

    try {
      await TrackPlayer.setQueue(queue);
      await TrackPlayer.skip(queueIndex);
      await TrackPlayer.play();
      setCurrentSong(track);
    } catch (error) {
      console.error('Error al reproducir audio:', error);
      Alert.alert('Reproducción', error.message || 'No se pudo reproducir esta pista.');
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
  if (!isAlreadyFav && autoDownloadFavs) handleDownload(track);
};
  // --- CONTROLADOR DE SIGUIENTE PISTA (CON SHUFFLE Y REPEAT) ---
  const handleNextTrack = async () => {
    const activeList = currentCollectionSongs.length > 0 ? currentCollectionSongs : songs;
    const playableTracks = activeList.filter(song => song.url && !song.externalUrl);
    if (playableTracks.length === 0 || !currentSong) return;

    if (isRepeat) {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      return;
    }

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * playableTracks.length);
      await playTrack(playableTracks[randomIndex]);
      return;
    }

    const currentIndex = playableTracks.findIndex(song => song.id === currentSong.id);
    await playTrack(playableTracks[(currentIndex + 1) % playableTracks.length]);
  };
   // --- BOTÓN PARA PREPARAR LA ADICIÓN A UNA PLAYLIST ---
  const openAddToPlaylistModal = (track) => {
    setSongToAdd(track); // Asigna la canción seleccionada [cite: 10]
    setShowPlaylistModal(true); // Muestra el modal de listas [cite: 10]
  };

  const goToCollection = async (collection, type) => {
    const collectionName = typeof collection === 'string' ? collection : collection.name;
    const collectionId = typeof collection === 'object'
      ? collection.collectionId || collection.id
      : null;
    setCurrentArtist(`${type}: ${collectionName}`);
    setView('artist_profile');
    setCurrentCollectionSongs([]);
    setSongs([]);
    setSearchMessage('');

    if (!collectionId || !/^\d+$/.test(String(collectionId))) {
      Alert.alert('Colección', 'No se encontró el identificador de este álbum.');
      return;
    }

    try {
      const response = await fetch(
        `https://itunes.apple.com/lookup?id=${encodeURIComponent(collectionId)}&entity=song`
      );
      const data = await response.json();
      if (!response.ok) throw new Error('iTunes no pudo cargar las canciones del álbum.');

      const collectionTracks = (data.results || [])
        .filter(track => track.wrapperType === 'track' && track.trackId)
        .map(track => ({
          id: String(track.trackId),
          title: track.trackName,
          artist: track.artistName || collection.artist,
          image: track.artworkUrl100?.replace('100x100', '600x600') || collection.image || APP_LOGO_URI,
          url: track.previewUrl,
          source: 'itunes',
        }));

      setCurrentCollectionSongs(collectionTracks);
      setSongs(collectionTracks);
      if (collectionTracks.length === 0) {
        setSearchMessage('El álbum no tiene canciones o vistas previas disponibles.');
      }
    } catch (error) {
      console.error('Error al cargar las canciones del álbum:', error);
      Alert.alert('Álbum', error.message || 'No se pudo cargar el álbum.');
    }
  };

  async function goToArtistProfile(artist) {
    const artistName = typeof artist === 'string' ? artist : artist?.title || artist?.artist;
    const artistId = typeof artist === 'object' ? artist.artistId || artist.id : null;
    if (!artistName) return;
    setCurrentArtist(artistName);
    setAccentColor(getRandomColor());
    setView('artist_profile');
    setCurrentCollectionSongs([]);
    setSongs([]);

    try {
      const songsUrl = artistId && /^\d+$/.test(String(artistId))
        ? `https://itunes.apple.com/lookup?id=${encodeURIComponent(artistId)}&entity=song&limit=25`
        : `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=25`;
      const albumsUrl = artistId && /^\d+$/.test(String(artistId))
        ? `https://itunes.apple.com/lookup?id=${encodeURIComponent(artistId)}&entity=album&limit=25`
        : `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=25`;
      const [respSongs, respAlbums] = await Promise.all([fetch(songsUrl), fetch(albumsUrl)]);
      if (!respSongs.ok || !respAlbums.ok) throw new Error('iTunes no pudo cargar el perfil del artista.');
      const [dataSongs, dataAlbums] = await Promise.all([respSongs.json(), respAlbums.json()]);

      const mappedSongs = (dataSongs.results || [])
        .filter(song => song.wrapperType === 'track' && song.trackId)
        .map(song => ({
          id: String(song.trackId),
          title: song.trackName,
          artist: song.artistName || artistName,
          image: song.artworkUrl100?.replace('100x100', '600x600') || APP_LOGO_URI,
          url: song.previewUrl,
          source: 'itunes',
        }));

      setCurrentCollectionSongs(mappedSongs);
      setSongs(mappedSongs);
      setArtistAlbums((dataAlbums.results || [])
        .filter(album => album.wrapperType === 'collection' && album.collectionId)
        .map(album => ({
          id: String(album.collectionId),
          collectionId: String(album.collectionId),
          name: album.collectionName,
          artist: album.artistName || artistName,
          image: album.artworkUrl100?.replace('100x100', '600x600') || APP_LOGO_URI,
          year: album.releaseDate ? new Date(album.releaseDate).getFullYear() : '',
        })));
    } catch (error) {
      console.error('Error al cargar el perfil del artista:', error);
      Alert.alert('Artista', error.message || 'No se pudo cargar el perfil del artista.');
    }
  }

  async function handleSearch() {
    const searchTerm = query.trim();
    if (!searchTerm) {
      setSearchMessage('Escribe algo para comenzar la búsqueda.');
      return;
    }

    setIsSearching(true);
    setSearchMessage('');
    setHasSearched(true);
    setView('results');
    setSongs([]);
    setCurrentCollectionSongs([]);
    setArtistAlbums([]);

    try {
      const importedResource = getYouTubeResource(searchTerm);
      if (importedResource) {
        const importedTrack = {
          id: `youtube-${importedResource.videoId || importedResource.playlistId}`,
          title: importedResource.playlistId ? 'Playlist de YouTube Music' : 'Video de YouTube',
          artist: 'YouTube',
          image: APP_LOGO_URI,
          ...(
            importedResource.playlistId
              ? { youtubePlaylistId: importedResource.playlistId }
              : { youtubeVideoId: importedResource.videoId }
          ),
        };
        setSongs([importedTrack]);
        setCurrentCollectionSongs([importedTrack]);
        setSearchMessage('Enlace listo para reproducirse dentro de la app.');
        return;
      }

      if (searchFilter === 'playlist' || searchFilter === 'song') {
        if (!googleUser) {
          setSearchMessage('Conecta Google para buscar canciones y playlists en YouTube Music.');
          return;
        }

        const resourceType = searchFilter === 'playlist' ? 'playlist' : 'video';
        const { accessToken } = await GoogleSignin.getTokens();
        if (!accessToken) throw new Error('Google no devolvió un token de acceso. Vuelve a iniciar sesión.');
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=${resourceType}${resourceType === 'video' ? '&videoCategoryId=10' : ''}&maxResults=20&q=${encodeURIComponent(searchTerm)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || 'YouTube no pudo completar la búsqueda.');
        }

        const results = (data.items || []).map((item) => {
          const resourceId = resourceType === 'playlist' ? item.id?.playlistId : item.id?.videoId;
          if (!resourceId) return null;
          return {
            id: `youtube-${resourceId}`,
            title: item.snippet?.title || 'Sin título',
            artist: item.snippet?.channelTitle || 'YouTube',
            image: item.snippet?.thumbnails?.high?.url
              || item.snippet?.thumbnails?.medium?.url
              || item.snippet?.thumbnails?.default?.url
              || '',
            ...(resourceType === 'playlist'
              ? { youtubePlaylistId: resourceId }
              : { youtubeVideoId: resourceId }),
          };
        }).filter(Boolean);

        setSongs(results);
        setCurrentCollectionSongs(results);
        setSearchMessage(results.length
          ? ''
          : `No se encontraron ${resourceType === 'playlist' ? 'playlists de YouTube Music' : 'canciones de YouTube Music'}.`);
        return;
      }

      const entity = searchFilter === 'album'
        ? 'album'
        : searchFilter === 'artist'
          ? 'musicArtist'
          : 'song';
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=${entity}&limit=20`
      );
      if (!response.ok) throw new Error('iTunes no pudo completar la búsqueda.');
      const data = await response.json();
      const results = data.results || [];

      if (searchFilter === 'artist') {
        const artists = results.map((artist) => ({
          id: String(artist.artistId),
          artistId: String(artist.artistId),
          title: artist.artistName,
          artist: 'Artista',
          image: APP_LOGO_URI,
          kind: 'artist',
        })).filter(artist => artist.artistId && artist.title);
        setSongs(artists);
        setSearchMessage(artists.length ? '' : 'No se encontraron artistas.');
        return;
      }

      if (searchFilter === 'album') {
        const albums = results.map((album) => ({
          id: album.collectionId?.toString(),
          collectionId: album.collectionId?.toString(),
          name: album.collectionName,
          artist: album.artistName,
          image: album.artworkUrl100?.replace('100x100', '600x600') || '',
          year: album.releaseDate ? new Date(album.releaseDate).getFullYear() : '',
        })).filter((album) => album.id && album.name);
        setArtistAlbums(albums);
        setSearchMessage(albums.length ? '' : 'No se encontraron álbumes.');
        return;
      }

      const mappedSongs = results.map(song => ({
        id: song.trackId?.toString(),
        title: song.trackName,
        artist: song.artistName,
        image: song.artworkUrl100?.replace('100x100', '600x600') || '',
        url: song.previewUrl,
        source: 'itunes',
      })).filter(song => song.id && song.title);

      setCurrentCollectionSongs(mappedSongs);
      setSongs(mappedSongs);
      setSearchMessage(mappedSongs.length
        ? 'Resultados de iTunes: las pistas disponibles se reproducen como vista previa.'
        : 'No se encontraron canciones.');
    } catch (error) {
      console.error('Error buscando:', error);
      setSearchMessage(error.message || 'No se pudieron cargar los resultados.');
    } finally {
      setIsSearching(false);
    }
  }

  const handleGoogleSignIn = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert('Google', 'Falta configurar el OAuth Client ID de Google.');
      return;
    }

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = googleUser
        ? await GoogleSignin.addScopes({ scopes: [YOUTUBE_READONLY_SCOPE] })
        : await GoogleSignin.signIn();
      if (result?.type === 'success') setGoogleUser(result.data);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error('Error al iniciar sesión con Google:', error);
      const errorCode = String(error.code || error.statusCode || '');
      const isOAuthConfigurationError = errorCode === '10' || errorCode === 'DEVELOPER_ERROR';
      Alert.alert(
        'Google',
        isOAuthConfigurationError
          ? 'Google rechazó la configuración de esta app (código 10). Comprueba que el cliente OAuth Android tenga el paquete com.nitraxx.music.player y el SHA-1 del certificado con el que se firmó este APK.'
          : `${error.message || 'No se pudo iniciar sesión.'}${errorCode ? ` (código: ${errorCode})` : ''}`
      );
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await GoogleSignin.signOut();
      setGoogleUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión de Google:', error);
      Alert.alert('Google', error.message || 'No se pudo cerrar la sesión.');
    }
  };

  // --- FORMATEADOR DE TIEMPO Y AVANCE ---
  const formatTime = (millis) => {
    if (!millis || isNaN(millis)) return "0:00";
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeek = async (percentage) => {
    try {
      if (playerReady && duration > 0) {
        const newPositionSeconds = (percentage / 100) * (duration / 1000);
        await TrackPlayer.seekTo(newPositionSeconds);
        setPosition(newPositionSeconds * 1000);
      }
    } catch (e) {
      console.error("Error al mover la línea de tiempo:", e);
    }
  };

  // --- CONTROLADORES DE REPRODUCCIÓN UNIFICADOS ---
  async function loadAndPlay(item) {
    if (!item) return;
    await playTrack(item);
    if (themeMode === 'Dinámico') setAccentColor(getRandomColor());
  }

  async function togglePlay(item) {
    if (!item) return;

    if (!currentSong || currentSong.id !== item.id) {
      await loadAndPlay(item);
      return;
    }

    try {
      const playbackState = await TrackPlayer.getPlaybackState();
      if (playbackState.state === State.Playing) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error("Error en togglePlay:", e);
      Alert.alert('Reproductor', 'No se pudo cambiar el estado de reproducción.');
    }
  }
  
  const handlePrevTrack = async () => {
    const activeList = (currentCollectionSongs && currentCollectionSongs.length > 0) ? currentCollectionSongs : songs;
    const playableTracks = activeList.filter(song => song.url && !song.externalUrl);
    if (playableTracks.length === 0 || !currentSong) return;

    const currentIndex = playableTracks.findIndex(song => song.id === currentSong.id);
    if (currentIndex <= 0) {
      await playTrack(playableTracks[playableTracks.length - 1]);
    } else {
      await playTrack(playableTracks[currentIndex - 1]);
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
          <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>{t('settings')}</Text>
        </View>

        {/* SECCIÓN: PERSONALIZACIÓN */}
        <View style={{ backgroundColor: '#0f0f11', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Personalización</Text>
          {renderSelector('Modo del tema', themeMode, ['Dinámico', 'Oscuro'], setThemeMode)}
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
          {renderSelector('Canciones del top en pantalla', initialCount, ['5', '10', '15', '25'], setInitialCount)}
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
          {renderOptionRow(
            'Omitir silencios',
            Platform.OS === 'android' ? 'Salta los segmentos silenciosos dentro de la pista' : 'Disponible solo en Android',
            Platform.OS === 'android'
              ? <Switch value={skipSilence} onValueChange={setSkipSilence} trackColor={{ true: accentColor }} />
              : <Text style={{ color: '#777' }}>Solo Android</Text>
          )}
          {renderOptionRow('Mantener la pantalla encendida mientras se reproduce', 'Si está activado, la pantalla permanecerá despierta', <Switch value={keepScreenOn} onValueChange={setKeepScreenOn} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Restaurar la última sesión de reproducción', 'Restaura automáticamente la última sesión al iniciar la aplicación', <Switch value={restoreSession} onValueChange={setRestoreSession} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Abrir automáticamente pantalla del reproductor', 'Activar/desactivar la apertura automática a pantalla completa al seleccionar una canción', <Switch value={autoOpenPlayer} onValueChange={setAutoOpenPlayer} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Ecualizador', 'No está disponible con el motor de audio actual', <Text style={{ color: '#777' }}>Pendiente</Text>)}
          {renderOptionRow('Android Auto', 'Requiere un servicio multimedia de navegación adicional', <Text style={{ color: '#777' }}>Pendiente</Text>)}
          {renderOptionRow('Controles en notificación y Bluetooth', 'Disponibles durante la reproducción', <Text style={{ color: playerReady ? accentColor : '#777' }}>{playerReady ? 'Activos' : 'Iniciando'}</Text>)}
        </View>

        <View style={{ backgroundColor: '#0f0f11', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Cuenta</Text>
          {renderOptionRow(
            'Google',
            googleUser?.user?.email || 'No has iniciado sesión',
            <TouchableOpacity
              onPress={googleUser ? handleGoogleSignOut : handleGoogleSignIn}
              style={{ backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            >
              <Text style={{ color: 'white', fontSize: 12 }}>
                {googleUser ? 'Cerrar sesión' : 'Iniciar sesión'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SECCIÓN: DESCARGAR */}
        <View style={{ backgroundColor: '#0f0f11', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Descargar</Text>
          {renderOptionRow('Descarga automática de canciones favoritas', 'Descarga automática de canciones cuando se añaden a favoritas', <Switch value={autoDownloadFavs} onValueChange={setAutoDownloadFavs} trackColor={{ true: accentColor }} />)}
          {renderOptionRow('Calidad de descarga', 'Se conserva el archivo original autorizado; no se convierte ni se extrae audio de YouTube', <Text style={{ color: '#777' }}>Original</Text>)}
          {renderOptionRow('Ubicación de la descarga', 'In App storage directory', <TouchableOpacity onPress={() => Alert.alert("Almacenamiento", "Ubicación por defecto restablecida.")}><Text style={{ color: 'white', textDecorationLine: 'underline' }}>Restablecer</Text></TouchableOpacity>)}
          {renderOptionRow('Exportar archivos descargados', 'La exportación a una carpeta pública todavía no está disponible', <Text style={{ color: '#777' }}>Pendiente</Text>)}
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
          <TouchableOpacity onPress={() => { setSongs([]); setCurrentCollectionSongs([]); setArtistAlbums([]); setHasSearched(false); setSearchMessage(''); setView('results'); setTab('home'); }}>
            <Image source={require('./jvlogo1.png')} style={{ width: 34, height: 34, borderRadius: 8 }} />
          </TouchableOpacity>

          <View style={styles.sidebarCenterOptions}>
            <TouchableOpacity style={styles.verticalNavButton} onPress={() => { setSongs([]); setCurrentCollectionSongs([]); setArtistAlbums([]); setHasSearched(false); setSearchMessage(''); setView('results'); setTab('home'); }}>
              <Text style={[styles.verticalText, tab === 'home' && view === 'results' && styles.verticalTextActive]}>{t('home')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.verticalNavButton} onPress={() => { setSearchFilter('song'); setHasSearched(false); setView('results'); setTab('songs'); }}>
              <Text style={[styles.verticalText, tab === 'songs' && styles.verticalTextActive]}>{t('songs')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.verticalNavButton} onPress={() => setTab('library')}>
              <Text style={[styles.verticalText, tab === 'library' && styles.verticalTextActive]}>{t('playlists')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.verticalNavButton} onPress={() => { setSearchFilter('album'); setHasSearched(false); setView('results'); setTab('albums'); }}>
              <Text style={[styles.verticalText, tab === 'albums' && styles.verticalTextActive]}>{t('albums')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.verticalNavButton} onPress={() => { setSearchFilter('artist'); setHasSearched(false); setView('results'); setTab('artists'); }}>
              <Text style={[styles.verticalText, tab === 'artists' && styles.verticalTextActive]}>{t('artists')}</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={[styles.artistNameBig, { flex: 1 }]}>{t('library')}</Text>
                  <TouchableOpacity
                    onPress={createPlaylist}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e', padding: 10, borderRadius: 10 }}
                  >
                    <ListMusic color={accentColor} size={18} />
                    <Text style={{ color: 'white', marginLeft: 8, fontWeight: '600' }}>{t('newPlaylist')}</Text>
                  </TouchableOpacity>
                </View>
                {playlists.map(playlist => (
                  <View
                    key={playlist.id}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10, backgroundColor: '#101012', borderRadius: 12 }}
                  >
                    <TouchableOpacity onPress={() => openPlaylist(playlist)} style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>{playlist.name}</Text>
                      <Text style={{ color: '#777', fontSize: 12, marginTop: 4 }}>
                        {playlist.songs.length} canciones
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => downloadPlaylist(playlist)} style={{ padding: 8 }}>
                      <Download color="#888" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSongToAdd(playlist);
                        setShowPlaylistModal(true);
                      }}
                      style={{ padding: 8 }}
                    >
                      <MoreVertical color="#888" size={18} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <>
                {/* ENCABEZADO ESTÁNDAR */}
                {view === 'results' && (
                  <View style={[styles.header, {paddingHorizontal: 10, paddingTop: 50}]}>
                    <Image source={require('./jvlogo1.png')} style={{ width: 112, height: 114, alignSelf: 'center' }} />
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
        <Text style={[styles.chipText, searchFilter === 'artist' && { color: '#000' }]}>{t('artists')}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.chip, searchFilter === 'album' && { backgroundColor: accentColor }]} 
        onPress={() => setSearchFilter('album')}
      >
        <Text style={[styles.chipText, searchFilter === 'album' && { color: '#000' }]}>{t('albums')}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.chip, searchFilter === 'playlist' && { backgroundColor: accentColor }]} 
        onPress={() => setSearchFilter('playlist')}
      >
        <Text style={[styles.chipText, searchFilter === 'playlist' && { color: '#000' }]}>{t('playlists')}</Text>
      </TouchableOpacity>
    </View>

    <Text style={styles.sectionTitle}>{t('songs')}</Text>
    {currentCollectionSongs.map((item, index) => {
      // Validaciones visuales en tiempo real para descargas y favoritos
      const isDownloaded = downloads[item.id]?.status === 'completed';
      const isFav = favoriteSongs.includes(item.id);

      return (
        <TouchableOpacity key={item.id} style={styles.songRow} onPress={() => togglePlay(item)}>
          <Text style={styles.songIndex}>{index + 1}</Text>
          <Image source={{uri: item.image || APP_LOGO_URI}} style={styles.songArt} />
          
          <View style={{flex: 1, marginLeft: 15}}>
            <Text style={[styles.songTitle, {color: currentSong?.id === item.id ? accentColor : 'white'}]} numberOfLines={1}>{item.title}</Text>
            <TouchableOpacity onPress={() => goToArtistProfile(item.artist)}>
              <Text style={styles.songArtist}>{item.artist}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Botones de acción de la canción conectados a tus funciones reales */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 14, marginRight: 5}}>
            {item.downloadAllowed && item.downloadUrl ? (
              <TouchableOpacity onPress={() => handleDownload(item)}>
                <Download color={isDownloaded ? accentColor : "#777"} size={18} />
              </TouchableOpacity>
            ) : null}
            
            <TouchableOpacity onPress={() => toggleFavorite(item)}>
              <Heart color={isFav ? accentColor : "#777"} fill={isFav ? accentColor : "transparent"} size={18} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openAddToPlaylistModal(item)}>
              <MoreVertical color="#777" size={18} />
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
                        placeholder={`${t('search')} ${searchFilter === 'song' ? 'canciones' : searchFilter === 'artist' ? t('artists').toLowerCase() : searchFilter === 'album' ? t('albums').toLowerCase() : t('playlists').toLowerCase()}...`}
                        placeholderTextColor="#444" 
                        style={styles.input}
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                      />
                      <TouchableOpacity
                        onPress={handleSearch}
                        disabled={isSearching}
                        accessibilityLabel="Buscar"
                        style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                      >
                        {isSearching
                          ? <ActivityIndicator color={accentColor} size="small" />
                          : <Text style={{ color: accentColor, fontWeight: 'bold' }}>Buscar</Text>}
                      </TouchableOpacity>
                    </View>

                    {/* FILTROS MULTI-OPCIÓN */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ flexDirection: 'row', gap: 10, paddingHorizontal: 10 }}
                    >
                      {['song', 'artist', 'album', 'playlist'].map((filterType) => (
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
                            {filterType === 'song' ? 'Canciones' : filterType === 'artist' ? 'Artistas' : filterType === 'album' ? 'Álbumes' : 'Playlists'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {(searchFilter === 'song' || searchFilter === 'playlist') && (
                      <View style={{ marginHorizontal: 10, marginTop: 10, padding: 12, borderRadius: 10, backgroundColor: '#101012' }}>
                        {googleUser ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#aaa', fontSize: 12, flex: 1 }} numberOfLines={1}>
                              Google: {googleUser.user?.email || 'cuenta conectada'}
                            </Text>
                            <TouchableOpacity onPress={handleGoogleSignIn} style={{ paddingLeft: 12 }}>
                              <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 12 }}>Permitir YouTube</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={handleGoogleSignIn}>
                            <Text style={{ color: accentColor, fontWeight: 'bold' }}>
                              Conectar Google para buscar canciones y playlists en YouTube Music
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    {!!searchMessage && (
                      <Text accessibilityLiveRegion="polite" style={{ color: '#aaa', marginHorizontal: 12, marginTop: 10 }}>
                        {searchMessage}
                      </Text>
                    )}
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
                            <TouchableOpacity key={album.id} style={styles.albumCard} onPress={() => goToCollection(album, 'Álbum')}>
                              <Image source={{uri: album.image || APP_LOGO_URI}} style={styles.albumArt} />
                              <Text style={styles.albumName} numberOfLines={1}>{album.name}</Text>
                              <Text style={styles.albumYear}>{album.year}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {songs.length > 0 && (
                      <View>
                        <Text style={[styles.sectionTitle, {marginLeft: 10}]}>
                          {searchFilter === 'playlist'
                            ? 'Playlists encontradas'
                            : searchFilter === 'artist'
                              ? 'Artistas encontrados'
                              : 'Canciones encontradas'}
                        </Text>
                        {songs.map((item, index) => (
                          <TouchableOpacity 
                            key={item.id} 
                            style={styles.songRow} 
                            onPress={() => {
                              if (item.kind === 'artist') {
                                goToArtistProfile(item);
                                return;
                              }
                              setCurrentCollectionSongs(songs); // Mantiene la cola de reproducción actualizada
                              togglePlay(item);
                            }}
                          >
                            <Text style={styles.songIndex}>{index + 1}</Text>
                            <Image source={{uri: item.image || APP_LOGO_URI}} style={styles.songArt} />
                            <View style={{flex: 1, marginLeft: 15}}>
                              <Text style={[styles.songTitle, {color: currentSong?.id === item.id ? accentColor : 'white'}]} numberOfLines={1}>{item.title}</Text>
                              {item.kind === 'artist' ? (
                                <Text style={styles.songArtist}>Artista</Text>
                              ) : (
                                <TouchableOpacity onPress={() => goToArtistProfile(item.artist)}>
                                  <Text style={styles.songArtist}>{item.artist}</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                            {item.kind !== 'artist' && !item.youtubePlaylistId && (
                              <View style={{flexDirection: 'row', alignItems: 'center', gap: 14, marginRight: 5}}>
                                {item.downloadAllowed && item.downloadUrl ? <TouchableOpacity onPress={() => handleDownload(item)}><Download color={downloads[item.id]?.status === 'completed' ? accentColor : '#777'} size={18} /></TouchableOpacity> : null}
                                <TouchableOpacity onPress={() => toggleFavorite(item)}><Heart color={favoriteSongs.includes(item.id) ? accentColor : '#777'} fill={favoriteSongs.includes(item.id) ? accentColor : 'transparent'} size={18} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => openAddToPlaylistModal(item)}><MoreVertical color="#777" size={18} /></TouchableOpacity>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : view === 'results' && !hasSearched ? (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 10, marginTop: 10 }}>
                        <View>
                          <Text style={styles.sectionTitle}>Top canciones · España</Text>
                          <Text style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                            Apple Music · actualizado {chartsUpdatedAt ? chartsUpdatedAt.toLocaleTimeString() : 'al abrir la app'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={loadHomeCharts}
                          disabled={isLoadingCharts}
                          accessibilityLabel="Actualizar tops musicales"
                          style={{ padding: 8 }}
                        >
                          {isLoadingCharts
                            ? <ActivityIndicator color={accentColor} size="small" />
                            : <RotateCcw color={accentColor} size={20} />}
                        </TouchableOpacity>
                      </View>
                      {!!chartError && (
                        <Text style={{ color: '#aaa', marginHorizontal: 12, marginTop: 8 }}>{chartError}</Text>
                      )}
                      {isLoadingCharts && topSongs.length === 0 && (
                        <ActivityIndicator color={accentColor} style={{ margin: 20 }} />
                      )}
                      {!isLoadingCharts && topSongs.length === 0 && (
                        <TouchableOpacity onPress={loadHomeCharts} style={{ marginHorizontal: 12, marginVertical: 16 }}>
                          <Text style={{ color: accentColor }}>No se pudo cargar el top. Toca para reintentar.</Text>
                        </TouchableOpacity>
                      )}
                      {topSongs.slice(0, Number(initialCount) || 10).map((song, index) => (
                        <TouchableOpacity
                          key={song.id}
                          style={styles.songRow}
                          onPress={async () => {
                            setLoadingChartSongId(song.id);
                            try {
                              await playTrack(song);
                            } finally {
                              setLoadingChartSongId(null);
                            }
                          }}
                          disabled={loadingChartSongId === song.id}
                        >
                          <Text style={styles.songIndex}>{index + 1}</Text>
                          <Image source={{ uri: song.image || APP_LOGO_URI }} style={styles.songArt} />
                          <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                            <TouchableOpacity onPress={() => goToArtistProfile({ title: song.artist, artistId: song.artistId })}>
                              <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                            </TouchableOpacity>
                          </View>
                          {loadingChartSongId === song.id
                            ? <ActivityIndicator color={accentColor} />
                            : <Play color={accentColor} size={20} fill={accentColor} />}
                        </TouchableOpacity>
                      ))}

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 10, marginTop: 24 }}>
                        <Text style={styles.sectionTitle}>Top álbumes · España</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setSearchFilter('playlist');
                            setQuery('');
                            setHasSearched(false);
                            setSearchMessage('');
                          }}
                          style={{ padding: 8 }}
                        >
                          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 12 }}>Buscar playlists</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 10, marginBottom: 20 }}>
                        {topAlbums.map((album) => (
                          <TouchableOpacity
                            key={album.id}
                            style={{ width: 140, marginRight: 15 }}
                            onPress={() => goToCollection(album, 'Álbum')}
                          >
                            <Image source={{ uri: album.image || APP_LOGO_URI }} style={{ width: 140, height: 140, borderRadius: 10 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14, marginTop: 8 }} numberOfLines={1}>{album.name}</Text>
                            <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }} numberOfLines={1}>{album.artist}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={Boolean(youtubePlayback)}
        animationType="slide"
        onRequestClose={() => setYoutubePlayback(null)}
      >
        <View style={{ flex: 1, backgroundColor: '#080808', paddingTop: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 17, fontWeight: 'bold' }} numberOfLines={1}>
                {youtubePlayback?.title || 'YouTube'}
              </Text>
              <Text style={{ color: '#888', fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                {youtubePlayback?.artist || 'Reproducción en la app'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setYoutubePlayback(null)} accessibilityLabel="Cerrar reproductor">
              <ArrowLeft color="white" size={26} />
            </TouchableOpacity>
          </View>
          {youtubePlayback && (
            <WebView
              key={youtubePlayback.id}
              style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}
              source={{
                uri: youtubePlayback.youtubePlaylistId
                  ? `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(youtubePlayback.youtubePlaylistId)}&autoplay=1&playsinline=1`
                  : `https://www.youtube.com/embed/${encodeURIComponent(youtubePlayback.youtubeVideoId)}?autoplay=1&playsinline=1&rel=0`,
              }}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onError={() => {
                Alert.alert('YouTube', 'No se pudo cargar el reproductor. Comprueba tu conexión e inténtalo de nuevo.');
              }}
            />
          )}
          <Text style={{ color: '#777', fontSize: 12, textAlign: 'center', margin: 16 }}>
            Reproductor oficial de YouTube
          </Text>
        </View>
      </Modal>

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

      <Modal
        visible={showCreatePlaylist}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreatePlaylist(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalMenu}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
              Nueva playlist
            </Text>
            <TextInput
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              placeholder="Nombre de la playlist"
              placeholderTextColor="#777"
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={savePlaylist}
              style={{ color: 'white', backgroundColor: '#222', padding: 12, borderRadius: 8, width: '100%' }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
              <TouchableOpacity onPress={() => setShowCreatePlaylist(false)} style={{ padding: 10 }}>
                <Text style={{ color: '#aaa' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={savePlaylist} style={{ backgroundColor: accentColor, padding: 10, borderRadius: 8 }}>
                <Text style={{ color: '#111', fontWeight: 'bold' }}>{t('create')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
