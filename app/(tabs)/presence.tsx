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
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts, EchoLayout } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useAISession } from '@/hooks/useAISession';
import { useMemoryOverlay } from '@/hooks/useMemoryOverlay';
import {
  AI_PROVIDER_LABELS,
  type AIProviderName,
  type ChatMessage,
} from '@/lib/types/ai-session';

const PROVIDERS: AIProviderName[] = ['openai', 'gemini', 'beyond_presence'];

// ── Sub-components ────────────────────────────────────────────────────────────

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

function BPPlaceholder({ roomName }: { roomName: string }) {
  return (
    <View style={styles.bpViewport}>
      <IconSymbol name="video.fill" size={40} color={EchoColors.textMuted} />
      <Text style={styles.bpTitle}>Beyond Presence</Text>
      <Text style={styles.bpSub}>Room: {roomName}</Text>
      <Text style={styles.bpSub}>LiveKit video stream connection ready.</Text>
      <Text style={[styles.bpSub, { marginTop: 8, color: EchoColors.accentWarm }]}>
        Wire LiveKit RN SDK in the next sprint to see the avatar here.
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PresenceScreen() {
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
  } = useAISession();

  const { isOpen: memoryOpen, memory, close: closeMemory } = useMemoryOverlay();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const isIdle = state.status === 'idle';
  const isConnecting = state.status === 'connecting';
  const isActive = state.status === 'active';
  const isError = state.status === 'error';
  const isBP = isActive && provider === 'beyond_presence';
  const isLLM = isActive && (provider === 'openai' || provider === 'gemini');

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !isLLM || isTyping) return;
    setInputText('');
    await sendMessage(text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer withGradient={false} edges={['top']} includeTabBarPadding>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={top + 56}>

        {/* ── Provider picker ── */}
        <View style={styles.pickerWrap}>
          <ProviderPicker
            selected={provider}
            onSelect={setProvider}
            disabled={isActive || isConnecting}
          />
        </View>

        {/* ── Session state ── */}
        {isIdle && (
          <View style={styles.centeredState}>
            <IconSymbol name="video.fill" size={48} color={EchoColors.textMuted} />
            <Text style={styles.stateTitle}>Presence</Text>
            <Text style={styles.stateSub}>
              {provider === 'beyond_presence'
                ? 'Start a live avatar session via Beyond Presence + LiveKit.'
                : `Chat with the memory echo powered by ${AI_PROVIDER_LABELS[provider]}.`}
            </Text>
            <Pressable style={styles.startBtn} onPress={startSession}>
              <Text style={styles.startBtnText}>Begin session</Text>
            </Pressable>
          </View>
        )}

        {isConnecting && (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={EchoColors.accent} />
            <Text style={[styles.stateSub, { marginTop: 16 }]}>
              Connecting to {AI_PROVIDER_LABELS[provider]}…
            </Text>
          </View>
        )}

        {isError && (
          <View style={styles.centeredState}>
            <IconSymbol name="video.fill" size={40} color={EchoColors.error} />
            <Text style={[styles.stateTitle, { color: EchoColors.error }]}>Error</Text>
            <Text style={styles.stateSub}>{(state as { message: string }).message}</Text>
            <Pressable style={styles.startBtn} onPress={startSession}>
              <Text style={styles.startBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* ── Beyond Presence: LiveKit viewport placeholder ── */}
        {isBP && livekitCreds && (
          <View style={{ flex: 1 }}>
            <BPPlaceholder roomName={livekitCreds.roomName} />
            {/* Caption bar */}
            <View style={[styles.captionBar, { bottom: fabBottom + 72, left: horizontal + left, right: horizontal + right }]}>
              <Text style={styles.captionText} numberOfLines={2}>
                {latestAssistantMessage || 'Waiting for avatar…'}
              </Text>
            </View>
            {/* Hold-to-talk */}
            <View style={[styles.pttBtn, { bottom: fabBottom }]}>
              <IconSymbol name="mic.fill" size={22} color={EchoColors.bg} />
              <Text style={styles.pttLabel}>Hold to talk</Text>
            </View>
            {/* Memory overlay pane (slides from right) */}
            <MemoryModePane
              isOpen={memoryOpen}
              memory={memory}
              onClose={closeMemory}
              rightOffset={horizontal + right}
              bottomOffset={fabBottom + 72}
            />
          </View>
        )}

        {/* ── LLM: Chat interface ── */}
        {isLLM && (
          <View style={{ flex: 1 }}>
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

            {/* Input row */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask your echo…"
                placeholderTextColor={EchoColors.textDim}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                multiline={false}
                editable={!isTyping}
              />
              <Pressable
                style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || isTyping}>
                <IconSymbol name="paperplane.fill" size={18} color={EchoColors.bg} />
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── End session button ── */}
      {isActive && (
        <Pressable
          style={[styles.endBtn, { top: top + 12, right: horizontal + right }]}
          onPress={endSession}>
          <Text style={styles.endBtnText}>End</Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Provider picker
  pickerWrap: {
    paddingBottom: 12,
  },
  pickerRow: {
    gap: 8,
    paddingVertical: 4,
  },
  providerChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: EchoColors.border,
    backgroundColor: EchoColors.bgElevated,
  },
  providerChipActive: {
    backgroundColor: EchoColors.accent,
    borderColor: EchoColors.accent,
  },
  providerChipText: {
    color: EchoColors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  providerChipTextActive: {
    color: EchoColors.bg,
    fontWeight: '600',
  },

  // State screens
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  stateTitle: {
    fontFamily: EchoFonts.serif,
    fontSize: 28,
    color: EchoColors.text,
    marginTop: 8,
  },
  stateSub: {
    color: EchoColors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  startBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: EchoColors.accent,
  },
  startBtnText: {
    color: EchoColors.bg,
    fontSize: 16,
    fontWeight: '600',
  },

  // Beyond Presence viewport
  bpViewport: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
    marginBottom: 8,
  },
  bpTitle: {
    fontFamily: EchoFonts.serif,
    fontSize: 24,
    color: EchoColors.text,
  },
  bpSub: {
    color: EchoColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },

  // Caption + PTT
  captionBar: {
    position: 'absolute',
    backgroundColor: 'rgba(10,10,11,0.88)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  captionText: {
    color: EchoColors.text,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  pttBtn: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    height: 52,
    borderRadius: 26,
    backgroundColor: EchoColors.accent,
  },
  pttLabel: {
    color: EchoColors.bg,
    fontWeight: '600',
    fontSize: 15,
  },

  // LLM chat
  chatList: {
    paddingBottom: 12,
    gap: 8,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: EchoColors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: EchoColors.bg,
  },
  bubbleTextAssistant: {
    color: EchoColors.text,
  },
  typingBubble: {
    paddingVertical: 14,
  },
  typingDots: {
    color: EchoColors.textMuted,
    fontSize: 20,
    letterSpacing: 4,
  },

  // Input row
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
    backgroundColor: EchoColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },

  // End session
  endBtn: {
    position: 'absolute',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  endBtnText: {
    color: EchoColors.error,
    fontSize: 13,
    fontWeight: '600',
  },
});
