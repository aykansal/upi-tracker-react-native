const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to add FileProvider configuration for secure file sharing
 */
const withExpoUpiAppLauncher = (config) => {
  // Add FileProvider to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];
    
    // Add FileProvider if it doesn't exist
    if (!application.provider) {
      application.provider = [];
    }

    const packageName = config.android?.package || 'com.upitracker.app';
    const authority = `${packageName}.fileprovider`;

    // Check if FileProvider already exists
    const hasFileProvider = application.provider.some(
      (provider) => provider.$['android:name'] === 'androidx.core.content.FileProvider'
    );

    if (!hasFileProvider) {
      application.provider.push({
        $: {
          'android:name': 'androidx.core.content.FileProvider',
          'android:authorities': authority,
          'android:exported': 'false',
          'android:grantUriPermissions': 'true',
        },
        'meta-data': [
          {
            $: {
              'android:name': 'android.support.FILE_PROVIDER_PATHS',
              'android:resource': '@xml/file_provider_paths',
            },
          },
        ],
      });
    }

    return config;
  });

  // Create file_provider_paths.xml resource file
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const resXmlPath = path.join(
        projectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      // Create xml directory if it doesn't exist
      if (!fs.existsSync(resXmlPath)) {
        fs.mkdirSync(resXmlPath, { recursive: true });
      }

      const fileProviderPathsPath = path.join(resXmlPath, 'file_provider_paths.xml');
      
      // Create file_provider_paths.xml if it doesn't exist
      if (!fs.existsSync(fileProviderPathsPath)) {
        const fileProviderPathsContent = `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <cache-path name="qr_images" path="." />
    <external-cache-path name="qr_images_external" path="." />
    <files-path name="files" path="." />
</paths>`;

        fs.writeFileSync(fileProviderPathsPath, fileProviderPathsContent, 'utf8');
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withExpoUpiAppLauncher;

