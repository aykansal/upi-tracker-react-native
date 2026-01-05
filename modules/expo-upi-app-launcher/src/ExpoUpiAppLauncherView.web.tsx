import * as React from 'react';

import { ExpoUpiAppLauncherViewProps } from './ExpoUpiAppLauncher.types';

export default function ExpoUpiAppLauncherView(props: ExpoUpiAppLauncherViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
