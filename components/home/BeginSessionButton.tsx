import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/ui/PrimaryButton';

export function BeginSessionButton() {
  const router = useRouter();

  return (
    <PrimaryButton
      label="Begin Echo Session"
      onPress={() => router.push('/presence')}
    />
  );
}
