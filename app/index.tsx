import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { isOnboardingComplete } from '@/services/user-storage';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await isOnboardingComplete();
        setShouldRedirect(completed ? '/(tabs)' : '/onboarding');
      } catch (error) {
        console.error('Error checking onboarding:', error);
        // Default to onboarding on error
        setShouldRedirect('/onboarding');
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, []);

  if (isChecking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.light.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  if (shouldRedirect) {
    return <Redirect href={shouldRedirect as any} />;
  }

  return null;
}

