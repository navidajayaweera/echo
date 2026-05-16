import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MemoryModePane } from '@/components/presence/MemoryModePane';
import { PresenceMemoryBar } from '@/components/presence/PresenceMemoryBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useAISession } from '@/hooks/useAISession';
import { useMemoryOverlay } from '@/hooks/useMemoryOverlay';
import { usePersona } from '@/hooks/usePersona';
import {
  AI_PROVIDER_LABELS,
  type AIProviderName,
  type ChatMessage,
} from '@/lib/types/ai-session';
import type { MemoryRecalledEvent } from '@/lib/types/memory-events';

const PROVIDERS: AIProviderName[] = ['openai', 'gemini', 'beyond_presence'];

const DEMO_MOM_MEMORY: MemoryRecalledEvent = {
  type: 'memory.recalled',
  title: 'Galle Beach Trip, 2014',
  snippet: 'Beach trip with family',
  memoryYear: 2014,
};

function ProviderPicker({
  selected,
  onSelect,
  disabled,
}: {
  selected: AIProviderName;
  onSelect: (p: AIProviderName) => void;
  disabled?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pickerRow}>
      {PROVIDERS.map((p) => (
        <Pressable
          key={p}
          style={[styles.providerChip, selected === p && styles.providerChipActive]}
          onPress={() => !disabled && onSelect(p)}
          disabled={disabled}>
          <Text
            style={[
              styles.providerChipText,
              selected === p && styles.providerChipTextActive,
            ]}>
            {AI_PROVIDER_LABELS[p]}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
      <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
        {message.content}
      </Text>
    </View>
  );
}

function BPPlaceholder({ roomName, personaName }: { roomName: string; personaName: string }) {
  return (
    <View style={styles.bpViewport}>
      <View style={styles.avatarRing}>
        <Text style={styles.avatarGlyph}>✦</Text>
      </View>
      <Text style={styles.bpTitle}>Talk with {personaName}</Text>
      <Text style={styles.bpSub}>Room: {roomName}</Text>
      <Text style={styles.bpSub}>LiveKit avatar stream ready.</Text>
    </View>
  );
}

export default function PresenceScreen() {
  const router = useRouter();
  const { selectedPersona } = usePersona();
  const { fabBottom, horizontal, left, right, top } = useAppInsets({ includeTabBar: true });
  const {
    state,
    provider,
    setProvider,
    messages,
    isTyping,
    livekitCreds,
    latestAssistantMessage,
    startSession,
    sendMessage,
    endSession,
  } = useAISession(selectedPersona);

  const { isOpen: memoryOpen, memory, open: openMemory, close: closeMemory } = useMemoryOverlay();

  const [inputText, setInputText] = useState('');
  const [inlineMemory, setInlineMemory] = useState<MemoryRecalledEvent | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const personaName = selectedPersona?.name ?? 'your echo';
  const isIdle = state.status === 'idle';
  const isConnecting = state.status === 'connecting';
  const isActive = state.status === 'active';
  const isError = state.status === 'error';
  const isBP = isActive && provider === 'beyond_presence';
  const isLLM = isActive && (provider === 'openai' || provider === 'gemini');

  const maybeRecallMemory = (userText: string) => {
    if (selectedPersona?.id !== 'mom') return;
    const q = userText.toLowerCase();
    if (
      q.includes('memory') ||
      q.includes('childhood') ||
      q.includes('favorite') ||
      q.includes('galle')
    ) {
      setInlineMemory(DEMO_MOM_MEMORY);
      openMemory(DEMO_MOM_MEMORY);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !isLLM || isTyping) return;
    setInputText('');
    maybeRecallMemory(text);
    await sendMessage(text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (!selectedPersona) {
    return (
      <ScreenContainer includeTabBarPadding>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Presence</Text>
          <Text style={styles.stateSub}>Select a persona before starting a session.</Text>
          <PrimaryButton
            label="Choose Persona"
            onPress={() => router.push('/(tabs)/personas')}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer withGradient={false} edges={['top']} includeTabBarPadding>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={top + 56}>
        <View style={styles.pickerWrap}>
          <ProviderPicker
            selected={provider}
            onSelect={setProvider}
            disabled={isActive || isConnecting}
          />
        </View>

        {isIdle && (
          <View style={styles.centeredState}>
            <View style={[styles.idleAvatar, { backgroundColor: selectedPersona.avatarColor }]}>
              <Text style={styles.idleAvatarLetter}>{selectedPersona.name.charAt(0)}</Text>
            </View>
            <Text style={styles.stateTitle}>Talk with {selectedPersona.name}</Text>
            <Text style={styles.stateSub}>
              Your memories keep {selectedPersona.name === 'Younger Me' ? 'your' : 'their'} presence alive.
            </Text>
            <GlassCard style={styles.disclosureCard}>
              <Text style={styles.disclosure}>
                This is an AI representation built from preserved memories. It is not a living person.
              </Text>
            </GlassCard>
            <View style={styles.modeRow}>
              <PrimaryButton label="Start Conversation" onPress={startSession} />
              <PrimaryButton
                label="Voice Only"
                onPress={() => {
                  setProvider('beyond_presence');
                  startSession();
                }}
                variant="outline"
              />
              <PrimaryButton
                label="Text Mode"
                onPress={() => {
                  setProvider('openai');
                  startSession();
                }}
                variant="ghost"
              />
            </View>
          </View>
        )}

        {isConnecting && (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={EchoColors.primary} />
            <Text style={[styles.stateSub, { marginTop: 16 }]}>
              Connecting to {personaName} via {AI_PROVIDER_LABELS[provider]}…
            </Text>
          </View>
        )}

        {isError && (
          <View style={styles.centeredState}>
            <Text style={[styles.stateTitle, { color: EchoColors.error }]}>Error</Text>
            <Text style={styles.stateSub}>{(state as { message: string }).message}</Text>
            <PrimaryButton label="Retry" onPress={startSession} />
          </View>
        )}

        {isBP && livekitCreds && (
          <View style={{ flex: 1 }}>
            <BPPlaceholder roomName={livekitCreds.roomName} personaName={personaName} />
            {inlineMemory ? (
              <View style={styles.memoryBarWrap}>
                <PresenceMemoryBar
                  memory={inlineMemory}
                  onPress={() => openMemory(inlineMemory)}
                />
              </View>
            ) : null}
            <View
              style={[
                styles.captionBar,
                { bottom: fabBottom + 72, left: horizontal + left, right: horizontal + right },
              ]}>
              <Text style={styles.captionText} numberOfLines={2}>
                {latestAssistantMessage || `Waiting for ${personaName}…`}
              </Text>
            </View>
            <View style={[styles.pttBtn, { bottom: fabBottom }]}>
              <IconSymbol name="mic.fill" size={22} color={EchoColors.onSecondary} />
              <Text style={styles.pttLabel}>Hold to talk</Text>
            </View>
            <MemoryModePane
              isOpen={memoryOpen}
              memory={memory}
              onClose={closeMemory}
              rightOffset={horizontal + right}
              bottomOffset={fabBottom + 72}
            />
          </View>
        )}

        {isLLM && (
          <View style={{ flex: 1 }}>
            {inlineMemory ? (
              <View style={styles.memoryBarWrap}>
                <PresenceMemoryBar
                  memory={inlineMemory}
                  onPress={() => openMemory(inlineMemory)}
                />
              </View>
            ) : null}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => <MessageBubble message={item} />}
              contentContainerStyle={styles.chatList}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                isTyping ? (
                  <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                    <Text style={styles.typingDots}>•••</Text>
                  </View>
                ) : null
              }
            />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={`Ask ${personaName}…`}
                placeholderTextColor={EchoColors.textDim}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={!isTyping}
              />
              <Pressable
                style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || isTyping}>
                <IconSymbol name="paperplane.fill" size={18} color={EchoColors.onPrimary} />
              </Pressable>
            </View>
            <MemoryModePane
              isOpen={memoryOpen}
              memory={memory}
              onClose={closeMemory}
              rightOffset={horizontal + right}
              bottomOffset={fabBottom + 16}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      {isActive && (
        <Pressable
          style={[styles.endBtn, { top: top + 12, right: horizontal + right }]}
          onPress={() => {
            setInlineMemory(null);
            endSession();
          }}>
          <Text style={styles.endBtnText}>End</Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pickerWrap: { paddingBottom: 12 },
  pickerRow: { gap: 8, paddingVertical: 4 },
  providerChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: EchoColors.border,
    backgroundColor: EchoColors.bgElevated,
  },
  providerChipActive: {
    backgroundColor: EchoColors.primary,
    borderColor: EchoColors.primary,
  },
  providerChipText: { color: EchoColors.textMuted, fontSize: 14, fontWeight: '500' },
  providerChipTextActive: { color: EchoColors.onPrimary, fontWeight: '600' },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  idleAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: EchoColors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  idleAvatarLetter: {
    fontFamily: EchoFonts.serif,
    fontSize: 40,
    color: EchoColors.onPrimary,
  },
  stateTitle: {
    fontFamily: EchoFonts.serif,
    fontSize: 28,
    color: EchoColors.text,
    textAlign: 'center',
  },
  stateSub: {
    color: EchoColors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  disclosureCard: { padding: 14, marginVertical: 8, maxWidth: 320 },
  disclosure: {
    color: EchoColors.textDim,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modeRow: { width: '100%', gap: 10, marginTop: 8 },
  bpViewport: {
    flex: 1,
    backgroundColor: EchoColors.bgLowest,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: EchoColors.glassBorder,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: EchoColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EchoColors.glowViolet,
  },
  avatarGlyph: { fontSize: 36, color: EchoColors.primary },
  bpTitle: { fontFamily: EchoFonts.serif, fontSize: 24, color: EchoColors.text },
  bpSub: { color: EchoColors.textMuted, fontSize: 14, textAlign: 'center' },
  memoryBarWrap: { marginBottom: 8 },
  captionBar: {
    position: 'absolute',
    backgroundColor: EchoColors.glass,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: EchoColors.glassBorder,
  },
  captionText: { color: EchoColors.text, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  pttBtn: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    height: 52,
    borderRadius: 26,
    backgroundColor: EchoColors.secondary,
    shadowColor: EchoColors.secondary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  pttLabel: { color: EchoColors.onSecondary, fontWeight: '600', fontSize: 15 },
  chatList: { paddingBottom: 12, gap: 8 },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: EchoColors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: EchoColors.onPrimary },
  bubbleTextAssistant: { color: EchoColors.text },
  typingBubble: { paddingVertical: 14 },
  typingDots: { color: EchoColors.textMuted, fontSize: 20, letterSpacing: 4 },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: EchoColors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: EchoColors.border,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: EchoColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  endBtn: {
    position: 'absolute',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  endBtnText: { color: EchoColors.error, fontSize: 13, fontWeight: '600' },
});
