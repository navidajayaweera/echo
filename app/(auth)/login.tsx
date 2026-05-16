import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoTextInput } from '@/components/ui/EchoTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail, continueAsGuest, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter email and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    setError(null);
    try {
      await continueAsGuest();
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Guest sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} withGradient>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.brand}>Echoes</Text>
          <Text style={styles.tagline}>Preserve legacy. Speak with presence.</Text>

          {!isConfigured && (
            <Text style={styles.warn}>
              Supabase is not configured. Add keys to .env and restart Expo.
            </Text>
          )}

          <View style={styles.form}>
            <EchoTextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />
            <EchoTextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              label="Sign in"
              onPress={handleLogin}
              loading={loading}
              disabled={!isConfigured}
            />
            <PrimaryButton
              label="Continue as guest"
              onPress={handleGuest}
              variant="outline"
              disabled={!isConfigured || loading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>No account?</Text>
            <Link href="/signup" style={styles.link}>
              Create one
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  brand: {
    fontFamily: EchoFonts.serif,
    fontSize: 48,
    fontWeight: '300',
    color: EchoColors.text,
    letterSpacing: -1,
    textAlign: 'center',
  },
  tagline: {
    color: EchoColors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
    fontStyle: 'italic',
  },
  warn: {
    color: EchoColors.accentWarm,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  form: {
    marginTop: 8,
  },
  error: {
    color: EchoColors.error,
    marginBottom: 12,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    gap: 6,
  },
  footerText: {
    color: EchoColors.textDim,
    fontSize: 15,
  },
  link: {
    color: EchoColors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
