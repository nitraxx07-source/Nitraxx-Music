# Nitraxx Music

<p align="center">
  <img src="jvlogo1.png" width="220" alt="Nitraxx Music Logo">
</p>

Aplicación Android con React Native y Expo.

## Funciones

- Logo personalizado para el icono, la pantalla de inicio y la web.
- Reproducción en segundo plano, notificación multimedia y controles remotos mediante React Native Track Player.
- Playlists y favoritos guardados localmente en el dispositivo.
- Búsqueda de canciones y playlists públicas de YouTube desde la app, además de búsqueda de álbumes y metadatos con iTunes.
- Reproducción de videos y playlists de YouTube dentro de la app usando el reproductor oficial incrustado; los enlaces de YouTube Music se pueden pegar en la búsqueda.
- En Android, omisión de segmentos silenciosos dentro de la pista mediante ExoPlayer.
- Descargas únicamente para pistas que indiquen explícitamente `downloadAllowed: true` y proporcionen una URL HTTPS directa autorizada. Las vistas previas de iTunes y los enlaces de YouTube Music no son descargables.
- Inicio de sesión Google sin Firebase ni backend; permite el acceso de solo lectura necesario para buscar en YouTube.

Android Auto, el ecualizador y el crossfade DJ entre pistas requieren una integración adicional del motor/servicio nativo; no se anuncian como disponibles. El salto de silencios no es un crossfade: elimina los segmentos silenciosos detectados dentro de una pista.
La reproducción de YouTube usa su reproductor incrustado y no se ejecuta en segundo plano; el modo de reproducción en segundo plano de Track Player aplica a las pistas con URL de audio autorizada. No se extrae ni descarga audio de YouTube.

## Crear un APK universal de prueba

El perfil `universal` de EAS genera un APK de distribución interna sin divisiones por ABI:

```bash
npx eas login
npx eas build --platform android --profile universal
```

Para que Google Sign-In y las búsquedas de YouTube funcionen, habilita **YouTube Data API v3** en el proyecto de Google Cloud asociado, configura la pantalla de consentimiento para el permiso `youtube.readonly` y registra un cliente Android con el paquete `com.nitraxx.music.player` y el SHA-1 del certificado usado para firmar el APK. El Client ID web se configura en `expo.extra.googleWebClientId` de [app.json](./app.json). La primera búsqueda de canciones o playlists pide iniciar sesión y autorizar YouTube.

## Validar

```bash
npx expo install --check
npx expo export --platform android
```
