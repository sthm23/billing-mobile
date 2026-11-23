import { VOICE_MAX_MS, type RecordedAudio } from '@/services/order-assistant';
import {
  AudioQuality,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

/** Speech only: mono 16 kHz (what Whisper uses), small AAC / Opus files. */
const OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
  isMeteringEnabled: true,
  android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
  ios: { outputFormat: IOSOutputFormat.MPEG4AAC, audioQuality: AudioQuality.MEDIUM },
  web: { mimeType: 'audio/webm', bitsPerSecond: 32000 },
};

/** Bars of the level meter (design «VoiceRecording»). */
export const LEVEL_BARS = 36;
const SILENCE_DB = -60;
const STATUS_INTERVAL_MS = 100;

/** A browser can record only with getUserMedia + MediaRecorder (https or localhost). */
export function canRecordVoice(): boolean {
  if (Platform.OS !== 'web') return true;
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof (globalThis as { MediaRecorder?: unknown }).MediaRecorder !== 'undefined'
  );
}

export type StartResult = 'recording' | 'denied' | 'failed';

/**
 * Voice tab recorder: permission, start, stop at the 60 s limit, level meter.
 * `finish` returns the file (kept by the caller until `transcribe` succeeds);
 * `cancel` throws the recording away.
 */
export function useVoiceRecorder(onLimit: () => void) {
  const recorder = useAudioRecorder(OPTIONS);
  const status = useAudioRecorderState(recorder, STATUS_INTERVAL_MS);
  const [levels, setLevels] = useState<number[]>([]);
  const active = useRef(false);

  const isRecording = status.isRecording;
  const durationMs = Math.min(status.durationMillis, VOICE_MAX_MS);

  // Level history: dBFS → 0…1, newest last
  useEffect(() => {
    if (!isRecording) return;
    const db = status.metering ?? SILENCE_DB;
    const level = Math.max(0, Math.min(1, (db - SILENCE_DB) / -SILENCE_DB));
    setLevels((prev) => [...prev.slice(-(LEVEL_BARS - 1)), level]);
  }, [isRecording, status.durationMillis, status.metering]);

  useEffect(() => {
    if (isRecording && status.durationMillis >= VOICE_MAX_MS) onLimit();
  }, [isRecording, status.durationMillis, onLimit]);

  const start = useCallback(async (): Promise<StartResult> => {
    const permission = await requestRecordingPermissionsAsync().catch(() => null);
    if (!permission?.granted) return 'denied';
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      active.current = true;
      setLevels([]);
      return 'recording';
    } catch {
      return 'failed';
    }
  }, [recorder]);

  const stopRecorder = useCallback(async () => {
    if (!active.current) return;
    active.current = false;
    try {
      await recorder.stop();
    } finally {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    }
  }, [recorder]);

  const finish = useCallback(async (): Promise<RecordedAudio | null> => {
    const duration = Math.min(recorder.currentTime * 1000, VOICE_MAX_MS);
    await stopRecorder();
    if (!recorder.uri) return null;
    const web = Platform.OS === 'web';
    return {
      uri: recorder.uri,
      mimeType: web ? 'audio/webm' : 'audio/mp4',
      name: web ? 'order.webm' : 'order.m4a',
      durationMs: duration,
    };
  }, [recorder, stopRecorder]);

  const cancel = useCallback(() => {
    void stopRecorder().catch(() => undefined);
  }, [stopRecorder]);

  // Closing the sheet mid-recording releases the microphone
  useEffect(() => () => cancel(), [cancel]);

  return { isRecording, durationMs, levels, start, finish, cancel };
}
