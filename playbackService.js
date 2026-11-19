import TrackPlayer, { Event } from 'react-native-track-player';

const handleRemoteAction = (name, action) => async (payload) => {
  try {
    await action(payload);
  } catch (error) {
    console.error(`Error en control remoto (${name}):`, error);
  }
};

export async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, handleRemoteAction('play', () => TrackPlayer.play()));
  TrackPlayer.addEventListener(Event.RemotePause, handleRemoteAction('pause', () => TrackPlayer.pause()));
  TrackPlayer.addEventListener(Event.RemoteNext, handleRemoteAction('next', () => TrackPlayer.skipToNext()));
  TrackPlayer.addEventListener(Event.RemotePrevious, handleRemoteAction('previous', () => TrackPlayer.skipToPrevious()));
  TrackPlayer.addEventListener(Event.RemoteSeek, handleRemoteAction('seek', ({ position }) => TrackPlayer.seekTo(position)));
}
