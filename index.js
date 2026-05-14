import { registerRootComponent } from 'expo';
import App from './App';

// PARCHE CRÍTICO: Engañamos al sistema para que no busque las herramientas rotas
global.__expo_device_log_disabled = true;

// Forzamos a que NO use las herramientas de desarrollo de React
if (__DEV__) {
  const { NativeModules } = require('react-native');
  if (NativeModules.DevSettings) {
    NativeModules.DevSettings.setIsDebuggingRemotely(false);
  }
}

registerRootComponent(App);
