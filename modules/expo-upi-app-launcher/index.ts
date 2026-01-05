// Reexport the native module. On web, it will be resolved to ExpoUpiAppLauncherModule.web.ts

import { requireNativeModule } from 'expo';

// and on native platforms to ExpoUpiAppLauncherModule.ts
export { default } from './src/ExpoUpiAppLauncherModule';
export { default as ExpoUpiAppLauncherView } from './src/ExpoUpiAppLauncherView';
export * from  './src/ExpoUpiAppLauncher.types';

export const ExpoUpiAppLauncherModule = requireNativeModule('ExpoUpiAppLauncher');