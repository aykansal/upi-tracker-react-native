import { NativeModule, requireNativeModule } from 'expo';

import { ExpoUpiAppLauncherModuleEvents } from './ExpoUpiAppLauncher.types';

declare class ExpoUpiAppLauncherModule extends NativeModule<ExpoUpiAppLauncherModuleEvents> {
  shareTo(packageName: string, uri: string): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoUpiAppLauncherModule>('ExpoUpiAppLauncher');
