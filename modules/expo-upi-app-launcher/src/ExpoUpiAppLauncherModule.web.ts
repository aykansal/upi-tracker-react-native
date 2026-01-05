import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoUpiAppLauncher.types';

type ExpoUpiAppLauncherModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoUpiAppLauncherModule extends NativeModule<ExpoUpiAppLauncherModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoUpiAppLauncherModule, 'ExpoUpiAppLauncherModule');
