import * as Haptics from 'expo-haptics';
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

import { MemoryModePane } from '@/components/presence/MemoryModePane';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useAISession } from '@/hooks/useAISession';
import { useMemoryOverlay } from '@/hooks/useMemoryOverlay';
import {
  AI_PROVIDER_LABELS,
  type AIProviderName,
  type ChatMessage,
} from '@/lib/types/ai-session';

const PROVIDERS: AIProviderName[] = ['openai', 'gemini', 'beyond_presence'];

const MODEL_LABEL: Record<AIProviderName, string> = {
  openai: 'GPT-4o mini',
  gemini: 'Gemini 1.5 Flash',
  beyond_presence: 'Beyond Presence',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

// ── Animated message bubble ────────────────────────────────────────────────────

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

// ── Session header ─────────────────────────────────────────────────────────────

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

// ── Typing indicator ───────────────────────────────────────────────────────────

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

// ── Chat input row ─────────────────────────────────────────────────────────────

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
        placeholder={placeholder ?? 'Message your echo…'}
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

// ── Suggestion chips (shown on idle) ──────────────────────────────────────────

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

// ── Beyond Presence text panel ─────────────────────────────────────────────────

function BPTextPanel({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (t: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.spring(heightAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  };

  const panelHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 96],
  });

  return (
    <View style={styles.bpTextPanel}>
      <Pressable style={styles.bpTextToggle} onPress={toggle}>
        <IconSymbol name="bubble.left.fill" size={15} color={EchoColors.textMuted} />
        <Text style={styles.bpTextToggleLabel}>
          {expanded ? 'Hide text input' : 'Type to avatar'}
        </Text>
        <IconSymbol
          name={expanded ? 'chevron.down' : 'chevron.up'}
          size={12}
          color={EchoColors.textDim}
        />
      </Pressable>
      <Animated.View style={[styles.bpTextExpanded, { height: panelHeight, overflow: 'hidden' }]}>
        <ChatInputRow
          value={value}
          onChange={onChange}
          onSend={onSend}
          disabled={disabled}
          placeholder="Type to the avatar…"
        />
      </Animated.View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

interface TimestampedMessage {
  message: ChatMessage;
  timestamp: number;
}

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
  const [bpInputText, setBpInputText] = useState('');
  const [timestampedMessages, setTimestampedMessages] = useState<TimestampedMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const isIdle = state.status === 'idle';
  const isConnecting = state.status === 'connecting';
  const isActive = state.status === 'active';
  const isError = state.status === 'error';
  const isBP = isActive && provider === 'beyond_presence';
  const isLLM = isActive && (provider === 'openai' || provider === 'gemini');

  // Sync messages → timestamped list
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

  // ── Send handlers ──────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !isLLM || isTyping) return;
    setInputText('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(text);
    scrollToBottom();
  }, [inputText, isLLM, isTyping, sendMessage, scrollToBottom]);

  const handleBPSend = useCallback(async () => {
    const text = bpInputText.trim();
    if (!text || !isBP) return;
    setBpInputText('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Send over LiveKit data channel (text) — wire when LiveKit RN SDK is installed
    console.log('[BP] Text message queued:', text);
  }, [bpInputText, isBP]);

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
  }, [endSession]);

  const handleLongPressBubble = useCallback((content: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Clipboard.setStringAsync(content); — add expo-clipboard for full copy support
    console.log('[copy]', content);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer withGradient={false} edges={['top']} includeTabBarPadding>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={top + 56}>

        {/* ── Provider picker (hidden while active) ── */}
        {!isActive && !isConnecting && (
          <View style={styles.pickerWrap}>
            <ProviderPicker selected={provider} onSelect={setProvider} disabled={isConnecting} />
          </View>
        )}

        {/* ── Active session header ── */}
        {isActive && (
          <SessionHeader provider={provider} onEnd={endSession} onClear={handleClearChat} />
        )}

        {/* ────────────────── IDLE ────────────────── */}
        {isIdle && (
          <View style={styles.idleContainer}>
            <View style={styles.idleTop}>
              <View style={styles.echoAvatar}>
                <Text style={styles.echoAvatarLetter}>E</Text>
              </View>
              <Text style={styles.stateTitle}>
                {provider === 'beyond_presence' ? 'Live Avatar' : 'Echo Chat'}
              </Text>
              <Text style={styles.stateSub}>
                {provider === 'beyond_presence'
                  ? 'Start a real-time avatar session powered by Beyond Presence + LiveKit.'
                  : `Have a conversation with your memory echo, powered by ${AI_PROVIDER_LABELS[provider]}.`}
              </Text>
              <Pressable style={styles.startBtn} onPress={startSession}>
                <IconSymbol name={provider === 'beyond_presence' ? 'video.fill' : 'bubble.left.fill'} size={16} color={EchoColors.bg} />
                <Text style={styles.startBtnText}>
                  {provider === 'beyond_presence' ? 'Start avatar session' : 'Start chatting'}
                </Text>
              </Pressable>
            </View>
            {provider !== 'beyond_presence' && (
              <View style={styles.idleBottom}>
                <Text style={styles.suggestionsLabel}>Try asking…</Text>
                <SuggestionChips onSelect={handleSuggestion} />
              </View>
            )}
          </View>
        )}

        {/* ────────────────── CONNECTING ────────────────── */}
        {isConnecting && (
          <View style={styles.centeredState}>
            <View style={styles.connectingRing}>
              <View style={styles.echoAvatar}>
                <Text style={styles.echoAvatarLetter}>E</Text>
              </View>
            </View>
            <Text style={styles.stateSub}>Connecting to {AI_PROVIDER_LABELS[provider]}…</Text>
          </View>
        )}

        {/* ────────────────── ERROR ────────────────── */}
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

        {/* ────────────────── ACTIVE — LLM CHAT ────────────────── */}
        {isLLM && (
          <View style={{ flex: 1 }}>
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
                  <Text style={styles.chatEmptyText}>Session started — say anything to your echo.</Text>
                </View>
              }
              ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            />

            {/* Suggestion row when no messages yet */}
            {messages.length === 0 && !isTyping && (
              <View style={styles.idleBottom}>
                <Text style={styles.suggestionsLabel}>Try asking…</Text>
                <SuggestionChips onSelect={handleSuggestion} />
              </View>
            )}

            <ChatInputRow
              value={inputText}
              onChange={setInputText}
              onSend={handleSend}
              disabled={isTyping}
            />
          </View>
        )}

        {/* ────────────────── ACTIVE — BEYOND PRESENCE ────────────────── */}
        {isBP && livekitCreds && (
          <View style={{ flex: 1 }}>
            {/* Video viewport */}
            <View style={styles.bpViewport}>
              <View style={styles.echoAvatar}>
                <Text style={styles.echoAvatarLetter}>E</Text>
              </View>
              <Text style={styles.bpTitle}>Avatar connected</Text>
              <Text style={styles.bpSub}>Room · {livekitCreds.roomName}</Text>
              <Text style={[styles.bpSub, { color: EchoColors.accentWarm, marginTop: 4 }]}>
                Install @livekit/react-native to render live video
              </Text>
            </View>

            {/* Caption bar */}
            <View style={[styles.captionBar, {
              bottom: fabBottom + 80,
              left: horizontal + left,
              right: horizontal + right,
            }]}>
              <Text style={styles.captionText} numberOfLines={3}>
                {latestAssistantMessage || 'Listening…'}
              </Text>
            </View>

            {/* PTT button */}
            <Pressable
              style={[styles.pttBtn, { bottom: fabBottom }]}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              onPressOut={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <IconSymbol name="mic.fill" size={22} color={EchoColors.bg} />
              <Text style={styles.pttLabel}>Hold to talk</Text>
            </Pressable>

            {/* Text input for BP */}
            <View style={[styles.bpTextPanelWrapper, { bottom: fabBottom + 60 }]}>
              <BPTextPanel
                value={bpInputText}
                onChange={setBpInputText}
                onSend={handleBPSend}
                disabled={false}
              />
            </View>

            {/* Memory overlay */}
            <MemoryModePane
              isOpen={memoryOpen}
              memory={memory}
              onClose={closeMemory}
              rightOffset={horizontal + right}
              bottomOffset={fabBottom + 150}
            />
          </View>
        )}

      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Provider picker
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

  // BP viewport
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
  bpTitle: { fontFamily: EchoFonts.serif, fontSize: 22, color: EchoColors.text },
  bpSub: { color: EchoColors.textMuted, fontSize: 14, textAlign: 'center' },

  // Caption + PTT
  captionBar: {
    position: 'absolute',
    backgroundColor: 'rgba(10,10,11,0.92)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
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
    backgroundColor: EchoColors.accent,
  },
  pttLabel: { color: EchoColors.bg, fontWeight: '600', fontSize: 15 },

  // BP text panel
  bpTextPanelWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  bpTextPanel: {
    backgroundColor: 'rgba(10,10,11,0.94)',
    borderTopWidth: 1,
    borderTopColor: EchoColors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bpTextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  bpTextToggleLabel: { color: EchoColors.textMuted, fontSize: 13, flex: 1 },
  bpTextExpanded: {},
});
