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

export default function SignUpScreen() {
  const router = useRouter();
  const { signUpWithEmail, isConfigured } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Email required and password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email.trim(), password, displayName.trim());
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <Text style={styles.brand}>Check your email</Text>
          <Text style={styles.tagline}>
            We sent a confirmation link if your project requires it. You can sign in once verified.
          </Text>
          <PrimaryButton label="Back to sign in" onPress={() => router.replace('/login')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.brand}>Join Echoes</Text>
          <Text style={styles.tagline}>Begin preserving memories today</Text>

          <View style={styles.form}>
            <EchoTextInput
              placeholder="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <EchoTextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <EchoTextInput
              placeholder="Password (min 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              label="Create account"
              onPress={handleSignUp}
              loading={loading}
              disabled={!isConfigured}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/login" style={styles.link}>
              Sign in
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
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  brand: {
    fontFamily: EchoFonts.serif,
    fontSize: 36,
    fontWeight: '300',
    color: EchoColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  tagline: {
    color: EchoColors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
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
