import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@upitracker_onboarding_complete';
const USER_PROFILE_KEY = '@upitracker_user_profile';

export interface UserProfile {
  name: string;
  avatarId: string;
}

/**
 * Check if onboarding has been completed
 */
export const isOnboardingComplete = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as complete
 */
export const completeOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
};

/**
 * Save user profile (name and avatarId)
 */
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!data) return null;
    return JSON.parse(data) as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Complete onboarding and save user profile in one operation
 */
export const completeOnboardingWithProfile = async (
  profile: UserProfile
): Promise<void> => {
  try {
    await Promise.all([
      completeOnboarding(),
      saveUserProfile(profile),
    ]);
  } catch (error) {
    console.error('Error completing onboarding with profile:', error);
    throw error;
  }
};

/**
 * Update user profile without affecting onboarding status
 */
export const updateUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await saveUserProfile(profile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

