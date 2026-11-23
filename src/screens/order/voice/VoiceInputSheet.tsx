import { Button, IconButton, Segmented, Text } from '@/components/base';
import { Sheet, SheetTextInput } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { hasVoiceDataConsent } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import {
  ORDER_ASSISTANT_DISABLED,
  ORDER_ASSISTANT_LIMITS,
  SPEECH_NOT_RECOGNIZED,
  VOICE_MAX_MS,
  useTranscribeAudio,
  type RecordedAudio,
} from '@/services/order-assistant';
import { isAxiosError } from 'axios';
import { Mic, MicOff, RotateCw, Search, ShieldCheck, TriangleAlert, WifiOff, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Platform, Pressable, View } from 'react-native';
import { LEVEL_BARS, canRecordVoice, useVoiceRecorder } from './use-voice-recorder';

type Mode = 'voice' | 'text';
/** Voice tab states (design «VoiceRecord»: idle, recording, denied, notHeard) + recognition. */
type VoicePhase = 'idle' | 'recording' | 'transcribing' | 'failed' | 'denied';
type TranscribeError = 'offline' | 'busy' | 'unavailable' | 'tooLong' | 'disabled' | 'other';

function transcribeError(error: unknown): TranscribeError | 'notHeard' {
  if (!isAxiosError<{ code?: string }>(error)) return 'other';
  if (!error.response) return error.code === 'ECONNABORTED' ? 'unavailable' : 'offline';
  const { status, data } = error.response;
  if (status === 422 || data?.code === SPEECH_NOT_RECOGNIZED) return 'notHeard';
  if (status === 403 && data?.code === ORDER_ASSISTANT_DISABLED) return 'disabled';
  if (status === 413) return 'tooLong';
  if (status === 429) return 'busy';
  if (status === 503 || status === 504) return 'unavailable';
  return 'other';
}

function clock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

interface VoiceInputSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called with the typed or recognized text; the caller closes the sheet.
   * `sampleId` — the recording was kept (store consent), reported back in `feedback`.
   */
  onSubmit: (text: string, sampleId?: string | null) => void;
  /** Warehouse of the cart — required for the voice tab (`transcribe`) */
  warehouseId?: string;
  /** «Ещё» on the review screen: the text is added to the list */
  append?: boolean;
  /** Characters still allowed (the transcript already holds some) */
  maxLength?: number;
}

/**
 * Order assistant input (design «VoiceRecord»): «Голос» — record up to 60 s,
 * the recording is recognized here («Распознаём речь…») and kept until that
 * succeeds; «Написать текстом» — one line per product. Both end in `onSubmit`.
 */
export function VoiceInputSheet({
  isOpen,
  onClose,
  onSubmit,
  warehouseId,
  append = false,
  maxLength = ORDER_ASSISTANT_LIMITS.TEXT_LENGTH,
}: VoiceInputSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const { user } = useAuth();
  const keepsVoice = hasVoiceDataConsent(user);
  const voiceAvailable = !!warehouseId && canRecordVoice();
  const [mode, setMode] = useState<Mode>(voiceAvailable ? 'voice' : 'text');
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [notHeard, setNotHeard] = useState(false);
  const [error, setError] = useState<TranscribeError | null>(null);
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const transcribe = useTranscribeAudio();
  // A result that arrives after the sheet was closed is dropped
  const session = useRef(0);

  const room = Math.max(maxLength, 0);

  const send = useCallback(
    (recorded: RecordedAudio) => {
      if (!warehouseId) return;
      const id = session.current;
      setPhase('transcribing');
      setError(null);
      setNotHeard(false);
      transcribe.mutate(
        { warehouseId, audio: recorded },
        {
          onSuccess: ({ text: heard, sampleId }) => {
            if (id !== session.current) return;
            setAudio(null);
            setPhase('idle');
            onSubmit(heard.trim().slice(0, room), sampleId);
          },
          onError: (e) => {
            if (id !== session.current) return;
            const kind = transcribeError(e);
            if (kind === 'notHeard') {
              setAudio(null);
              setNotHeard(true);
              setPhase('idle');
            } else {
              setError(kind);
              setPhase('failed');
            }
          },
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [warehouseId, onSubmit, room]
  );

  const finishRef = useRef<() => void>(() => undefined);
  const recorder = useVoiceRecorder(useCallback(() => finishRef.current(), []));

  // «Готово», the mic button and the 60 s limit may fire together — stop once
  const finishing = useRef(false);
  const finish = async () => {
    if (finishing.current || !recorder.isRecording) return;
    finishing.current = true;
    try {
      const recorded = await recorder.finish();
      if (!recorded) {
        setPhase('idle');
        return;
      }
      setAudio(recorded);
      send(recorded);
    } finally {
      finishing.current = false;
    }
  };
  finishRef.current = () => void finish();

  const startRecording = async () => {
    setNotHeard(false);
    setError(null);
    setAudio(null);
    const result = await recorder.start();
    setPhase(result === 'recording' ? 'recording' : result === 'denied' ? 'denied' : 'idle');
    if (result === 'failed') setError('other');
  };

  useEffect(() => {
    if (isOpen) {
      session.current += 1;
      setText('');
      setMode(voiceAvailable ? 'voice' : 'text');
      setPhase('idle');
      setNotHeard(false);
      setError(null);
      setAudio(null);
    } else {
      session.current += 1;
      recorder.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const switchMode = (next: Mode) => {
    if (phase === 'recording') recorder.cancel();
    if (phase === 'transcribing') return;
    setPhase('idle');
    setMode(next);
  };

  const lines = text.split('\n').filter((l) => l.trim()).length;
  const recording = phase === 'recording';
  const busy = phase === 'transcribing';

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <View className="flex-row items-start gap-2">
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="type-title text-ink" accessibilityRole="header">
              {append ? t('voiceOrder.input.appendTitle') : t('voiceOrder.input.title')}
            </Text>
            <Text className="font-onest text-[13px] text-muted">
              {mode === 'voice' ? t('voiceOrder.input.voiceSubtitle') : t('voiceOrder.input.subtitle')}
            </Text>
          </View>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        {voiceAvailable && (
          <Segmented
            variant="sunken"
            options={[
              { value: 'voice', label: t('voiceOrder.input.tabVoice') },
              { value: 'text', label: t('voiceOrder.input.tabText') },
            ]}
            value={mode}
            onChange={switchMode}
          />
        )}

        {mode === 'voice' && phase === 'denied' && (
          <View className="items-center gap-3 pt-1">
            <View className="w-[72px] h-[72px] rounded-full bg-err-bg items-center justify-center">
              <MicOff size={32} color={colors.errFg} strokeWidth={2} />
            </View>
            <Text className="font-onest-bold text-lg text-ink text-center">{t('voiceOrder.input.deniedTitle')}</Text>
            <Text className="font-onest text-sm leading-5 text-muted text-center max-w-[300px]">
              {Platform.OS === 'web' ? t('voiceOrder.input.deniedTextWeb') : t('voiceOrder.input.deniedText')}
            </Text>
            <View className="self-stretch gap-2 pt-1">
              {Platform.OS !== 'web' && (
                <Button variant="primary" size="lg" full onPress={() => void Linking.openSettings()}>
                  {t('voiceOrder.input.openSettings')}
                </Button>
              )}
              <Button variant="secondary" size="lg" full onPress={() => switchMode('text')}>
                {t('voiceOrder.input.toText')}
              </Button>
            </View>
          </View>
        )}

        {mode === 'voice' && phase === 'failed' && error && (
          <View className="items-center gap-2.5 pt-1" accessibilityRole="alert">
            <View className="w-16 h-16 rounded-full bg-err-bg items-center justify-center">
              {error === 'offline' ? (
                <WifiOff size={28} color={colors.errFg} strokeWidth={2} />
              ) : (
                <TriangleAlert size={28} color={colors.errFg} strokeWidth={2} />
              )}
            </View>
            <Text className="font-onest-bold text-lg text-ink text-center">
              {t(`voiceOrder.input.error.${error}Title`)}
            </Text>
            <Text className="font-onest text-sm leading-5 text-muted text-center max-w-[310px]">
              {t(`voiceOrder.input.error.${error}Text`)}
            </Text>
            <View className="self-stretch gap-2 pt-1">
              {audio && error !== 'tooLong' && error !== 'disabled' && (
                <Button variant="primary" size="lg" full icon={RotateCw} onPress={() => send(audio)}>
                  {t('voiceOrder.input.retry')}
                </Button>
              )}
              <View className="flex-row gap-2">
                {error !== 'disabled' && (
                  <Button variant="secondary" size="lg" className="flex-1" onPress={() => void startRecording()}>
                    {t('voiceOrder.input.recordAgain')}
                  </Button>
                )}
                <Button variant="secondary" size="lg" className="flex-1" onPress={() => switchMode('text')}>
                  {t('voiceOrder.input.toText')}
                </Button>
              </View>
            </View>
          </View>
        )}

        {mode === 'voice' && (phase === 'idle' || recording || busy) && (
          <View className="items-center gap-4">
            {notHeard && phase === 'idle' && (
              <View
                className="self-stretch flex-row items-center gap-2.5 rounded-2xl bg-warn-bg px-3.5 py-3"
                accessibilityRole="alert"
              >
                <TriangleAlert size={18} color={colors.warnFg} strokeWidth={2} />
                <Text className="flex-1 font-onest-semibold text-sm text-warn-fg">{t('voiceOrder.input.notHeard')}</Text>
              </View>
            )}
            {error === 'other' && phase === 'idle' && (
              <Text className="font-onest text-[13px] text-err-fg text-center">{t('voiceOrder.input.micFailed')}</Text>
            )}

            {phase === 'idle' && (
              <View className="self-stretch rounded-[18px] bg-sunken p-3.5 gap-1.5">
                <Text className="font-onest-semibold text-[13px] text-soft">{t('voiceOrder.input.idleHint')}</Text>
                <Text className="font-onest text-[15px] leading-[22px] italic text-ink">
                  {t('voiceOrder.input.idleExample')}
                </Text>
                <Text className="font-onest text-xs text-muted">{t('voiceOrder.input.idleNote')}</Text>
              </View>
            )}

            {recording && (
              <View className="self-stretch gap-2.5">
                <View className="h-16 flex-row items-center justify-center gap-[3px]" aria-hidden>
                  {Array.from({ length: LEVEL_BARS }, (_, i) => {
                    const level = recorder.levels[i - (LEVEL_BARS - recorder.levels.length)];
                    return (
                      <View
                        key={i}
                        className={cn('w-1 rounded-sm', level === undefined ? 'bg-track' : 'bg-ink')}
                        style={{ height: 6 + Math.round((level ?? 0) * 54) }}
                      />
                    );
                  })}
                </View>
                <View className="flex-row items-center gap-2.5">
                  <Text className="font-onest-bold text-[15px] text-err-fg tabular-nums">
                    ● {clock(recorder.durationMs)}
                  </Text>
                  <View className="flex-1 h-1 rounded-sm bg-track overflow-hidden">
                    <View
                      className="h-1 rounded-sm bg-ink"
                      style={{ width: `${(recorder.durationMs / VOICE_MAX_MS) * 100}%` }}
                    />
                  </View>
                  <Text className="font-onest text-[13px] text-muted tabular-nums">{clock(VOICE_MAX_MS)}</Text>
                </View>
                <View className="rounded-2xl bg-sunken px-3.5 py-3">
                  <Text className="font-onest text-[13px] leading-[19px] text-soft text-center">
                    {t('voiceOrder.input.recHint')}
                  </Text>
                </View>
              </View>
            )}

            {busy ? (
              <View className="items-center gap-3 py-6" accessibilityState={{ busy: true }}>
                <ActivityIndicator size="large" color={colors.ink} />
                <Text className="font-onest-bold text-base text-ink">{t('voiceOrder.input.transcribing')}</Text>
                <Text className="font-onest text-[13px] text-muted text-center">
                  {t('voiceOrder.input.transcribingHint')}
                </Text>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => (recording ? void finish() : void startRecording())}
                  accessibilityRole="button"
                  accessibilityLabel={recording ? t('voiceOrder.input.micStopA11y') : t('voiceOrder.input.micStartA11y')}
                  className={cn(
                    'w-24 h-24 rounded-full items-center justify-center my-2',
                    recording ? 'bg-err-fg border-[10px] border-err-bg' : 'bg-accent'
                  )}
                >
                  {recording ? (
                    <View className="w-[30px] h-[30px] rounded-lg" style={{ backgroundColor: colors.onPrimary }} />
                  ) : (
                    <Mic size={40} color={colors.onAccent} strokeWidth={2} />
                  )}
                </Pressable>
                <Text className="font-onest-semibold text-sm text-soft">
                  {recording ? t('voiceOrder.input.micStop') : t('voiceOrder.input.micStart')}
                </Text>
              </>
            )}

            {recording && (
              <View className="self-stretch flex-row gap-2">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onPress={() => {
                    recorder.cancel();
                    setPhase('idle');
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button variant="accent" size="lg" className="flex-1" onPress={() => void finish()}>
                  {t('voiceOrder.input.done')}
                </Button>
              </View>
            )}

            {keepsVoice && !busy && (
              <View className="flex-row items-center justify-center gap-1.5 px-2">
                <ShieldCheck size={14} color={colors.muted} strokeWidth={2} />
                <Text className="shrink font-onest text-xs text-muted text-center">
                  {t('voiceOrder.input.voiceKept')}
                </Text>
              </View>
            )}
          </View>
        )}

        {mode === 'text' && (
          <>
            <View className="gap-1.5">
              <Text className="font-onest-semibold text-[13px] text-soft">{t('voiceOrder.input.label')}</Text>
              <SheetTextInput
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={room}
                placeholder={t('voiceOrder.input.placeholder')}
                placeholderTextColor={colors.muted}
                accessibilityLabel={t('voiceOrder.input.label')}
                className="h-[168px] rounded-[18px] bg-sunken px-3.5 py-3 font-onest-medium text-base leading-[26px] text-ink"
              />
              <Text className="font-onest text-xs text-muted px-0.5">{t('voiceOrder.input.hint')}</Text>
            </View>

            <Button
              variant="accent"
              size="lg"
              full
              icon={Search}
              disabled={lines === 0}
              onPress={() => onSubmit(text.trim())}
            >
              {lines > 0 ? t('voiceOrder.input.findCount', { count: lines }) : t('voiceOrder.input.find')}
            </Button>
          </>
        )}
      </View>
    </Sheet>
  );
}
