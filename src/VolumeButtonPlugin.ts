import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export interface VolumeButtonPlugin {
  addListener(eventName: 'volumeButtonPressed', listenerFunc: (info: { pressed: boolean }) => void): Promise<PluginListenerHandle>;
}

const VolumeButtonPlugin = registerPlugin<VolumeButtonPlugin>('VolumeButtonPlugin');

export default VolumeButtonPlugin;
