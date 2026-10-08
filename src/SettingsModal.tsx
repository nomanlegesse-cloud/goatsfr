import React, { useState, useRef } from 'react';
import {
  X,
  Palette,
  MessageSquare,
  Volume2,
  Shield,
  UserCheck,
  Database,
  RotateCcw,
  Download,
  Trash2,
  Check,
  ImagePlus,
  KeyRound,
  Lock,
  Sparkles,
} from 'lucide-react';
import { UserId, ALL_USER_IDS, MEMBERS, MemberProfile, ChatMessage } from './types';
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  ThemePreset,
  BubbleRadiusStyle,
  MessageDensity,
  FontScale,
  TimeFormatStyle,
  SoundEffectType,
  playUiSound,
  isDuringSchoolHours,
  getSchoolHoursLabel,
} from './settings';
import { CHAT_BACKGROUND_OPTIONS, ChatBackgroundId } from './backgrounds';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  currentUser: UserId | null;
  getEffectiveMember: (id: UserId) => MemberProfile;
  messages: ChatMessage[];
  groupName: string;
  onLockCurrentAccount: () => void;
  onResetLocalPasswordReveals: () => void;
  onClearAllChatMessagesInRoom: () => void;
}

type SettingsTab =
  | 'appearance'
  | 'chat'
  | 'sound'
  | 'privacy'
  | 'profiles'
  | 'data';

const ACCENT_SWATCHES = [
  '#C25953', // Terracotta Rose
  '#B87D3B', // Warm Ochre
  '#4A7C59', // Sage Moss
  '#4A6FA5', // Slate Blue
  '#7C5295', // Royal Plum
  '#2C2520', // Espresso Black
  '#0F766E', // Deep Teal
  '#B45309', // Burnt Amber
];

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentUser,
  getEffectiveMember,
  messages,
  groupName,
  onLockCurrentAccount,
  onResetLocalPasswordReveals,
  onClearAllChatMessagesInRoom,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [selectedProfileId, setSelectedProfileId] = useState<UserId>(
    currentUser || 'nomi'
  );
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const customBgInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusFeedback(msg);
    window.setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      onUpdateSettings((prev) => ({
        ...prev,
        chatBackground: 'custom',
        customBackgroundUrl: dataUrl,
      }));
      showToast('Custom wallpaper background applied!');
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      onUpdateSettings((prev) => ({
        ...prev,
        memberOverrides: {
          ...prev.memberOverrides,
          [selectedProfileId]: {
            ...(prev.memberOverrides[selectedProfileId] || {}),
            avatarUrl: dataUrl,
          },
        },
      }));
      showToast(`Updated profile photo for ${selectedProfileId}!`);
    };
    reader.readAsDataURL(file);
  };

  const handleExportTranscript = () => {
    const lines = messages.map(
      (m) => `[${new Date(m.timestamp).toLocaleString()}] (${m.roomId || 'group'}) ${m.sender}: ${m.text}`
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupName.toLowerCase().replace(/\s+/g, '-')}-chat-export.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded chat transcript!');
  };

  const selectedMember = getEffectiveMember(selectedProfileId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 bg-[#2C2520]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-4xl w-full h-[86vh] max-h-[740px] flex flex-col overflow-hidden shadow-2xl text-[#2C2520]">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5DEC9] flex items-center justify-between shrink-0">
          <div>
            <h2
              id="settings-modal-title"
              className="font-display text-xl font-bold text-[#2C2520]"
            >
              App Settings & Customization
            </h2>
            <p className="text-xs text-[#6E645B] mt-0.5">
              Customize themes, chat bubbles, sounds, privacy, profile avatars, and security
            </p>
          </div>
          <div className="flex items-center gap-2">
            {statusFeedback && (
              <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {statusFeedback}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="p-2 rounded-xl text-[#786E65] hover:text-[#2C2520] hover:bg-[#EFECE6] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body with Sidebar Tabs + Main Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Category Navigation */}
          <nav
            aria-label="Settings Categories"
            className="w-full md:w-60 bg-[#F7F4EF] border-b md:border-b-0 md:border-r border-[#E5DEC9] p-3 flex md:flex-col gap-1 overflow-x-auto shrink-0"
          >
            {[
              { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
              { id: 'chat', label: 'Chat & Bubbles', icon: MessageSquare },
              { id: 'sound', label: 'Sounds & Alerts', icon: Volume2 },
              { id: 'privacy', label: 'Privacy & Security', icon: Shield },
              { id: 'profiles', label: 'Member Profiles', icon: UserCheck },
              { id: 'data', label: 'Data & Reset', icon: Database },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as SettingsTab)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors whitespace-nowrap text-left ${
                    isActive
                      ? 'bg-[#2C2520] text-[#F7F4EF] shadow-xs'
                      : 'text-[#5C5349] hover:bg-[#EFECE6] hover:text-[#2C2520]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Settings Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            {/* TAB 1: APPEARANCE & THEME */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* 10 Chat Background Wallpapers */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h3 className="font-display text-base font-bold text-[#2C2520]">
                      Chat Background Wallpaper ({CHAT_BACKGROUND_OPTIONS.length} Options)
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        ref={customBgInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCustomBgUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => customBgInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#DFD7C8] text-xs font-semibold text-[#2C2520] flex items-center gap-1.5"
                      >
                        <ImagePlus className="w-3.5 h-3.5 text-[#8C6D46]" />
                        <span>Upload Custom Image</span>
                      </button>
                      {settings.chatBackground !== 'none' && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              chatBackground: 'none',
                            }));
                            showToast('Reset to solid theme background');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
                        >
                          Clear Wallpaper
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#6E645B] mb-3">
                    Pick any of the 10 wallpapers below for your chat background
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {CHAT_BACKGROUND_OPTIONS.map((bg) => {
                      const isSelected = settings.chatBackground === bg.id;
                      return (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              chatBackground: bg.id as ChatBackgroundId,
                            }));
                            showToast(`Background set to ${bg.name}!`);
                          }}
                          className={`group rounded-xl border overflow-hidden text-left transition-all flex flex-col ${
                            isSelected
                              ? 'border-[#2C2520] ring-2 ring-[#2C2520] bg-[#F7F4EF]'
                              : 'border-[#E5DEC9] hover:border-[#8C6D46] bg-white'
                          }`}
                        >
                          <div
                            className="w-full h-24 bg-center relative border-b border-[#E5DEC9]"
                            style={{
                              backgroundImage: `url("${bg.imageUrl}")`,
                              backgroundSize: bg.backgroundSize === 'cover' ? 'cover' : '140px 140px',
                              backgroundRepeat: bg.backgroundRepeat,
                            }}
                          >
                            {isSelected && (
                              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#2C2520] text-white flex items-center justify-center shadow-sm">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <div className="p-2">
                            <div className="text-[11px] font-bold text-[#2C2520] truncate">
                              {bg.name}
                            </div>
                            <div className="text-[10px] text-[#6E645B] line-clamp-1 mt-0.5">
                              {bg.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EFECE6]">
                  <h3 className="font-display text-base font-bold text-[#2C2520] mb-1">
                    Color Palette & Surface Theme
                  </h3>
                  <p className="text-xs text-[#6E645B] mb-3">
                    Choose your favorite white & beige variation or high-contrast dark espresso
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        {
                          id: 'white-beige',
                          name: 'Classic White & Beige',
                          desc: 'Warm alabaster canvas with crisp white cards',
                          previewBg: '#F7F4EF',
                          previewCard: '#FFFFFF',
                        },
                        {
                          id: 'warm-latte',
                          name: 'Warm Oat Latte',
                          desc: 'Richer sand and toasted latte tones',
                          previewBg: '#EFE7DA',
                          previewCard: '#FAF6F0',
                        },
                        {
                          id: 'pure-ivory',
                          name: 'Crisp Ivory Studio',
                          desc: 'Bright gallery white with subtle stone borders',
                          previewBg: '#FCFBF9',
                          previewCard: '#FFFFFF',
                        },
                        {
                          id: 'espresso-night',
                          name: 'Espresso Night Mode',
                          desc: 'Deep roasted espresso with warm cream text',
                          previewBg: '#1E1916',
                          previewCard: '#2A231F',
                        },
                      ] as const
                    ).map((preset) => {
                      const isSelected = settings.themePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            onUpdateSettings((prev) => ({
                              ...prev,
                              themePreset: preset.id as ThemePreset,
                            }))
                          }
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-[#2C2520] bg-[#F7F4EF] ring-1 ring-[#2C2520]'
                              : 'border-[#E5DEC9] hover:border-[#C5B49A]'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-[#2C2520]">
                              {preset.name}
                            </div>
                            <div className="text-[11px] text-[#6E645B] mt-0.5">
                              {preset.desc}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span
                              className="w-5 h-5 rounded-full border border-[#C5B49A]"
                              style={{ backgroundColor: preset.previewBg }}
                            />
                            <span
                              className="w-5 h-5 rounded-full border border-[#C5B49A]"
                              style={{ backgroundColor: preset.previewCard }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bubble Corner Style */}
                <div className="pt-4 border-t border-[#EFECE6]">
                  <h3 className="font-display text-sm font-bold text-[#2C2520] mb-2">
                    Message Bubble Shape
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        { id: 'rounded', label: 'Soft Rounded' },
                        { id: 'pill', label: 'Extra Pill' },
                        { id: 'sharp', label: 'Crisp Square' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings((prev) => ({
                            ...prev,
                            bubbleRadius: opt.id as BubbleRadiusStyle,
                          }))
                        }
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                          settings.bubbleRadius === opt.id
                            ? 'bg-[#2C2520] text-white border-[#2C2520]'
                            : 'bg-[#F7F4EF] text-[#5C5349] border-[#DFD7C8] hover:text-[#2C2520]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Spacing / Density & Font Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#EFECE6]">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#2C2520] mb-2">
                      Chat Spacing Density
                    </h3>
                    <div className="flex gap-2">
                      {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            onUpdateSettings((prev) => ({
                              ...prev,
                              messageDensity: d as MessageDensity,
                            }))
                          }
                          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold capitalize border ${
                            settings.messageDensity === d
                              ? 'bg-[#2C2520] text-white border-[#2C2520]'
                              : 'bg-[#F7F4EF] text-[#5C5349] border-[#DFD7C8]'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-sm font-bold text-[#2C2520] mb-2">
                      Message Text Size
                    </h3>
                    <div className="flex gap-2">
                      {(
                        [
                          { id: 'sm', label: 'Small' },
                          { id: 'md', label: 'Medium' },
                          { id: 'lg', label: 'Large' },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() =>
                            onUpdateSettings((prev) => ({
                              ...prev,
                              fontScale: f.id as FontScale,
                            }))
                          }
                          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border ${
                            settings.fontScale === f.id
                              ? 'bg-[#2C2520] text-white border-[#2C2520]'
                              : 'bg-[#F7F4EF] text-[#5C5349] border-[#DFD7C8]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* High Contrast Borders Toggle */}
                <div className="pt-4 border-t border-[#EFECE6] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#2C2520]">
                      High-Contrast Borders
                    </div>
                    <div className="text-xs text-[#6E645B]">
                      Make message bubble and card outlines sharper and more visible
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.highContrastBorders}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        highContrastBorders: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#2C2520] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CHAT & BUBBLES */}
            {activeTab === 'chat' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#2C2520] mb-2">
                    Timestamp Format
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        { id: '24h', label: '24-Hour (14:30)' },
                        { id: '12h', label: '12-Hour (2:30 PM)' },
                        { id: 'hidden', label: 'Hide Timestamps' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings((prev) => ({
                            ...prev,
                            timeFormat: t.id as TimeFormatStyle,
                          }))
                        }
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border ${
                          settings.timeFormat === t.id
                            ? 'bg-[#2C2520] text-white border-[#2C2520]'
                            : 'bg-[#F7F4EF] text-[#5C5349] border-[#DFD7C8]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#EFECE6]">
                  {[
                    {
                      key: 'showAvatarsInChat',
                      title: 'Show Profile Avatars Next to Messages',
                      desc: 'Display each member’s photo or initials beside every message bubble',
                    },
                    {
                      key: 'showTaglinesInChat',
                      title: 'Show Member Descriptions in Chat Header',
                      desc: 'Display titles like "The Sigma", "The Goat", "The Potato", and "The Queen" next to names in messages',
                    },
                    {
                      key: 'showSystemEvents',
                      title: 'Show System & Rename Vote Events in Stream',
                      desc: 'Display unanimous group name vote updates inside the message stream',
                    },
                    {
                      key: 'showReactionCounts',
                      title: 'Show Emoji Reaction Badges',
                      desc: 'Display quick reaction pills underneath messages',
                    },
                    {
                      key: 'animateMessages',
                      title: 'Message Entry & Exit Animations',
                      desc: 'Smooth spring animation when messages are sent or deleted',
                    },
                    {
                      key: 'animateRoomTransitions',
                      title: 'Smooth Room Transition Animations',
                      desc: 'Fade and slide transition when switching between GOATS and direct chats',
                    },
                    {
                      key: 'enterToSend',
                      title: 'Press Enter to Send Message',
                      desc: 'Send messages immediately when pressing Enter in the message box',
                    },
                    {
                      key: 'autoScrollOnNewMessage',
                      title: 'Auto-Scroll to Newest Message',
                      desc: 'Automatically scroll to the bottom when new messages arrive',
                    },
                  ].map((item) => {
                    const checked = Boolean(
                      settings[item.key as keyof AppSettings]
                    );
                    return (
                      <label
                        key={item.key}
                        className="p-3 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] flex items-center justify-between gap-4 cursor-pointer hover:border-[#C5B49A]"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#2C2520]">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[#6E645B] mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            onUpdateSettings((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-[#2C2520] rounded shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: SOUNDS & ALERTS */}
            {activeTab === 'sound' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-[#FFF8F1] border border-[#D99B66] flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#7A3E18]">
                      School Hours Auto-Mute Active ({getSchoolHoursLabel(currentUser)})
                    </div>
                    <div className="text-[11px] text-[#5C5349] mt-0.5 leading-relaxed">
                      No sound is played while in school:
                      <ul className="mt-1 space-y-0.5 list-disc list-inside">
                        <li>
                          <strong>yufi & nomi</strong>: 10:00 AM – 4:00 PM AST
                        </li>
                        <li>
                          <strong>sofi</strong>: 10:00 AM – 4:00 PM EEST
                        </li>
                        <li>
                          <strong>afiyyy</strong>: 11:00 AM – 5:00 PM
                        </li>
                      </ul>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                      isDuringSchoolHours(currentUser)
                        ? 'bg-rose-700 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isDuringSchoolHours(currentUser)
                      ? 'Muted (In School)'
                      : 'Outside School Hours'}
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="p-3.5 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-[#2C2520]">
                        Play Sound When Sending a Message
                      </div>
                      <div className="text-[11px] text-[#6E645B]">
                        Subtle audio feedback when you post a message
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundOnSend}
                      onChange={(e) =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          soundOnSend: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#2C2520]"
                    />
                  </label>

                  <label className="p-3.5 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-[#2C2520]">
                        Play Sound When Receiving a Message
                      </div>
                      <div className="text-[11px] text-[#6E645B]">
                        Alert sound when another member messages the chat
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundOnReceive}
                      onChange={(e) =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          soundOnReceive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#2C2520]"
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-[#EFECE6]">
                  <h3 className="font-display text-sm font-bold text-[#2C2520] mb-2">
                    Sound Effect Tone
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        { id: 'pop', label: 'Warm Pop' },
                        { id: 'chime', label: 'Soft Chime' },
                        { id: 'click', label: 'Tactile Click' },
                      ] as const
                    ).map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            soundEffectStyle: tone.id as SoundEffectType,
                          }));
                          playUiSound(tone.id, settings.soundVolume || 60, currentUser);
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border ${
                          settings.soundEffectStyle === tone.id
                            ? 'bg-[#2C2520] text-white border-[#2C2520]'
                            : 'bg-[#F7F4EF] text-[#5C5349] border-[#DFD7C8]'
                        }`}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EFECE6]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#2C2520]">
                      Sound Volume
                    </span>
                    <span className="text-xs font-mono-tabular text-[#8C6D46] font-bold">
                      {settings.soundVolume}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.soundVolume}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        soundVolume: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-[#2C2520] cursor-pointer"
                  />
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() =>
                        playUiSound(settings.soundEffectStyle, settings.soundVolume, currentUser)
                      }
                      className="px-4 py-2 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#2C2520]"
                    >
                      Test Sound Effect
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PRIVACY & SECURITY */}
            {activeTab === 'privacy' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  {[
                    {
                      key: 'broadcastTypingIndicator',
                      title: 'Broadcast My Typing Indicator',
                      desc: 'Let others see when you are typing a message',
                    },
                    {
                      key: 'showOthersTyping',
                      title: 'Show When Others Are Typing',
                      desc: 'Display the typing indicator bar above the message box',
                    },
                    {
                      key: 'blurImagesUntilClick',
                      title: 'Blur Shared Photos Until Hovered / Clicked',
                      desc: 'Keep uploaded images blurred in the chat stream until you interact with them',
                    },
                    {
                      key: 'autoLockOnSwitch',
                      title: 'Require Password Every Time You Switch Accounts',
                      desc: 'Automatically lock your current account when switching to another member',
                    },
                  ].map((item) => {
                    const checked = Boolean(
                      settings[item.key as keyof AppSettings]
                    );
                    return (
                      <label
                        key={item.key}
                        className="p-3.5 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#2C2520]">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[#6E645B] mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            onUpdateSettings((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-[#2C2520] shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DFD7C8] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2C2520]">
                    <KeyRound className="w-4 h-4 text-[#8C6D46]" />
                    <span>Account Password & One-Time Reveal Controls</span>
                  </div>
                  <p className="text-xs text-[#6E645B] leading-relaxed">
                    Lock your active session immediately or restart the 30-second one-time password reveal timer if you need to see the account passwords again.
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => {
                          onLockCurrentAccount();
                          onClose();
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Lock {currentUser.toUpperCase()} Now</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onResetLocalPasswordReveals();
                        showToast('Restarted one-time 30s password reveals!');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] border border-[#DFD7C8] text-[#2C2520] text-xs font-semibold flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart One-Time Password Reveal</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: MEMBER PROFILES CUSTOMIZATION */}
            {activeTab === 'profiles' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#2C2520] mb-2">
                    Select Member to Customize
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_USER_IDS.map((id) => {
                      const m = getEffectiveMember(id);
                      const isSel = selectedProfileId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedProfileId(id)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                            isSel
                              ? 'bg-[#2C2520] text-white border-[#2C2520]'
                              : 'bg-[#F7F4EF] text-[#2C2520] border-[#DFD7C8]'
                          }`}
                        >
                          {m.avatarUrl ? (
                            <img
                              src={m.avatarUrl}
                              alt={m.displayName}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <span
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ backgroundColor: m.accentColor }}
                            >
                              {m.avatarInitials}
                            </span>
                          )}
                          <span className="truncate">{id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Member Editor Card */}
                <div className="p-4 rounded-2xl bg-[#F7F4EF] border border-[#DFD7C8] space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {selectedMember.avatarUrl ? (
                        <img
                          src={selectedMember.avatarUrl}
                          alt={selectedMember.displayName}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover border border-[#C5B49A]"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center font-display text-xl font-bold text-white"
                          style={{ backgroundColor: selectedMember.accentColor }}
                        >
                          {selectedMember.avatarInitials}
                        </div>
                      )}
                      <div>
                        <div className="font-display text-lg font-bold text-[#2C2520]">
                          {selectedMember.displayName}
                        </div>
                        <div className="text-xs text-[#6E645B]">
                          {selectedMember.tagline}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EFECE6] border border-[#DFD7C8] text-xs font-semibold text-[#2C2520] flex items-center gap-1.5"
                      >
                        <ImagePlus className="w-3.5 h-3.5 text-[#8C6D46]" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Tagline / Description Input */}
                  <div>
                    <label className="block text-xs font-bold text-[#2C2520] mb-1.5">
                      Description / Title for {selectedProfileId}
                    </label>
                    <input
                      type="text"
                      value={selectedMember.tagline}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateSettings((prev) => ({
                          ...prev,
                          memberOverrides: {
                            ...prev.memberOverrides,
                            [selectedProfileId]: {
                              ...(prev.memberOverrides[selectedProfileId] || {}),
                              tagline: val,
                            },
                          },
                        }));
                      }}
                      maxLength={40}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFD7C8] text-xs text-[#2C2520] focus:outline-none focus:border-[#8C6D46]"
                    />
                  </div>

                  {/* Custom Accent Color Swatches */}
                  <div>
                    <label className="block text-xs font-bold text-[#2C2520] mb-2">
                      Name & Badge Accent Color
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {ACCENT_SWATCHES.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() =>
                            onUpdateSettings((prev) => ({
                              ...prev,
                              memberOverrides: {
                                ...prev.memberOverrides,
                                [selectedProfileId]: {
                                  ...(prev.memberOverrides[selectedProfileId] || {}),
                                  accentColor: hex,
                                },
                              },
                            }))
                          }
                          className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                            selectedMember.accentColor === hex
                              ? 'border-[#2C2520] scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: hex }}
                          aria-label={`Select accent color ${hex}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSettings((prev) => {
                          const nextOverrides = { ...prev.memberOverrides };
                          delete nextOverrides[selectedProfileId];
                          return {
                            ...prev,
                            memberOverrides: nextOverrides,
                          };
                        });
                        showToast(`Reset ${selectedProfileId} to default profile!`);
                      }}
                      className="text-xs text-[#786E65] hover:text-[#2C2520] underline"
                    >
                      Reset {selectedProfileId} to default ({MEMBERS[selectedProfileId].tagline})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: DATA & RESET */}
            {activeTab === 'data' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#2C2520]">
                      Export Chat Transcript (.txt)
                    </div>
                    <div className="text-[11px] text-[#6E645B] mt-0.5">
                      Download all messages from the current session as a text file
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportTranscript}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#EFECE6] border border-[#DFD7C8] text-xs font-semibold text-[#2C2520] flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#2C2520]">
                      Clear My Messages in Active Chat
                    </div>
                    <div className="text-[11px] text-[#6E645B] mt-0.5">
                      Delete all messages sent by {currentUser || 'you'} in the currently open room
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllChatMessagesInRoom();
                      showToast('Cleared your messages in this room!');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-1.5 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Mine</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F4EF] border border-[#E5DEC9] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#2C2520]">
                      Reset All Settings to Defaults
                    </div>
                    <div className="text-[11px] text-[#6E645B] mt-0.5">
                      Restore default White & Beige theme, bubble styles, sounds, and profiles
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings(() => DEFAULT_APP_SETTINGS);
                      showToast('All settings restored to defaults!');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-xs font-semibold text-white flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reset All</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
