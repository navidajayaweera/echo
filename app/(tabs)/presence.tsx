import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
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

import { BeyondPresenceActive } from '@/components/presence/BeyondPresenceActive';
import { BeyondPresenceIdle } from '@/components/presence/BeyondPresenceIdle';
import { PresenceMemoryBar } from '@/components/presence/PresenceMemoryBar';
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

const MODEL_LABEL: Record<AIProviderName, string> = {
  openai: 'GPT-4o mini',
  gemini: 'Gemini 1.5 Flash',
  beyond_presence: 'Beyond Presence',
};

const DEMO_MOM_MEMORY: MemoryRecalledEvent = {
  type: 'memory.recalled',
  title: 'Galle Beach Trip, 2014',
  snippet: 'Beach trip with family',
  memoryYear: 2014,
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ?????? Sub-components ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

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

// ?????? Animated message bubble ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

function MessageBubble({
  message,
  timestamp,
  onLongPress,
}: {
  message: ChatMessage;
  timestamp?: number;
  onLongPress?: () => void;
}) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
      <Pressable
        onLongPress={onLongPress}
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {message.content}
        </Text>
      </Pressable>
      {timestamp && (
        <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAssistant]}>
          {formatTime(timestamp)}
        </Text>
      )}
    </Animated.View>
  );
}

// ?????? Session header ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

function SessionHeader({
  provider,
  onEnd,
  onClear,
}: {
  provider: AIProviderName;
  onEnd: () => void;
  onClear: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <View style={styles.sessionHeader}>
      <View style={styles.sessionHeaderLeft}>
        <View style={styles.liveDot} />
        <Text style={styles.sessionProvider}>{AI_PROVIDER_LABELS[provider]}</Text>
        <Text style={styles.sessionModel}>{MODEL_LABEL[provider]}</Text>
      </View>
      <View style={styles.sessionHeaderRight}>
        <Text style={styles.sessionTimer}>{mm}:{ss}</Text>
        <Pressable style={styles.headerBtn} onPress={onClear} hitSlop={8}>
          <IconSymbol name="trash.fill" size={14} color={EchoColors.textMuted} />
        </Pressable>
        <Pressable style={[styles.headerBtn, styles.endBtnHeader]} onPress={onEnd} hitSlop={8}>
          <Text style={styles.endBtnText}>End</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ?????? Typing indicator ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      );
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 150);
    const a3 = pulse(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
      ))}
    </View>
  );
}

// ?????? Chat input row ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

function ChatInputRow({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (t: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View style={styles.inputRow}>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder ?? 'Message your echo???'}
        placeholderTextColor={EchoColors.textDim}
        value={value}
        onChangeText={onChange}
        returnKeyType="send"
        onSubmitEditing={onSend}
        blurOnSubmit={false}
        multiline
        maxLength={2000}
        editable={!disabled}
      />
      <Pressable
        style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        onPress={onSend}
        disabled={!canSend}>
        <IconSymbol name="paperplane.fill" size={18} color={canSend ? EchoColors.bg : EchoColors.textDim} />
      </Pressable>
    </View>
  );
}

// ?????? Suggestion chips (shown on idle) ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

const SUGGESTIONS = [
  'Tell me about your childhood',
  'What advice would you give me?',
  'Share a favourite memory',
  'How did you meet your partner?',
];

function SuggestionChips({ onSelect }: { onSelect: (s: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.suggestionsRow}>
      {SUGGESTIONS.map((s) => (
        <Pressable key={s} style={styles.suggestionChip} onPress={() => onSelect(s)}>
          <Text style={styles.suggestionText}>{s}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ?????? Main screen ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

interface TimestampedMessage {
  message: ChatMessage;
  timestamp: number;
}

export default function PresenceScreen() {
  const router = useRouter();
  const { selectedPersona } = usePersona();
  const { top } = useAppInsets({ includeTabBar: true });
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

  const {
    isOpen: memoryOpen,
    memory,
    open: openMemory,
    close: closeMemory,
    handleLiveKitData,
  } = useMemoryOverlay();

  const [inputText, setInputText] = useState('');
  const [inlineMemory, setInlineMemory] = useState<MemoryRecalledEvent | null>(null);
  const [timestampedMessages, setTimestampedMessages] = useState<TimestampedMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const personaName = selectedPersona?.name ?? 'your echo';
  const avatarLabel = selectedPersona?.name.charAt(0) ?? 'E';

  const isIdle = state.status === 'idle';
  const isConnecting = state.status === 'connecting';
  const isActive = state.status === 'active';
  const isError = state.status === 'error';
  const isBP = isActive && provider === 'beyond_presence';
  const isLLM = isActive && (provider === 'openai' || provider === 'gemini');

  // Sync messages ??? timestamped list
  useEffect(() => {
    setTimestampedMessages((prev) => {
      const prevLen = prev.length;
      if (messages.length === 0) return [];
      if (messages.length <= prevLen) return prev;
      const newOnes = messages.slice(prevLen).map((m) => ({ message: m, timestamp: Date.now() }));
      return [...prev, ...newOnes];
    });
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  // ?????? Send handlers ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

  const maybeRecallMemory = useCallback(
    (userText: string) => {
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
    },
    [selectedPersona?.id, openMemory],
  );

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !isLLM || isTyping) return;
    setInputText('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    maybeRecallMemory(text);
    await sendMessage(text);
    scrollToBottom();
  }, [inputText, isLLM, isTyping, sendMessage, scrollToBottom, maybeRecallMemory]);

  const handleSuggestion = useCallback(
    async (text: string) => {
      if (isIdle) {
        await startSession();
        // sendMessage will be called after session is active via useEffect
        setInputText(text);
      } else if (isLLM) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await sendMessage(text);
        scrollToBottom();
      }
    },
    [isIdle, isLLM, startSession, sendMessage, scrollToBottom],
  );

  const handleClearChat = useCallback(() => {
    endSession();
    setTimestampedMessages([]);
    setInputText('');
    setInlineMemory(null);
  }, [endSession]);

  const handleLongPressBubble = useCallback((content: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Clipboard.setStringAsync(content); ??? add expo-clipboard for full copy support
    console.log('[copy]', content);
  }, []);

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

        {/* ?????? Provider picker
              Hidden: during active sessions, while connecting, and when BP is selected
              (BeyondPresenceIdle fills the whole screen and must remain distraction-free).
              Visible: on idle or error when using an LLM provider. ?????? */}
        {(isIdle || isError) && provider !== 'beyond_presence' && (
          <View style={styles.pickerWrap}>
            <ProviderPicker selected={provider} onSelect={setProvider} disabled={isConnecting} />
          </View>
        )}

        {/* ?????? Active session header ??? LLM only; BP has its own header inside BeyondPresenceActive ?????? */}
        {isLLM && (
          <SessionHeader provider={provider} onEnd={endSession} onClear={handleClearChat} />
        )}

        {/* ?????????????????????????????????????????????????????? IDLE ??? Beyond Presence ?????????????????????????????????????????????????????? */}
        {isIdle && provider === 'beyond_presence' && (
          <BeyondPresenceIdle
            onStart={startSession}
            isConnecting={false}
            avatarLabel={avatarLabel}
          />
        )}

        {isIdle && provider !== 'beyond_presence' && (
          <View style={styles.idleContainer}>
            <View style={styles.idleTop}>
              <View style={styles.echoAvatar}>
                <Text style={styles.echoAvatarLetter}>{avatarLabel}</Text>
              </View>
              <Text style={styles.stateTitle}>Talk with {personaName}</Text>
              <Text style={styles.stateSub}>
                {`Memory-grounded conversation powered by ${AI_PROVIDER_LABELS[provider]}.`}
              </Text>
              <Pressable style={styles.startBtn} onPress={startSession}>
                <IconSymbol name="bubble.left.fill" size={16} color={EchoColors.bg} />
                <Text style={styles.startBtnText}>Start chatting</Text>
              </Pressable>
            </View>
            <View style={styles.idleBottom}>
              <Text style={styles.suggestionsLabel}>Try asking???</Text>
              <SuggestionChips onSelect={handleSuggestion} />
            </View>
          </View>
        )}

        {/* ?????????????????????????????????????????????????????? CONNECTING ??? Beyond Presence ?????????????????????????????????????????????????????? */}
        {isConnecting && provider === 'beyond_presence' && (
          <BeyondPresenceIdle
            onStart={startSession}
            isConnecting={true}
            avatarLabel={avatarLabel}
          />
        )}

        {/* ?????????????????????????????????????????????????????? CONNECTING ??? LLM providers ?????????????????????????????????????????????????????? */}
        {isConnecting && provider !== 'beyond_presence' && (
          <View style={styles.centeredState}>
            <View style={styles.connectingRing}>
              <View style={styles.echoAvatar}>
                <Text style={styles.echoAvatarLetter}>E</Text>
              </View>
            </View>
            <Text style={styles.stateSub}>Connecting to {AI_PROVIDER_LABELS[provider]}???</Text>
          </View>
        )}

        {/* ?????????????????????????????????????????????????????? ERROR ?????????????????????????????????????????????????????? */}
        {isError && (
          <View style={styles.centeredState}>
            <IconSymbol name="xmark.circle.fill" size={44} color={EchoColors.error} />
            <Text style={[styles.stateTitle, { color: EchoColors.error }]}>Connection failed</Text>
            <Text style={[styles.stateSub, { color: EchoColors.textMuted }]}>
              {(state as { message: string }).message}
            </Text>
            <Pressable style={styles.startBtn} onPress={startSession}>
              <Text style={styles.startBtnText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {/* ?????????????????????????????????????????????????????? ACTIVE ??? LLM CHAT ?????????????????????????????????????????????????????? */}
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
              data={timestampedMessages}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item.message}
                  timestamp={item.timestamp}
                  onLongPress={() => handleLongPressBubble(item.message.content)}
                />
              )}
              contentContainerStyle={styles.chatList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
              ListEmptyComponent={
                <View style={styles.chatEmpty}>
                  <Text style={styles.chatEmptyText}>Session started ??? say anything to your echo.</Text>
                </View>
              }
              ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            />

            {/* Suggestion row when no messages yet */}
            {messages.length === 0 && !isTyping && (
              <View style={styles.idleBottom}>
                <Text style={styles.suggestionsLabel}>Try asking???</Text>
                <SuggestionChips onSelect={handleSuggestion} />
              </View>
            )}

            <ChatInputRow
              value={inputText}
              onChange={setInputText}
              onSend={handleSend}
              disabled={isTyping}
              placeholder={`Ask ${personaName}?`}
            />
          </View>
        )}

        {/* ?????????????????????????????????????????????????????? ACTIVE ??? BEYOND PRESENCE ?????????????????????????????????????????????????????? */}
        {isBP && livekitCreds && (
          <>
            {inlineMemory ? (
              <View style={styles.memoryBarWrap}>
                <PresenceMemoryBar
                  memory={inlineMemory}
                  onPress={() => openMemory(inlineMemory)}
                />
              </View>
            ) : null}
            <BeyondPresenceActive
              livekitCreds={livekitCreds}
              captionText={latestAssistantMessage}
              avatarLabel={avatarLabel}
              memoryOpen={memoryOpen}
              memory={memory}
              onMemoryClose={closeMemory}
              onLiveKitData={handleLiveKitData}
              onEndSession={() => {
                setInlineMemory(null);
                endSession();
              }}
            />
          </>
        )}

      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// ?????? Styles ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

const styles = StyleSheet.create({
  memoryBarWrap: { marginBottom: 8 },
  pickerWrap: { paddingBottom: 10 },
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
    backgroundColor: EchoColors.accent,
    borderColor: EchoColors.accent,
  },
  providerChipText: { color: EchoColors.textMuted, fontSize: 14, fontWeight: '500' },
  providerChipTextActive: { color: EchoColors.bg, fontWeight: '600' },

  // Session header
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: EchoColors.border,
    marginBottom: 8,
  },
  sessionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EchoColors.success,
  },
  sessionProvider: { color: EchoColors.text, fontSize: 14, fontWeight: '600' },
  sessionModel: {
    color: EchoColors.textDim,
    fontSize: 12,
    backgroundColor: EchoColors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  sessionTimer: { color: EchoColors.textDim, fontSize: 12, fontVariant: ['tabular-nums'] },
  headerBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  endBtnHeader: { borderColor: EchoColors.error + '55' },
  endBtnText: { color: EchoColors.error, fontSize: 12, fontWeight: '600' },

  // Echo avatar circle
  echoAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  echoAvatarLetter: {
    fontFamily: EchoFonts.serif,
    fontSize: 28,
    color: EchoColors.text,
  },

  // Idle state
  idleContainer: { flex: 1, justifyContent: 'space-between', paddingBottom: 8 },
  idleTop: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  idleBottom: { gap: 8, paddingBottom: 4 },
  stateTitle: {
    fontFamily: EchoFonts.serif,
    fontSize: 26,
    color: EchoColors.text,
  },
  stateSub: {
    color: EchoColors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  startBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: EchoColors.accent,
  },
  startBtnText: { color: EchoColors.bg, fontSize: 16, fontWeight: '600' },

  // Suggestions
  suggestionsLabel: {
    color: EchoColors.textDim,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  suggestionsRow: { gap: 8, paddingVertical: 4 },
  suggestionChip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: EchoColors.border,
    backgroundColor: EchoColors.bgElevated,
  },
  suggestionText: { color: EchoColors.textMuted, fontSize: 13 },

  // Connecting
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  connectingRing: {
    padding: 8,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: EchoColors.accent + '44',
    borderStyle: 'dashed',
  },

  // Chat bubbles
  chatList: { paddingBottom: 8, gap: 2 },
  bubbleRow: { marginBottom: 4 },
  bubbleRowUser: { alignItems: 'flex-end' },
  bubbleRowAssistant: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: EchoColors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: EchoColors.bg },
  bubbleTextAssistant: { color: EchoColors.text },
  timestamp: { fontSize: 10, marginTop: 3, marginHorizontal: 6 },
  timestampUser: { color: EchoColors.textDim, textAlign: 'right' },
  timestampAssistant: { color: EchoColors.textDim },

  // Typing indicator
  typingBubble: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: EchoColors.textMuted,
  },

  // Empty chat
  chatEmpty: { alignItems: 'center', paddingVertical: 24 },
  chatEmptyText: { color: EchoColors.textDim, fontSize: 14, textAlign: 'center' },

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
    paddingTop: 12,
    paddingBottom: 12,
    color: EchoColors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: EchoColors.border,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: EchoColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: EchoColors.bgElevated, borderWidth: 1, borderColor: EchoColors.border },

});
