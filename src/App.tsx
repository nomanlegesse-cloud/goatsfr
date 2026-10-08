import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Users,
  Edit3,
  Check,
  X,
  Reply,
  Smile,
  ArrowRight,
  History,
  LogOut,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ImagePlus,
  ZoomIn,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  MessageSquare,
  EyeOff,
  Settings,
  Globe,
  Music,
  Mic,
  Square,
  Loader2,
  AtSign,
  Plus,
  UserPen,
  Sparkles,
  Flame,
  Award,
  Palette,
  Mail,
  MailOpen,
  Bell,
  FileText,
  ListChecks,
} from 'lucide-react';
import {
  UserId,
  RoomId,
  ALL_USER_IDS,
  MEMBERS,
  MemberProfile,
  PRIVATE_CHATS,
  SECRET_VENT_ROOM_ID,
  SECRET_VENT_PASSCODE,
  NEVERLAND_ROOM_ID,
  NEVERLAND_GROUP_NAME,
  NEVERLAND_LYRICS_MAX_LENGTH,
  SUNO_CREATE_URL,
  NeverlandLyricEntry,
  NeverlandPlanItem,
  NeverlandProfile,
  DEFAULT_NEVERLAND_PROFILE,
  BADGE_DEFINITIONS,
  BadgeDefinition,
  BadgeId,
  CustomGroupChat,
  ChatMessage,
  NameProposal,
  GroupNameHistoryEntry,
  ServerState,
  ClientEvent,
  ServerEvent,
} from './types';
import {
  isContentRestricted,
  isSecretContent,
  formatModerationWarning,
  SECRET_SOUNDTRAP_WARNING,
  SOUNDTRAP_STUDIO_URL,
  SOUNDTRAP_MODERATION_WARNING,
  YUSUF_PRIVATE_CHAT_SUGGESTION,
  detectMentionedMembers,
} from './moderation';
import {
  AppSettings,
  loadAppSettings,
  saveAppSettings,
  playUiSound,
} from './settings';
import { CHAT_BACKGROUND_OPTIONS, ChatBackgroundId } from './backgrounds';
import SettingsModal from './SettingsModal';
import GoogleImagesModal from './GoogleImagesModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import TranscribeModal from './TranscribeModal';

const QUICK_REACTIONS = ['🐐', '🔥', '💯', '😂', '❤️', '👀'];

interface ApiEmojiItem {
  character: string;
  unicodeName: string;
  group: string;
}

interface ApiGifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
}

const GIF_CATEGORIES = [
  { id: '', label: 'Trending', icon: '🔥' },
  { id: 'goat', label: 'Goat', icon: '🐐' },
  { id: 'celebrate', label: 'Celebrate', icon: '🎉' },
  { id: 'funny', label: 'Funny', icon: '😂' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'dance', label: 'Dance', icon: '🕺' },
  { id: 'reaction', label: 'Reactions', icon: '👀' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'mind blown', label: 'Mind Blown', icon: '🤯' },
] as const;

const EMOJI_CATEGORIES = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'smileys-emotion', label: 'Smileys', icon: '😀' },
  { id: 'people-body', label: 'People', icon: '👋' },
  { id: 'animals-nature', label: 'Nature', icon: '🐐' },
  { id: 'food-drink', label: 'Food', icon: '🍕' },
  { id: 'activities', label: 'Fun', icon: '🎉' },
  { id: 'travel-places', label: 'Places', icon: '🚀' },
  { id: 'objects', label: 'Objects', icon: '👑' },
  { id: 'symbols', label: 'Symbols', icon: '💯' },
] as const;
const PASSWORD_REVEAL_SECONDS = 30;
const LOCAL_REVEALED_KEY = 'goats_revealed_identities_v4';
const LOCAL_CUSTOM_PASSWORDS_KEY = 'goats_custom_passwords_v1';
const ACTIVE_USER_SESSION_KEY = 'goats_active_user_v4';
const LOCAL_BLOOM_ARMED_KEY = 'goats_bloom_effect_armed_v1';
const LOCAL_BLOOM_UNLOCKED_USERS_KEY = 'goats_bloom_unlocked_users_v1';
const LOCAL_BLOOM_MSG_IDS_KEY = 'goats_bloom_message_ids_v1';
const NOMI_FRIDAY_GM_URL = 'https://meet.google.com/gcr-enuy-yme';

// Check if it is Friday after 3:00 PM (15:00) in local time or AST (UTC+3 / UTC-4)
function isFridayAfter3PM(date: Date = new Date()): boolean {
  const localDay = date.getDay();
  const localMinutes = date.getHours() * 60 + date.getMinutes();
  if (localDay === 5 && localMinutes >= 15 * 60) {
    return true;
  }
  // AST (Arabia Standard Time UTC+3)
  const astPlus3 = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  if (astPlus3.getUTCDay() === 5 && astPlus3.getUTCHours() * 60 + astPlus3.getUTCMinutes() >= 15 * 60) {
    return true;
  }
  // AST (Atlantic Standard Time UTC-4)
  const astMinus4 = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  if (
    astMinus4.getUTCDay() === 5 &&
    astMinus4.getUTCHours() * 60 + astMinus4.getUTCMinutes() >= 15 * 60
  ) {
    return true;
  }
  return false;
}

function getLocalUnlockedBloomUsers(): UserId[] {
  try {
    const raw = localStorage.getItem(LOCAL_BLOOM_UNLOCKED_USERS_KEY);
    if (!raw) return ['nomi'];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const valid = parsed.filter((u): u is UserId => ALL_USER_IDS.includes(u));
      return valid.includes('nomi') ? valid : ['nomi', ...valid];
    }
    return ['nomi'];
  } catch {
    return ['nomi'];
  }
}

function saveLocalUnlockedBloomUsers(users: UserId[]) {
  try {
    const unique = Array.from(new Set<UserId>(['nomi', ...users]));
    localStorage.setItem(LOCAL_BLOOM_UNLOCKED_USERS_KEY, JSON.stringify(unique));
  } catch {
    // ignore
  }
}

function getLocalSavedBloomIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_BLOOM_MSG_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalBloomId(msgId: string, enabled: boolean) {
  try {
    const current = getLocalSavedBloomIds();
    const next = enabled
      ? current.includes(msgId)
        ? current
        : [...current, msgId]
      : current.filter((id) => id !== msgId);
    localStorage.setItem(LOCAL_BLOOM_MSG_IDS_KEY, JSON.stringify(next.slice(-250)));
  } catch {
    // ignore storage errors
  }
}

// Detect random long words / elongated exclamations like "AHHHHHH", "BOOOOOO", "NOOOOOO", "YOOOOO", or long words
function hasRandomLongWord(text: string): boolean {
  const words = text.trim().split(/\s+/);
  for (const raw of words) {
    const clean = raw.replace(/[^a-zA-Z]/g, '');
    if (!clean) continue;
    // Any word with 3+ repeated consecutive letters (like AHHH, BOOO, AHHHHHH, BOOOOOO, HIIII, OMGGGG)
    if (/(.)\1{2,}/i.test(clean)) {
      return true;
    }
    // Or a long single word (7+ letters)
    if (clean.length >= 7) {
      return true;
    }
  }
  return false;
}

const BLOOM_PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const distance = 28 + (i % 3) * 18;
  return {
    id: i,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance - 12,
    size: i % 3 === 0 ? 10 : i % 2 === 0 ? 7 : 5,
    color:
      i % 4 === 0
        ? '#FF5E99'
        : i % 4 === 1
        ? '#FFB347'
        : i % 4 === 2
        ? '#A855F7'
        : '#38BDF8',
    delay: (i % 5) * 0.04,
  };
});

function getLocalCustomPasswords(): Partial<Record<UserId, string>> {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_PASSWORDS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveLocalCustomPasswords(map: Partial<Record<UserId, string>>) {
  try {
    localStorage.setItem(LOCAL_CUSTOM_PASSWORDS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function getLocalRevealedIdentities(): UserId[] {
  try {
    const raw = localStorage.getItem(LOCAL_REVEALED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalRevealedIdentities(list: UserId[]) {
  try {
    localStorage.setItem(LOCAL_REVEALED_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function formatTime(isoString: string, format: '24h' | '12h' | 'hidden' = '24h'): string {
  if (format === 'hidden') return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h',
    });
  } catch {
    return '';
  }
}

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Could not read image'));
        return;
      }
      if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export default function App() {
  // Check URL query param or sessionStorage for initial identity
  const [currentUser, setCurrentUser] = useState<UserId | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const asUser = params.get('user') as UserId | null;
    if (asUser && ALL_USER_IDS.includes(asUser)) {
      return asUser;
    }
    if (params.get('autostart') === '1') {
      return 'sofi';
    }
    const saved = sessionStorage.getItem(ACTIVE_USER_SESSION_KEY) as UserId | null;
    if (saved && ALL_USER_IDS.includes(saved)) {
      return saved;
    }
    return null;
  });

  const [groupName, setGroupName] = useState<string>('GOATS');
  const [websiteName, setWebsiteName] = useState<string>('GOATS Group Chat');
  const [customDisplayNames, setCustomDisplayNames] = useState<Partial<Record<UserId, string>>>({});
  const [customGroups, setCustomGroups] = useState<CustomGroupChat[]>([]);
  const [ventUsers, setVentUsers] = useState<UserId[]>([]);
  const [unlockedVentUsers, setUnlockedVentUsers] = useState<UserId[]>([]);
  const [ventPasscodeInput, setVentPasscodeInput] = useState<string>('');
  const [ventPasscodeError, setVentPasscodeError] = useState<string | null>(null);
  const [ventClearedBanner, setVentClearedBanner] = useState<boolean>(false);
  const [showEffectPrompt, setShowEffectPrompt] = useState<boolean>(false);
  const [bloomUnlockedUsers, setBloomUnlockedUsers] = useState<UserId[]>(() =>
    getLocalUnlockedBloomUsers()
  );
  const [userMessageCounts, setUserMessageCounts] = useState<Partial<Record<UserId, number>>>({
    sofi: 0,
    afiyyy: 0,
    yufi: 0,
    nomi: 0,
  });
  const [unlockedBadges, setUnlockedBadges] = useState<Partial<Record<UserId, BadgeId[]>>>({
    sofi: [],
    afiyyy: [],
    yufi: [],
    nomi: [],
  });
  const [showBadgesModal, setShowBadgesModal] = useState<boolean>(false);
  const [badgeToastQueue, setBadgeToastQueue] = useState<
    Array<{ key: string; badge: BadgeDefinition; userId: UserId }>
  >([]);
  const prevEarnedBadgeIdsRef = useRef<Partial<Record<UserId, BadgeId[]>>>({});
  const hasHydratedBadgesRef = useRef<boolean>(false);
  const [showBackgroundsModal, setShowBackgroundsModal] = useState<boolean>(false);
  const [showUnreadModal, setShowUnreadModal] = useState<boolean>(false);
  const [showOnlyUnreadInRoom, setShowOnlyUnreadInRoom] = useState<boolean>(false);
  const [manualUnreadIdsByUser, setManualUnreadIdsByUser] = useState<Partial<Record<UserId, string[]>>>({});
  const [neverlandLyrics, setNeverlandLyrics] = useState<NeverlandLyricEntry[]>([]);
  const [neverlandPlans, setNeverlandPlans] = useState<NeverlandPlanItem[]>([]);
  const [neverlandProfile, setNeverlandProfile] = useState<NeverlandProfile>(
    DEFAULT_NEVERLAND_PROFILE
  );
  const [neverlandTab, setNeverlandTab] = useState<'chat' | 'lyrics' | 'plan' | 'profile'>('chat');
  const [neverlandProfileError, setNeverlandProfileError] = useState<string | null>(null);
  const [neverlandProfileSavedMsg, setNeverlandProfileSavedMsg] = useState<boolean>(false);
  const neverlandAvatarFileRef = useRef<HTMLInputElement | null>(null);
  const [editingLyricId, setEditingLyricId] = useState<string | null>(null);
  const [lyricTitleInput, setLyricTitleInput] = useState<string>('');
  const [lyricBodyInput, setLyricBodyInput] = useState<string>('');
  const [lyricError, setLyricError] = useState<string | null>(null);
  const [planTitleInput, setPlanTitleInput] = useState<string>('');
  const [planDetailsInput, setPlanDetailsInput] = useState<string>('');
  const [planAssignedTo, setPlanAssignedTo] = useState<UserId | 'all'>('all');
  const [planError, setPlanError] = useState<string | null>(null);
  const customBgQuickInputRef = useRef<HTMLInputElement | null>(null);
  const [isFridayGmTime, setIsFridayGmTime] = useState<boolean>(() => isFridayAfter3PM());
  const [previewFridayGmBanner, setPreviewFridayGmBanner] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('friday') === '1';
  });
  const [isBloomEffectArmed, setIsBloomEffectArmed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_BLOOM_ARMED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [bloomReplayCounter, setBloomReplayCounter] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeProposal, setActiveProposal] = useState<NameProposal | null>(null);
  const [nameHistory, setNameHistory] = useState<GroupNameHistoryEntry[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserId[]>([]);
  const [typingUsers, setTypingUsers] = useState<UserId[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // One-time 30-second password reveal state & Account Unlock state
  const [revealedIdentities, setRevealedIdentities] = useState<UserId[]>(() =>
    getLocalRevealedIdentities()
  );
  const [revealSecondsLeft, setRevealSecondsLeft] = useState<number>(0);
  const [unlockedIdentities, setUnlockedIdentities] = useState<UserId[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const asUser = params.get('user') as UserId | null;
    if (asUser && ALL_USER_IDS.includes(asUser)) return [asUser];
    if (params.get('autostart') === '1') return ['sofi'];
    return [];
  });
  const [accountPasswordInput, setAccountPasswordInput] = useState<string>('');
  const [accountPasswordError, setAccountPasswordError] = useState<string | null>(null);
  const [customPasswords, setCustomPasswords] = useState<Partial<Record<UserId, string>>>(() =>
    getLocalCustomPasswords()
  );
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);

  // Active Chat Room
  const [activeRoom, setActiveRoom] = useState<RoomId>('group');

  // UI state
  const [messageInput, setMessageInput] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState<string>('');
  const [newGroupMembers, setNewGroupMembers] = useState<UserId[]>(ALL_USER_IDS);
  const [showMemberRenameModal, setShowMemberRenameModal] = useState<boolean>(false);
  const [renameTargetUser, setRenameTargetUser] = useState<UserId>('sofi');
  const [memberNewNameInput, setMemberNewNameInput] = useState<string>('');
  const [showWebsiteRenameModal, setShowWebsiteRenameModal] = useState<boolean>(false);
  const [websiteNameInput, setWebsiteNameInput] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showGoogleImagesModal, setShowGoogleImagesModal] = useState<boolean>(false);
  const [showTranscribeModal, setShowTranscribeModal] = useState<boolean>(false);
  const [isQuickRecording, setIsQuickRecording] = useState<boolean>(false);
  const [isQuickTranscribing, setIsQuickTranscribing] = useState<boolean>(false);
  const [quickRecordSeconds, setQuickRecordSeconds] = useState<number>(0);
  const [liveDictationPreview, setLiveDictationPreview] = useState<string>('');
  const quickRecorderRef = useRef<MediaRecorder | null>(null);
  const quickChunksRef = useRef<Blob[]>([]);
  const quickStreamRef = useRef<MediaStream | null>(null);
  const quickTimerRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quickRecognitionRef = useRef<any>(null);
  const baseInputBeforeDictationRef = useRef<string>('');
  const autoSendAfterStopRef = useRef<boolean>(false);
  const [proposedNameInput, setProposedNameInput] = useState<string>('');
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [privateChatSuggestionTarget, setPrivateChatSuggestionTarget] = useState<UserId | null>(
    null
  );
  const [showMentionMenu, setShowMentionMenu] = useState<boolean>(false);
  const [mentionFilter, setMentionFilter] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [emojiSearchQuery, setEmojiSearchQuery] = useState<string>('');
  const [emojiCategory, setEmojiCategory] = useState<string>('all');
  const [emojiResults, setEmojiResults] = useState<ApiEmojiItem[]>([]);
  const [isLoadingEmojis, setIsLoadingEmojis] = useState<boolean>(false);
  const [emojiTargetReactionMsgId, setEmojiTargetReactionMsgId] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState<boolean>(false);
  const [gifSearchQuery, setGifSearchQuery] = useState<string>('');
  const [gifResults, setGifResults] = useState<ApiGifItem[]>([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState<boolean>(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadAppSettings());
  const appSettingsRef = useRef<AppSettings>(appSettings);

  const handleUpdateSettings = (updater: (prev: AppSettings) => AppSettings) => {
    setAppSettings((prev) => {
      const next = updater(prev);
      appSettingsRef.current = next;
      saveAppSettings(next);
      return next;
    });
  };

  const getEffectiveMember = (id: UserId): MemberProfile => {
    const base = MEMBERS[id];
    const override = appSettings.memberOverrides[id];
    const sharedCustomName = customDisplayNames[id];
    const customPass = customPasswords[id];
    const effectiveDisplayName = sharedCustomName || override?.displayName || base.displayName;
    return {
      ...base,
      displayName: effectiveDisplayName,
      tagline: override?.tagline !== undefined ? override.tagline : base.tagline,
      accentColor: override?.accentColor || base.accentColor,
      avatarUrl: override?.avatarUrl || base.avatarUrl,
      avatarInitials:
        sharedCustomName && sharedCustomName.trim().length >= 2
          ? sharedCustomName.trim().slice(0, 2).toUpperCase()
          : base.avatarInitials,
      accountPassword: customPass || base.accountPassword,
    };
  };

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_BLOOM_ARMED_KEY, isBloomEffectArmed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [isBloomEffectArmed]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIsFridayGmTime(isFridayAfter3PM());
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showEmojiPicker) return;
    let cancelled = false;
    setIsLoadingEmojis(true);
    const timer = window.setTimeout(() => {
      fetch(
        `/api/emojis?q=${encodeURIComponent(emojiSearchQuery)}&category=${encodeURIComponent(
          emojiCategory
        )}`
      )
        .then((res) => res.json())
        .then((data: { emojis?: ApiEmojiItem[] }) => {
          if (!cancelled && Array.isArray(data.emojis)) {
            setEmojiResults(data.emojis);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setIsLoadingEmojis(false);
        });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [showEmojiPicker, emojiSearchQuery, emojiCategory]);

  const handleSelectEmojiFromPicker = (emojiChar: string) => {
    if (emojiTargetReactionMsgId) {
      handleToggleReaction(emojiTargetReactionMsgId, emojiChar);
      setEmojiTargetReactionMsgId(null);
      setShowEmojiPicker(false);
      return;
    }
    setMessageInput((prev) => `${prev}${emojiChar}`);
    messageInputRef.current?.focus();
  };

  useEffect(() => {
    if (!showGifPicker) return;
    let cancelled = false;
    setIsLoadingGifs(true);
    const timer = window.setTimeout(() => {
      fetch(`/api/gifs?q=${encodeURIComponent(gifSearchQuery.trim())}`)
        .then((res) => res.json())
        .then((data: { gifs?: ApiGifItem[] }) => {
          if (!cancelled && Array.isArray(data.gifs)) {
            setGifResults(data.gifs);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setIsLoadingGifs(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [showGifPicker, gifSearchQuery]);

  const handleSelectGif = (gifUrl: string, sendImmediately: boolean = false) => {
    if (!gifUrl) return;
    setShowGifPicker(false);
    if (sendImmediately && currentUser) {
      const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const effectToUse: 'bloom' | undefined = isBloomEffectArmed ? 'bloom' : undefined;
      if (effectToUse === 'bloom') {
        unlockBloomForUser(currentUser);
        awardBadgeForUser(currentUser, 'japan_bloom');
        saveLocalBloomId(msgId, true);
        setBloomReplayCounter((prev) => ({ ...prev, [msgId]: (prev[msgId] || 0) + 1 }));
      }
      const optimisticMsg: ChatMessage = {
        id: msgId,
        roomId: activeRoom,
        sender: currentUser,
        text: messageInput.trim(),
        imageUrl: gifUrl,
        effect: effectToUse,
        timestamp: new Date().toISOString(),
        type: 'chat',
        replyToId: replyingTo?.id,
        reactions: {},
        readBy: [currentUser],
      };
      handleMarkRoomAsRead(activeRoom, currentUser);
      setMessages((prev) => (prev.some((m) => m.id === msgId) ? prev : [...prev, optimisticMsg]));
      const textToSend = messageInput.trim();
      setMessageInput('');
      setSelectedImage(null);
      setReplyingTo(null);
      setUserMessageCounts((prev) => ({
        ...prev,
        [currentUser]: getUserMessageCount(currentUser) + 1,
      }));
      if (appSettings.soundOnSend) {
        playUiSound(appSettings.soundEffectStyle, appSettings.soundVolume, currentUser);
      }
      sendEvent({
        type: 'message:send',
        id: msgId,
        roomId: activeRoom,
        sender: currentUser,
        text: textToSend,
        imageUrl: gifUrl,
        effect: effectToUse,
        replyToId: replyingTo?.id,
      });
      return;
    }
    setSelectedImage(gifUrl);
    messageInputRef.current?.focus();
  };

  const isMessageUnreadForUser = (msg: ChatMessage, uid: UserId): boolean => {
    if (msg.sender === 'system') return false;
    const manualList = manualUnreadIdsByUser[uid] || [];
    if (manualList.includes(msg.id)) return true;
    if (msg.sender === uid) return false;
    if (!Array.isArray(msg.readBy)) return false;
    return !msg.readBy.includes(uid);
  };

  const canUserAccessRoom = (uid: UserId, roomId: RoomId): boolean => {
    if (
      roomId === 'group' ||
      roomId === SECRET_VENT_ROOM_ID ||
      roomId === NEVERLAND_ROOM_ID
    ) {
      return true;
    }
    const priv = PRIVATE_CHATS.find((p) => p.id === roomId);
    if (priv) return priv.participants.includes(uid);
    const grp = customGroups.find((g) => g.id === roomId);
    if (grp) return grp.members.includes(uid);
    return true;
  };

  const getRoomUnreadCount = (roomId: RoomId, uid: UserId | null = currentUser): number => {
    if (!uid) return 0;
    if (!canUserAccessRoom(uid, roomId)) return 0;
    return messages.filter(
      (m) => (m.roomId || 'group') === roomId && isMessageUnreadForUser(m, uid)
    ).length;
  };

  const getTotalUnreadForUser = (uid: UserId | null = currentUser): number => {
    if (!uid) return 0;
    return messages.filter((m) => {
      const rId = m.roomId || 'group';
      return canUserAccessRoom(uid, rId) && isMessageUnreadForUser(m, uid);
    }).length;
  };

  const handleMarkRoomAsRead = (roomId: RoomId, uid: UserId | null = currentUser) => {
    if (!uid) return;
    setManualUnreadIdsByUser((prev) => {
      const list = prev[uid] || [];
      if (list.length === 0) return prev;
      const roomMsgIds = new Set(
        messages.filter((m) => (m.roomId || 'group') === roomId).map((m) => m.id)
      );
      return {
        ...prev,
        [uid]: list.filter((id) => !roomMsgIds.has(id)),
      };
    });
    setMessages((prev) =>
      prev.map((m) => {
        if (m.sender === 'system' || (m.roomId || 'group') !== roomId) return m;
        const currentReadBy = Array.isArray(m.readBy) ? m.readBy : [m.sender];
        if (currentReadBy.includes(uid)) return m;
        return { ...m, readBy: [...currentReadBy, uid] };
      })
    );
    sendEvent({ type: 'message:mark-read', userId: uid, roomId });
  };

  const handleMarkAllAsRead = (uid: UserId | null = currentUser) => {
    if (!uid) return;
    setManualUnreadIdsByUser((prev) => ({ ...prev, [uid]: [] }));
    setMessages((prev) =>
      prev.map((m) => {
        if (m.sender === 'system') return m;
        const rId = m.roomId || 'group';
        if (!canUserAccessRoom(uid, rId)) return m;
        const currentReadBy = Array.isArray(m.readBy) ? m.readBy : [m.sender];
        if (currentReadBy.includes(uid)) return m;
        return { ...m, readBy: [...currentReadBy, uid] };
      })
    );
    sendEvent({ type: 'message:mark-read', userId: uid });
  };

  const handleMarkMessageAsUnread = (msg: ChatMessage) => {
    if (!currentUser) return;
    const targetRoom = msg.roomId || 'group';
    const msgIdx = messages.findIndex((m) => m.id === msg.id);
    const idsToUnread = messages
      .slice(msgIdx >= 0 ? msgIdx : 0)
      .filter((m) => (m.roomId || 'group') === targetRoom && m.sender !== 'system')
      .map((m) => m.id);

    setManualUnreadIdsByUser((prev) => {
      const existing = prev[currentUser] || [];
      return {
        ...prev,
        [currentUser]: Array.from(new Set([...existing, ...idsToUnread])),
      };
    });

    setMessages((prev) =>
      prev.map((m) => {
        if (!idsToUnread.includes(m.id)) return m;
        const currentReadBy = Array.isArray(m.readBy)
          ? m.readBy
          : m.sender !== 'system'
          ? [m.sender]
          : [];
        return {
          ...m,
          readBy: currentReadBy.filter((u) => u !== currentUser),
        };
      })
    );
    sendEvent({ type: 'message:mark-unread', userId: currentUser, messageId: msg.id });
  };

  const handleMarkRoomUnread = (roomId: RoomId) => {
    if (!currentUser) return;
    const roomChatMsgs = messages.filter(
      (m) => (m.roomId || 'group') === roomId && m.sender !== 'system'
    );
    const lastMsg = roomChatMsgs[roomChatMsgs.length - 1];
    if (!lastMsg) return;
    handleMarkMessageAsUnread(lastMsg);
  };

  const triggerBadgeUnlockToast = (uid: UserId, badgeId: BadgeId) => {
    const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
    if (!badgeDef) return;
    const toastKey = `${uid}-${badgeId}`;
    setBadgeToastQueue((prev) => {
      if (prev.some((item) => item.key === toastKey)) return prev;
      return [...prev, { key: toastKey, badge: badgeDef, userId: uid }];
    });
    window.setTimeout(() => {
      setBadgeToastQueue((prev) => prev.filter((item) => item.key !== toastKey));
    }, 6500);
  };

  const awardBadgeForUser = (uid: UserId, badgeId: BadgeId) => {
    const alreadyEarned = getEarnedBadges(uid).some((b) => b.id === badgeId);
    if (!alreadyEarned) {
      const currentTracked = prevEarnedBadgeIdsRef.current[uid] || [];
      if (!currentTracked.includes(badgeId)) {
        prevEarnedBadgeIdsRef.current[uid] = [...currentTracked, badgeId];
      }
      if (!currentUserRef.current || uid === currentUserRef.current) {
        triggerBadgeUnlockToast(uid, badgeId);
      }
    }
    setUnlockedBadges((prev) => {
      const currentList = prev[uid] || [];
      if (currentList.includes(badgeId)) return prev;
      return { ...prev, [uid]: [...currentList, badgeId] };
    });
    sendEvent({ type: 'badge:unlock', userId: uid, badgeId });
  };

  const handleRestartAllBadges = () => {
    prevEarnedBadgeIdsRef.current = {
      sofi: [],
      afiyyy: [],
      yufi: [],
      nomi: [],
    };
    setBadgeToastQueue([]);
    setUserMessageCounts({
      sofi: 0,
      afiyyy: 0,
      yufi: 0,
      nomi: 0,
    });
    setUnlockedBadges({
      sofi: [],
      afiyyy: [],
      yufi: [],
      nomi: [],
    });
    setUnlockedVentUsers([]);
    sendEvent({ type: 'badges:reset-all' });
  };

  const unlockBloomForUser = (uid: UserId) => {
    setBloomUnlockedUsers((prev) => {
      const next = prev.includes(uid) ? prev : [...prev, uid];
      saveLocalUnlockedBloomUsers(next);
      return next;
    });
    awardBadgeForUser(uid, 'japan_bloom');
    sendEvent({ type: 'bloom:unlock', userId: uid });
  };

  const hasCurrentUserUnlockedBloom = currentUser
    ? bloomUnlockedUsers.includes(currentUser)
    : false;

  const getUserMessageCount = (uid: UserId): number => {
    if (typeof userMessageCounts[uid] === 'number') {
      return userMessageCounts[uid]!;
    }
    return 0;
  };

  const getEarnedBadges = (uid: UserId): BadgeDefinition[] => {
    const count = getUserMessageCount(uid);
    const specialList = unlockedBadges[uid] || [];
    return BADGE_DEFINITIONS.filter((b) => {
      if (b.threshold !== undefined) {
        return count >= b.threshold;
      }
      if (b.id === 'among_us') {
        return specialList.includes('among_us') || unlockedVentUsers.includes(uid) || ventUsers.includes(uid);
      }
      if (b.id === 'i_agree') {
        return specialList.includes('i_agree') || Boolean(activeProposal?.approvals.includes(uid));
      }
      if (b.id === 'boo') {
        return specialList.includes('boo') || Boolean(activeProposal?.rejections.includes(uid));
      }
      if (b.id === 'japan_bloom') {
        return specialList.includes('japan_bloom');
      }
      if (b.id === 'celebrate_gm') {
        return specialList.includes('celebrate_gm');
      }
      if (b.id === 'rockstar_song') {
        return specialList.includes('rockstar_song');
      }
      return false;
    });
  };

  useEffect(() => {
    if (!hasHydratedBadgesRef.current) return;
    for (const uid of ALL_USER_IDS) {
      const currentEarned = getEarnedBadges(uid).map((b) => b.id);
      const prevEarned = prevEarnedBadgeIdsRef.current[uid] || [];
      const newlyEarned = currentEarned.filter((id) => !prevEarned.includes(id));
      if (newlyEarned.length > 0 && (!currentUser || uid === currentUser)) {
        newlyEarned.forEach((badgeId) => triggerBadgeUnlockToast(uid, badgeId));
      }
      prevEarnedBadgeIdsRef.current[uid] = currentEarned;
    }
  }, [userMessageCounts, unlockedBadges, unlockedVentUsers, ventUsers, activeProposal, currentUser]);

  useEffect(() => {
    if (websiteName && websiteName.trim()) {
      document.title = websiteName.trim();
    }
  }, [websiteName]);

  const wsRef = useRef<WebSocket | null>(null);
  const echoWsRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const moderationTimerRef = useRef<number | null>(null);
  const suggestionTimerRef = useRef<number | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const currentUserRef = useRef<UserId | null>(currentUser);

  const triggerPrivateChatSuggestion = (targetUser: UserId) => {
    setPrivateChatSuggestionTarget(targetUser);
    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }
    suggestionTimerRef.current = window.setTimeout(() => {
      setPrivateChatSuggestionTarget(null);
    }, 9000);
  };

  const openPrivateChatWithMember = (targetUser: UserId) => {
    if (!currentUser || targetUser === currentUser) return;
    const foundRoom = PRIVATE_CHATS.find(
      (c) => c.participants.includes(currentUser) && c.participants.includes(targetUser)
    );
    if (foundRoom) {
      handleSelectRoom(foundRoom.id);
      setPrivateChatSuggestionTarget(null);
    }
  };

  const triggerModerationWarning = (warningText?: string, offendingText?: string) => {
    const activeGroupLabel =
      customGroups.find((g) => g.id === activeRoom)?.name || groupName || 'GOATS';
    let resolvedWarning: string;
    if (offendingText && isSecretContent(offendingText)) {
      resolvedWarning = SECRET_SOUNDTRAP_WARNING;
    } else if (warningText === SECRET_SOUNDTRAP_WARNING) {
      resolvedWarning = SECRET_SOUNDTRAP_WARNING;
    } else if (warningText && warningText !== SOUNDTRAP_MODERATION_WARNING) {
      resolvedWarning = warningText;
    } else {
      resolvedWarning = formatModerationWarning(activeGroupLabel, offendingText);
    }
    setModerationWarning(resolvedWarning);
    if (moderationTimerRef.current) {
      clearTimeout(moderationTimerRef.current);
    }
    moderationTimerRef.current = window.setTimeout(() => {
      setModerationWarning(null);
    }, 8000);
  };

  const markIdentityRevealedPermanently = (userId: UserId) => {
    setRevealedIdentities((prev) => {
      const next = prev.includes(userId) ? prev : [...prev, userId];
      saveLocalRevealedIdentities(next);
      return next;
    });
    sendEvent({ type: 'identity:mark-revealed', userId });
  };

  // 30-second countdown timer when passwords are being shown for the first and only time
  useEffect(() => {
    if (revealSecondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setRevealSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [revealSecondsLeft]);

  useEffect(() => {
    currentUserRef.current = currentUser;
    if (currentUser) {
      sessionStorage.setItem(ACTIVE_USER_SESSION_KEY, currentUser);
      sendEvent({ type: 'user:identify', userId: currentUser });
    } else {
      sessionStorage.removeItem(ACTIVE_USER_SESSION_KEY);
    }
  }, [currentUser]);

  // Apply full server state
  const applyServerState = (state: ServerState) => {
    setGroupName(state.groupName);
    if (state.websiteName) {
      setWebsiteName(state.websiteName);
    }
    if (state.customDisplayNames && typeof state.customDisplayNames === 'object') {
      setCustomDisplayNames(state.customDisplayNames);
    }
    if (Array.isArray(state.customGroups)) {
      setCustomGroups(state.customGroups);
    }
    if (Array.isArray(state.ventUsers)) {
      setVentUsers(state.ventUsers);
    }
    if (Array.isArray(state.bloomUnlockedUsers)) {
      setBloomUnlockedUsers((prev) => {
        const merged = Array.from(
          new Set<UserId>([...prev, ...getLocalUnlockedBloomUsers(), ...state.bloomUnlockedUsers!])
        );
        saveLocalUnlockedBloomUsers(merged);
        return merged;
      });
    }
    if (state.userMessageCounts && typeof state.userMessageCounts === 'object') {
      setUserMessageCounts(state.userMessageCounts);
    }
    if (state.unlockedBadges && typeof state.unlockedBadges === 'object') {
      setUnlockedBadges(state.unlockedBadges);
    }
    if (Array.isArray(state.neverlandLyrics)) {
      setNeverlandLyrics(state.neverlandLyrics);
    }
    if (Array.isArray(state.neverlandPlans)) {
      setNeverlandPlans(state.neverlandPlans);
    }
    if (state.neverlandProfile && typeof state.neverlandProfile === 'object') {
      setNeverlandProfile({
        ...DEFAULT_NEVERLAND_PROFILE,
        ...state.neverlandProfile,
        memberRoles: {
          ...DEFAULT_NEVERLAND_PROFILE.memberRoles,
          ...(state.neverlandProfile.memberRoles || {}),
        },
      });
    }
    if (!hasHydratedBadgesRef.current) {
      const initMap: Partial<Record<UserId, BadgeId[]>> = {};
      for (const uid of ALL_USER_IDS) {
        const c = state.userMessageCounts?.[uid] || 0;
        const spec = state.unlockedBadges?.[uid] || [];
        const vList = state.ventUsers || [];
        initMap[uid] = BADGE_DEFINITIONS.filter((b) => {
          if (b.threshold !== undefined) return c >= b.threshold;
          if (b.id === 'among_us') return spec.includes('among_us') || vList.includes(uid);
          return spec.includes(b.id);
        }).map((b) => b.id);
      }
      prevEarnedBadgeIdsRef.current = initMap;
      hasHydratedBadgesRef.current = true;
    }
    const savedBloomIds = getLocalSavedBloomIds();
    const hydratedMessages = (state.messages || []).map((m) =>
      m.effect === 'bloom' || savedBloomIds.includes(m.id)
        ? { ...m, effect: 'bloom' as const }
        : m
    );
    setMessages((prev) => {
      const prevIds = new Set(prev.map((m) => m.id));
      const newlyArrivedFromOthers = hydratedMessages.filter(
        (m) =>
          !prevIds.has(m.id) &&
          m.sender !== 'system' &&
          m.sender !== currentUserRef.current
      );
      if (
        prev.length > 0 &&
        newlyArrivedFromOthers.length > 0 &&
        appSettingsRef.current.soundOnReceive
      ) {
        playUiSound(
          appSettingsRef.current.soundEffectStyle,
          appSettingsRef.current.soundVolume,
          currentUserRef.current
        );
      }
      return hydratedMessages;
    });
    setActiveProposal(state.activeProposal);
    setNameHistory(state.nameHistory || []);
    setOnlineUsers(state.onlineUsers || []);
    setTypingUsers(state.typingUsers || []);
    if (Array.isArray(state.revealedIdentities)) {
      setRevealedIdentities(state.revealedIdentities);
      saveLocalRevealedIdentities(state.revealedIdentities);
    }
    if (state.customPasswords && typeof state.customPasswords === 'object') {
      setCustomPasswords((prev) => {
        const merged = { ...prev, ...state.customPasswords };
        saveLocalCustomPasswords(merged);
        return merged;
      });
    }
  };

  // Send event via WebSocket + BroadcastChannel + HTTP POST fallback for guaranteed delivery
  const sendEvent = async (event: ClientEvent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(event));
      } catch {
        // continue to HTTP fallback
      }
    }
    if (
      event.type === 'message:send' &&
      echoWsRef.current &&
      echoWsRef.current.readyState === WebSocket.OPEN
    ) {
      try {
        echoWsRef.current.send(
          JSON.stringify({
            id: event.id,
            roomId: event.roomId || 'group',
            sender: event.sender,
            text: event.text,
            imageUrl: event.imageUrl,
            effect: event.effect,
            replyToId: event.replyToId,
          })
        );
      } catch {
        // ignore echo server errors
      }
    }
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(event);
      } catch {
        // ignore broadcast channel errors
      }
    }
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (res.ok) {
        const updatedState = (await res.json()) as ServerState;
        applyServerState(updatedState);
      } else {
        const errData = await res.json().catch(() => null);
        if (errData?.blocked && errData?.warning) {
          triggerModerationWarning(errData.warning);
        }
      }
    } catch (err) {
      console.error('Action fallback failed:', err);
    }
  };

  // Connect WebSocket, Public Echo Socket, BroadcastChannel, and live HTTP state sync
  useEffect(() => {
    let reconnectTimer: number | null = null;
    let echoReconnectTimer: number | null = null;
    let isMounted = true;

    const syncFromHttp = () => {
      fetch('/api/state')
        .then((res) => res.json())
        .then((data: ServerState) => {
          if (isMounted) applyServerState(data);
        })
        .catch(() => {});
    };

    syncFromHttp();
    const pollInterval = window.setInterval(syncFromHttp, 1500);

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('goats_live_chat_sync');
        broadcastChannelRef.current = bc;
        bc.onmessage = () => {
          if (isMounted) syncFromHttp();
        };
      } catch {
        // ignore if BroadcastChannel is unsupported
      }
    }

    const connectEchoSocket = () => {
      if (!isMounted) return;
      try {
        const echoSocket = new WebSocket('wss://echo.websocket.org/.well-known/apollo/v1');
        echoWsRef.current = echoSocket;
        echoSocket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data && data.text && data.sender && data.sender !== currentUserRef.current) {
              syncFromHttp();
            }
          } catch {
            // Ignore non-JSON test data from the public server
          }
        };
        echoSocket.onclose = () => {
          if (!isMounted) return;
          echoReconnectTimer = window.setTimeout(connectEchoSocket, 5000);
        };
      } catch {
        // ignore if blocked by network
      }
    };

    connectEchoSocket();

    const connectWs = () => {
      if (!isMounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
        if (currentUserRef.current) {
          ws.send(JSON.stringify({ type: 'user:identify', userId: currentUserRef.current }));
        }
      };

      ws.onmessage = (e) => {
        if (!isMounted) return;
        try {
          const event = JSON.parse(e.data) as ServerEvent;
          switch (event.type) {
            case 'state:init':
            case 'state:sync':
              applyServerState(event.state);
              break;
            case 'identity:revealed-updated':
              setRevealedIdentities(event.revealedIdentities);
              saveLocalRevealedIdentities(event.revealedIdentities);
              break;
            case 'account:passwords-updated':
              setCustomPasswords((prev) => {
                const merged = { ...prev, ...event.customPasswords };
                saveLocalCustomPasswords(merged);
                return merged;
              });
              break;
            case 'member:names-updated':
              setCustomDisplayNames(event.customDisplayNames || {});
              break;
            case 'website:name-updated':
              setWebsiteName(event.websiteName);
              break;
            case 'groups:updated':
              setCustomGroups(event.customGroups || []);
              break;
            case 'vent:updated':
              setVentUsers(event.ventUsers || []);
              if (event.cleared) {
                setMessages((prev) => prev.filter((m) => m.roomId !== SECRET_VENT_ROOM_ID));
                setVentClearedBanner(true);
              }
              break;
            case 'bloom:unlocked-updated':
              setBloomUnlockedUsers((prev) => {
                const merged = Array.from(
                  new Set<UserId>([
                    ...prev,
                    ...getLocalUnlockedBloomUsers(),
                    ...(event.bloomUnlockedUsers || ['nomi']),
                  ])
                );
                saveLocalUnlockedBloomUsers(merged);
                return merged;
              });
              break;
            case 'badges:counts-updated':
              setUserMessageCounts(event.userMessageCounts || {});
              break;
            case 'badges:unlocked-updated':
              setUnlockedBadges(event.unlockedBadges || {});
              break;
            case 'neverland:updated':
              setNeverlandLyrics(event.neverlandLyrics || []);
              setNeverlandPlans(event.neverlandPlans || []);
              if (event.neverlandProfile) {
                setNeverlandProfile({
                  ...DEFAULT_NEVERLAND_PROFILE,
                  ...event.neverlandProfile,
                  memberRoles: {
                    ...DEFAULT_NEVERLAND_PROFILE.memberRoles,
                    ...(event.neverlandProfile.memberRoles || {}),
                  },
                });
              }
              break;
            case 'message:created':
              if (event.message.effect === 'bloom') {
                saveLocalBloomId(event.message.id, true);
                setBloomReplayCounter((prev) => ({
                  ...prev,
                  [event.message.id]: (prev[event.message.id] || 0) + 1,
                }));
              }
              setMessages((prev) => {
                const existing = prev.find((m) => m.id === event.message.id);
                if (existing) {
                  const mergedEffect = existing.effect || event.message.effect;
                  return prev.map((m) =>
                    m.id === event.message.id
                      ? { ...event.message, effect: mergedEffect }
                      : m
                  );
                }
                if (
                  event.message.sender !== 'system' &&
                  event.message.sender !== currentUserRef.current &&
                  appSettingsRef.current.soundOnReceive
                ) {
                  playUiSound(
                    appSettingsRef.current.soundEffectStyle,
                    appSettingsRef.current.soundVolume,
                    currentUserRef.current
                  );
                }
                const savedIds = getLocalSavedBloomIds();
                const finalMsg =
                  event.message.effect === 'bloom' || savedIds.includes(event.message.id)
                    ? { ...event.message, effect: 'bloom' as const }
                    : event.message;
                return [...prev, finalMsg];
              });
              break;
            case 'message:updated':
              if (event.message.effect === 'bloom') {
                saveLocalBloomId(event.message.id, true);
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === event.message.id
                    ? { ...event.message, effect: event.message.effect || m.effect }
                    : m
                )
              );
              break;
            case 'message:deleted':
              setMessages((prev) => prev.filter((m) => m.id !== event.messageId));
              break;
            case 'messages:read-updated': {
              const savedBloomIds = getLocalSavedBloomIds();
              setMessages(
                (event.messages || []).map((m) =>
                  m.effect === 'bloom' || savedBloomIds.includes(m.id)
                    ? { ...m, effect: 'bloom' as const }
                    : m
                )
              );
              break;
            }
            case 'message:blocked':
              triggerModerationWarning(event.warning);
              break;
            case 'presence:updated':
              setOnlineUsers(event.onlineUsers);
              setTypingUsers(event.typingUsers);
              break;
            case 'name:updated':
              setGroupName(event.groupName);
              setActiveProposal(event.activeProposal);
              setNameHistory(event.nameHistory);
              break;
          }
        } catch (err) {
          console.error('Failed to parse server event:', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setIsConnected(false);
        reconnectTimer = window.setTimeout(connectWs, 2000);
      };
    };

    connectWs();

    return () => {
      isMounted = false;
      window.clearInterval(pollInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (echoReconnectTimer) clearTimeout(echoReconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (echoWsRef.current) {
        echoWsRef.current.close();
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Scroll to bottom when new messages arrive or room switches
  useEffect(() => {
    if (!appSettings.autoScrollOnNewMessage) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeRoom, appSettings.autoScrollOnNewMessage]);

  const handleSelectIdentity = (userId: UserId) => {
    if (activeRoom === SECRET_VENT_ROOM_ID && currentUser && currentUser !== userId) {
      sendEvent({ type: 'vent:leave', userId: currentUser });
    }
    if (!bloomUnlockedUsers.includes(userId)) {
      setIsBloomEffectArmed(false);
    }
    setShowEffectPrompt(false);
    if (appSettings.autoLockOnSwitch && currentUser && currentUser !== userId) {
      setUnlockedIdentities((prev) => prev.filter((id) => id !== currentUser));
    }
    setCurrentUser(userId);
    setAccountPasswordInput('');
    setAccountPasswordError(null);

    const alreadyRevealed =
      revealedIdentities.includes(userId) || getLocalRevealedIdentities().includes(userId);

    if (!alreadyRevealed) {
      // Show the single account password ONCE for 30 seconds, and immediately mark as revealed so it is never shown again
      setRevealSecondsLeft(PASSWORD_REVEAL_SECONDS);
      markIdentityRevealedPermanently(userId);
      setUnlockedIdentities((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    } else {
      setRevealSecondsLeft(0);
    }
  };

  const handleUnlockAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const expectedPassword = getEffectiveMember(currentUser).accountPassword;
    if (accountPasswordInput.trim() === expectedPassword) {
      setUnlockedIdentities((prev) =>
        prev.includes(currentUser) ? prev : [...prev, currentUser]
      );
      setAccountPasswordInput('');
      setAccountPasswordError(null);
    } else {
      setAccountPasswordError(
        `Incorrect password for ${currentUser.toUpperCase()}. Enter your account password or click Forgot Password.`
      );
    }
  };

  const handleCompleteRecoveryAndUnlock = (newPassword?: string) => {
    if (!currentUser) return;
    if (newPassword && newPassword.trim()) {
      const cleanPass = newPassword.trim();
      setCustomPasswords((prev) => {
        const next = { ...prev, [currentUser]: cleanPass };
        saveLocalCustomPasswords(next);
        return next;
      });
      sendEvent({
        type: 'account:update-password',
        userId: currentUser,
        newPassword: cleanPass,
      });
    }
    setUnlockedIdentities((prev) =>
      prev.includes(currentUser) ? prev : [...prev, currentUser]
    );
    setAccountPasswordInput('');
    setAccountPasswordError(null);
  };

  const handleSelectRoom = (roomId: RoomId) => {
    if (activeRoom === SECRET_VENT_ROOM_ID && roomId !== SECRET_VENT_ROOM_ID && currentUser) {
      sendEvent({ type: 'vent:leave', userId: currentUser });
    }
    if (
      roomId === SECRET_VENT_ROOM_ID &&
      currentUser &&
      unlockedVentUsers.includes(currentUser)
    ) {
      sendEvent({ type: 'vent:join', userId: currentUser });
    }
    setActiveRoom(roomId);
    setShowOnlyUnreadInRoom(false);
    setVentPasscodeError(null);
    setReplyingTo(null);
    setEditingMessageId(null);
    if (currentUser && (roomId !== SECRET_VENT_ROOM_ID || unlockedVentUsers.includes(currentUser))) {
      handleMarkRoomAsRead(roomId, currentUser);
    }
  };

  const handleUnlockSecretVent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (ventPasscodeInput.trim() === SECRET_VENT_PASSCODE) {
      setUnlockedVentUsers((prev) =>
        prev.includes(currentUser) ? prev : [...prev, currentUser]
      );
      awardBadgeForUser(currentUser, 'among_us');
      setVentPasscodeInput('');
      setVentPasscodeError(null);
      setVentClearedBanner(false);
      sendEvent({ type: 'vent:join', userId: currentUser });
    } else {
      setVentPasscodeError('Incorrect Secret Vent code! Hint: 4321');
    }
  };

  const handleLeaveSecretVent = () => {
    if (currentUser) {
      sendEvent({ type: 'vent:leave', userId: currentUser });
      setUnlockedVentUsers((prev) => prev.filter((u) => u !== currentUser));
    }
    setActiveRoom('group');
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsProcessingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setSelectedImage(compressedDataUrl);
    } catch (err) {
      console.error('Failed to process image:', err);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          setIsProcessingImage(true);
          try {
            const compressed = await compressImageFile(file);
            setSelectedImage(compressed);
          } catch (err) {
            console.error('Failed to paste image:', err);
          } finally {
            setIsProcessingImage(false);
          }
          break;
        }
      }
    }
  };

  const stopQuickRecordingInternal = (shouldAutoSend: boolean = false) => {
    autoSendAfterStopRef.current = shouldAutoSend;
    if (quickTimerRef.current) {
      window.clearInterval(quickTimerRef.current);
      quickTimerRef.current = null;
    }
    if (quickRecognitionRef.current) {
      try {
        quickRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      quickRecognitionRef.current = null;
    }
    if (quickRecorderRef.current && quickRecorderRef.current.state !== 'inactive') {
      try {
        quickRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (quickStreamRef.current) {
      quickStreamRef.current.getTracks().forEach((t) => t.stop());
      quickStreamRef.current = null;
    }
    setIsQuickRecording(false);
    setQuickRecordSeconds(0);
  };

  const handleToggleQuickRecord = async () => {
    if (isQuickRecording) {
      stopQuickRecordingInternal(false);
      return;
    }

    baseInputBeforeDictationRef.current = messageInput.trim();
    setLiveDictationPreview('');
    autoSendAfterStopRef.current = false;

    // 1. Start instant live browser speech recognition so words appear in the input box immediately as you talk!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let instantBrowserTranscript = '';

    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (event: any) => {
          let spoken = '';
          for (let i = 0; i < event.results.length; i++) {
            spoken += event.results[i][0].transcript + ' ';
          }
          const cleanSpoken = spoken.trim();
          instantBrowserTranscript = cleanSpoken;
          setLiveDictationPreview(cleanSpoken);
          if (cleanSpoken) {
            if (isContentRestricted(cleanSpoken)) {
              triggerModerationWarning(undefined, cleanSpoken);
            } else {
              const prefix = baseInputBeforeDictationRef.current;
              const combinedText = prefix ? `${prefix} ${cleanSpoken}` : cleanSpoken;
              setMessageInput(combinedText);
              if (activeRoom === 'group') {
                const mentioned = detectMentionedMembers(combinedText);
                const preferred = mentioned.find((m) => m !== currentUser) || mentioned[0];
                if (preferred) {
                  triggerPrivateChatSuggestion(preferred);
                }
              }
            }
          }
        };
        rec.start();
        quickRecognitionRef.current = rec;
      } catch {
        // ignore if browser SpeechRecognition is not supported
      }
    }

    // 2. Also record audio for high-accuracy Gemini 3.5 Transcribe
    try {
      quickChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      quickStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      quickRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          quickChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const shouldSendNow = autoSendAfterStopRef.current;
        const blob = new Blob(quickChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        // If we already got instant live words and user clicked "Send Now", send immediately without waiting!
        if (shouldSendNow && instantBrowserTranscript.trim()) {
          const prefix = baseInputBeforeDictationRef.current;
          const finalToSend = prefix
            ? `${prefix} ${instantBrowserTranscript.trim()}`
            : instantBrowserTranscript.trim();
          setMessageInput('');
          setLiveDictationPreview('');
          handleSendTextDirect(finalToSend);
          return;
        }

        if (blob.size === 0) return;

        // Otherwise refine or transcribe via Gemini 3.5 Transcribe
        setIsQuickTranscribing(true);
        try {
          const reader = new FileReader();
          const base64: string = await new Promise((resolve, reject) => {
            reader.onloadend = () =>
              typeof reader.result === 'string'
                ? resolve(reader.result)
                : reject(new Error('Read error'));
            reader.onerror = () => reject(new Error('Read error'));
            reader.readAsDataURL(blob);
          });

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: blob.type || 'audio/webm',
            }),
          });
          const data = (await res.json()) as { transcript?: string };
          const text = (data.transcript || instantBrowserTranscript || '').trim();
          if (text) {
            if (isContentRestricted(text)) {
              triggerModerationWarning(undefined, text);
              setMessageInput(baseInputBeforeDictationRef.current);
            } else {
              const prefix = baseInputBeforeDictationRef.current;
              const combined = prefix ? `${prefix} ${text}` : text;
              if (shouldSendNow) {
                setMessageInput('');
                handleSendTextDirect(combined);
              } else {
                setMessageInput(combined);
              }
            }
          }
        } catch (err) {
          console.error('Quick transcription failed:', err);
        } finally {
          setIsQuickTranscribing(false);
          setLiveDictationPreview('');
        }
      };

      recorder.start(250);
      setIsQuickRecording(true);
      setQuickRecordSeconds(0);
      quickTimerRef.current = window.setInterval(() => {
        setQuickRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      // If microphone stream isn't available, open the simple modal where they can also upload audio
      setShowTranscribeModal(true);
    }
  };

  const handleSendTextDirect = (rawText: string) => {
    if (!currentUser) return;
    const text = rawText.trim();
    if (!text) return;
    if (isContentRestricted(text)) {
      triggerModerationWarning(undefined, text);
      return;
    }
    if (activeRoom === 'group') {
      const mentioned = detectMentionedMembers(text);
      const preferred = mentioned.find((m) => m !== currentUser) || mentioned[0];
      if (preferred) {
        triggerPrivateChatSuggestion(preferred);
      }
    }
    setModerationWarning(null);
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const effectToUse: 'bloom' | undefined = isBloomEffectArmed ? 'bloom' : undefined;
    if (effectToUse === 'bloom') {
      unlockBloomForUser(currentUser);
      awardBadgeForUser(currentUser, 'japan_bloom');
      saveLocalBloomId(msgId, true);
      setBloomReplayCounter((prev) => ({ ...prev, [msgId]: (prev[msgId] || 0) + 1 }));
    }
    if (/meet\.google\.com/i.test(text)) {
      awardBadgeForUser(currentUser, 'celebrate_gm');
    }
    const optimisticMsg: ChatMessage = {
      id: msgId,
      roomId: activeRoom,
      sender: currentUser,
      text,
      effect: effectToUse,
      timestamp: new Date().toISOString(),
      type: 'chat',
      replyToId: replyingTo?.id,
      reactions: {},
    };
    setMessages((prev) => (prev.some((m) => m.id === msgId) ? prev : [...prev, optimisticMsg]));
    setReplyingTo(null);
    if (appSettings.soundOnSend) {
      playUiSound(appSettings.soundEffectStyle, appSettings.soundVolume, currentUser);
    }
    sendEvent({
      type: 'message:send',
      id: msgId,
      roomId: activeRoom,
      sender: currentUser,
      text,
      effect: effectToUse,
      replyToId: replyingTo?.id,
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || (!messageInput.trim() && !selectedImage)) return;

    const text = messageInput.trim();

    // Check content filter before sending
    if (isContentRestricted(text)) {
      triggerModerationWarning(undefined, text);
      setMessageInput('');
      if (currentUserRef.current) {
        sendEvent({ type: 'typing:set', userId: currentUserRef.current, isTyping: false });
      }
      return;
    }

    // If talking to a specific person in the group chat, show Noman's non-intrusive top banner while still letting the message send!
    if (activeRoom === 'group') {
      const mentioned = detectMentionedMembers(text);
      const preferred = mentioned.find((m) => m !== currentUser) || mentioned[0];
      if (preferred) {
        triggerPrivateChatSuggestion(preferred);
      }
    }

    setModerationWarning(null);
    setShowMentionMenu(false);
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const imageUrl = selectedImage || undefined;
    const replyId = replyingTo?.id;
    const effectToUse: 'bloom' | undefined = isBloomEffectArmed ? 'bloom' : undefined;
    if (effectToUse === 'bloom') {
      unlockBloomForUser(currentUser);
      awardBadgeForUser(currentUser, 'japan_bloom');
    }
    if (/meet\.google\.com/i.test(text)) {
      awardBadgeForUser(currentUser, 'celebrate_gm');
    }

    // Optimistic message insertion
    const optimisticMsg: ChatMessage = {
      id: msgId,
      roomId: activeRoom,
      sender: currentUser,
      text,
      imageUrl,
      effect: effectToUse,
      timestamp: new Date().toISOString(),
      type: 'chat',
      replyToId: replyId,
      reactions: {},
      readBy: [currentUser],
    };
    handleMarkRoomAsRead(activeRoom, currentUser);
    if (effectToUse === 'bloom') {
      saveLocalBloomId(msgId, true);
      setBloomReplayCounter((prev) => ({ ...prev, [msgId]: (prev[msgId] || 0) + 1 }));
    }
    setMessages((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      return [...prev, optimisticMsg];
    });

    setMessageInput('');
    setSelectedImage(null);
    setReplyingTo(null);
    setShowEffectPrompt(false);
    setUserMessageCounts((prev) => ({
      ...prev,
      [currentUser]: getUserMessageCount(currentUser) + 1,
    }));

    if (appSettings.soundOnSend) {
      playUiSound(appSettings.soundEffectStyle, appSettings.soundVolume, currentUser);
    }

    sendEvent({
      type: 'message:send',
      id: msgId,
      roomId: activeRoom,
      sender: currentUser,
      text,
      imageUrl,
      effect: effectToUse,
      replyToId: replyId,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageInput(val);

    // Check if the user typed something like "AHHHHHH" or "BOOOOOO" (a random long word)
    if (hasRandomLongWord(val)) {
      setShowEffectPrompt(true);
      if (currentUser && !bloomUnlockedUsers.includes(currentUser)) {
        unlockBloomForUser(currentUser);
      }
    } else if (!val.trim()) {
      setShowEffectPrompt(false);
    }

    // Check for '@' mention trigger at the end of the current word
    const atMatch = val.match(/(?:^|\s)@([a-zA-Z]*)$/);
    if (atMatch) {
      setShowMentionMenu(true);
      setMentionFilter(atMatch[1].toLowerCase());
    } else {
      setShowMentionMenu(false);
      setMentionFilter('');
    }

    // Detect if the user is addressing a specific member by name (afiy/afiyy/afiyyy/afiyah, nomanini/nomani/nomi/noman, sofi/sofia, yufi/yusuf/yufifi) in the group chat
    if (activeRoom === 'group' && currentUser) {
      const mentioned = detectMentionedMembers(val);
      const preferred = mentioned.find((m) => m !== currentUser) || mentioned[0];
      if (preferred) {
        triggerPrivateChatSuggestion(preferred);
      }
    }

    if (!currentUser || !appSettings.broadcastTypingIndicator) return;
    sendEvent({ type: 'typing:set', userId: currentUser, isTyping: val.trim().length > 0 });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      if (currentUserRef.current) {
        sendEvent({ type: 'typing:set', userId: currentUserRef.current, isTyping: false });
      }
    }, 2500);
  };

  const handleInsertMention = (targetId: UserId | 'all') => {
    const updated = messageInput.replace(/(?:^|\s)@([a-zA-Z]*)$/, (full) => {
      const leadingSpace = full.startsWith(' ') ? ' ' : '';
      return `${leadingSpace}@${targetId} `;
    });
    const nextValue =
      updated !== messageInput
        ? updated
        : messageInput
        ? `${messageInput.trim()} @${targetId} `
        : `@${targetId} `;
    setMessageInput(nextValue);
    setShowMentionMenu(false);
    setMentionFilter('');
    if (targetId === 'all') {
      setPrivateChatSuggestionTarget(null);
    } else if (activeRoom === 'group') {
      triggerPrivateChatSuggestion(targetId);
    }
    messageInputRef.current?.focus();
  };

  const handleToggleMentionPicker = () => {
    if (showMentionMenu) {
      setShowMentionMenu(false);
      return;
    }
    if (!messageInput.endsWith('@')) {
      setMessageInput((prev) => (prev && !prev.endsWith(' ') ? `${prev} @` : `${prev}@`));
    }
    setMentionFilter('');
    setShowMentionMenu(true);
    messageInputRef.current?.focus();
  };

  const handleProposeName = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRoom === NEVERLAND_ROOM_ID) {
      setShowRenameModal(false);
      return;
    }
    if (!currentUser || !proposedNameInput.trim()) return;
    const cleanName = proposedNameInput.trim();
    if (isContentRestricted(cleanName)) {
      triggerModerationWarning(undefined, cleanName);
      setProposedNameInput('');
      setShowRenameModal(false);
      return;
    }
    if (activeCustomGroup) {
      if (cleanName === activeCustomGroup.name) {
        setShowRenameModal(false);
        return;
      }
      sendEvent({
        type: 'group:rename',
        actorId: currentUser,
        groupId: activeCustomGroup.id,
        newName: cleanName,
      });
      setProposedNameInput('');
      setShowRenameModal(false);
      return;
    }
    if (cleanName === groupName) {
      setShowRenameModal(false);
      return;
    }
    sendEvent({
      type: 'name:propose',
      userId: currentUser,
      proposedName: cleanName,
    });
    setProposedNameInput('');
    setShowRenameModal(false);
  };

  const handleOpenMemberRename = (targetId: UserId) => {
    setRenameTargetUser(targetId);
    setMemberNewNameInput(getEffectiveMember(targetId).displayName);
    setShowMemberRenameModal(true);
  };

  const handleSaveMemberRename = (e: React.FormEvent) => {
    e.preventDefault();
    const actor = currentUser || renameTargetUser;
    const clean = memberNewNameInput.trim();
    if (!clean) return;
    if (isContentRestricted(clean)) {
      triggerModerationWarning(undefined, clean);
      return;
    }
    setCustomDisplayNames((prev) => ({ ...prev, [renameTargetUser]: clean }));
    sendEvent({
      type: 'member:rename',
      actorId: actor,
      targetUserId: renameTargetUser,
      newDisplayName: clean,
    });
    setShowMemberRenameModal(false);
  };

  const handleOpenWebsiteRename = () => {
    setWebsiteNameInput(websiteName);
    setShowWebsiteRenameModal(true);
  };

  const handleSaveWebsiteRename = (e: React.FormEvent) => {
    e.preventDefault();
    const actor = currentUser || 'nomi';
    const clean = websiteNameInput.trim();
    if (!clean) return;
    if (isContentRestricted(clean)) {
      triggerModerationWarning(undefined, clean);
      return;
    }
    setWebsiteName(clean);
    sendEvent({
      type: 'website:rename',
      actorId: actor,
      newWebsiteName: clean,
    });
    setShowWebsiteRenameModal(false);
  };

  const handleToggleNewGroupMember = (id: UserId) => {
    if (id === currentUser) return; // creator is always included
    setNewGroupMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreateCustomGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const clean = newGroupNameInput.trim();
    if (!clean) return;
    if (isContentRestricted(clean)) {
      triggerModerationWarning(undefined, clean);
      return;
    }
    const membersToInclude = Array.from(new Set([currentUser, ...newGroupMembers]));
    if (membersToInclude.length < 2) return;
    sendEvent({
      type: 'group:create',
      creatorId: currentUser,
      name: clean,
      members: membersToInclude,
    });
    setNewGroupNameInput('');
    setShowCreateGroupModal(false);
  };

  const handleVote = (userId: UserId, vote: 'approve' | 'reject') => {
    const badgeToAward: BadgeId = vote === 'approve' ? 'i_agree' : 'boo';
    awardBadgeForUser(userId, badgeToAward);
    sendEvent({
      type: 'name:vote',
      userId,
      vote,
    });
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    sendEvent({
      type: 'message:react',
      messageId,
      userId: currentUser,
      emoji,
    });
    setActiveReactionMsgId(null);
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleSaveEdit = (e: React.FormEvent, msg: ChatMessage) => {
    e.preventDefault();
    if (!currentUser) return;
    const cleanText = editingText.trim();
    if (!cleanText && !msg.imageUrl) return;

    if (isContentRestricted(cleanText)) {
      triggerModerationWarning(undefined, cleanText);
      return;
    }

    setModerationWarning(null);
    const nextEffect: 'bloom' | undefined =
      msg.effect === 'bloom' || isBloomEffectArmed ? 'bloom' : undefined;
    if (nextEffect === 'bloom') {
      saveLocalBloomId(msg.id, true);
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? { ...m, text: cleanText, effect: nextEffect, editedAt: new Date().toISOString() }
          : m
      )
    );
    setEditingMessageId(null);
    setEditingText('');

    sendEvent({
      type: 'message:edit',
      messageId: msg.id,
      userId: currentUser,
      newText: cleanText,
      effect: nextEffect,
    });
  };

  const handleToggleMessageBloomEffect = (msg: ChatMessage) => {
    if (!currentUser) return;
    const enableBloom = msg.effect !== 'bloom';
    saveLocalBloomId(msg.id, enableBloom);
    if (enableBloom) {
      awardBadgeForUser(currentUser, 'japan_bloom');
      setBloomReplayCounter((prev) => ({ ...prev, [msg.id]: (prev[msg.id] || 0) + 1 }));
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, effect: enableBloom ? 'bloom' : undefined } : m
      )
    );
    sendEvent({
      type: 'message:effect',
      messageId: msg.id,
      userId: currentUser,
      effect: enableBloom ? 'bloom' : null,
    });
  };

  const openSunoCreatePage = (lyricsToCopy?: string) => {
    if (lyricsToCopy && navigator.clipboard) {
      navigator.clipboard.writeText(lyricsToCopy).catch(() => {});
    }
    const a = document.createElement('a');
    a.href = SUNO_CREATE_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveNeverlandLyric = (status: 'draft' | 'published') => {
    if (!currentUser) return;
    const cleanTitle = lyricTitleInput.trim();
    const cleanBody = lyricBodyInput.trim().slice(0, NEVERLAND_LYRICS_MAX_LENGTH);
    if (!cleanTitle || !cleanBody) {
      setLyricError('Please enter both a song title and lyrics.');
      return;
    }
    if (cleanBody.length > NEVERLAND_LYRICS_MAX_LENGTH) {
      setLyricError(`Lyrics must be ${NEVERLAND_LYRICS_MAX_LENGTH} letters maximum.`);
      return;
    }
    if (isContentRestricted(cleanTitle) || isContentRestricted(cleanBody)) {
      setLyricError('No swear words in lyrics! Please remove any inappropriate words before drafting or publishing.');
      triggerModerationWarning(
        'No swear words allowed in NEVERLAND lyrics!',
        `${cleanTitle} ${cleanBody}`
      );
      return;
    }
    setLyricError(null);
    if (status === 'published') {
      awardBadgeForUser(currentUser, 'rockstar_song');
      openSunoCreatePage(cleanBody);
    }
    sendEvent({
      type: 'neverland:lyric-save',
      id: editingLyricId || undefined,
      userId: currentUser,
      title: cleanTitle,
      lyrics: cleanBody,
      status,
    });
    setEditingLyricId(null);
    setLyricTitleInput('');
    setLyricBodyInput('');
  };

  const handleEditNeverlandLyric = (entry: NeverlandLyricEntry) => {
    setEditingLyricId(entry.id);
    setLyricTitleInput(entry.title);
    setLyricBodyInput(entry.lyrics);
    setLyricError(null);
  };

  const handleDeleteNeverlandLyric = (id: string) => {
    if (!currentUser) return;
    sendEvent({ type: 'neverland:lyric-delete', id, userId: currentUser });
    if (editingLyricId === id) {
      setEditingLyricId(null);
      setLyricTitleInput('');
      setLyricBodyInput('');
    }
  };

  const handleAddNeverlandPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const cleanTitle = planTitleInput.trim();
    const cleanDetails = planDetailsInput.trim();
    if (!cleanTitle) {
      setPlanError('Please enter a plan title.');
      return;
    }
    if (isContentRestricted(cleanTitle) || isContentRestricted(cleanDetails)) {
      setPlanError('No swear words allowed in NEVERLAND plans!');
      triggerModerationWarning(undefined, `${cleanTitle} ${cleanDetails}`);
      return;
    }
    setPlanError(null);
    sendEvent({
      type: 'neverland:plan-add',
      userId: currentUser,
      title: cleanTitle,
      details: cleanDetails,
      assignedTo: planAssignedTo,
    });
    setPlanTitleInput('');
    setPlanDetailsInput('');
    setPlanAssignedTo('all');
  };

  const handleUpdateNeverlandPlanStatus = (
    id: string,
    status: 'planned' | 'in-progress' | 'done'
  ) => {
    if (!currentUser) return;
    sendEvent({ type: 'neverland:plan-status', id, userId: currentUser, status });
  };

  const handleDeleteNeverlandPlan = (id: string) => {
    if (!currentUser) return;
    sendEvent({ type: 'neverland:plan-delete', id, userId: currentUser });
  };

  const handleSaveNeverlandProfile = (e?: React.FormEvent, overridePatch?: Partial<NeverlandProfile>) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    const nextProfile: NeverlandProfile = {
      ...neverlandProfile,
      ...(overridePatch || {}),
      memberRoles: {
        ...neverlandProfile.memberRoles,
        ...(overridePatch?.memberRoles || {}),
      },
    };
    const combinedText = `${nextProfile.tagline} ${nextProfile.genre} ${Object.values(
      nextProfile.memberRoles
    ).join(' ')}`;
    if (isContentRestricted(combinedText)) {
      setNeverlandProfileError('No swear words allowed in the NEVERLAND profile!');
      triggerModerationWarning(undefined, combinedText);
      return;
    }
    setNeverlandProfileError(null);
    setNeverlandProfile(nextProfile);
    sendEvent({
      type: 'neverland:profile-update',
      userId: currentUser,
      profile: nextProfile,
    });
    setNeverlandProfileSavedMsg(true);
    window.setTimeout(() => setNeverlandProfileSavedMsg(false), 2500);
  };

  const handleNeverlandAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      if (neverlandAvatarFileRef.current) neverlandAvatarFileRef.current.value = '';
      return;
    }
    try {
      const compressed = await compressImageFile(file);
      handleSaveNeverlandProfile(undefined, { avatarUrl: compressed });
    } catch (err) {
      console.error('Failed to upload NEVERLAND avatar:', err);
    } finally {
      if (neverlandAvatarFileRef.current) neverlandAvatarFileRef.current.value = '';
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!currentUser) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    if (editingMessageId === messageId) {
      setEditingMessageId(null);
      setEditingText('');
    }
    if (replyingTo?.id === messageId) {
      setReplyingTo(null);
    }
    sendEvent({
      type: 'message:delete',
      messageId,
      userId: currentUser,
    });
  };

  // Filter messages for the currently selected room + search query + system events setting + unread filter
  const filteredMessages = useMemo(() => {
    const roomMsgs = messages.filter((m) => {
      if ((m.roomId || 'group') !== activeRoom) return false;
      if (!appSettings.showSystemEvents && m.sender === 'system') return false;
      if (showOnlyUnreadInRoom && currentUser && !isMessageUnreadForUser(m, currentUser)) {
        return false;
      }
      return true;
    });
    if (!searchQuery.trim()) return roomMsgs;
    const q = searchQuery.toLowerCase();
    return roomMsgs.filter(
      (m) => m.text.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q)
    );
  }, [
    messages,
    activeRoom,
    searchQuery,
    appSettings.showSystemEvents,
    showOnlyUnreadInRoom,
    currentUser,
    manualUnreadIdsByUser,
  ]);

  const firstUnreadMessageIdInRoom = useMemo(() => {
    if (!currentUser) return null;
    const first = filteredMessages.find((m) => isMessageUnreadForUser(m, currentUser));
    return first ? first.id : null;
  }, [filteredMessages, currentUser, manualUnreadIdsByUser]);

  const activeRoomUnreadCount = currentUser ? getRoomUnreadCount(activeRoom, currentUser) : 0;
  const totalUnreadCount = currentUser ? getTotalUnreadForUser(currentUser) : 0;

  const activePrivateConfig = useMemo(() => {
    if (activeRoom === 'group') return null;
    return PRIVATE_CHATS.find((c) => c.id === activeRoom) || null;
  }, [activeRoom]);

  const activeCustomGroup = useMemo(() => {
    if (activeRoom === 'group') return null;
    return customGroups.find((g) => g.id === activeRoom) || null;
  }, [activeRoom, customGroups]);

  const activePrivatePeer = useMemo(() => {
    if (!activePrivateConfig || !currentUser) return null;
    const peerId =
      activePrivateConfig.participants.find((p) => p !== currentUser) ||
      activePrivateConfig.participants[0];
    return getEffectiveMember(peerId);
  }, [
    activePrivateConfig,
    currentUser,
    appSettings.memberOverrides,
    customPasswords,
    customDisplayNames,
  ]);

  const isAccountUnlocked = currentUser ? unlockedIdentities.includes(currentUser) : false;

  const activeMember = currentUser ? getEffectiveMember(currentUser) : MEMBERS.sofi;
  const otherTyping = appSettings.showOthersTyping
    ? typingUsers.filter((u) => u !== currentUser)
    : [];

  const isEspresso = appSettings.themePreset === 'espresso-night';
  const isLatte = appSettings.themePreset === 'warm-latte';
  const isIvory = appSettings.themePreset === 'pure-ivory';
  const isSecretVentRoom = activeRoom === SECRET_VENT_ROOM_ID;
  const isDarkWallpaper =
    appSettings.chatBackground === 'dark-coral-waves' ||
    appSettings.chatBackground === 'bw-doodle-collage' ||
    appSettings.chatBackground === 'dark-emerald-clovers';
  const isAnyDarkMode = isEspresso || isSecretVentRoom || isDarkWallpaper;

  const selectedBackgroundOption = useMemo(
    () => CHAT_BACKGROUND_OPTIONS.find((b) => b.id === appSettings.chatBackground) || null,
    [appSettings.chatBackground]
  );

  const chatWallpaperStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (isSecretVentRoom) {
      return {
        backgroundImage:
          'radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.22) 0%, transparent 55%), radial-gradient(circle at 80% 30%, rgba(132, 204, 22, 0.16) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(6, 78, 59, 0.35) 0%, rgba(5, 10, 8, 0.98) 100%)',
      };
    }
    if (appSettings.chatBackground === 'custom' && appSettings.customBackgroundUrl) {
      return {
        backgroundImage: `url("${appSettings.customBackgroundUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    if (selectedBackgroundOption) {
      return {
        backgroundImage: `url("${selectedBackgroundOption.imageUrl}")`,
        backgroundSize: selectedBackgroundOption.backgroundSize,
        backgroundPosition: 'center',
        backgroundRepeat: selectedBackgroundOption.backgroundRepeat,
      };
    }
    return undefined;
  }, [
    isSecretVentRoom,
    appSettings.chatBackground,
    appSettings.customBackgroundUrl,
    selectedBackgroundOption,
  ]);

  const themeBgClass = isSecretVentRoom
    ? 'bg-[#070D0A] text-white dark-mode-white-text'
    : isEspresso
    ? 'bg-[#1C1613] text-white dark-mode-white-text'
    : isDarkWallpaper
    ? 'bg-[#121212] text-white dark-mode-white-text'
    : isLatte
    ? 'bg-[#E6D7C3] text-[#2C221A]'
    : isIvory
    ? 'bg-[#FCFBF9] text-[#2C2520]'
    : 'bg-[#F7F4EF] text-[#2C2520]';

  const themeSurfaceClass = isSecretVentRoom
    ? 'bg-[#0D1913] border-emerald-900/70 text-white'
    : isEspresso || isDarkWallpaper
    ? 'bg-[#28201B] border-[#3E322B] text-white'
    : isLatte
    ? 'bg-[#F3E9DC] border-[#D4C2AA] text-[#2C221A]'
    : isIvory
    ? 'bg-white border-[#EAE4D7] text-[#2C2520]'
    : 'bg-white border-[#E5DEC9] text-[#2C2520]';

  const themeSidebarClass = isSecretVentRoom
    ? 'bg-[#0A140F] border-emerald-900/60 text-white'
    : isEspresso || isDarkWallpaper
    ? 'bg-[#231C18] border-[#3E322B] text-white'
    : isLatte
    ? 'bg-[#DECBB3] border-[#CBB69B] text-[#2C221A]'
    : isIvory
    ? 'bg-[#F6F4EF] border-[#E5DEC9] text-[#2C2520]'
    : 'bg-[#EFECE6] border-[#E5DEC9] text-[#2C2520]';

  const themeSubBarClass = isSecretVentRoom
    ? 'bg-[#0B1711]/95 border-emerald-800/70 text-white'
    : isEspresso || isDarkWallpaper
    ? 'bg-[#241D18] border-[#3E322B] text-white'
    : isLatte
    ? 'bg-[#EDE0CE] border-[#D4C2AA] text-[#4A3B2F]'
    : 'bg-[#FAF8F5] border-[#E5DEC9] text-[#6E645B]';

  const themeOwnBubbleClass = isSecretVentRoom
    ? 'bg-emerald-950/90 text-white border-emerald-600/60 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
    : isEspresso || isDarkWallpaper
    ? 'bg-[#4A382B] text-white border-[#664E3D]'
    : isLatte
    ? 'bg-[#D5BFA3] text-[#261C15] border-[#BEA484]'
    : 'bg-[#E8DFD1] text-[#2C2520] border-[#D8CBB8]';

  const themeOtherBubbleClass = isSecretVentRoom
    ? 'bg-[#11221A]/90 text-white border-emerald-800/70 shadow-[0_0_14px_rgba(16,185,129,0.12)]'
    : isEspresso || isDarkWallpaper
    ? 'bg-[#2D241E] text-white border-[#42352C]'
    : isLatte
    ? 'bg-[#FAF4EC] text-[#2C221A] border-[#D8C7B0]'
    : 'bg-white text-[#2C2520] border-[#E5DEC9]';

  const themeInputClass = isSecretVentRoom
    ? 'bg-[#07100C] border-emerald-800/80 text-white placeholder-white/70'
    : isEspresso || isDarkWallpaper
    ? 'bg-[#1C1613] border-[#42352C] text-white placeholder-white/70'
    : isLatte
    ? 'bg-[#FAF4EC] border-[#CBB69B] text-[#2C221A] placeholder-[#847261]'
    : 'bg-[#F7F4EF] border-[#DFD7C8] text-[#2C2520] placeholder-[#9E9388]';

  const bubbleRadiusClass =
    appSettings.bubbleRadius === 'pill'
      ? 'rounded-3xl'
      : appSettings.bubbleRadius === 'sharp'
      ? 'rounded-md'
      : 'rounded-2xl';

  const fontScaleClass =
    appSettings.fontScale === 'lg'
      ? 'text-base'
      : appSettings.fontScale === 'sm'
      ? 'text-xs'
      : 'text-sm';

  const densitySpacingClass =
    appSettings.messageDensity === 'compact'
      ? 'space-y-2 py-3'
      : appSettings.messageDensity === 'spacious'
      ? 'space-y-6 py-8'
      : 'space-y-4 py-6';

  // Screen 1: Who are you? Identity Gate (sofi, afiyyy, yufi, or nomi)
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${themeBgClass} flex flex-col justify-between p-6 md:p-12 transition-colors duration-200`}>
        {/* Top Bar Contract */}
        <header className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DEC9]/60 pb-5">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight">
              {websiteName}
            </span>
            <button
              type="button"
              onClick={handleOpenWebsiteRename}
              title="Change website name"
              className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 ${themeSurfaceClass}`}
            >
              <Pencil className="w-3 h-3 text-[#8C6D46]" />
              <span>Edit Website Name</span>
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs opacity-80">
            <span className="hidden sm:inline">
              {isConnected ? 'Live WebSocket Server' : 'Connecting'}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="font-mono-tabular">{messages.length} messages</span>
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${themeSurfaceClass}`}
            >
              <Settings className="w-3.5 h-3.5 text-[#8C6D46]" />
              <span>Settings</span>
            </button>
          </div>
        </header>

        {/* Identity Selection Main Stage */}
        <main className="max-w-4xl w-full mx-auto my-auto py-12">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold text-[#B89058] mb-3 tracking-wide">
              Online Group Chat · One Account Password · One-Time 30s Reveal
            </p>
            <h1
              className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4"
              style={{ textWrap: 'balance' }}
            >
              Who are you messaging as today?
            </h1>
            <p className="text-base opacity-80 leading-relaxed">
              Select your identity to enter the <strong>{groupName}</strong> group chat. When you pick your account for the first time, your single <strong>4-digit account password</strong> will be shown <strong>once for 30 seconds</strong> so you can write it down or memorize it—then never again!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_USER_IDS.map((id) => {
              const member = getEffectiveMember(id);
              const isOnline = onlineUsers.includes(id);
              const hasVoted = activeProposal?.approvals.includes(id);
              const wasAlreadyRevealed = revealedIdentities.includes(id);
              const userUnreadCount = getTotalUnreadForUser(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectIdentity(id)}
                  className={`group text-left p-6 rounded-2xl border ${themeSurfaceClass} hover:border-[#8C6D46] shadow-xs transition-all duration-150 flex items-center justify-between focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C6D46]`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#DFD7C8]"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center font-display text-lg font-bold text-white shrink-0"
                        style={{ backgroundColor: member.accentColor }}
                      >
                        {member.avatarInitials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-xl font-bold group-hover:text-[#B89058] transition-colors">
                          {member.displayName}
                        </span>
                        {userUnreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold font-mono-tabular">
                            {userUnreadCount} unread
                          </span>
                        )}
                        <span className="text-xs opacity-50" aria-hidden="true">·</span>
                        <span className="text-xs opacity-75">
                          {isOnline ? 'Active now' : 'Tap to join'}
                        </span>
                      </div>
                      <p className="text-sm opacity-80 truncate mt-1">
                        {member.tagline}
                      </p>
                      <p className="text-xs text-[#B89058] mt-1.5 font-mono-tabular">
                        {wasAlreadyRevealed
                          ? 'Account password already shown once (locked)'
                          : 'First-time 30s password reveal ready'}
                      </p>
                      {activeProposal && (
                        <p className="text-xs text-[#B89058] font-medium mt-1">
                          {hasVoted
                            ? `Agreed to "${activeProposal.proposedName}"`
                            : `Vote needed for "${activeProposal.proposedName}"`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#8C6D46]/15 group-hover:bg-[#8C6D46] group-hover:text-white flex items-center justify-center transition-colors shrink-0 ml-3">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              );
            })}
          </div>
        </main>

        <footer className="max-w-5xl w-full mx-auto pt-6 border-t border-[#E5DEC9]/60 flex flex-wrap items-center justify-between gap-4 text-xs opacity-75">
          <span>Members: sofi · afiyyy · yufi · nomi</span>
          <span>Current Group Name: {groupName}</span>
        </footer>

        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={appSettings}
          onUpdateSettings={handleUpdateSettings}
          currentUser={currentUser}
          getEffectiveMember={getEffectiveMember}
          messages={messages}
          groupName={groupName}
          onLockCurrentAccount={() => {}}
          onResetLocalPasswordReveals={() => {
            setRevealedIdentities([]);
            saveLocalRevealedIdentities([]);
            sendEvent({ type: 'identity:reset-reveals' });
          }}
          onClearAllChatMessagesInRoom={() => {}}
        />

        {showWebsiteRenameModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="website-rename-gate-title"
            className="fixed inset-0 z-50 bg-[#2C2520]/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl text-[#2C2520]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="website-rename-gate-title"
                    className="font-display text-xl font-bold text-[#2C2520]"
                  >
                    Change Website Name
                  </h2>
                  <p className="text-xs text-[#6E645B] mt-1">
                    Updates the website header & browser tab title for everyone
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWebsiteRenameModal(false)}
                  aria-label="Close website rename modal"
                  className="p-1.5 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveWebsiteRename} className="space-y-4">
                <div>
                  <label
                    htmlFor="website-name-gate-input"
                    className="block text-xs font-semibold text-[#2C2520] mb-1.5"
                  >
                    New Website Name
                  </label>
                  <input
                    id="website-name-gate-input"
                    type="text"
                    value={websiteNameInput}
                    onChange={(e) => setWebsiteNameInput(e.target.value)}
                    placeholder="e.g. GOATS HQ, The BINA Chat, Sigma Hub..."
                    maxLength={48}
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] text-sm text-[#2C2520] placeholder-[#9E9388] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWebsiteRenameModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!websiteNameInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] disabled:opacity-40 text-white text-xs font-semibold"
                  >
                    Save Website Name
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Screen 1.5: Account Password Verification Gate (shown when an identity has already had its one-time 30s reveal and needs to enter their single account password)
  if (!isAccountUnlocked && revealSecondsLeft === 0) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] text-[#2C2520] flex flex-col justify-between p-6 md:p-12">
        <header className="max-w-5xl w-full mx-auto flex items-center justify-between border-b border-[#E5DEC9] pb-5">
          <span className="font-display text-xl font-bold tracking-tight text-[#2C2520]">
            {groupName}
          </span>
          <button
            type="button"
            onClick={() => setCurrentUser(null)}
            className="px-3 py-1.5 rounded-lg bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
          >
            Back to Accounts
          </button>
        </header>

        <main className="max-w-md w-full mx-auto my-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#E5DEC9] rounded-2xl p-6 space-y-5 shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              {activeMember.avatarUrl ? (
                <img
                  src={activeMember.avatarUrl}
                  alt={activeMember.displayName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#DFD7C8]"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-display text-base font-bold text-white shrink-0"
                  style={{ backgroundColor: activeMember.accentColor }}
                >
                  {activeMember.avatarInitials}
                </div>
              )}
              <div>
                <h1 className="font-display text-xl font-bold text-[#2C2520]">
                  Unlock {activeMember.displayName.toUpperCase()} Account
                </h1>
                <p className="text-xs text-[#6E645B] mt-0.5">
                  Your one-time 30s password reveal has already been used
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] flex items-start gap-2.5 text-xs text-[#6E645B]">
              <EyeOff className="w-4 h-4 text-[#8C6D46] shrink-0 mt-0.5" />
              <div>
                Enter the single 4-digit account password for <strong className="text-[#2C2520]">{activeMember.displayName.toUpperCase()}</strong> that you wrote down or memorized during your 30-second one-time reveal.
              </div>
            </div>

            <form onSubmit={handleUnlockAccount} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="account-password-input"
                    className="block text-xs font-semibold text-[#2C2520]"
                  >
                    {activeMember.displayName.toUpperCase()} Account Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-xs font-semibold text-[#8C6D46] hover:text-[#2C2520] underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  id="account-password-input"
                  type="password"
                  value={accountPasswordInput}
                  onChange={(e) => {
                    setAccountPasswordInput(e.target.value);
                    setAccountPasswordError(null);
                  }}
                  placeholder="Enter your password..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] font-mono-tabular text-sm text-[#2C2520] placeholder-[#9E9388] focus:outline-none"
                />
                {accountPasswordError && (
                  <p className="text-xs text-rose-700 font-medium mt-1.5">
                    {accountPasswordError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentUser(null)}
                    className="px-3.5 py-2.5 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
                  >
                    Switch Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] text-xs font-semibold text-[#8C6D46]"
                  >
                    Forgot Password
                  </button>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock {activeMember.displayName}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </main>

        <footer className="max-w-5xl w-full mx-auto pt-6 border-t border-[#E5DEC9] flex flex-wrap items-center justify-between gap-4 text-xs text-[#786E65]">
          <span>One Password Per Account · One-Time 30s Reveal</span>
          <span>Current Group Name: {groupName}</span>
        </footer>

        <ForgotPasswordModal
          isOpen={showForgotPasswordModal}
          onClose={() => setShowForgotPasswordModal(false)}
          userId={currentUser}
          member={activeMember}
          currentAccountPassword={activeMember.accountPassword}
          onCompleteRecoveryAndUnlock={handleCompleteRecoveryAndUnlock}
        />
      </div>
    );
  }

  return (
    <div className={`h-screen ${themeBgClass} flex flex-col overflow-hidden transition-colors duration-200`}>
      {/* Friday after 3:00 PM Banner for Nomi */}
      {currentUser === 'nomi' && (isFridayGmTime || previewFridayGmBanner) && (
        <div
          role="region"
          aria-label="Friday Google Meet Link for Noman"
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xs sm:text-sm font-bold flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 shadow-xs"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span>🎉</span>
            <span>
              Noman! Noman! Here is a GM link:{' '}
              <a
                href={NOMI_FRIDAY_GM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => awardBadgeForUser('nomi', 'celebrate_gm')}
                className="underline decoration-2 underline-offset-2 font-mono-tabular bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md text-white transition-colors"
              >
                {NOMI_FRIDAY_GM_URL}
              </a>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={NOMI_FRIDAY_GM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => awardBadgeForUser('nomi', 'celebrate_gm')}
              className="px-3 py-1 rounded-lg bg-white text-[#2C2520] hover:bg-amber-50 text-xs font-bold transition-colors whitespace-nowrap"
            >
              Join Google Meet
            </a>
            {previewFridayGmBanner && !isFridayGmTime && (
              <button
                type="button"
                onClick={() => setPreviewFridayGmBanner(false)}
                aria-label="Hide Friday GM preview"
                className="p-1 rounded-md text-white/90 hover:text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Bar Contract: Zone 1 (Website/Group Name) — Zone 2 (Nav/Persona Switcher) — Zone 3 (Primary Actions) */}
      <header className={`h-16 px-4 lg:px-6 border-b flex items-center justify-between shrink-0 z-20 transition-colors duration-200 ${themeSurfaceClass}`}>
        {/* Zone 1: Website Name + Group Name */}
        <div className="flex items-center gap-2 min-w-0">
          <a
            href="#chat"
            onClick={(e) => {
              e.preventDefault();
              handleSelectRoom('group');
            }}
            className="font-display text-lg sm:text-xl font-bold tracking-tight truncate max-w-[180px] sm:max-w-xs"
            title={`${websiteName} — ${groupName}`}
          >
            {websiteName}
          </a>
          <button
            type="button"
            onClick={handleOpenWebsiteRename}
            aria-label="Change Website Name"
            title="Change Website Name"
            className="px-2 py-1 rounded-lg bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] text-[11px] font-semibold text-[#5C5349] hover:text-[#2C2520] flex items-center gap-1 shrink-0"
          >
            <Pencil className="w-3 h-3 text-[#8C6D46]" />
            <span className="hidden xl:inline">Website Name</span>
          </button>
        </div>

        {/* Zone 2: Quick identity switcher links so switching between sofi, afiyyy, yufi, nomi is effortless */}
        <nav
          aria-label="Active Identity Switcher"
          className="hidden md:flex items-center gap-1 bg-[#F3EFE6] p-1 rounded-xl border border-[#E5DEC9]"
        >
          {ALL_USER_IDS.map((id) => {
            const isSelected = currentUser === id;
            const memberObj = getEffectiveMember(id);
            const idUnread = getTotalUnreadForUser(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectIdentity(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-[#2C2520] shadow-xs border border-[#E5DEC9]'
                    : 'text-[#6E645B] hover:text-[#2C2520]'
                }`}
              >
                <span>{memberObj.displayName}</span>
                {idUnread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none">
                    {idUnread}
                  </span>
                )}
                {activeProposal && (
                  <span className="ml-0.5 text-[11px] font-mono-tabular text-[#8C6D46]">
                    {activeProposal.approvals.includes(id) ? '✓' : '·'}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions including Create Group, Rename Member, Rename Group, Settings */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNewGroupNameInput('');
              setNewGroupMembers(ALL_USER_IDS);
              setShowCreateGroupModal(true);
            }}
            className="px-3 py-2 text-xs font-semibold text-[#2C2520] bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
          >
            <Plus className="w-3.5 h-3.5 text-[#8C6D46]" />
            <span className="hidden sm:inline">New Group</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenMemberRename(currentUser)}
            className="px-3 py-2 text-xs font-semibold text-[#2C2520] bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
          >
            <UserPen className="w-3.5 h-3.5 text-[#8C6D46]" />
            <span className="hidden sm:inline">Change Names</span>
          </button>

          {currentUser === 'nomi' && !isFridayGmTime && (
            <button
              type="button"
              onClick={() => {
                setPreviewFridayGmBanner((prev) => !prev);
                awardBadgeForUser('nomi', 'celebrate_gm');
              }}
              title="Toggle Friday after 3:00 PM Google Meet banner for Noman"
              className={`px-3 py-2 text-xs font-semibold border rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px] ${
                previewFridayGmBanner
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'text-[#2C2520] bg-[#F7F4EF] hover:bg-[#EFECE6] border-[#DFD7C8]'
              }`}
            >
              <span>🎉</span>
              <span className="hidden xl:inline">Fri 3PM GM</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowUnreadModal(true)}
            title="View Unread Messages"
            className={`px-3 py-2 text-xs font-semibold border rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px] ${
              totalUnreadCount > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-2xs'
                : 'text-[#2C2520] bg-[#F7F4EF] hover:bg-[#EFECE6] border-[#DFD7C8]'
            }`}
          >
            <Mail className={`w-3.5 h-3.5 ${totalUnreadCount > 0 ? 'text-white' : 'text-[#8C6D46]'}`} />
            <span className="hidden sm:inline">Unread</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono-tabular leading-none ${
                totalUnreadCount > 0
                  ? 'bg-white text-rose-700'
                  : 'bg-[#E5DEC9] text-[#5C5349]'
              }`}
            >
              {totalUnreadCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowBadgesModal(true)}
            className="px-3 py-2 text-xs font-semibold text-[#2C2520] bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
          >
            <Award className="w-3.5 h-3.5 text-[#8C6D46]" />
            <span className="hidden sm:inline">Badges</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBackgroundsModal(true)}
            className="px-3 py-2 text-xs font-semibold text-[#2C2520] bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
          >
            <Palette className="w-3.5 h-3.5 text-[#8C6D46]" />
            <span className="hidden md:inline">Backgrounds</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            aria-label="Open settings"
            className="px-3 py-2 text-xs font-semibold text-[#2C2520] bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
          >
            <Settings className="w-3.5 h-3.5 text-[#8C6D46]" />
            <span className="hidden lg:inline">Settings</span>
          </button>

          {activeRoom === NEVERLAND_ROOM_ID ? (
            <button
              type="button"
              onClick={() => setNeverlandTab('profile')}
              title="Edit NEVERLAND Profile (Avatar, Bio, Genre, Theme & Roles — Name is Locked)"
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-900 hover:bg-indigo-800 text-white border border-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">NEVERLAND Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setProposedNameInput(
                  activeCustomGroup
                    ? activeCustomGroup.name
                    : activeProposal
                    ? activeProposal.proposedName
                    : ''
                );
                setShowRenameModal(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold bg-[#2C2520] hover:bg-[#3F362F] text-[#F7F4EF] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rename Group</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (activeRoom === SECRET_VENT_ROOM_ID && currentUser) {
                sendEvent({ type: 'vent:leave', userId: currentUser });
              }
              setCurrentUser(null);
            }}
            aria-label="Switch user screen"
            className="px-3 py-2 text-xs font-semibold text-[#5C5349] hover:text-[#2C2520] bg-[#EFECE6] hover:bg-[#E5DFD3] border border-[#E5DEC9] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch ({activeMember.displayName})</span>
          </button>
        </div>
      </header>

      {/* Mobile Identity & Room Bar (visible on small viewports) */}
      <div className="lg:hidden px-4 py-2 bg-[#EFECE6] border-b border-[#E5DEC9] flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs text-[#6E645B] whitespace-nowrap">Messaging as:</span>
          <div className="flex items-center gap-1">
            {ALL_USER_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectIdentity(id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                  currentUser === id
                    ? 'bg-[#2C2520] text-white'
                    : 'text-[#6E645B] hover:text-[#2C2520]'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => handleSelectRoom('group')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
              activeRoom === 'group'
                ? 'bg-white text-[#2C2520] border border-[#DFD7C8]'
                : 'text-[#6E645B]'
            }`}
          >
            <span>{groupName} (Main)</span>
            {getRoomUnreadCount('group') > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none">
                {getRoomUnreadCount('group')}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSelectRoom(NEVERLAND_ROOM_ID)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
              activeRoom === NEVERLAND_ROOM_ID
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-900 bg-indigo-100/80'
            }`}
          >
            <Music className="w-3 h-3" />
            <span>{NEVERLAND_GROUP_NAME}</span>
            {getRoomUnreadCount(NEVERLAND_ROOM_ID) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none">
                {getRoomUnreadCount(NEVERLAND_ROOM_ID)}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSelectRoom(SECRET_VENT_ROOM_ID)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
              activeRoom === SECRET_VENT_ROOM_ID
                ? 'bg-[#2C2520] text-[#F7F4EF]'
                : 'text-rose-800 bg-rose-100/70'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Secret Vent</span>
            {getRoomUnreadCount(SECRET_VENT_ROOM_ID) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none">
                {getRoomUnreadCount(SECRET_VENT_ROOM_ID)}
              </span>
            )}
          </button>
          {customGroups
            .filter((g) => g.members.includes(currentUser))
            .map((grp) => {
              const grpUnread = getRoomUnreadCount(grp.id);
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => handleSelectRoom(grp.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
                    activeRoom === grp.id
                      ? 'bg-white text-[#2C2520] border border-[#DFD7C8]'
                      : 'text-[#6E645B]'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>{grp.name}</span>
                  {grpUnread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none">
                      {grpUnread}
                    </span>
                  )}
                </button>
              );
            })}
          {PRIVATE_CHATS.filter((pc) => pc.participants.includes(currentUser)).map((pc) => {
            const peerId = pc.participants.find((p) => p !== currentUser) || pc.participants[0];
            const peerMember = getEffectiveMember(peerId);
            const pcUnread = getRoomUnreadCount(pc.id);
            return (
              <button
                key={pc.id}
                type="button"
                onClick={() => handleSelectRoom(pc.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
                  activeRoom === pc.id
                    ? 'bg-white text-[#2C2520] border border-[#DFD7C8]'
                    : 'text-[#6E645B]'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>{peerMember.displayName}</span>
                {pcUnread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none">
                    {pcUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Theme-Aware Surface */}
        <aside className={`hidden lg:flex w-80 border-r flex-col justify-between p-5 overflow-y-auto shrink-0 transition-colors duration-200 ${themeSidebarClass}`}>
          <div className="space-y-6">
            {/* Current Persona Summary + One-Time Password Status Card */}
            <div className="pb-5 border-b border-[#E2DACB] space-y-3">
              <div className="text-xs text-[#786E65]">Signed in as</div>
              <div className="flex items-center gap-3">
                {activeMember.avatarUrl ? (
                  <img
                    src={activeMember.avatarUrl}
                    alt={activeMember.displayName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#DFD7C8]"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white shrink-0"
                    style={{ backgroundColor: activeMember.accentColor }}
                  >
                    {activeMember.avatarInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="font-display font-bold text-[#2C2520] text-base truncate">
                      {activeMember.displayName}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenMemberRename(currentUser)}
                      title="Change your name or someone else's name"
                      className="px-2 py-1 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#DFD7C8] text-[11px] font-semibold text-[#8C6D46] hover:text-[#2C2520] flex items-center gap-1 shrink-0"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Rename</span>
                    </button>
                  </div>
                  <div className="text-xs text-[#6E645B] truncate">
                    {activeMember.tagline} ({currentUser}) · {getUserMessageCount(currentUser)} msgs
                  </div>
                  {getEarnedBadges(currentUser).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {getEarnedBadges(currentUser).map((badge) => (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => setShowBadgesModal(true)}
                          title={`${badge.title} — ${badge.description}`}
                          className="px-1.5 py-0.5 rounded-md bg-amber-100/90 border border-amber-300 text-[10px] font-semibold text-amber-900 flex items-center gap-1"
                        >
                          <span>{badge.iconEmoji}</span>
                          <span className="truncate max-w-[110px]">{badge.title.split(':')[0]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* One-Time 30-Second Account Password Status in Sidebar */}
              {revealSecondsLeft > 0 ? (
                <div className="p-3 rounded-xl bg-white border border-[#C5B49A] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#2C2520]">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#8C6D46]" />
                      <span>Write Down Now!</span>
                    </span>
                    <span className="font-mono-tabular text-rose-700">
                      {revealSecondsLeft}s left
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#5C5349] pt-1">
                    <span className="font-semibold text-[#2C2520]">
                      {activeMember.displayName.toUpperCase()} Password:
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#F7F4EF] border border-[#D5C7B2] font-mono-tabular font-bold text-[#2C2520]">
                      {activeMember.accountPassword}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] space-y-2">
                  <div className="flex items-start gap-2.5">
                    <EyeOff className="w-4 h-4 text-[#8C6D46] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#6E645B] leading-snug">
                      <span className="font-semibold text-[#2C2520] block mb-0.5">
                        Account Password Hidden Forever
                      </span>
                      Your 30-second one-time reveal for <strong>{currentUser.toUpperCase()}</strong> has expired.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#DFD7C8] text-xs font-semibold text-[#8C6D46] hover:text-[#2C2520] transition-colors"
                  >
                    Forgot Password? (Gmail / Outlook)
                  </button>
                </div>
              )}
            </div>

            {/* Chat Rooms Navigation: Main Group Chat + Custom Group Chats + 1-on-1 Chats */}
            <div className="pb-5 border-b border-[#E2DACB] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[#2C2520] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#786E65]" />
                  <span>Group & Private Chats</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewGroupNameInput('');
                    setNewGroupMembers(ALL_USER_IDS);
                    setShowCreateGroupModal(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#DFD7C8] text-[11px] font-semibold text-[#8C6D46] hover:text-[#2C2520] flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Make Group</span>
                </button>
              </div>

              {/* Main Group Chat Button */}
              <button
                type="button"
                onClick={() => handleSelectRoom('group')}
                className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  activeRoom === 'group'
                    ? 'bg-white border border-[#DFD7C8] shadow-2xs'
                    : 'hover:bg-white/60 border border-transparent'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#2C2520] truncate flex items-center gap-1.5">
                    <span className="truncate">{groupName} (Everyone)</span>
                    {getRoomUnreadCount('group') > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none shrink-0">
                        {getRoomUnreadCount('group')} unread
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#786E65] truncate">
                    {ALL_USER_IDS.map((u) => getEffectiveMember(u).displayName).join(' · ')}
                  </div>
                </div>
                <span className="text-xs font-mono-tabular text-[#8C6D46]">Main</span>
              </button>

              {/* NEVERLAND Musical Group (Everyone · Lyrics Draft & Publish · Plan Section · Name Locked) */}
              <button
                type="button"
                onClick={() => handleSelectRoom(NEVERLAND_ROOM_ID)}
                className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  activeRoom === NEVERLAND_ROOM_ID
                    ? 'bg-indigo-900 text-white border border-indigo-700 shadow-xs'
                    : 'bg-indigo-50/90 hover:bg-indigo-100/80 border border-indigo-200 text-[#2C2520]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {neverlandProfile.avatarUrl ? (
                    <img
                      src={neverlandProfile.avatarUrl}
                      alt="NEVERLAND"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-indigo-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center text-sm shrink-0">
                      {neverlandProfile.avatarEmoji || '🎵'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate flex items-center gap-1.5">
                      <span>{NEVERLAND_GROUP_NAME}</span>
                      <span
                        title="Cannot change NEVERLAND group name"
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          activeRoom === NEVERLAND_ROOM_ID
                            ? 'bg-white/15 text-amber-200'
                            : 'bg-indigo-200/80 text-indigo-900'
                        }`}
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span>Locked</span>
                      </span>
                      {getRoomUnreadCount(NEVERLAND_ROOM_ID) > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none shrink-0">
                          {getRoomUnreadCount(NEVERLAND_ROOM_ID)}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        activeRoom === NEVERLAND_ROOM_ID ? 'text-indigo-100' : 'text-[#5C5349]'
                      }`}
                    >
                      {neverlandProfile.genre || 'Musical Group · Lyrics & Plan'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-mono-tabular px-1.5 py-0.5 rounded-md shrink-0 ml-2 ${
                    activeRoom === NEVERLAND_ROOM_ID
                      ? 'bg-white/15 text-amber-200'
                      : 'bg-indigo-200/70 text-indigo-900 font-semibold'
                  }`}
                >
                  {neverlandProfile.avatarEmoji || '🎵'} 4/4
                </span>
              </button>

              {/* Secret Vent Group Chat (Everyone has it · Code 4321 · Auto-deletes when everyone leaves) */}
              <button
                type="button"
                onClick={() => handleSelectRoom(SECRET_VENT_ROOM_ID)}
                className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  activeRoom === SECRET_VENT_ROOM_ID
                    ? 'bg-[#2C2520] text-[#F7F4EF] border border-[#2C2520] shadow-xs'
                    : 'bg-rose-50/80 hover:bg-rose-100/70 border border-rose-200/80 text-[#2C2520]'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                    <Flame
                      className={`w-4 h-4 shrink-0 ${
                        activeRoom === SECRET_VENT_ROOM_ID ? 'text-amber-400' : 'text-rose-700'
                      }`}
                    />
                    <span>Secret Vent</span>
                    <Lock className="w-3 h-3 opacity-75 shrink-0" />
                    {getRoomUnreadCount(SECRET_VENT_ROOM_ID) > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none shrink-0">
                        {getRoomUnreadCount(SECRET_VENT_ROOM_ID)}
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[11px] truncate mt-0.5 ${
                      activeRoom === SECRET_VENT_ROOM_ID ? 'text-[#D8CBB8]' : 'text-[#786E65]'
                    }`}
                  >
                    {ventUsers.length > 0
                      ? `In room: ${ventUsers.map((u) => getEffectiveMember(u).displayName).join(', ')}`
                      : 'Code locked · Auto-wipes when empty'}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-mono-tabular px-1.5 py-0.5 rounded-md shrink-0 ml-2 ${
                    activeRoom === SECRET_VENT_ROOM_ID
                      ? 'bg-white/15 text-amber-300'
                      : 'bg-rose-200/70 text-rose-900 font-semibold'
                  }`}
                >
                  {ventUsers.length}/4
                </span>
              </button>

              {/* Custom Group Chats List */}
              {customGroups.filter((g) => g.members.includes(currentUser)).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] text-[#786E65] px-1">
                    Custom Group Chats
                  </div>
                  {customGroups
                    .filter((g) => g.members.includes(currentUser))
                    .map((grp) => {
                      const isSelected = activeRoom === grp.id;
                      const grpUnread = getRoomUnreadCount(grp.id);
                      return (
                        <button
                          key={grp.id}
                          type="button"
                          onClick={() => handleSelectRoom(grp.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-white border border-[#DFD7C8] shadow-2xs'
                              : 'hover:bg-white/60 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#2C2520] truncate flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-[#8C6D46] shrink-0" />
                              <span className="truncate">{grp.name}</span>
                              {grpUnread > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none shrink-0">
                                  {grpUnread}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#786E65] truncate mt-0.5">
                              {grp.members.map((u) => getEffectiveMember(u).displayName).join(', ')}
                            </div>
                          </div>
                          <span className="text-[11px] font-mono-tabular text-[#8C6D46] shrink-0 ml-2">
                            {grp.members.length}p
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}

              {/* Private 1-on-1 Chats List */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-[#786E65] px-1">
                  Private 1-on-1 Chats
                </div>
                {PRIVATE_CHATS.filter((c) => c.participants.includes(currentUser)).map((chat) => {
                  const isSelected = activeRoom === chat.id;
                  const peerId =
                    chat.participants.find((p) => p !== currentUser) || chat.participants[0];
                  const peerMember = getEffectiveMember(peerId);
                  const chatUnread = getRoomUnreadCount(chat.id);

                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => handleSelectRoom(chat.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-white border border-[#DFD7C8] shadow-2xs'
                          : 'hover:bg-white/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {peerMember.avatarUrl ? (
                          <img
                            src={peerMember.avatarUrl}
                            alt={peerMember.displayName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-lg object-cover shrink-0 border border-[#DFD7C8]"
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-display text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: peerMember.accentColor }}
                          >
                            {peerMember.avatarInitials}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-[#2C2520] truncate">
                          {peerMember.displayName}
                        </span>
                        {chatUnread > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono-tabular leading-none shrink-0">
                            {chatUnread}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono-tabular text-[#786E65]">
                        1-on-1
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group Chat Name & 4/4 Unanimous Rule Panel */}
            <div className="pb-5 border-b border-[#E2DACB]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#2C2520]">
                  Group Name Consensus
                </span>
                <span className="text-xs font-mono-tabular text-[#8C6D46] font-semibold">
                  {activeProposal ? `${activeProposal.approvals.length}/4 agreed` : '4/4 locked'}
                </span>
              </div>
              <p className="text-xs text-[#6E645B] leading-relaxed mb-3">
                Current name is <strong className="text-[#2C2520]">{groupName}</strong>. It changes once <strong className="text-[#2C2520]">sofi, afiyyy, yufi, and nomi</strong> all agree.
              </p>

              {activeProposal ? (
                <div className="p-3.5 rounded-xl bg-white border border-[#D5C7B2] space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-[#8C6D46]">Pending Proposal</div>
                    <div className="font-display text-base font-bold text-[#2C2520] mt-0.5">
                      "{activeProposal.proposedName}"
                    </div>
                    <div className="text-xs text-[#786E65] mt-0.5">
                      Proposed by {activeProposal.proposedBy}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {ALL_USER_IDS.map((memberId) => {
                      const agreed = activeProposal.approvals.includes(memberId);
                      return (
                        <div
                          key={memberId}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <span className="text-[#2C2520] font-medium">{memberId}</span>
                          {agreed ? (
                            <span className="text-emerald-700 flex items-center gap-1 font-mono-tabular font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Agreed
                            </span>
                          ) : (
                            <span className="text-[#8C8075] flex items-center gap-1 font-mono-tabular">
                              <Clock className="w-3.5 h-3.5" /> Waiting
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    {!activeProposal.approvals.includes(currentUser) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleVote(currentUser, 'approve')}
                          className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" /> Agree as {currentUser}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVote(currentUser, 'reject')}
                          className="py-2 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap"
                        >
                          Veto
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between gap-2">
                        <span className="text-xs text-emerald-700 font-medium">
                          You ({currentUser}) agreed!
                        </span>
                        <button
                          type="button"
                          onClick={() => handleVote(currentUser, 'reject')}
                          className="text-xs text-[#786E65] hover:text-rose-700 underline"
                        >
                          Veto instead
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRenameModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#DFD7C8] text-[#2C2520] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#8C6D46]" />
                  <span>Propose New Group Name</span>
                </button>
              )}
            </div>

            {/* Members Roster */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#2C2520] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#786E65]" />
                  Switch or Rename Member (4)
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenMemberRename(currentUser)}
                  className="text-[11px] font-semibold text-[#8C6D46] hover:text-[#2C2520] underline"
                >
                  Rename Anyone
                </button>
              </div>
              <div className="space-y-1.5">
                {ALL_USER_IDS.map((id) => {
                  const m = getEffectiveMember(id);
                  const isMe = currentUser === id;
                  const isOnline = onlineUsers.includes(id) || isMe;
                  return (
                    <div
                      key={id}
                      className={`w-full p-2 rounded-xl transition-colors flex items-center justify-between ${
                        isMe
                          ? 'bg-white border border-[#DFD7C8] shadow-2xs'
                          : 'hover:bg-white/60 border border-transparent'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectIdentity(id)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                      >
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            alt={m.displayName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-lg object-cover shrink-0 border border-[#DFD7C8]"
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-display text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: m.accentColor }}
                          >
                            {m.avatarInitials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#2C2520] flex items-center gap-1 truncate">
                            <span className="truncate">{m.displayName}</span>
                            {getEarnedBadges(id).map((b) => (
                              <span
                                key={b.id}
                                title={`${b.title}: ${b.description}`}
                                className="text-xs shrink-0"
                              >
                                {b.iconEmoji}
                              </span>
                            ))}
                            {m.displayName !== id && (
                              <span className="text-[10px] font-normal text-[#786E65]">({id})</span>
                            )}
                            {isMe && (
                              <span className="text-[11px] font-normal text-[#8C6D46]">(You)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#786E65] truncate">
                            {getUserMessageCount(id)} messages ·{' '}
                            {bloomUnlockedUsers.includes(id)
                              ? '✨ Bloom unlocked'
                              : 'Type AHHHHHH to unlock Bloom'}
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenMemberRename(id)}
                          title={`Rename ${m.displayName}`}
                          className="p-1 rounded-md text-[#8C6D46] hover:text-[#2C2520] hover:bg-[#EFECE6]"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <span className="text-[11px] text-[#786E65]">
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2DACB] text-xs text-[#786E65] flex items-center justify-between">
            <span>Status: {isConnected ? 'Synced' : 'Reconnecting'}</span>
            <span className="font-mono-tabular">4/4 Required</span>
          </div>
        </aside>

        {/* Center Main Chat Feed */}
        <main
          className={`flex-1 flex flex-col ${themeBgClass} min-w-0 relative overflow-hidden`}
          style={chatWallpaperStyle}
        >
          {/* Dark & Gassy Atmospheric Overlay when inside Secret Vent */}
          {isSecretVentRoom && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden z-0"
            >
              {/* Metallic Vent Grate Lines at top & bottom */}
              <div
                className="absolute inset-x-0 top-0 h-8 opacity-25"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, rgba(16,185,129,0.25) 0px, rgba(16,185,129,0.25) 6px, transparent 6px, transparent 18px)',
                }}
              />
              {/* Drifting Gassy Plume 1 */}
              <motion.div
                animate={{
                  x: ['-12%', '14%', '-8%'],
                  y: ['4%', '-10%', '4%'],
                  scale: [1, 1.22, 1],
                  opacity: [0.28, 0.48, 0.28],
                }}
                transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-24 -left-20 w-[34rem] h-[26rem] rounded-full bg-emerald-500/25 blur-3xl"
              />
              {/* Drifting Gassy Plume 2 */}
              <motion.div
                animate={{
                  x: ['15%', '-15%', '15%'],
                  y: ['-6%', '10%', '-6%'],
                  scale: [1.15, 0.95, 1.15],
                  opacity: [0.22, 0.42, 0.22],
                }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-12 -right-24 w-[32rem] h-[28rem] rounded-full bg-lime-500/20 blur-3xl"
              />
              {/* Drifting Gassy Plume 3 (Center Haze) */}
              <motion.div
                animate={{
                  x: ['-8%', '10%', '-8%'],
                  y: ['10%', '-12%', '10%'],
                  scale: [0.95, 1.18, 0.95],
                  opacity: [0.18, 0.36, 0.18],
                }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/3 left-1/4 w-[28rem] h-[22rem] rounded-full bg-teal-400/20 blur-3xl"
              />
              {/* Rising Gas Bubbles / Spores */}
              {[
                { left: '12%', size: 14, dur: 6.5, delay: 0 },
                { left: '28%', size: 22, dur: 8.2, delay: 1.2 },
                { left: '46%', size: 16, dur: 7.1, delay: 0.5 },
                { left: '64%', size: 26, dur: 9.0, delay: 2.0 },
                { left: '79%', size: 18, dur: 6.8, delay: 1.6 },
                { left: '91%', size: 12, dur: 7.6, delay: 0.9 },
              ].map((b, i) => (
                <motion.span
                  key={`vent-gas-particle-${i}`}
                  animate={{
                    y: ['105%', '-15%'],
                    x: [0, i % 2 === 0 ? 24 : -24, 0],
                    opacity: [0, 0.55, 0],
                    scale: [0.7, 1.25, 0.9],
                  }}
                  transition={{
                    duration: b.dur,
                    delay: b.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ width: b.size, height: b.size, left: b.left, bottom: 0 }}
                  className="absolute rounded-full bg-lime-400/30 blur-[2px] border border-emerald-300/30"
                />
              ))}
            </div>
          )}
          {/* Active Group Rename Proposal Banner */}
          {activeProposal && (
            <div
              role="region"
              aria-label="Group Name Change Vote"
              className="px-4 py-3 bg-[#EFECE6] border-b border-[#D5C7B2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-[#8C6D46] flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Unanimous Group Rename Vote ({activeProposal.approvals.length}/4 Agreed)
                  </span>
                  <span aria-hidden="true" className="text-[#B8AFA6]">·</span>
                  <span className="text-[#5C5349]">
                    <strong className="text-[#2C2520]">{activeProposal.proposedBy}</strong> wants to change <strong className="text-[#2C2520]">{groupName}</strong> to <strong className="text-[#8C6D46]">"{activeProposal.proposedName}"</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#786E65]">
                  {ALL_USER_IDS.map((uid) => {
                    const hasApproved = activeProposal.approvals.includes(uid);
                    return (
                      <span
                        key={uid}
                        className={hasApproved ? 'text-emerald-700 font-semibold' : 'text-[#786E65]'}
                      >
                        {uid}: {hasApproved ? 'Agreed ✓' : 'Waiting...'}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                {!activeProposal.approvals.includes(currentUser) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleVote(currentUser, 'approve')}
                      className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Agree as {currentUser}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(currentUser, 'reject')}
                      className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap min-h-[38px]"
                    >
                      <X className="w-4 h-4" />
                      <span>Disagree</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-700 font-semibold">
                      {currentUser} agreed ✓
                    </span>
                    <button
                      type="button"
                      onClick={() => handleVote(currentUser, 'reject')}
                      className="px-2.5 py-1.5 text-xs text-rose-800 hover:bg-rose-100 bg-white border border-[#E5DEC9] rounded-lg transition-colors"
                    >
                      Cancel Vote
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Non-intrusive Top Banner when talking to a specific person ("How about you go and talk to them... privately. - Yusuf") */}
          <AnimatePresence>
            {privateChatSuggestionTarget && activeRoom === 'group' && (
              <motion.div
                key="yusuf-private-suggestion"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="px-4 py-2.5 bg-[#F3EFE6] border-b border-[#D5C7B2] flex flex-wrap items-center justify-between gap-3 shrink-0 z-10"
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2C2520]">
                  <MessageSquare className="w-4 h-4 text-[#4A7C59] shrink-0" />
                  <span>{YUSUF_PRIVATE_CHAT_SUGGESTION}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {privateChatSuggestionTarget !== currentUser && (
                    <button
                      type="button"
                      onClick={() => openPrivateChatWithMember(privateChatSuggestionTarget)}
                      className="px-3 py-1.5 rounded-lg bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Lock className="w-3 h-3 text-[#D99B66]" />
                      <span>
                        Message {getEffectiveMember(privateChatSuggestionTarget).displayName} Privately
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPrivateChatSuggestionTarget(null)}
                    aria-label="Dismiss suggestion"
                    className="p-1 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#E5DEC9]/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Room Header & Search Bar */}
          <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 transition-colors duration-200 ${themeSubBarClass}`}>
            <div className="flex items-center gap-2 text-xs truncate">
              {activePrivateConfig && activePrivatePeer ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#8C6D46] shrink-0" />
                  <span>
                    Private Chat: <strong>{activePrivatePeer.displayName}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Chatting as <strong>{activeMember.displayName}</strong></span>
                </>
              ) : activeRoom === NEVERLAND_ROOM_ID ? (
                <>
                  <Music className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Musical Group: <strong>{NEVERLAND_GROUP_NAME}</strong> (Everyone:{' '}
                    {ALL_USER_IDS.map((u) => getEffectiveMember(u).displayName).join(', ')})
                  </span>
                  <span
                    title="You cannot change the name of NEVERLAND"
                    className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-300 text-[11px] font-semibold inline-flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Name Locked</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Draft & Publish Lyrics (No Swear Words) + Plan
                  </span>
                </>
              ) : activeRoom === SECRET_VENT_ROOM_ID ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                  <span>
                    Group: <strong>Secret Vent</strong> (Deletes all messages when everyone leaves)
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    In room ({ventUsers.length}):{' '}
                    <strong>
                      {ventUsers.length > 0
                        ? ventUsers.map((u) => getEffectiveMember(u).displayName).join(', ')
                        : 'Nobody'}
                    </strong>
                  </span>
                  {unlockedVentUsers.includes(currentUser) && (
                    <button
                      type="button"
                      onClick={handleLeaveSecretVent}
                      className="ml-1 px-2.5 py-0.5 rounded-md bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-semibold transition-colors"
                    >
                      Leave Secret Vent
                    </button>
                  )}
                </>
              ) : activeCustomGroup ? (
                <>
                  <Users className="w-3.5 h-3.5 text-[#8C6D46] shrink-0" />
                  <span>
                    Group Chat: <strong>{activeCustomGroup.name}</strong> (
                    {activeCustomGroup.members.map((u) => getEffectiveMember(u).displayName).join(', ')})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProposedNameInput(activeCustomGroup.name);
                      setShowRenameModal(true);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/80 hover:bg-white border border-[#DFD7C8] text-[11px] font-semibold text-[#8C6D46]"
                  >
                    Rename
                  </button>
                  <span aria-hidden="true">·</span>
                  <span>Chatting as <strong>{activeMember.displayName}</strong></span>
                </>
              ) : (
                <>
                  <span>
                    Group Chat: <strong>{groupName}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Chatting as <strong>{activeMember.displayName}</strong></span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOnlyUnreadInRoom((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  showOnlyUnreadInRoom
                    ? 'bg-rose-600 text-white border-rose-700'
                    : activeRoomUnreadCount > 0
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-white/80 hover:bg-white text-[#5C5349] border-[#DFD7C8]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Unread ({activeRoomUnreadCount})</span>
              </button>

              {activeRoomUnreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleMarkRoomAsRead(activeRoom);
                    setShowOnlyUnreadInRoom(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <MailOpen className="w-3.5 h-3.5" />
                  <span>Mark Read</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMarkRoomUnread(activeRoom)}
                  title="Mark latest message in this chat as unread"
                  className="px-2.5 py-1.5 rounded-lg bg-white/80 hover:bg-white border border-[#DFD7C8] text-[#5C5349] hover:text-[#2C2520] text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#8C6D46]" />
                  <span>Mark Unread</span>
                </button>
              )}

              <div className="relative w-40 sm:w-56">
                <Search className="w-3.5 h-3.5 text-[#8C8075] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  aria-label="Search messages"
                  className={`w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-[#B89F7D] ${themeInputClass}`}
                />
              </div>
            </div>
          </div>

          {/* Animated Room Transition Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`room-${activeRoom}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              {activeRoom === SECRET_VENT_ROOM_ID && !unlockedVentUsers.includes(currentUser) ? (
                <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                  <div className="max-w-md w-full bg-[#0B1611]/95 border border-emerald-700/70 rounded-2xl p-6 space-y-5 shadow-[0_0_50px_rgba(16,185,129,0.22)] text-white backdrop-blur-md">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-600/70 flex items-center justify-center text-white shrink-0 shadow-[0_0_16px_rgba(132,204,22,0.3)]">
                        <Flame className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                          <span>Enter "Secret Vent"</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-900/90 border border-emerald-600/60 text-[10px] font-mono-tabular text-white">
                            DARK & GASSY
                          </span>
                        </h2>
                        <p className="text-xs text-white mt-0.5">
                          Everyone has this group · Ephemeral auto-deleting vent shaft
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#07100C] border border-emerald-800/80 text-xs text-white space-y-1.5 leading-relaxed">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-white" />
                        <span>Auto-Delete Rule:</span>
                      </div>
                      <p className="text-white">
                        As soon as <strong>everyone leaves Secret Vent</strong>, all messages inside this dark, gassy vent are permanently wiped!
                      </p>
                      {ventClearedBanner && (
                        <p className="text-white font-semibold pt-1">
                          ✓ Previous Secret Vent session ended — all old messages were vented into space.
                        </p>
                      )}
                    </div>

                    <form onSubmit={handleUnlockSecretVent} className="space-y-4">
                      <div>
                        <label
                          htmlFor="secret-vent-code-input"
                          className="block text-xs font-semibold text-white mb-1.5"
                        >
                          Secret Vent Passcode
                        </label>
                        <input
                          id="secret-vent-code-input"
                          type="password"
                          value={ventPasscodeInput}
                          onChange={(e) => {
                            setVentPasscodeInput(e.target.value);
                            setVentPasscodeError(null);
                          }}
                          placeholder="Enter 4-digit code..."
                          autoFocus
                          className="w-full px-4 py-3 rounded-xl bg-[#060C09] border border-emerald-700/80 focus:border-emerald-400 font-mono-tabular text-sm text-white placeholder-white/80 focus:outline-none tracking-widest"
                        />
                        {ventPasscodeError && (
                          <p className="text-xs text-white font-medium mt-1.5">
                            {ventPasscodeError}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectRoom('group')}
                          className="px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800 text-xs font-semibold text-white"
                        >
                          Back to Main Chat
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                        >
                          <Unlock className="w-3.5 h-3.5 text-white" />
                          <span>Unlock Secret Vent</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <>
                {/* NEVERLAND Musical Group Studio Bar & Section Switcher (Chat · Lyrics Studio · Plan Section · Profile) */}
                {activeRoom === NEVERLAND_ROOM_ID && (
                  <div
                    className={`border-b px-4 py-3 shrink-0 space-y-3 text-white ${
                      neverlandProfile.bannerTheme === 'emerald'
                        ? 'border-emerald-300 bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900'
                        : neverlandProfile.bannerTheme === 'rose'
                        ? 'border-rose-300 bg-gradient-to-r from-rose-950 via-pink-900 to-rose-900'
                        : neverlandProfile.bannerTheme === 'amber'
                        ? 'border-amber-300 bg-gradient-to-r from-amber-950 via-orange-900 to-amber-900'
                        : neverlandProfile.bannerTheme === 'violet'
                        ? 'border-purple-300 bg-gradient-to-r from-purple-950 via-fuchsia-950 to-indigo-950'
                        : neverlandProfile.bannerTheme === 'cyan'
                        ? 'border-cyan-300 bg-gradient-to-r from-slate-950 via-cyan-950 to-sky-950'
                        : 'border-indigo-200 bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setNeverlandTab('profile')}
                          title="Click to customize NEVERLAND Profile"
                          className="relative group/nlavatar w-12 h-12 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center text-2xl shrink-0 overflow-hidden shadow-sm"
                        >
                          {neverlandProfile.avatarUrl ? (
                            <img
                              src={neverlandProfile.avatarUrl}
                              alt="NEVERLAND Avatar"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{neverlandProfile.avatarEmoji || '🎵'}</span>
                          )}
                          <span className="opacity-0 group-hover/nlavatar:opacity-100 transition-opacity absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                            <Pencil className="w-4 h-4" />
                          </span>
                        </button>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-bold text-base tracking-wide text-white">
                              NEVERLAND
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/25 text-white text-[10px] font-semibold">
                              {neverlandProfile.genre}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Name Cannot Be Changed</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setNeverlandTab('profile')}
                              className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit Profile</span>
                            </button>
                          </div>
                          <p className="text-xs text-white/90 mt-0.5">
                            {neverlandProfile.tagline}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-white/85">
                            {ALL_USER_IDS.map((uid) => (
                              <span
                                key={uid}
                                className="px-2 py-0.5 rounded bg-black/25 border border-white/10"
                              >
                                <strong>{getEffectiveMember(uid).displayName}:</strong>{' '}
                                {neverlandProfile.memberRoles?.[uid] || DEFAULT_NEVERLAND_PROFILE.memberRoles[uid]}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 bg-black/25 p-1 rounded-xl border border-white/15">
                        <button
                          type="button"
                          onClick={() => setNeverlandTab('chat')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            neverlandTab === 'chat'
                              ? 'bg-white text-indigo-950 shadow-xs'
                              : 'text-white/90 hover:bg-white/10'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Group Chat ({filteredMessages.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNeverlandTab('lyrics')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            neverlandTab === 'lyrics'
                              ? 'bg-white text-indigo-950 shadow-xs'
                              : 'text-white/90 hover:bg-white/10'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            Lyrics Studio ({neverlandLyrics.filter((l) => l.status === 'published').length} Published ·{' '}
                            {neverlandLyrics.filter((l) => l.status === 'draft').length} Drafts)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNeverlandTab('plan')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            neverlandTab === 'plan'
                              ? 'bg-white text-indigo-950 shadow-xs'
                              : 'text-white/90 hover:bg-white/10'
                          }`}
                        >
                          <ListChecks className="w-3.5 h-3.5" />
                          <span>Plan ({neverlandPlans.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNeverlandTab('profile')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            neverlandTab === 'profile'
                              ? 'bg-white text-indigo-950 shadow-xs'
                              : 'text-white/90 hover:bg-white/10'
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Profile</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* NEVERLAND Lyrics Studio View */}
                {activeRoom === NEVERLAND_ROOM_ID && neverlandTab === 'lyrics' ? (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
                      {/* Left Column: Lyric Composer (Draft or Publish, No Swear Words) */}
                      <div className={`lg:col-span-5 p-5 rounded-2xl border space-y-4 self-start ${themeSurfaceClass}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h3 className="font-display font-bold text-base flex items-center gap-2">
                              <Music className="w-4 h-4 text-indigo-600" />
                              <span>{editingLyricId ? 'Edit Song Lyrics' : 'Draft or Publish Lyrics'}</span>
                            </h3>
                            <p className="text-xs opacity-75 mt-0.5">
                              Writing as <strong>{activeMember.displayName}</strong> · No swear words allowed in lyrics
                            </p>
                          </div>
                          {editingLyricId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLyricId(null);
                                setLyricTitleInput('');
                                setLyricBodyInput('');
                                setLyricError(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#EFECE6] text-[#2C2520] text-xs font-semibold"
                            >
                              New Song
                            </button>
                          )}
                        </div>

                        {lyricError && (
                          <div className="p-3 rounded-xl bg-rose-600 text-white text-xs font-semibold flex items-center justify-between gap-2">
                            <span>{lyricError}</span>
                            <button
                              type="button"
                              onClick={() => setLyricError(null)}
                              className="p-1 rounded hover:bg-white/20"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1">
                              Song Title
                            </label>
                            <input
                              type="text"
                              value={lyricTitleInput}
                              onChange={(e) => {
                                setLyricTitleInput(e.target.value);
                                if (lyricError) setLyricError(null);
                              }}
                              placeholder="e.g. Neverland Anthems, Golden Horizon..."
                              maxLength={80}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 ${themeInputClass}`}
                            />
                          </div>

                          <div>
                            {(() => {
                              const charCount = lyricBodyInput.length;
                              const charPct = Math.min(
                                100,
                                Math.round((charCount / NEVERLAND_LYRICS_MAX_LENGTH) * 100)
                              );
                              const remaining = NEVERLAND_LYRICS_MAX_LENGTH - charCount;
                              const isAtLimit = charCount >= NEVERLAND_LYRICS_MAX_LENGTH;
                              const isNearLimit =
                                !isAtLimit && charCount >= NEVERLAND_LYRICS_MAX_LENGTH * 0.9;
                              const isApproachingLimit =
                                !isAtLimit &&
                                !isNearLimit &&
                                charCount >= NEVERLAND_LYRICS_MAX_LENGTH * 0.7;

                              const badgeColorClass = isAtLimit
                                ? 'bg-rose-600 text-white border-rose-700'
                                : isNearLimit
                                ? 'bg-orange-500/20 text-orange-600 border-orange-500/50'
                                : isApproachingLimit
                                ? 'bg-amber-500/20 text-amber-600 border-amber-500/50'
                                : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40';

                              const barColorClass = isAtLimit
                                ? 'bg-rose-600'
                                : isNearLimit
                                ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                                : isApproachingLimit
                                ? 'bg-amber-500'
                                : 'bg-gradient-to-r from-indigo-600 to-emerald-500';

                              const textareaBorderClass = isAtLimit
                                ? '!border-rose-600 focus:!border-rose-600 ring-2 ring-rose-500/30'
                                : isNearLimit
                                ? '!border-orange-500 focus:!border-orange-600 ring-2 ring-orange-500/25'
                                : isApproachingLimit
                                ? '!border-amber-500 focus:!border-amber-600 ring-1 ring-amber-500/25'
                                : 'focus:border-indigo-600';

                              const statusLabel = isAtLimit
                                ? 'Maximum 5,000-letter limit reached!'
                                : isNearLimit
                                ? `Almost full — ${remaining.toLocaleString()} letters left`
                                : isApproachingLimit
                                ? `Approaching limit — ${remaining.toLocaleString()} letters left`
                                : `${remaining.toLocaleString()} letters remaining`;

                              return (
                                <>
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                    <label className="block text-xs font-semibold">
                                      Song Lyrics (No swear words · {NEVERLAND_LYRICS_MAX_LENGTH} letters max)
                                    </label>
                                    <span
                                      className={`px-2 py-0.5 rounded-md border text-[11px] font-mono-tabular font-bold transition-colors ${badgeColorClass}`}
                                    >
                                      {charCount.toLocaleString()}/{NEVERLAND_LYRICS_MAX_LENGTH.toLocaleString()} letters ({charPct}%)
                                    </span>
                                  </div>
                                  <textarea
                                    rows={8}
                                    maxLength={NEVERLAND_LYRICS_MAX_LENGTH}
                                    value={lyricBodyInput}
                                    onChange={(e) => {
                                      setLyricBodyInput(
                                        e.target.value.slice(0, NEVERLAND_LYRICS_MAX_LENGTH)
                                      );
                                      if (lyricError) setLyricError(null);
                                    }}
                                    placeholder="[Verse 1]&#10;Write your clean lyrics for NEVERLAND here (up to 5,000 letters)...&#10;&#10;[Chorus]&#10;Four voices rising in the night..."
                                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none leading-relaxed transition-all ${themeInputClass} ${textareaBorderClass}`}
                                  />
                                  {/* Visual Character Limit Progress Bar & Color Indicator */}
                                  <div className="mt-2 space-y-1">
                                    <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden p-0.5">
                                      <div
                                        className={`h-full rounded-full transition-all duration-200 ${barColorClass}`}
                                        style={{ width: `${Math.max(charCount > 0 ? 2 : 0, charPct)}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span
                                        className={`font-semibold transition-colors ${
                                          isAtLimit
                                            ? 'text-rose-600'
                                            : isNearLimit
                                            ? 'text-orange-600'
                                            : isApproachingLimit
                                            ? 'text-amber-600'
                                            : 'opacity-75'
                                        }`}
                                      >
                                        {statusLabel}
                                      </span>
                                      <span className="font-mono-tabular opacity-70">
                                        {charPct}% used
                                      </span>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveNeverlandLyric('draft')}
                              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Save as Draft</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveNeverlandLyric('published')}
                              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Publish & Open Suno</span>
                            </button>
                          </div>

                          <a
                            href={SUNO_CREATE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (lyricBodyInput.trim() && navigator.clipboard) {
                                navigator.clipboard.writeText(lyricBodyInput.trim()).catch(() => {});
                              }
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-amber-500 hover:opacity-95 text-white text-xs font-bold transition-opacity flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Music className="w-4 h-4" />
                            <span>Bring Me to Suno ({SUNO_CREATE_URL})</span>
                          </a>
                        </div>
                      </div>

                      {/* Right Column: Published Songs & Drafts */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* Published Lyrics Section */}
                        <div className={`p-5 rounded-2xl border space-y-4 ${themeSurfaceClass}`}>
                          <div className="flex items-center justify-between">
                            <h3 className="font-display font-bold text-base flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <span>
                                Published NEVERLAND Lyrics (
                                {neverlandLyrics.filter((l) => l.status === 'published').length})
                              </span>
                            </h3>
                            <span className="text-xs opacity-70">Visible to everyone in NEVERLAND</span>
                          </div>

                          {neverlandLyrics.filter((l) => l.status === 'published').length === 0 ? (
                            <p className="text-xs opacity-75 py-4 text-center">
                              No published lyrics yet. Write a song on the left and click <strong>Publish Lyrics</strong>!
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {neverlandLyrics
                                .filter((l) => l.status === 'published')
                                .map((song) => {
                                  const authorProfile = getEffectiveMember(song.author);
                                  return (
                                    <div
                                      key={song.id}
                                      className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-2"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                                            Published
                                          </span>
                                          <h4 className="font-display font-bold text-sm">
                                            {song.title}
                                          </h4>
                                          <span className="text-xs opacity-75">
                                            by <strong>{authorProfile.displayName}</strong>
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <a
                                            href={SUNO_CREATE_URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => {
                                              if (navigator.clipboard) {
                                                navigator.clipboard.writeText(song.lyrics).catch(() => {});
                                              }
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-[11px] font-semibold flex items-center gap-1"
                                            title="Copy lyrics & open https://suno.com/create"
                                          >
                                            <Music className="w-3 h-3" />
                                            <span>Open in Suno</span>
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => handleEditNeverlandLyric(song)}
                                            className="px-2.5 py-1 rounded-lg bg-[#2C2520] hover:bg-[#3F362F] text-white text-[11px] font-semibold flex items-center gap-1"
                                          >
                                            <Pencil className="w-3 h-3" />
                                            <span>Edit</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteNeverlandLyric(song.id)}
                                            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                                            title="Delete lyrics"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed p-3 rounded-lg bg-black/5 border border-black/10">
                                        {song.lyrics}
                                      </pre>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>

                        {/* Draft Lyrics Section */}
                        <div className={`p-5 rounded-2xl border space-y-4 ${themeSurfaceClass}`}>
                          <div className="flex items-center justify-between">
                            <h3 className="font-display font-bold text-base flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-600" />
                              <span>
                                Lyric Drafts (
                                {neverlandLyrics.filter((l) => l.status === 'draft').length})
                              </span>
                            </h3>
                            <span className="text-xs opacity-70">Work-in-progress ideas</span>
                          </div>

                          {neverlandLyrics.filter((l) => l.status === 'draft').length === 0 ? (
                            <p className="text-xs opacity-75 py-4 text-center">
                              No lyric drafts right now. Click <strong>Save as Draft</strong> to store work-in-progress lyrics!
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {neverlandLyrics
                                .filter((l) => l.status === 'draft')
                                .map((draft) => {
                                  const authorProfile = getEffectiveMember(draft.author);
                                  return (
                                    <div
                                      key={draft.id}
                                      className="p-4 rounded-xl border border-amber-300/80 bg-amber-50/40 dark:bg-amber-950/20 space-y-2"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider">
                                            Draft
                                          </span>
                                          <h4 className="font-display font-bold text-sm">
                                            {draft.title}
                                          </h4>
                                          <span className="text-xs opacity-75">
                                            drafted by <strong>{authorProfile.displayName}</strong>
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (!currentUser) return;
                                              awardBadgeForUser(currentUser, 'rockstar_song');
                                              openSunoCreatePage(draft.lyrics);
                                              sendEvent({
                                                type: 'neverland:lyric-save',
                                                id: draft.id,
                                                userId: currentUser,
                                                title: draft.title,
                                                lyrics: draft.lyrics,
                                                status: 'published',
                                              });
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-[11px] font-semibold flex items-center gap-1"
                                          >
                                            <Sparkles className="w-3 h-3" />
                                            <span>Publish & Open Suno</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleEditNeverlandLyric(draft)}
                                            className="px-2.5 py-1 rounded-lg bg-[#2C2520] hover:bg-[#3F362F] text-white text-[11px] font-semibold flex items-center gap-1"
                                          >
                                            <Pencil className="w-3 h-3" />
                                            <span>Edit Draft</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteNeverlandLyric(draft.id)}
                                            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                                            title="Delete draft"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed p-3 rounded-lg bg-black/5 border border-black/10">
                                        {draft.lyrics}
                                      </pre>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeRoom === NEVERLAND_ROOM_ID && neverlandTab === 'plan' ? (
                  /* NEVERLAND Plan Section View */
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
                      {/* Left Column: Add a New Plan Item */}
                      <div className={`lg:col-span-5 p-5 rounded-2xl border space-y-4 self-start ${themeSurfaceClass}`}>
                        <div>
                          <h3 className="font-display font-bold text-base flex items-center gap-2">
                            <ListChecks className="w-4 h-4 text-indigo-600" />
                            <span>Add to NEVERLAND Plan</span>
                          </h3>
                          <p className="text-xs opacity-75 mt-0.5">
                            Plan songs, roles, recordings, and release goals for the musical group
                          </p>
                        </div>

                        {planError && (
                          <div className="p-3 rounded-xl bg-rose-600 text-white text-xs font-semibold flex items-center justify-between gap-2">
                            <span>{planError}</span>
                            <button
                              type="button"
                              onClick={() => setPlanError(null)}
                              className="p-1 rounded hover:bg-white/20"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <form onSubmit={handleAddNeverlandPlan} className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1">
                              Plan Title
                            </label>
                            <input
                              type="text"
                              value={planTitleInput}
                              onChange={(e) => {
                                setPlanTitleInput(e.target.value);
                                if (planError) setPlanError(null);
                              }}
                              placeholder="e.g. Record Chorus Vocals, Pick Beat..."
                              maxLength={80}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 ${themeInputClass}`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold mb-1">
                              Plan Details & Notes
                            </label>
                            <textarea
                              rows={4}
                              value={planDetailsInput}
                              onChange={(e) => {
                                setPlanDetailsInput(e.target.value);
                                if (planError) setPlanError(null);
                              }}
                              placeholder="Describe what needs to happen for this step..."
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 leading-relaxed ${themeInputClass}`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold mb-1">
                              Assigned Member
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPlanAssignedTo('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                  planAssignedTo === 'all'
                                    ? 'bg-indigo-700 text-white border-indigo-700'
                                    : 'bg-black/5 border-black/15'
                                }`}
                              >
                                Everyone (All 4)
                              </button>
                              {ALL_USER_IDS.map((uid) => (
                                <button
                                  key={uid}
                                  type="button"
                                  onClick={() => setPlanAssignedTo(uid)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                    planAssignedTo === uid
                                      ? 'bg-indigo-700 text-white border-indigo-700'
                                      : 'bg-black/5 border-black/15'
                                  }`}
                                >
                                  {getEffectiveMember(uid).displayName}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Plan Item</span>
                          </button>
                        </form>
                      </div>

                      {/* Right Column: Plan Board */}
                      <div className={`lg:col-span-7 p-5 rounded-2xl border space-y-4 ${themeSurfaceClass}`}>
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-bold text-base flex items-center gap-2">
                            <ListChecks className="w-4 h-4 text-indigo-600" />
                            <span>NEVERLAND Musical Group Plan ({neverlandPlans.length})</span>
                          </h3>
                          <span className="text-xs opacity-75">
                            {neverlandPlans.filter((p) => p.status === 'done').length}/{neverlandPlans.length} completed
                          </span>
                        </div>

                        {neverlandPlans.length === 0 ? (
                          <p className="text-xs opacity-75 py-8 text-center">
                            No plans added yet. Add a musical group goal or schedule item on the left!
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {neverlandPlans.map((item) => {
                              const assignedLabel =
                                item.assignedTo === 'all'
                                  ? 'Everyone (sofi, afiyyy, yufi, nomi)'
                                  : getEffectiveMember(item.assignedTo).displayName;
                              return (
                                <div
                                  key={item.id}
                                  className="p-4 rounded-xl border border-indigo-200/80 bg-black/5 space-y-2.5"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white ${
                                            item.status === 'done'
                                              ? 'bg-emerald-600'
                                              : item.status === 'in-progress'
                                              ? 'bg-amber-600'
                                              : 'bg-indigo-600'
                                          }`}
                                        >
                                          {item.status === 'done'
                                            ? 'Done ✓'
                                            : item.status === 'in-progress'
                                            ? 'In Progress'
                                            : 'Planned'}
                                        </span>
                                        <h4 className="font-display font-bold text-sm">
                                          {item.title}
                                        </h4>
                                      </div>
                                      {item.details && (
                                        <p className="text-xs opacity-85 leading-relaxed">
                                          {item.details}
                                        </p>
                                      )}
                                      <div className="text-[11px] opacity-70">
                                        Assigned to: <strong>{assignedLabel}</strong> · Added by{' '}
                                        {getEffectiveMember(item.createdBy).displayName}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateNeverlandPlanStatus(item.id, 'planned')
                                        }
                                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${
                                          item.status === 'planned'
                                            ? 'bg-indigo-700 text-white'
                                            : 'bg-black/10 hover:bg-black/20'
                                        }`}
                                      >
                                        Planned
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateNeverlandPlanStatus(item.id, 'in-progress')
                                        }
                                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${
                                          item.status === 'in-progress'
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-black/10 hover:bg-black/20'
                                        }`}
                                      >
                                        In Progress
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateNeverlandPlanStatus(item.id, 'done')
                                        }
                                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${
                                          item.status === 'done'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-black/10 hover:bg-black/20'
                                        }`}
                                      >
                                        Done
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteNeverlandPlan(item.id)}
                                        className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                                        title="Delete plan item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : activeRoom === NEVERLAND_ROOM_ID && neverlandTab === 'profile' ? (
                  /* NEVERLAND Profile Customization View */
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Column: Avatar, Theme & Locked Name Card */}
                      <div className={`lg:col-span-5 p-5 rounded-2xl border space-y-5 self-start ${themeSurfaceClass}`}>
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-bold text-base flex items-center gap-2">
                            <Music className="w-4 h-4 text-indigo-600" />
                            <span>NEVERLAND Profile</span>
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-xs font-semibold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Name Locked</span>
                          </span>
                        </div>

                        {/* Group Name (Locked) */}
                        <div>
                          <label className="block text-xs font-semibold mb-1">
                            Musical Group Name (Cannot Be Changed)
                          </label>
                          <div className="px-3.5 py-2.5 rounded-xl bg-black/5 border border-black/15 text-sm font-display font-bold flex items-center justify-between opacity-80 cursor-not-allowed">
                            <span>NEVERLAND</span>
                            <Lock className="w-4 h-4 opacity-70" />
                          </div>
                        </div>

                        {/* Profile Picture / Emoji Picker */}
                        <div className="space-y-3">
                          <label className="block text-xs font-semibold">
                            NEVERLAND Profile Picture / Icon
                          </label>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-900 text-white border border-indigo-500 flex items-center justify-center text-3xl overflow-hidden shrink-0 shadow-sm">
                              {neverlandProfile.avatarUrl ? (
                                <img
                                  src={neverlandProfile.avatarUrl}
                                  alt="NEVERLAND Avatar"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{neverlandProfile.avatarEmoji || '🎵'}</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <input
                                ref={neverlandAvatarFileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleNeverlandAvatarUpload}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => neverlandAvatarFileRef.current?.click()}
                                className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold flex items-center gap-1.5"
                              >
                                <ImagePlus className="w-3.5 h-3.5" />
                                <span>Upload Profile Picture</span>
                              </button>
                              {neverlandProfile.avatarUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveNeverlandProfile(undefined, { avatarUrl: '' })
                                  }
                                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                                >
                                  Remove Picture (Use Emoji)
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="block text-[11px] opacity-75 mb-1.5">
                              Or choose a musical badge icon:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {['🎵', '🎸', '🎤', '🎧', '🎹', '🌟', '🔥', '👑', '💿', '🎶', '🎺', '🥁'].map(
                                (emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() =>
                                      handleSaveNeverlandProfile(undefined, {
                                        avatarEmoji: emoji,
                                        avatarUrl: '',
                                      })
                                    }
                                    className={`w-9 h-9 rounded-xl border text-lg flex items-center justify-center transition-transform active:scale-95 ${
                                      !neverlandProfile.avatarUrl &&
                                      neverlandProfile.avatarEmoji === emoji
                                        ? 'bg-indigo-700 text-white border-indigo-700 ring-2 ring-indigo-400'
                                        : 'bg-black/5 border-black/15 hover:bg-black/10'
                                    }`}
                                  >
                                    {emoji}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Studio Banner Color Theme */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold">
                            NEVERLAND Studio Banner Theme
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(
                              [
                                { id: 'indigo', label: 'Royal Indigo', dot: 'bg-indigo-600' },
                                { id: 'emerald', label: 'Emerald Studio', dot: 'bg-emerald-600' },
                                { id: 'rose', label: 'Crimson Stage', dot: 'bg-rose-600' },
                                { id: 'amber', label: 'Golden Hour', dot: 'bg-amber-600' },
                                { id: 'violet', label: 'Midnight Violet', dot: 'bg-purple-600' },
                                { id: 'cyan', label: 'Cyber Cyan', dot: 'bg-cyan-600' },
                              ] as const
                            ).map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() =>
                                  handleSaveNeverlandProfile(undefined, { bannerTheme: t.id })
                                }
                                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
                                  neverlandProfile.bannerTheme === t.id
                                    ? 'bg-indigo-700 text-white border-indigo-700'
                                    : 'bg-black/5 border-black/15 hover:bg-black/10'
                                }`}
                              >
                                <span className={`w-3 h-3 rounded-full ${t.dot}`} />
                                <span>{t.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Bio, Genre & Member Musical Roles Form */}
                      <form
                        onSubmit={(e) => handleSaveNeverlandProfile(e)}
                        className={`lg:col-span-7 p-5 rounded-2xl border space-y-4 ${themeSurfaceClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-display font-bold text-base">
                              Edit NEVERLAND Bio, Genre & Band Roles
                            </h3>
                            <p className="text-xs opacity-75 mt-0.5">
                              Anyone in NEVERLAND can update the group profile for everyone
                            </p>
                          </div>
                          {neverlandProfileSavedMsg && (
                            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Saved!</span>
                            </span>
                          )}
                        </div>

                        {neverlandProfileError && (
                          <div className="p-3 rounded-xl bg-rose-600 text-white text-xs font-semibold flex items-center justify-between gap-2">
                            <span>{neverlandProfileError}</span>
                            <button
                              type="button"
                              onClick={() => setNeverlandProfileError(null)}
                              className="p-1 rounded hover:bg-white/20"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold mb-1">
                            NEVERLAND Bio / Tagline
                          </label>
                          <input
                            type="text"
                            value={neverlandProfile.tagline}
                            onChange={(e) =>
                              setNeverlandProfile((prev) => ({
                                ...prev,
                                tagline: e.target.value,
                              }))
                            }
                            placeholder="Describe NEVERLAND's musical mission..."
                            maxLength={140}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 ${themeInputClass}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1">
                            Musical Genre / Vibe
                          </label>
                          <input
                            type="text"
                            value={neverlandProfile.genre}
                            onChange={(e) =>
                              setNeverlandProfile((prev) => ({
                                ...prev,
                                genre: e.target.value,
                              }))
                            }
                            placeholder="e.g. Pop · Hip-Hop · R&B · Synthwave"
                            maxLength={80}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 ${themeInputClass}`}
                          />
                        </div>

                        <div className="space-y-3 pt-1">
                          <label className="block text-xs font-semibold">
                            Member Musical Roles in NEVERLAND
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ALL_USER_IDS.map((uid) => {
                              const m = getEffectiveMember(uid);
                              return (
                                <div
                                  key={uid}
                                  className="p-3 rounded-xl border border-black/15 bg-black/5 space-y-1.5"
                                >
                                  <div className="flex items-center gap-2 text-xs font-bold">
                                    <span
                                      className="w-5 h-5 rounded-md text-[10px] text-white flex items-center justify-center font-bold"
                                      style={{ backgroundColor: m.accentColor }}
                                    >
                                      {m.avatarInitials}
                                    </span>
                                    <span>{m.displayName}</span>
                                  </div>
                                  <input
                                    type="text"
                                    value={neverlandProfile.memberRoles?.[uid] || ''}
                                    onChange={(e) =>
                                      setNeverlandProfile((prev) => ({
                                        ...prev,
                                        memberRoles: {
                                          ...prev.memberRoles,
                                          [uid]: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder={`Role for ${m.displayName}...`}
                                    maxLength={50}
                                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-indigo-600 ${themeInputClass}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span>Save NEVERLAND Profile</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                <>
                {/* Scrollable Message Stream with Entry/Exit Animations */}
                <div className={`flex-1 overflow-y-auto px-4 sm:px-6 ${densitySpacingClass}`}>
                  {filteredMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <p className="text-sm text-[#6E645B] mb-2">
                        {searchQuery
                          ? 'No messages match your search.'
                          : activePrivatePeer
                          ? `No messages yet with ${activePrivatePeer.displayName}. Say hi!`
                          : 'No messages yet in this chat.'}
                      </p>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="text-xs text-[#8C6D46] font-semibold hover:underline"
                        >
                          Clear search filter
                        </button>
                      )}
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {filteredMessages.map((msg) => {
                        if (msg.sender === 'system') {
                          const sysTime = formatTime(msg.timestamp, appSettings.timeFormat);
                          return (
                            <motion.div
                              key={msg.id}
                              initial={
                                appSettings.animateMessages
                                  ? { opacity: 0, scale: 0.96, y: 8 }
                                  : false
                              }
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={
                                appSettings.animateMessages
                                  ? { opacity: 0, scale: 0.92, y: -6 }
                                  : undefined
                              }
                              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                              className="flex justify-center my-3"
                            >
                              <div className="max-w-xl px-4 py-2 rounded-xl bg-[#EFECE6] border border-[#E2DACB] text-xs text-[#5C5349] text-center leading-relaxed">
                                <span>{msg.text}</span>
                                {sysTime && (
                                  <>
                                    <span className="mx-1.5 text-[#B8AFA6]" aria-hidden="true">·</span>
                                    <span className="font-mono-tabular text-[#8C8075]">
                                      {sysTime}
                                    </span>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          );
                        }

                        const isOwn = msg.sender === currentUser;
                        const isUnreadForMe = currentUser
                          ? isMessageUnreadForUser(msg, currentUser)
                          : false;
                        const isFirstUnreadDivider = firstUnreadMessageIdInRoom === msg.id;
                        const senderProfile = getEffectiveMember(msg.sender);
                        const repliedMsg = msg.replyToId
                          ? messages.find((m) => m.id === msg.replyToId)
                          : null;
                        const reactionEntries = Object.entries(msg.reactions || {}).filter(
                          ([, users]) => users.length > 0
                        );
                        const isEditingThis = editingMessageId === msg.id;
                        const formattedMsgTime = formatTime(msg.timestamp, appSettings.timeFormat);

                        return (
                          <React.Fragment key={msg.id}>
                            {isFirstUnreadDivider && (
                              <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-rose-400/70" />
                                <div className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                                  <Bell className="w-3 h-3" />
                                  <span>
                                    {activeRoomUnreadCount} Unread Message
                                    {activeRoomUnreadCount === 1 ? '' : 's'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkRoomAsRead(activeRoom)}
                                    className="ml-1.5 underline hover:text-rose-100 font-semibold"
                                  >
                                    Mark read
                                  </button>
                                </div>
                                <div className="flex-1 h-px bg-rose-400/70" />
                              </div>
                            )}
                          <motion.div
                            initial={
                              appSettings.animateMessages
                                ? { opacity: 0, y: 12, scale: 0.97 }
                                : false
                            }
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={
                              appSettings.animateMessages
                                ? { opacity: 0, scale: 0.9, y: -8 }
                                : undefined
                            }
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className={`group flex items-start gap-3 ${
                              isOwn ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            {/* Sender Avatar */}
                            {appSettings.showAvatarsInChat &&
                              (senderProfile.avatarUrl ? (
                                <img
                                  src={senderProfile.avatarUrl}
                                  alt={senderProfile.displayName}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-xl object-cover shrink-0 mt-1 border border-[#DFD7C8]"
                                />
                              ) : (
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center font-display text-xs font-bold text-white shrink-0 mt-1"
                                  style={{ backgroundColor: senderProfile.accentColor }}
                                >
                                  {senderProfile.avatarInitials}
                                </div>
                              ))}

                            <div
                              className={`max-w-[78%] sm:max-w-[65%] flex flex-col ${
                                isOwn ? 'items-end' : 'items-start'
                              }`}
                            >
                              {/* Clean unboxed metadata header */}
                              <div
                                className={`flex flex-wrap items-center gap-1.5 text-xs mb-1 px-1 ${
                                  isAnyDarkMode ? 'text-white' : 'text-[#6E645B]'
                                }`}
                              >
                                <span
                                  className="font-semibold"
                                  style={{
                                    color: isAnyDarkMode ? '#FFFFFF' : senderProfile.accentColor,
                                  }}
                                >
                                  {senderProfile.displayName}
                                </span>
                                {getEarnedBadges(msg.sender).map((b) => (
                                  <span
                                    key={b.id}
                                    title={`${b.title} — ${b.description}`}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100/90 border border-amber-300 text-[10px] font-semibold text-amber-900"
                                  >
                                    {b.iconEmoji} {b.title.split(':')[0]}
                                  </span>
                                ))}
                                {appSettings.showTaglinesInChat && senderProfile.tagline && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-[11px] text-[#8C6D46] font-medium">
                                      {senderProfile.tagline}
                                    </span>
                                  </>
                                )}
                                {formattedMsgTime && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-mono-tabular text-[11px] text-[#8C8075]">
                                      {formattedMsgTime}
                                    </span>
                                  </>
                                )}
                                {msg.editedAt && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-[11px] text-[#8C8075] italic">
                                      edited
                                    </span>
                                  </>
                                )}
                                {isUnreadForMe && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
                                    Unread
                                  </span>
                                )}
                              </div>

                              {/* Reply context preview if replying */}
                              {repliedMsg && (
                                <div className="text-xs text-[#6E645B] bg-[#EFECE6] border-l-2 border-[#B89F7D] pl-2.5 pr-3 py-1 mb-1 rounded-r-md max-w-full truncate">
                                  <span className="font-semibold text-[#2C2520]">
                                    @{repliedMsg.sender}:
                                  </span>{' '}
                                  {repliedMsg.text || (repliedMsg.imageUrl ? '[Image]' : '')}
                                </div>
                              )}

                              {/* Message Bubble or Inline Edit Form */}
                              <div className="relative flex items-center gap-2">
                                {isEditingThis ? (
                                  <form
                                    onSubmit={(e) => handleSaveEdit(e, msg)}
                                    className="p-2.5 rounded-2xl bg-white border border-[#C5B49A] shadow-sm flex flex-col gap-2 min-w-[240px] sm:min-w-[300px]"
                                  >
                                    <input
                                      type="text"
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      aria-label="Edit message text"
                                      autoFocus
                                      className="w-full px-3 py-2 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] text-sm text-[#2C2520] focus:outline-none focus:border-[#8C6D46]"
                                    />
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMessageId(null);
                                          setEditingText('');
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="px-3 py-1 rounded-lg bg-[#2C2520] hover:bg-[#3F362F] text-xs font-semibold text-white"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <motion.div
                                    initial={
                                      msg.effect === 'bloom'
                                        ? { scale: 0.45, opacity: 0, y: 18 }
                                        : false
                                    }
                                    animate={
                                      msg.effect === 'bloom'
                                        ? {
                                            scale: [0.45, 1.18, 0.96, 1.04, 1],
                                            opacity: 1,
                                            y: [18, -6, 0],
                                          }
                                        : { scale: 1, opacity: 1, y: 0 }
                                    }
                                    transition={{
                                      duration: 0.75,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className={`relative ${bubbleRadiusClass} ${fontScaleClass} leading-relaxed break-words overflow-visible border ${
                                      msg.imageUrl ? 'p-2' : 'px-4 py-2.5'
                                    } ${
                                      msg.effect === 'bloom'
                                        ? 'bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-white border-pink-300 shadow-lg ring-2 ring-pink-300/60 font-semibold'
                                        : isOwn
                                        ? `${themeOwnBubbleClass} font-medium rounded-tr-xs`
                                        : `${themeOtherBubbleClass} rounded-tl-xs shadow-2xs`
                                    } ${
                                      appSettings.highContrastBorders ? '!border-[#8C6D46]' : ''
                                    }`}
                                  >
                                    {/* Bloom Effect Particle Burst */}
                                    {msg.effect === 'bloom' && (
                                      <>
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-20">
                                          {BLOOM_PARTICLES.map((p) => (
                                            <motion.span
                                              key={`${msg.id}-bloom-${p.id}-${bloomReplayCounter[msg.id] || 0}`}
                                              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                                              animate={{
                                                x: p.dx,
                                                y: p.dy,
                                                scale: [0, 1.35, 0.9, 1],
                                                opacity: [1, 1, 0.95, 0.85],
                                              }}
                                              transition={{
                                                duration: 1.15,
                                                delay: p.delay,
                                                ease: 'easeOut',
                                              }}
                                              style={{
                                                width: p.size,
                                                height: p.size,
                                                backgroundColor: p.color,
                                              }}
                                              className="absolute rounded-full shadow-xs"
                                            />
                                          ))}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider font-bold text-white/95 mb-1">
                                          <span className="flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            <span>Bloom Effect</span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setBloomReplayCounter((prev) => ({
                                                ...prev,
                                                [msg.id]: (prev[msg.id] || 0) + 1,
                                              }))
                                            }
                                            className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[9px] text-white transition-colors"
                                            title="Replay Bloom Effect"
                                          >
                                            Replay
                                          </button>
                                        </div>
                                      </>
                                    )}
                                    {msg.imageUrl && (
                                      <div className="relative group/img">
                                        <img
                                          src={msg.imageUrl}
                                          alt={`Shared by ${msg.sender}`}
                                          referrerPolicy="no-referrer"
                                          onClick={() => setLightboxImage(msg.imageUrl || null)}
                                          className={`max-h-72 w-auto rounded-xl object-cover cursor-pointer border border-[#E5DEC9]/60 transition-all ${
                                            appSettings.blurImagesUntilClick
                                              ? 'blur-md hover:blur-none'
                                              : ''
                                          }`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setLightboxImage(msg.imageUrl || null)}
                                          aria-label="View full size image"
                                          className="opacity-0 group-hover/img:opacity-100 transition-opacity absolute top-2 right-2 p-1.5 rounded-lg bg-[#2C2520]/75 text-white"
                                        >
                                          <ZoomIn className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                    {msg.text && (
                                      <div className={msg.imageUrl ? 'px-2 pt-2 pb-1' : ''}>
                                        {msg.text.split(/(@(?:all|everyone|sofi|sofia|afi|afiy+|afiyah|yufi|yusuf|yufifi|nomi|nomani|nomanini|noman)\b)/gi).map((part, idx) => {
                                          if (part.startsWith('@')) {
                                            const isAllMention = /^@(?:all|everyone)$/i.test(part);
                                            return (
                                              <span
                                                key={idx}
                                                className={`inline-block px-1.5 py-0.5 mx-0.5 rounded-md font-semibold text-xs ${
                                                  isAllMention
                                                    ? 'bg-[#8C6D46] text-white'
                                                    : 'bg-[#2C2520] text-[#F7F4EF]'
                                                }`}
                                              >
                                                {part}
                                              </span>
                                            );
                                          }
                                          return <React.Fragment key={idx}>{part}</React.Fragment>;
                                        })}
                                      </div>
                                    )}
                                  </motion.div>
                                )}

                                {/* Message actions: React, Reply, Edit (own), Delete (own) */}
                                {!isEditingThis && (
                                  <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveReactionMsgId(
                                          activeReactionMsgId === msg.id ? null : msg.id
                                        )
                                      }
                                      aria-label={`React to message from ${msg.sender}`}
                                      title="React"
                                      className="p-1.5 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#E5DEC9] text-[#5C5349]"
                                    >
                                      <Smile className="w-3.5 h-3.5" />
                                    </button>
                                    {hasCurrentUserUnlockedBloom && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleMessageBloomEffect(msg)}
                                        aria-label="Toggle Bloom Effect on this message"
                                        title={
                                          msg.effect === 'bloom'
                                            ? 'Remove Bloom Effect'
                                            : 'Save Bloom Effect on this message'
                                        }
                                        className={`p-1.5 rounded-lg border transition-colors ${
                                          msg.effect === 'bloom'
                                            ? 'bg-fuchsia-600 text-white border-fuchsia-600'
                                            : 'bg-white hover:bg-[#EFECE6] border-[#E5DEC9] text-fuchsia-600'
                                        }`}
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setReplyingTo(msg)}
                                      aria-label={`Reply to message from ${msg.sender}`}
                                      title="Reply"
                                      className="p-1.5 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#E5DEC9] text-[#5C5349]"
                                    >
                                      <Reply className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMarkMessageAsUnread(msg)}
                                      aria-label="Mark message as unread"
                                      title="Mark as Unread from here"
                                      className={`p-1.5 rounded-lg border transition-colors ${
                                        isUnreadForMe
                                          ? 'bg-rose-600 text-white border-rose-600'
                                          : 'bg-white hover:bg-[#EFECE6] border-[#E5DEC9] text-[#5C5349]'
                                      }`}
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </button>
                                    {isOwn && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleStartEdit(msg)}
                                          aria-label="Edit message"
                                          title="Edit message"
                                          className="p-1.5 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#E5DEC9] text-[#5C5349]"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteMessage(msg.id)}
                                          aria-label="Delete message"
                                          title="Delete message"
                                          className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-[#E5DEC9] text-rose-700"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Quick Emoji Picker Popover */}
                              {activeReactionMsgId === msg.id && (
                                <div className="mt-1.5 p-1.5 rounded-xl bg-white border border-[#DFD7C8] shadow-md flex items-center gap-1 z-10">
                                  {QUICK_REACTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className="w-8 h-8 rounded-lg hover:bg-[#F3EFE6] flex items-center justify-center text-base transition-transform active:scale-95"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEmojiTargetReactionMsgId(msg.id);
                                      setActiveReactionMsgId(null);
                                      setShowEmojiPicker(true);
                                    }}
                                    title="Browse all emojis"
                                    className="px-2 h-8 rounded-lg bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] text-[#2C2520] text-xs font-semibold flex items-center gap-1"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-[#8C6D46]" />
                                    <span>More</span>
                                  </button>
                                </div>
                              )}

                              {/* Existing Reactions Row */}
                              {appSettings.showReactionCounts && reactionEntries.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  {reactionEntries.map(([emoji, users]) => {
                                    const iReacted = users.includes(currentUser);
                                    return (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleToggleReaction(msg.id, emoji)}
                                        className={`px-2 py-0.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                                          iReacted
                                            ? 'bg-[#E8DFD1] border border-[#C5B49A] text-[#2C2520] font-medium'
                                            : 'bg-white border border-[#E5DEC9] text-[#5C5349] hover:bg-[#F3EFE6]'
                                        }`}
                                        title={`Reacted by: ${users.join(', ')}`}
                                      >
                                        <span>{emoji}</span>
                                        <span className="font-mono-tabular text-[11px]">
                                          {users.length}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </motion.div>
                          </React.Fragment>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Typing Indicator */}
                {otherTyping.length > 0 && (
                  <div className="px-6 py-1.5 text-xs text-[#8C6D46] font-medium bg-[#F7F4EF] shrink-0">
                    {otherTyping.join(', ')} {otherTyping.length === 1 ? 'is' : 'are'} typing...
                  </div>
                )}

                {/* Moderation Alert Banner: Soundtrap button shown ONLY for secrets */}
                {moderationWarning && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="px-4 py-3 bg-[#FFF8F1] border-t border-[#D99B66] flex flex-wrap items-center justify-between gap-3 shrink-0"
                  >
                    <p className="text-xs sm:text-sm font-semibold text-[#7A3E18] leading-snug">
                      {moderationWarning}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {moderationWarning === SECRET_SOUNDTRAP_WARNING && (
                        <a
                          href={SOUNDTRAP_STUDIO_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Music className="w-3.5 h-3.5 text-[#D99B66]" />
                          <span>Send me to Soundtrap!</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setModerationWarning(null)}
                        aria-label="Dismiss warning"
                        className="p-1 rounded-lg text-[#7A3E18] hover:bg-[#F3E4D5] shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Replying Banner */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-[#EFECE6] border-t border-[#E5DEC9] flex items-center justify-between text-xs text-[#5C5349] shrink-0">
                    <div className="truncate">
                      Replying to <strong className="text-[#2C2520]">@{replyingTo.sender}</strong>:{' '}
                      <span className="text-[#6E645B]">
                        {replyingTo.text || (replyingTo.imageUrl ? '[Image attachment]' : '')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      aria-label="Cancel reply"
                      className="p-1 text-[#786E65] hover:text-[#2C2520]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Selected Image Preview Strip above Composer */}
                {selectedImage && (
                  <div className="px-4 py-3 bg-[#EFECE6] border-t border-[#E5DEC9] flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedImage}
                        alt="Upload preview"
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover border border-[#D5C7B2] bg-white shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#2C2520]">
                          Image ready to send as {currentUser}
                        </div>
                        <div className="text-xs text-[#6E645B] truncate">
                          Add an optional caption below or press Send
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      aria-label="Remove attached image"
                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-[#5C5349] hover:text-rose-700 border border-[#DFD7C8] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Super Easy Live Voice Transcribing Strip above Composer */}
                {(isQuickRecording || isQuickTranscribing) && (
                  <div className="px-4 py-2.5 bg-[#FFF8F1] border-t border-[#D99B66] flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isQuickRecording ? (
                        <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-[#8C6D46] animate-spin shrink-0" />
                      )}
                      <div className="text-xs min-w-0 truncate">
                        {isQuickRecording ? (
                          <>
                            <strong className="text-rose-700">
                              Listening ({quickRecordSeconds}s) — Speak now!
                            </strong>{' '}
                            <span className="text-[#5C5349]">
                              {liveDictationPreview
                                ? `“${liveDictationPreview}”`
                                : 'Your words type straight into the chat box below...'}
                            </span>
                          </>
                        ) : (
                          <strong className="text-[#2C2520]">
                            Finishing transcription...
                          </strong>
                        )}
                      </div>
                    </div>

                    {isQuickRecording && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => stopQuickRecordingInternal(false)}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#DFD7C8] text-[#2C2520] text-xs font-semibold transition-colors"
                        >
                          Done Speaking
                        </button>
                        <button
                          type="button"
                          onClick={() => stopQuickRecordingInternal(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Stop & Send Now</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Full Searchable Emoji Picker Popover above Composer (Powered by Emoji API) */}
                {showEmojiPicker && (
                  <div className="px-4 py-3 bg-white border-t border-[#D5C7B2] space-y-2.5 shrink-0 shadow-lg z-20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#2C2520]">
                        <Smile className="w-4 h-4 text-[#8C6D46]" />
                        <span>
                          {emojiTargetReactionMsgId
                            ? 'Pick an Emoji Reaction'
                            : 'Emoji Picker (Click to insert into message)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-48 sm:w-60">
                          <Search className="w-3.5 h-3.5 text-[#8C8075] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={emojiSearchQuery}
                            onChange={(e) => setEmojiSearchQuery(e.target.value)}
                            placeholder="Search emojis (e.g. goat, fire, party)..."
                            className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-[#F7F4EF] border border-[#DFD7C8] text-xs text-[#2C2520] placeholder-[#9E9388] focus:outline-none focus:border-[#8C6D46]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEmojiPicker(false);
                            setEmojiTargetReactionMsgId(null);
                          }}
                          aria-label="Close emoji picker"
                          className="p-1 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {EMOJI_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setEmojiCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                            emojiCategory === cat.id
                              ? 'bg-[#2C2520] text-white'
                              : 'bg-[#F7F4EF] hover:bg-[#EFECE6] text-[#5C5349]'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="max-h-44 overflow-y-auto grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1 pt-1">
                      {isLoadingEmojis && emojiResults.length === 0 ? (
                        <div className="col-span-full py-6 text-center text-xs text-[#786E65] flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#8C6D46]" />
                          <span>Loading emojis...</span>
                        </div>
                      ) : emojiResults.length === 0 ? (
                        <div className="col-span-full py-4 text-center text-xs text-[#786E65]">
                          No emojis found for "{emojiSearchQuery}"
                        </div>
                      ) : (
                        emojiResults.map((item, idx) => (
                          <button
                            key={`${item.character}-${idx}`}
                            type="button"
                            onClick={() => handleSelectEmojiFromPicker(item.character)}
                            title={item.unicodeName}
                            className="h-9 rounded-lg hover:bg-[#F3EFE6] flex items-center justify-center text-xl transition-transform active:scale-90"
                          >
                            {item.character}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Searchable GIF Picker Popover above Composer */}
                {showGifPicker && (
                  <div className="px-4 py-3 bg-white border-t border-[#D5C7B2] space-y-2.5 shrink-0 shadow-lg z-20 text-[#2C2520]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#2C2520]">
                        <span className="px-1.5 py-0.5 rounded bg-[#2C2520] text-white text-[10px] font-bold tracking-wider">
                          GIF
                        </span>
                        <span>GIF Picker (Click to attach or Send Now)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-52 sm:w-64">
                          <Search className="w-3.5 h-3.5 text-[#8C8075] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={gifSearchQuery}
                            onChange={(e) => setGifSearchQuery(e.target.value)}
                            placeholder="Search GIFs (e.g. goat, celebrate, funny)..."
                            className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-[#F7F4EF] border border-[#DFD7C8] text-xs text-[#2C2520] placeholder-[#9E9388] focus:outline-none focus:border-[#8C6D46]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowGifPicker(false)}
                          aria-label="Close GIF picker"
                          className="p-1 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {GIF_CATEGORIES.map((cat) => (
                        <button
                          key={cat.label}
                          type="button"
                          onClick={() => setGifSearchQuery(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                            gifSearchQuery.trim().toLowerCase() === cat.id
                              ? 'bg-[#2C2520] text-white'
                              : 'bg-[#F7F4EF] hover:bg-[#EFECE6] text-[#5C5349]'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="max-h-56 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                      {isLoadingGifs && gifResults.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-xs text-[#786E65] flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#8C6D46]" />
                          <span>Loading GIFs...</span>
                        </div>
                      ) : gifResults.length === 0 ? (
                        <div className="col-span-full py-6 text-center text-xs text-[#786E65]">
                          No GIFs found{gifSearchQuery ? ` for "${gifSearchQuery}"` : ''}. Try another search!
                        </div>
                      ) : (
                        gifResults.map((gif) => (
                          <div
                            key={gif.id}
                            className="group relative aspect-square rounded-xl overflow-hidden bg-[#F7F4EF] border border-[#E5DEC9] hover:border-[#2C2520] transition-all"
                          >
                            <img
                              src={gif.previewUrl || gif.url}
                              alt={gif.title}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              onClick={() => handleSelectGif(gif.url, false)}
                              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-center justify-between gap-1">
                              <button
                                type="button"
                                onClick={() => handleSelectGif(gif.url, false)}
                                className="px-2 py-1 rounded bg-white text-[#2C2520] text-[10px] font-bold hover:bg-[#F7F4EF] truncate"
                              >
                                Attach
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectGif(gif.url, true)}
                                className="px-2 py-1 rounded bg-[#8C6D46] text-white text-[10px] font-bold hover:bg-[#735836] shrink-0"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* '@' Call / Mention Member Popover above Composer */}
                {showMentionMenu && (
                  <div className="px-4 py-2.5 bg-[#F7F4EF] border-t border-[#D5C7B2] flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#2C2520]">
                      <AtSign className="w-3.5 h-3.5 text-[#8C6D46]" />
                      <span>Call someone with @:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(!mentionFilter || 'all'.startsWith(mentionFilter) || 'everyone'.startsWith(mentionFilter)) && (
                        <button
                          type="button"
                          onClick={() => handleInsertMention('all')}
                          className="px-2.5 py-1.5 rounded-lg bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Users className="w-3.5 h-3.5 text-[#D99B66]" />
                          <span>@all (Everyone)</span>
                        </button>
                      )}
                      {ALL_USER_IDS.filter((id) => {
                        if (!mentionFilter) return true;
                        const aliases: Record<UserId, string[]> = {
                          afiyyy: ['afi', 'afiy', 'afiyy', 'afiyyy', 'afiyah'],
                          nomi: ['nomi', 'nomani', 'nomanini', 'noman'],
                          sofi: ['sofi', 'sofia'],
                          yufi: ['yufi', 'yusuf', 'yufifi'],
                        };
                        return aliases[id].some((a) => a.startsWith(mentionFilter));
                      }).map((id) => {
                        const m = getEffectiveMember(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleInsertMention(id)}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#DFD7C8] text-xs font-semibold text-[#2C2520] flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            {m.avatarUrl ? (
                              <img
                                src={m.avatarUrl}
                                alt={m.displayName}
                                referrerPolicy="no-referrer"
                                className="w-4 h-4 rounded-sm object-cover"
                              />
                            ) : (
                              <span
                                className="w-4 h-4 rounded-sm text-[9px] text-white font-bold flex items-center justify-center"
                                style={{ backgroundColor: m.accentColor }}
                              >
                                {m.avatarInitials}
                              </span>
                            )}
                            <span>@{m.displayName}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowMentionMenu(false)}
                        aria-label="Close mention menu"
                        className="p-1 text-[#786E65] hover:text-[#2C2520]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* "Do you want an effect?" Prompt Banner when typing random long words like "AHHHHHH" or "BOOOOOO" */}
                <AnimatePresence>
                  {showEffectPrompt && (
                    <motion.div
                      key="bloom-effect-prompt"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.16 }}
                      className="px-4 py-2.5 bg-gradient-to-r from-rose-50 via-fuchsia-50 to-amber-50 border-t border-pink-200 flex flex-wrap items-center justify-between gap-2 shrink-0"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#2C2520]">
                        <Sparkles className="w-4 h-4 text-fuchsia-600 shrink-0" />
                        <span>Do you want an effect?</span>
                        <span className="text-[#6E645B] font-normal">
                          Click the <strong>Effect</strong> button next to Send for the Bloom effect!
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentUser) {
                              unlockBloomForUser(currentUser);
                            }
                            setIsBloomEffectArmed(true);
                            setShowEffectPrompt(false);
                            messageInputRef.current?.focus();
                          }}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Yes, Turn On Effect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEffectPrompt(false)}
                          className="p-1 text-[#786E65] hover:text-[#2C2520]"
                          aria-label="Dismiss effect prompt"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message Composer Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className={`p-3 sm:p-4 border-t flex items-center gap-2.5 sm:gap-3 shrink-0 transition-colors duration-200 ${themeSurfaceClass}`}
                >
                  {activeMember.avatarUrl ? (
                    <img
                      src={activeMember.avatarUrl}
                      alt={activeMember.displayName}
                      referrerPolicy="no-referrer"
                      title={`Messaging as ${currentUser}`}
                      className="hidden sm:block w-9 h-9 rounded-xl object-cover shrink-0 border border-[#DFD7C8]"
                    />
                  ) : (
                    <div
                      className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center font-display text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: activeMember.accentColor }}
                      title={`Messaging as ${currentUser}`}
                    >
                      {activeMember.avatarInitials}
                    </div>
                  )}

                  {/* Hidden File Input for Images & GIFs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageFileSelect}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => setShowGoogleImagesModal(true)}
                    disabled={isProcessingImage}
                    aria-label="Open Google Images"
                    title="Browse GIFs & Google Images (https://images.google.com/)"
                    className="px-3 py-3 rounded-xl bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] text-[#5C5349] hover:text-[#2C2520] transition-colors flex items-center justify-center gap-1.5 shrink-0 min-h-[44px]"
                  >
                    <Globe className="w-4 h-4 text-[#8C6D46]" />
                    <span className="hidden md:inline text-xs font-semibold">Images</span>
                  </button>

                  {/* GIF Picker Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker(false);
                      setShowGifPicker((prev) => !prev);
                    }}
                    aria-label="Open GIF Picker"
                    title="Open GIF Picker"
                    className={`px-3 py-3 rounded-xl border transition-colors flex items-center justify-center gap-1 shrink-0 min-h-[44px] ${
                      showGifPicker
                        ? 'bg-[#2C2520] text-white border-[#2C2520]'
                        : 'bg-[#F7F4EF] hover:bg-[#EFECE6] border-[#DFD7C8] text-[#2C2520]'
                    }`}
                  >
                    <span className="text-xs font-display font-extrabold tracking-wider">GIF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    aria-label="Attach image from device"
                    title="Upload image from device"
                    className="px-3 py-3 rounded-xl bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] text-[#5C5349] hover:text-[#2C2520] transition-colors flex items-center justify-center gap-1.5 shrink-0 min-h-[44px] min-w-[44px]"
                  >
                    <ImagePlus className="w-4 h-4 text-[#8C6D46]" />
                    <span className="hidden lg:inline text-xs font-semibold">Upload</span>
                  </button>

                  {/* One-Tap Easy Voice Transcribe Button */}
                  <button
                    type="button"
                    onClick={handleToggleQuickRecord}
                    disabled={isQuickTranscribing}
                    aria-label={
                      isQuickRecording
                        ? 'Stop voice transcribing'
                        : 'Click and talk to transcribe voice into text'
                    }
                    title={
                      isQuickRecording
                        ? 'Click to stop speaking'
                        : 'Tap once and talk! Automatically types what you say'
                    }
                    className={`px-3.5 py-3 rounded-xl border transition-all flex items-center justify-center gap-1.5 shrink-0 min-h-[44px] ${
                      isQuickRecording
                        ? 'bg-rose-700 hover:bg-rose-800 border-rose-800 text-white shadow-sm'
                        : 'bg-[#F7F4EF] hover:bg-[#EFECE6] border-[#DFD7C8] text-[#2C2520]'
                    }`}
                  >
                    {isQuickTranscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 text-[#8C6D46] animate-spin" />
                        <span className="text-xs font-semibold">Transcribing...</span>
                      </>
                    ) : isQuickRecording ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-semibold">
                          Stop ({quickRecordSeconds}s)
                        </span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-[#8C6D46]" />
                        <span className="text-xs font-semibold">Talk</span>
                      </>
                    )}
                  </button>

                  {/* '@' Button to Call / Mention Someone */}
                  <button
                    type="button"
                    onClick={handleToggleMentionPicker}
                    aria-label="Call someone with @"
                    title="Call someone with @"
                    className={`px-3 py-3 rounded-xl border transition-colors flex items-center justify-center gap-1 shrink-0 min-h-[44px] ${
                      showMentionMenu
                        ? 'bg-[#2C2520] text-white border-[#2C2520]'
                        : 'bg-[#F7F4EF] hover:bg-[#EFECE6] border-[#DFD7C8] text-[#2C2520]'
                    }`}
                  >
                    <AtSign className="w-4 h-4 text-[#8C6D46]" />
                  </button>

                  {/* Emoji API Picker Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEmojiTargetReactionMsgId(null);
                      setShowGifPicker(false);
                      setShowEmojiPicker((prev) => !prev);
                    }}
                    aria-label="Open Emoji Picker"
                    title="Open Emoji Picker"
                    className={`px-3 py-3 rounded-xl border transition-colors flex items-center justify-center gap-1.5 shrink-0 min-h-[44px] ${
                      showEmojiPicker
                        ? 'bg-[#2C2520] text-white border-[#2C2520]'
                        : 'bg-[#F7F4EF] hover:bg-[#EFECE6] border-[#DFD7C8] text-[#2C2520]'
                    }`}
                  >
                    <Smile className="w-4 h-4 text-[#8C6D46]" />
                    <span className="hidden xl:inline text-xs font-semibold">Emojis</span>
                  </button>

                  <input
                    ref={messageInputRef}
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onPaste={handlePaste}
                    placeholder={
                      selectedImage
                        ? `Add a caption as ${currentUser}...`
                        : activeRoom === SECRET_VENT_ROOM_ID
                        ? `Vent in Secret Vent as ${currentUser} (wipes when everyone leaves)...`
                        : activePrivatePeer
                        ? `Message ${activePrivatePeer.displayName} privately as ${currentUser}...`
                        : `Message or paste an image in ${groupName} as ${currentUser}...`
                    }
                    aria-label={`Message as ${currentUser}`}
                    className={`flex-1 border focus:border-[#8C6D46] rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${themeInputClass}`}
                  />

                  {/* Effect Button right next to the messaging (Send) button — only shown for nomi or once a user types a random long word like AHHHHHH or BOOOOOO */}
                  {(hasCurrentUserUnlockedBloom || showEffectPrompt || isBloomEffectArmed || hasRandomLongWord(messageInput)) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser) {
                          unlockBloomForUser(currentUser);
                        }
                        setShowEffectPrompt(false);
                        setIsBloomEffectArmed((prev) => !prev);
                      }}
                      title="Toggle Bloom Effect (saves automatically)"
                      className={`px-3.5 py-3 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[44px] ${
                        isBloomEffectArmed
                          ? 'bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-white shadow-md ring-2 ring-pink-300 scale-105'
                          : 'bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] text-[#2C2520]'
                      }`}
                    >
                      <Sparkles
                        className={`w-4 h-4 ${
                          isBloomEffectArmed ? 'text-white animate-spin' : 'text-fuchsia-600'
                        }`}
                      />
                      <span>{isBloomEffectArmed ? 'Bloom Effect ON' : 'Effect'}</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!messageInput.trim() && !selectedImage}
                    className={`px-5 py-3 rounded-xl disabled:opacity-40 disabled:pointer-events-none font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[44px] ${
                      isBloomEffectArmed
                        ? 'bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 hover:opacity-95 text-white shadow-md'
                        : 'bg-[#2C2520] hover:bg-[#3F362F] text-[#F7F4EF]'
                    }`}
                  >
                    <span>{isBloomEffectArmed ? 'Send with Bloom' : 'Send'}</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                </>
                )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* One-Time 30-Second Single Account Password Reveal Modal */}
      <AnimatePresence>
        {revealSecondsLeft > 0 && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="one-time-password-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-[#2C2520]/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-[#E5DEC9] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#F3EFE6] border border-[#DFD7C8] flex items-center justify-center text-[#8C6D46] shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2
                      id="one-time-password-title"
                      className="font-display text-lg font-bold text-[#2C2520]"
                    >
                      One-Time Password Reveal ({currentUser.toUpperCase()})
                    </h2>
                    <p className="text-xs text-rose-700 font-semibold mt-0.5">
                      Shown ONCE and never again · Disappears in {revealSecondsLeft}s
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#5C5349] leading-relaxed">
                Write down or memorize your single account password right now! Once the <strong className="text-[#2C2520]">{revealSecondsLeft}s</strong> timer finishes, this password will be hidden forever.
              </p>

              {/* Countdown Bar */}
              <div className="w-full h-2 bg-[#EFECE6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8C6D46] transition-all duration-1000"
                  style={{ width: `${(revealSecondsLeft / PASSWORD_REVEAL_SECONDS) * 100}%` }}
                />
              </div>

              {/* Single Password Card for Current Account */}
              <div className="p-4 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#6E645B] block">Account</span>
                  <span className="font-display text-base font-bold text-[#2C2520]">
                    {activeMember.displayName.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#6E645B] block">Your Password</span>
                  <span className="inline-block mt-0.5 px-3.5 py-1.5 rounded-lg bg-white border border-[#D5C7B2] font-mono-tabular text-lg font-bold text-[#2C2520] tracking-wider">
                    {activeMember.accountPassword}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setRevealSecondsLeft(0)}
                  className="w-full py-3 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold transition-colors"
                >
                  I Wrote It Down — Hide Now ({revealSecondsLeft}s)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Image Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full size image preview"
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-[#2C2520]/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[88vh] bg-white p-2.5 rounded-2xl border border-[#E5DEC9] shadow-2xl flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Close image preview"
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#2C2520]/80 hover:bg-[#2C2520] text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Full size attachment"
              referrerPolicy="no-referrer"
              className="max-h-[82vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {/* Modal: Propose or Manage Group Chat Name Change */}
      {showRenameModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-dialog-title"
          className="fixed inset-0 z-50 bg-[#2C2520]/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="rename-dialog-title"
                  className="font-display text-xl font-bold text-[#2C2520]"
                >
                  {activeCustomGroup ? 'Rename Custom Group Chat' : 'Change Main Group Chat Name'}
                </h2>
                <p className="text-xs text-[#6E645B] mt-1">
                  Current name:{' '}
                  <strong className="text-[#2C2520]">
                    {activeCustomGroup ? activeCustomGroup.name : groupName}
                  </strong>{' '}
                  · {activeCustomGroup ? 'Updates immediately' : 'Unanimous 4/4 agreement required'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                aria-label="Close rename modal"
                className="p-1.5 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProposeName} className="space-y-4">
              <div>
                <label
                  htmlFor="new-group-name-input"
                  className="block text-xs font-semibold text-[#2C2520] mb-2"
                >
                  New Group Name (as {activeMember.displayName})
                </label>
                <input
                  id="new-group-name-input"
                  type="text"
                  value={proposedNameInput}
                  onChange={(e) => setProposedNameInput(e.target.value)}
                  placeholder="e.g. THE LEGENDS, ULTRA GOATS..."
                  maxLength={40}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] text-sm text-[#2C2520] placeholder-[#9E9388] focus:outline-none"
                />
              </div>

              {!activeCustomGroup && (
                <div className="p-3.5 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] text-xs text-[#5C5349] space-y-1.5 leading-relaxed">
                  <div className="text-[#2C2520] font-semibold">
                    How the Unanimous Rule Works:
                  </div>
                  <p>
                    When you submit a new name, your vote (<strong className="text-[#2C2520]">{activeMember.displayName}</strong>) counts as 1/4. Once the other 3 members click <strong className="text-emerald-700">Agree</strong>, the group chat name automatically updates for everyone!
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !proposedNameInput.trim() ||
                    proposedNameInput.trim() ===
                      (activeCustomGroup ? activeCustomGroup.name : groupName)
                  }
                  className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                >
                  {activeCustomGroup ? 'Save Group Name' : 'Start 4/4 Rename Vote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create a New Custom Group Chat */}
      {showCreateGroupModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-group-dialog-title"
          className="fixed inset-0 z-50 bg-[#2C2520]/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="create-group-dialog-title"
                  className="font-display text-xl font-bold text-[#2C2520]"
                >
                  Make a Group Chat
                </h2>
                <p className="text-xs text-[#6E645B] mt-1">
                  Pick a group name and choose which members to include
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                aria-label="Close create group modal"
                className="p-1.5 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomGroup} className="space-y-4">
              <div>
                <label
                  htmlFor="create-group-name-input"
                  className="block text-xs font-semibold text-[#2C2520] mb-1.5"
                >
                  Group Chat Name
                </label>
                <input
                  id="create-group-name-input"
                  type="text"
                  value={newGroupNameInput}
                  onChange={(e) => setNewGroupNameInput(e.target.value)}
                  placeholder="e.g. Late Night Squad, Trio Chat, Study Group..."
                  maxLength={40}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] text-sm text-[#2C2520] placeholder-[#9E9388] focus:outline-none"
                />
              </div>

              <div>
                <div className="block text-xs font-semibold text-[#2C2520] mb-2">
                  Select Members ({newGroupMembers.length} selected)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_USER_IDS.map((uid) => {
                    const m = getEffectiveMember(uid);
                    const isCreator = uid === currentUser;
                    const isChecked = newGroupMembers.includes(uid) || isCreator;
                    return (
                      <button
                        key={uid}
                        type="button"
                        onClick={() => handleToggleNewGroupMember(uid)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-[#F7F4EF] border-[#8C6D46] text-[#2C2520]'
                            : 'bg-white border-[#E5DEC9] text-[#6E645B] opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: m.accentColor }}
                          >
                            {m.avatarInitials}
                          </div>
                          <span className="text-xs font-semibold truncate">
                            {m.displayName} {isCreator ? '(You)' : ''}
                          </span>
                        </div>
                        {isChecked && <Check className="w-3.5 h-3.5 text-[#8C6D46] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupNameInput.trim() || newGroupMembers.length < 2}
                  className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] disabled:opacity-40 text-white text-xs font-semibold"
                >
                  Create Group Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Your Name or Someone Else's Name */}
      {showMemberRenameModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-rename-dialog-title"
          className="fixed inset-0 z-50 bg-[#2C2520]/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="member-rename-dialog-title"
                  className="font-display text-xl font-bold text-[#2C2520]"
                >
                  Change Your Name or Someone Else's
                </h2>
                <p className="text-xs text-[#6E645B] mt-1">
                  Pick any member below to change their display name for everyone in real time
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMemberRenameModal(false)}
                aria-label="Close member rename modal"
                className="p-1.5 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMemberRename} className="space-y-4">
              <div>
                <div className="block text-xs font-semibold text-[#2C2520] mb-2">
                  Who do you want to rename?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_USER_IDS.map((uid) => {
                    const m = getEffectiveMember(uid);
                    const isSelected = renameTargetUser === uid;
                    return (
                      <button
                        key={uid}
                        type="button"
                        onClick={() => {
                          setRenameTargetUser(uid);
                          setMemberNewNameInput(getEffectiveMember(uid).displayName);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-colors ${
                          isSelected
                            ? 'bg-[#F7F4EF] border-[#8C6D46] text-[#2C2520]'
                            : 'bg-white border-[#E5DEC9] text-[#6E645B]'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: m.accentColor }}
                        >
                          {m.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{m.displayName}</div>
                          <div className="text-[10px] text-[#8C8075]">
                            {uid === currentUser ? 'Your account' : `@${uid}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="member-new-name-input"
                  className="block text-xs font-semibold text-[#2C2520] mb-1.5"
                >
                  New Name for {renameTargetUser.toUpperCase()}
                </label>
                <input
                  id="member-new-name-input"
                  type="text"
                  value={memberNewNameInput}
                  onChange={(e) => setMemberNewNameInput(e.target.value)}
                  placeholder={`Enter new name for ${renameTargetUser}...`}
                  maxLength={32}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] text-sm text-[#2C2520] placeholder-[#9E9388] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberRenameModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!memberNewNameInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] disabled:opacity-40 text-white text-xs font-semibold"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change the Website Name */}
      {showWebsiteRenameModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="website-rename-dialog-title"
          className="fixed inset-0 z-50 bg-[#2C2520]/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="website-rename-dialog-title"
                  className="font-display text-xl font-bold text-[#2C2520]"
                >
                  Change Website Name
                </h2>
                <p className="text-xs text-[#6E645B] mt-1">
                  Updates the top website title & browser tab title for everyone
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWebsiteRenameModal(false)}
                aria-label="Close website rename modal"
                className="p-1.5 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWebsiteRename} className="space-y-4">
              <div>
                <label
                  htmlFor="website-name-input"
                  className="block text-xs font-semibold text-[#2C2520] mb-1.5"
                >
                  New Website Name
                </label>
                <input
                  id="website-name-input"
                  type="text"
                  value={websiteNameInput}
                  onChange={(e) => setWebsiteNameInput(e.target.value)}
                  placeholder="e.g. GOATS HQ, The BINA Chat, Sigma Hub..."
                  maxLength={48}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] text-sm text-[#2C2520] placeholder-[#9E9388] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWebsiteRenameModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!websiteNameInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] disabled:opacity-40 text-white text-xs font-semibold"
                >
                  Save Website Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Quick Chat Background Picker (10 Options + Custom Upload) */}
      {showBackgroundsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="backgrounds-dialog-title"
          className="fixed inset-0 z-50 bg-[#2C2520]/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-xl max-h-[88vh] overflow-y-auto text-[#2C2520]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2
                  id="backgrounds-dialog-title"
                  className="font-display text-xl font-bold text-[#2C2520] flex items-center gap-2"
                >
                  <Palette className="w-5 h-5 text-[#8C6D46]" />
                  <span>Choose Chat Background ({CHAT_BACKGROUND_OPTIONS.length} Options)</span>
                </h2>
                <p className="text-xs text-[#6E645B] mt-1">
                  Click any of the {CHAT_BACKGROUND_OPTIONS.length} wallpapers below to set it as your chat background, or upload your own image
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={customBgQuickInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !file.type.startsWith('image/')) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const dataUrl = ev.target?.result as string;
                      if (!dataUrl) return;
                      handleUpdateSettings((prev) => ({
                        ...prev,
                        chatBackground: 'custom',
                        customBackgroundUrl: dataUrl,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => customBgQuickInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] text-xs font-semibold text-[#2C2520] flex items-center gap-1.5"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-[#8C6D46]" />
                  <span>Upload Image</span>
                </button>
                {appSettings.chatBackground !== 'none' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateSettings((prev) => ({
                        ...prev,
                        chatBackground: 'none',
                      }))
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
                  >
                    Default Solid
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowBackgroundsModal(false)}
                  aria-label="Close backgrounds modal"
                  className="p-1.5 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {CHAT_BACKGROUND_OPTIONS.map((bg) => {
                const isSelected = appSettings.chatBackground === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() =>
                      handleUpdateSettings((prev) => ({
                        ...prev,
                        chatBackground: bg.id as ChatBackgroundId,
                      }))
                    }
                    className={`group rounded-xl border overflow-hidden text-left transition-all flex flex-col ${
                      isSelected
                        ? 'border-[#2C2520] ring-2 ring-[#2C2520] bg-[#F7F4EF]'
                        : 'border-[#E5DEC9] hover:border-[#8C6D46] bg-white'
                    }`}
                  >
                    <div
                      className="w-full h-28 bg-center relative border-b border-[#E5DEC9]"
                      style={{
                        backgroundImage: `url("${bg.imageUrl}")`,
                        backgroundSize: bg.backgroundSize === 'cover' ? 'cover' : '150px 150px',
                        backgroundRepeat: bg.backgroundRepeat,
                      }}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#2C2520] text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="text-xs font-bold text-[#2C2520] truncate">
                        {bg.name}
                      </div>
                      <div className="text-[10px] text-[#6E645B] line-clamp-2 mt-0.5 leading-snug">
                        {bg.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowBackgroundsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Unread Messages Inbox */}
      {showUnreadModal && currentUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unread-dialog-title"
          className="fixed inset-0 z-50 bg-[#2C2520]/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-xl max-h-[88vh] overflow-y-auto text-[#2C2520]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="unread-dialog-title"
                  className="font-display text-xl font-bold text-[#2C2520] flex items-center gap-2"
                >
                  <Mail className="w-5 h-5 text-rose-600" />
                  <span>Unread Messages ({totalUnreadCount})</span>
                </h2>
                <p className="text-xs text-[#6E645B] mt-1">
                  All unread messages for <strong>{activeMember.displayName}</strong> across group & private chats. You can also mark any message as unread using the envelope icon on a message.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {totalUnreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMarkAllAsRead(currentUser)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MailOpen className="w-3.5 h-3.5" />
                    <span>Mark All Read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowUnreadModal(false)}
                  aria-label="Close unread modal"
                  className="p-1.5 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {totalUnreadCount === 0 ? (
              <div className="p-8 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] text-center space-y-2">
                <MailOpen className="w-8 h-8 text-[#8C6D46] mx-auto" />
                <div className="font-display font-bold text-sm text-[#2C2520]">
                  You're all caught up!
                </div>
                <p className="text-xs text-[#6E645B]">
                  No unread messages right now. Hover over any message and click the <strong>Mail</strong> icon (or click <strong>Mark Unread</strong> in the chat bar) to save a message as unread for later.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {messages
                  .filter((m) => {
                    const rId = m.roomId || 'group';
                    return canUserAccessRoom(currentUser, rId) && isMessageUnreadForUser(m, currentUser);
                  })
                  .map((m) => {
                    const rId = m.roomId || 'group';
                    const senderObj = m.sender === 'system' ? null : getEffectiveMember(m.sender);
                    const roomLabel =
                      rId === 'group'
                        ? `${groupName} (Main)`
                        : rId === NEVERLAND_ROOM_ID
                        ? NEVERLAND_GROUP_NAME
                        : rId === SECRET_VENT_ROOM_ID
                        ? 'Secret Vent'
                        : customGroups.find((g) => g.id === rId)?.name ||
                          PRIVATE_CHATS.find((p) => p.id === rId)?.label ||
                          rId;

                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-semibold text-[11px]">
                              {roomLabel}
                            </span>
                            <span className="font-bold text-[#2C2520]">
                              {senderObj ? senderObj.displayName : m.sender}
                            </span>
                            <span className="text-[11px] font-mono-tabular text-[#8C8075]">
                              {formatTime(m.timestamp, appSettings.timeFormat)}
                            </span>
                          </div>
                          <p className="text-xs text-[#2C2520] break-words line-clamp-2">
                            {m.text || (m.imageUrl ? '[Image Attachment]' : '')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectRoom(rId);
                              setShowUnreadModal(false);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold"
                          >
                            Open Chat
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowUnreadModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Badges & Message Milestones */}
      {showBadgesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="badges-dialog-title"
          className="fixed inset-0 z-50 bg-[#2C2520]/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="badges-dialog-title"
                  className="font-display text-xl font-bold text-[#2C2520] flex items-center gap-2"
                >
                  <Award className="w-5 h-5 text-[#8C6D46]" />
                  <span>Chat Badges & Milestones ({BADGE_DEFINITIONS.length})</span>
                </h2>
                <p className="text-xs text-[#6E645B] mt-1">
                  Unlock all {BADGE_DEFINITIONS.length} badges! Your current count:{' '}
                  <strong className="text-[#2C2520]">
                    {getUserMessageCount(currentUser)} messages
                  </strong>{' '}
                  ·{' '}
                  <strong className="text-[#8C6D46]">
                    {getEarnedBadges(currentUser).length}/{BADGE_DEFINITIONS.length} unlocked
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestartAllBadges}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold transition-colors"
                >
                  Restart Everyone's Badges
                </button>
                <button
                  type="button"
                  onClick={() => setShowBadgesModal(false)}
                  aria-label="Close badges modal"
                  className="p-1.5 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {BADGE_DEFINITIONS.map((badge) => {
                const myCount = getUserMessageCount(currentUser);
                const myEarned = getEarnedBadges(currentUser);
                const unlocked = myEarned.some((b) => b.id === badge.id);
                const progressPct =
                  badge.threshold !== undefined
                    ? Math.min(100, Math.round((myCount / badge.threshold) * 100))
                    : unlocked
                    ? 100
                    : 0;
                const membersWhoHaveIt = ALL_USER_IDS.filter((uid) =>
                  getEarnedBadges(uid).some((b) => b.id === badge.id)
                );

                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      unlocked
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-[#F7F4EF] border-[#DFD7C8]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white border border-[#DFD7C8] flex items-center justify-center text-2xl shrink-0">
                          {badge.iconEmoji}
                        </div>
                        <div>
                          <div className="font-display font-bold text-sm text-[#2C2520] flex flex-wrap items-center gap-2">
                            <span>{badge.title}</span>
                            {unlocked ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                                Unlocked ✓
                              </span>
                            ) : badge.threshold !== undefined ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#EFECE6] text-[#786E65] text-[10px] font-mono-tabular">
                                {myCount}/{badge.threshold}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-[#EFECE6] text-[#786E65] text-[10px] font-medium">
                                {badge.howToEarn}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5C5349] mt-0.5 font-medium">
                            Description: "{badge.description}"
                          </p>
                          <div className="text-[11px] text-[#786E65] mt-1.5">
                            Earned by:{' '}
                            {membersWhoHaveIt.length > 0
                              ? membersWhoHaveIt
                                  .map((u) => getEffectiveMember(u).displayName)
                                  .join(', ')
                              : 'Nobody yet'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-[#E5DEC9] rounded-full overflow-hidden mt-3">
                      <div
                        className="h-full bg-[#8C6D46] transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] text-xs text-[#5C5349] space-y-1">
              <div className="font-semibold text-[#2C2520] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-600" />
                <span>How to Get the Bloom Effect:</span>
              </div>
              <p>
                Only <strong>nomi</strong> starts with the Bloom Effect unlocked! For{' '}
                <strong>yufi</strong>, <strong>sofi</strong>, or <strong>afiyyy</strong> to get it,
                type a random long word like <strong>"AHHHHHH"</strong> or{' '}
                <strong>"BOOOOOO"</strong> in the message box—it will ask{' '}
                <em>"Do you want an effect?"</em> and unlock the <strong>Effect</strong> button next
                to Send!
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowBadgesModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Google Images & Web Image Search Modal */}
      <GoogleImagesModal
        isOpen={showGoogleImagesModal}
        onClose={() => setShowGoogleImagesModal(false)}
        onSelectImage={(imgUrl) => setSelectedImage(imgUrl)}
        onUploadFromDevice={() => fileInputRef.current?.click()}
        onRestrictedQuery={(warning) => triggerModerationWarning(warning)}
      />

      {/* Voice & Audio Transcriber Modal (Gemini 3.5 Transcribe) */}
      <TranscribeModal
        isOpen={showTranscribeModal}
        onClose={() => setShowTranscribeModal(false)}
        onInsertText={(text) =>
          setMessageInput((prev) => (prev ? `${prev} ${text}` : text))
        }
        onSendTranscriptNow={(text) => handleSendTextDirect(text)}
        onRestrictedContent={(warning) => triggerModerationWarning(warning)}
      />

      {/* Forgot Password Modal (Gmail / Outlook -> BOOM password sent -> Go Back -> 30s to change or keep) */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        userId={currentUser}
        member={activeMember}
        currentAccountPassword={activeMember.accountPassword}
        onCompleteRecoveryAndUnlock={handleCompleteRecoveryAndUnlock}
      />

      {/* Comprehensive Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={appSettings}
        onUpdateSettings={handleUpdateSettings}
        currentUser={currentUser}
        getEffectiveMember={getEffectiveMember}
        messages={messages}
        groupName={groupName}
        onLockCurrentAccount={() => {
          if (!currentUser) return;
          setUnlockedIdentities((prev) => prev.filter((id) => id !== currentUser));
        }}
        onResetLocalPasswordReveals={() => {
          setRevealedIdentities([]);
          saveLocalRevealedIdentities([]);
          sendEvent({ type: 'identity:reset-reveals' });
          if (currentUser) {
            setRevealSecondsLeft(PASSWORD_REVEAL_SECONDS);
          }
        }}
        onClearAllChatMessagesInRoom={() => {
          if (!currentUser) return;
          const myMsgsInRoom = messages.filter(
            (m) => m.sender === currentUser && (m.roomId || 'group') === activeRoom
          );
          myMsgsInRoom.forEach((m) => handleDeleteMessage(m.id));
        }}
      />

      {/* Bottom-Right Corner Badge Unlocked Notification Toast */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {badgeToastQueue.map((item) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.92 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto bg-[#2C2520] text-[#F7F4EF] border-2 border-amber-400 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-2xl shrink-0">
                {item.badge.iconEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>Badge Unlocked!</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setBadgeToastQueue((prev) => prev.filter((t) => t.key !== item.key))
                    }
                    aria-label="Dismiss badge notification"
                    className="p-0.5 rounded-md text-[#D8CBB8] hover:text-white hover:bg-white/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-display font-bold text-sm text-white mt-0.5">
                  {item.badge.title}
                </div>
                <p className="text-xs text-[#E5DEC9] mt-0.5 leading-snug">
                  {item.badge.description}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
