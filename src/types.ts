export type UserId = 'sofi' | 'afiyyy' | 'yufi' | 'nomi';

export interface MemberProfile {
  id: UserId;
  displayName: string;
  tagline: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  avatarInitials: string;
  avatarUrl?: string;
  accountPassword: string;
}

export const MEMBERS: Record<UserId, MemberProfile> = {
  sofi: {
    id: 'sofi',
    displayName: 'sofi',
    tagline: 'The Potato',
    accentColor: '#C25953',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    avatarInitials: 'SF',
    accountPassword: '1231',
  },
  afiyyy: {
    id: 'afiyyy',
    displayName: 'afiyyy',
    tagline: 'The Queen',
    accentColor: '#B87D3B',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    avatarInitials: 'AF',
    accountPassword: '1212',
  },
  yufi: {
    id: 'yufi',
    displayName: 'yufi',
    tagline: 'The Goat',
    accentColor: '#4A7C59',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    avatarInitials: 'YF',
    accountPassword: '1321',
  },
  nomi: {
    id: 'nomi',
    displayName: 'nomi',
    tagline: 'The Sigma',
    accentColor: '#4A6FA5',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    avatarInitials: 'NM',
    avatarUrl: '/src/assets/images/nomi_sigma_avatar_1791291791035.jpg',
    accountPassword: '1213',
  },
};

export const ALL_USER_IDS: UserId[] = ['sofi', 'afiyyy', 'yufi', 'nomi'];

export type RoomId =
  | 'group'
  | 'secret-vent'
  | 'neverland'
  | 'nomi-yufi'
  | 'sofi-yufi'
  | 'afiyyy-yufi'
  | 'nomi-sofi'
  | 'nomi-afiyyy'
  | 'afiyyy-sofi'
  | string;

export const SECRET_VENT_ROOM_ID = 'secret-vent';
export const SECRET_VENT_PASSCODE = '4321';
export const NEVERLAND_ROOM_ID = 'neverland';
export const NEVERLAND_GROUP_NAME = 'NEVERLAND';
export const NEVERLAND_LYRICS_MAX_LENGTH = 5000;
export const SUNO_CREATE_URL = 'https://suno.com/create';

export interface NeverlandLyricEntry {
  id: string;
  title: string;
  lyrics: string;
  author: UserId;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface NeverlandPlanItem {
  id: string;
  title: string;
  details: string;
  assignedTo: UserId | 'all';
  status: 'planned' | 'in-progress' | 'done';
  createdBy: UserId;
  createdAt: string;
}

export interface NeverlandProfile {
  avatarEmoji: string;
  avatarUrl?: string;
  tagline: string;
  genre: string;
  bannerTheme: 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan';
  memberRoles: Record<UserId, string>;
  updatedBy?: UserId;
  updatedAt?: string;
}

export const DEFAULT_NEVERLAND_PROFILE: NeverlandProfile = {
  avatarEmoji: '🎵',
  avatarUrl: '',
  tagline: 'Musical Group with Everyone (sofi · afiyyy · yufi · nomi) · Clean Lyrics Only',
  genre: 'Pop · Melodic Rap · Indie Anthem',
  bannerTheme: 'indigo',
  memberRoles: {
    sofi: 'Vocals & Melodies',
    afiyyy: 'Lead Vocals & Hooks',
    yufi: 'Beats & Production',
    nomi: 'Lyrics & Direction',
  },
};

export interface CustomGroupChat {
  id: string;
  name: string;
  members: UserId[];
  createdBy: UserId;
  createdAt: string;
}

export interface PrivateChatConfig {
  id: string;
  participants: [UserId, UserId];
  label: string;
}

export const PRIVATE_CHATS: PrivateChatConfig[] = [
  {
    id: 'nomi-yufi',
    participants: ['nomi', 'yufi'],
    label: 'nomi & yufi',
  },
  {
    id: 'sofi-yufi',
    participants: ['sofi', 'yufi'],
    label: 'sofi & yufi',
  },
  {
    id: 'afiyyy-yufi',
    participants: ['afiyyy', 'yufi'],
    label: 'afiyyy & yufi',
  },
  {
    id: 'nomi-sofi',
    participants: ['nomi', 'sofi'],
    label: 'nomi & sofi',
  },
  {
    id: 'nomi-afiyyy',
    participants: ['nomi', 'afiyyy'],
    label: 'nomi & afiyyy',
  },
  {
    id: 'afiyyy-sofi',
    participants: ['afiyyy', 'sofi'],
    label: 'afiyyy & sofi',
  },
];

export interface MessageReaction {
  emoji: string;
  users: UserId[];
}

export interface ChatMessage {
  id: string;
  roomId?: RoomId;
  sender: UserId | 'system';
  text: string;
  imageUrl?: string;
  effect?: 'bloom';
  timestamp: string;
  editedAt?: string;
  type: 'chat' | 'system' | 'proposal_event';
  replyToId?: string;
  reactions: Record<string, UserId[]>;
  readBy?: UserId[];
}

export interface NameProposal {
  id: string;
  proposedName: string;
  proposedBy: UserId;
  createdAt: string;
  approvals: UserId[];
  rejections: UserId[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface GroupNameHistoryEntry {
  id: string;
  oldName: string;
  newName: string;
  proposedBy: UserId;
  approvedAt: string;
}

export type BadgeId =
  | 'first_text'
  | 'a_hunnid'
  | 'legend'
  | 'among_us'
  | 'i_agree'
  | 'boo'
  | 'japan_bloom'
  | 'celebrate_gm'
  | 'rockstar_song';

export interface BadgeDefinition {
  id: BadgeId;
  title: string;
  subtitle?: string;
  description: string;
  threshold?: number;
  iconEmoji: string;
  howToEarn: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_text',
    title: 'First ever text',
    description: 'Giddy up for the adventure!',
    threshold: 1,
    iconEmoji: '🤠',
    howToEarn: 'Send your first message',
  },
  {
    id: 'a_hunnid',
    title: "A hunnid': A hundred messages",
    description: 'You text too much!',
    threshold: 100,
    iconEmoji: '💯',
    howToEarn: 'Send 100 messages',
  },
  {
    id: 'legend',
    title: 'LEGEND: A thousand messages',
    description: "Noman probably didn't get it first!",
    threshold: 1000,
    iconEmoji: '👑',
    howToEarn: 'Send 1,000 messages',
  },
  {
    id: 'among_us',
    title: 'Among Us?: Secret Vent',
    description: 'Ooh, I think Yusuf is the imposter!',
    iconEmoji: '📮',
    howToEarn: 'Unlock or message in Secret Vent (Code: 4321)',
  },
  {
    id: 'i_agree',
    title: 'I Agree: Changed Name',
    description: 'No way, that is so rare!',
    iconEmoji: '🤝',
    howToEarn: 'Agree on a Group Name change',
  },
  {
    id: 'boo',
    title: 'Boo!: Not Agreed',
    description: "No, I don't like the name!",
    iconEmoji: '👻',
    howToEarn: 'Disagree / Veto a Group Name change',
  },
  {
    id: 'japan_bloom',
    title: 'Japan?: Bloom Effect',
    description: "Ni Hao, no that's Chinese...",
    iconEmoji: '🌸',
    howToEarn: 'Use or unlock the Bloom Effect',
  },
  {
    id: 'celebrate_gm',
    title: 'Celebrate!: Google Meet',
    description: 'Finally, a time to rest with friends... WAIT I HAVE HOMEWORK.',
    iconEmoji: '🎉',
    howToEarn: 'Open or share a Google Meet link (or Friday 3:00 PM GM link)',
  },
  {
    id: 'rockstar_song',
    title: "I'm A Rockstar!: Published Song",
    description: 'I published the song, that took so long. Get it? It rhymes?',
    iconEmoji: '🎸',
    howToEarn: 'Publish a song in NEVERLAND Lyrics Studio',
  },
];

export interface ServerState {
  groupName: string;
  websiteName?: string;
  customDisplayNames?: Partial<Record<UserId, string>>;
  customGroups?: CustomGroupChat[];
  ventUsers?: UserId[];
  bloomUnlockedUsers?: UserId[];
  userMessageCounts?: Partial<Record<UserId, number>>;
  unlockedBadges?: Partial<Record<UserId, BadgeId[]>>;
  neverlandLyrics?: NeverlandLyricEntry[];
  neverlandPlans?: NeverlandPlanItem[];
  neverlandProfile?: NeverlandProfile;
  messages: ChatMessage[];
  activeProposal: NameProposal | null;
  nameHistory: GroupNameHistoryEntry[];
  onlineUsers: UserId[];
  typingUsers: UserId[];
  revealedIdentities?: UserId[];
  customPasswords?: Partial<Record<UserId, string>>;
}

export type ClientEvent =
  | { type: 'user:identify'; userId: UserId }
  | { type: 'identity:mark-revealed'; userId: UserId }
  | { type: 'identity:reset-reveals' }
  | { type: 'account:update-password'; userId: UserId; newPassword: string }
  | { type: 'member:rename'; actorId: UserId; targetUserId: UserId; newDisplayName: string }
  | { type: 'website:rename'; actorId: UserId; newWebsiteName: string }
  | { type: 'group:create'; creatorId: UserId; name: string; members: UserId[] }
  | { type: 'group:rename'; actorId: UserId; groupId: string; newName: string }
  | { type: 'vent:join'; userId: UserId }
  | { type: 'vent:leave'; userId: UserId }
  | { type: 'bloom:unlock'; userId: UserId }
  | { type: 'badge:unlock'; userId: UserId; badgeId: BadgeId }
  | { type: 'badges:reset-all' }
  | {
      type: 'neverland:profile-update';
      userId: UserId;
      profile: Partial<NeverlandProfile>;
    }
  | {
      type: 'neverland:lyric-save';
      id?: string;
      userId: UserId;
      title: string;
      lyrics: string;
      status: 'draft' | 'published';
    }
  | { type: 'neverland:lyric-delete'; id: string; userId: UserId }
  | {
      type: 'neverland:plan-add';
      userId: UserId;
      title: string;
      details: string;
      assignedTo: UserId | 'all';
    }
  | {
      type: 'neverland:plan-status';
      id: string;
      userId: UserId;
      status: 'planned' | 'in-progress' | 'done';
    }
  | { type: 'neverland:plan-delete'; id: string; userId: UserId }
  | { type: 'message:send'; id: string; roomId?: RoomId; sender: UserId; text: string; imageUrl?: string; effect?: 'bloom'; replyToId?: string }
  | { type: 'message:edit'; messageId: string; userId: UserId; newText: string; effect?: 'bloom' | null }
  | { type: 'message:effect'; messageId: string; userId: UserId; effect?: 'bloom' | null }
  | { type: 'message:delete'; messageId: string; userId: UserId }
  | { type: 'message:react'; messageId: string; userId: UserId; emoji: string }
  | { type: 'message:mark-read'; userId: UserId; roomId?: RoomId; messageIds?: string[] }
  | { type: 'message:mark-unread'; userId: UserId; messageId?: string; roomId?: RoomId }
  | { type: 'typing:set'; userId: UserId; isTyping: boolean }
  | { type: 'name:propose'; userId: UserId; proposedName: string }
  | { type: 'name:vote'; userId: UserId; vote: 'approve' | 'reject' }
  | { type: 'name:cancel'; userId: UserId };

export type ServerEvent =
  | { type: 'state:init'; state: ServerState }
  | { type: 'state:sync'; state: ServerState }
  | { type: 'identity:revealed-updated'; revealedIdentities: UserId[] }
  | { type: 'account:passwords-updated'; customPasswords: Partial<Record<UserId, string>> }
  | { type: 'member:names-updated'; customDisplayNames: Partial<Record<UserId, string>> }
  | { type: 'website:name-updated'; websiteName: string }
  | { type: 'groups:updated'; customGroups: CustomGroupChat[] }
  | { type: 'vent:updated'; ventUsers: UserId[]; cleared: boolean }
  | { type: 'bloom:unlocked-updated'; bloomUnlockedUsers: UserId[] }
  | { type: 'badges:counts-updated'; userMessageCounts: Partial<Record<UserId, number>> }
  | { type: 'badges:unlocked-updated'; unlockedBadges: Partial<Record<UserId, BadgeId[]>> }
  | {
      type: 'neverland:updated';
      neverlandLyrics: NeverlandLyricEntry[];
      neverlandPlans: NeverlandPlanItem[];
      neverlandProfile?: NeverlandProfile;
    }
  | { type: 'message:created'; message: ChatMessage }
  | { type: 'message:updated'; message: ChatMessage }
  | { type: 'message:deleted'; messageId: string }
  | { type: 'messages:read-updated'; messages: ChatMessage[] }
  | { type: 'message:blocked'; warning: string }
  | { type: 'presence:updated'; onlineUsers: UserId[]; typingUsers: UserId[] }
  | { type: 'name:updated'; groupName: string; activeProposal: NameProposal | null; nameHistory: GroupNameHistoryEntry[] };
