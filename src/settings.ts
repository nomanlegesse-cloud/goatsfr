import { UserId } from './types';
import type { ChatBackgroundId } from './backgrounds';

export type ThemePreset = 'white-beige' | 'warm-latte' | 'pure-ivory' | 'espresso-night';
export type BubbleRadiusStyle = 'rounded' | 'pill' | 'sharp';
export type MessageDensity = 'compact' | 'comfortable' | 'spacious';
export type FontScale = 'sm' | 'md' | 'lg';
export type TimeFormatStyle = '24h' | '12h' | 'hidden';
export type SoundEffectType = 'pop' | 'chime' | 'click';

export interface CustomMemberOverride {
  displayName?: string;
  tagline?: string;
  accentColor?: string;
  avatarUrl?: string;
}

export interface AppSettings {
  // Appearance & Theme
  themePreset: ThemePreset;
  chatBackground: ChatBackgroundId;
  customBackgroundUrl?: string;
  bubbleRadius: BubbleRadiusStyle;
  messageDensity: MessageDensity;
  fontScale: FontScale;
  highContrastBorders: boolean;

  // Chat & Display
  timeFormat: TimeFormatStyle;
  showAvatarsInChat: boolean;
  showTaglinesInChat: boolean;
  showSystemEvents: boolean;
  showReactionCounts: boolean;
  animateMessages: boolean;
  animateRoomTransitions: boolean;
  enterToSend: boolean;
  autoScrollOnNewMessage: boolean;

  // Sound & Notifications
  soundOnSend: boolean;
  soundOnReceive: boolean;
  soundEffectStyle: SoundEffectType;
  soundVolume: number; // 0 to 100

  // Privacy, Typing & Security
  broadcastTypingIndicator: boolean;
  showOthersTyping: boolean;
  blurImagesUntilClick: boolean;
  autoLockOnSwitch: boolean;
  strictSoundtrapFilter: boolean;

  // Custom Profile Overrides per Member
  memberOverrides: Partial<Record<UserId, CustomMemberOverride>>;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  themePreset: 'white-beige',
  chatBackground: 'none',
  customBackgroundUrl: '',
  bubbleRadius: 'rounded',
  messageDensity: 'comfortable',
  fontScale: 'md',
  highContrastBorders: false,

  timeFormat: '24h',
  showAvatarsInChat: true,
  showTaglinesInChat: false,
  showSystemEvents: true,
  showReactionCounts: true,
  animateMessages: true,
  animateRoomTransitions: true,
  enterToSend: true,
  autoScrollOnNewMessage: true,

  soundOnSend: true,
  soundOnReceive: true,
  soundEffectStyle: 'pop',
  soundVolume: 60,

  broadcastTypingIndicator: true,
  showOthersTyping: true,
  blurImagesUntilClick: false,
  autoLockOnSwitch: false,
  strictSoundtrapFilter: true,

  memberOverrides: {},
};

const SETTINGS_STORAGE_KEY = 'goats_comprehensive_settings_v1';

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      memberOverrides: {
        ...DEFAULT_APP_SETTINGS.memberOverrides,
        ...(parsed.memberOverrides || {}),
      },
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

export function getSchoolHoursLabel(userId?: UserId | null): string {
  if (userId === 'yufi' || userId === 'nomi') {
    return '10:00 AM – 4:00 PM AST (yufi & nomi)';
  }
  if (userId === 'sofi') {
    return '10:00 AM – 4:00 PM EEST (sofi)';
  }
  if (userId === 'afiyyy') {
    return '11:00 AM – 5:00 PM (afiyyy)';
  }
  return '10:00 AM – 4:00 PM AST (yufi & nomi) · 10:00 AM – 4:00 PM EEST (sofi) · 11:00 AM – 5:00 PM (afiyyy)';
}

// Check if current time falls within School Hours for the specific member:
// - yufi & nomi: 10:00 AM - 4:00 PM AST (Arabia Standard Time UTC+3 / Atlantic Standard Time UTC-4 / local 10am-4pm)
// - sofi: 10:00 AM - 4:00 PM EEST (Eastern European Summer Time UTC+3 / local 10am-4pm)
// - afiyyy: 11:00 AM - 5:00 PM (UTC+4 / local 11am-5pm)
export function isDuringSchoolHours(
  userId?: UserId | null,
  date: Date = new Date()
): boolean {
  const localMinutes = date.getHours() * 60 + date.getMinutes();
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const astArabiaMinutes = (utcMinutes + 3 * 60 + 1440) % 1440; // UTC+3 (AST / EEST)
  const astAtlanticMinutes = (utcMinutes - 4 * 60 + 1440) % 1440; // UTC-4 (AST)
  const utcPlus4Minutes = (utcMinutes + 4 * 60 + 1440) % 1440; // UTC+4 (11am-5pm matches 10am-4pm UTC+3)

  if (userId === 'yufi' || userId === 'nomi') {
    // 10:00 AM - 4:00 PM AST
    const inLocal = localMinutes >= 10 * 60 && localMinutes < 16 * 60;
    const inAstArabia = astArabiaMinutes >= 10 * 60 && astArabiaMinutes < 16 * 60;
    const inAstAtlantic = astAtlanticMinutes >= 10 * 60 && astAtlanticMinutes < 16 * 60;
    return inLocal || inAstArabia || inAstAtlantic;
  }

  if (userId === 'sofi') {
    // 10:00 AM - 4:00 PM EEST (UTC+3)
    const inLocal = localMinutes >= 10 * 60 && localMinutes < 16 * 60;
    const inEest = astArabiaMinutes >= 10 * 60 && astArabiaMinutes < 16 * 60;
    return inLocal || inEest;
  }

  if (userId === 'afiyyy') {
    // 11:00 AM - 5:00 PM
    const inLocal = localMinutes >= 11 * 60 && localMinutes < 17 * 60;
    const inUtcPlus4 = utcPlus4Minutes >= 11 * 60 && utcPlus4Minutes < 17 * 60;
    return inLocal || inUtcPlus4;
  }

  // Fallback if no userId specified
  const in10to4AstOrEest =
    (localMinutes >= 10 * 60 && localMinutes < 16 * 60) ||
    (astArabiaMinutes >= 10 * 60 && astArabiaMinutes < 16 * 60) ||
    (astAtlanticMinutes >= 10 * 60 && astAtlanticMinutes < 16 * 60);
  const in11to5 =
    (localMinutes >= 11 * 60 && localMinutes < 17 * 60) ||
    (utcPlus4Minutes >= 11 * 60 && utcPlus4Minutes < 17 * 60);

  return in10to4AstOrEest || in11to5;
}

// Web Audio API synthesized sound effects so no external audio files are needed
export function playUiSound(
  type: SoundEffectType,
  volumePercent: number,
  userId?: UserId | null
) {
  // Never make any sound if this member is in school
  if (isDuringSchoolHours(userId)) return;
  if (volumePercent <= 0) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const vol = Math.min(1, Math.max(0, volumePercent / 100)) * 0.18;
    const now = ctx.currentTime;

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.065);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'chime') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(240, now);
      gain.gain.setValueAtTime(vol * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch {
    // ignore audio context restrictions
  }
}
