import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { usePersona } from '@/hooks/usePersona';

export function BeginSessionButton() {
  const router = useRouter();
  const { selectedPersona } = usePersona();

  const handlePress = () => {
    if (!selectedPersona) {
      Alert.alert('Choose a persona', 'Select who you want to talk with first.', [
        { text: 'Go to Personas', onPress: () => router.push('/(tabs)/personas') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    router.push('/(tabs)/presence');
  };

  return (
    <PrimaryButton
      label={
        selectedPersona
          ? `Talk with ${selectedPersona.name}`
          : 'Begin Presence'
      }
      onPress={handlePress}
    />
  );
}
