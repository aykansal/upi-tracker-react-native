import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoUpiAppLauncherViewProps } from './ExpoUpiAppLauncher.types';

const NativeView: React.ComponentType<ExpoUpiAppLauncherViewProps> =
  requireNativeView('ExpoUpiAppLauncher');

export default function ExpoUpiAppLauncherView(props: ExpoUpiAppLauncherViewProps) {
  return <NativeView {...props} />;
}
