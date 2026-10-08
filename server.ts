import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  UserId,
  ALL_USER_IDS,
  MEMBERS,
  SECRET_VENT_ROOM_ID,
  NEVERLAND_ROOM_ID,
  NEVERLAND_GROUP_NAME,
  NeverlandLyricEntry,
  NeverlandPlanItem,
  NeverlandProfile,
  DEFAULT_NEVERLAND_PROFILE,
  BadgeId,
  ChatMessage,
  NameProposal,
  GroupNameHistoryEntry,
  CustomGroupChat,
  ServerState,
  ClientEvent,
  ServerEvent,
} from './src/types.ts';
import {
  isContentRestricted,
  formatModerationWarning,
} from './src/moderation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'chat-state.json');
const EMOJI_API_KEY =
  process.env.EMOJI_API_KEY || 'eQaCJ590tyDq6mhjmYyBXeTTKVLzSkyox5CkZ8bp';
const KLIPY_API_KEY =
  process.env.KLIPY_API_KEY ||
  'NvuKButyiRRvMhJsz7gV2bp6intTgFwvabGjU2nsTLfpyVn96HOxwJcOroB2KNmz';

export interface GifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
}

const gifSearchCache = new Map<string, { timestamp: number; items: GifItem[] }>();

export interface EmojiItem {
  character: string;
  unicodeName: string;
  group: string;
}

const FALLBACK_EMOJIS: EmojiItem[] = [
  { character: '🐐', unicodeName: 'goat', group: 'animals-nature' },
  { character: '🔥', unicodeName: 'fire flame lit', group: 'travel-places' },
  { character: '💯', unicodeName: 'hundred points 100', group: 'symbols' },
  { character: '😂', unicodeName: 'face with tears of joy laugh', group: 'smileys-emotion' },
  { character: '🤣', unicodeName: 'rolling on the floor laughing rofl', group: 'smileys-emotion' },
  { character: '😭', unicodeName: 'loudly crying face sob', group: 'smileys-emotion' },
  { character: '💀', unicodeName: 'skull dead', group: 'smileys-emotion' },
  { character: '❤️', unicodeName: 'red heart love', group: 'smileys-emotion' },
  { character: '👀', unicodeName: 'eyes looking', group: 'people-body' },
  { character: '👑', unicodeName: 'crown king legend', group: 'objects' },
  { character: '🎉', unicodeName: 'party popper celebrate', group: 'activities' },
  { character: '✨', unicodeName: 'sparkles magic bloom', group: 'activities' },
  { character: '🌸', unicodeName: 'cherry blossom flower japan', group: 'animals-nature' },
  { character: '🤠', unicodeName: 'cowboy hat face giddy up', group: 'smileys-emotion' },
  { character: '📮', unicodeName: 'postbox vent among us', group: 'objects' },
  { character: '🤝', unicodeName: 'handshake agree deal', group: 'people-body' },
  { character: '👻', unicodeName: 'ghost boo', group: 'smileys-emotion' },
  { character: '👎', unicodeName: 'thumbs down disagree boo', group: 'people-body' },
  { character: '👍', unicodeName: 'thumbs up approve yes', group: 'people-body' },
  { character: '😎', unicodeName: 'smiling face with sunglasses cool', group: 'smileys-emotion' },
  { character: '🥳', unicodeName: 'partying face celebrate', group: 'smileys-emotion' },
  { character: '🤯', unicodeName: 'exploding head mind blown', group: 'smileys-emotion' },
  { character: '🥺', unicodeName: 'pleading face', group: 'smileys-emotion' },
  { character: '😤', unicodeName: 'face with steam from nose', group: 'smileys-emotion' },
  { character: '😡', unicodeName: 'enraged face angry', group: 'smileys-emotion' },
  { character: '😱', unicodeName: 'face screaming in fear ahhhhh', group: 'smileys-emotion' },
  { character: '🤫', unicodeName: 'shushing face shh secret', group: 'smileys-emotion' },
  { character: '🫡', unicodeName: 'saluting face respect', group: 'smileys-emotion' },
  { character: '🫶', unicodeName: 'heart hands love', group: 'people-body' },
  { character: '🙌', unicodeName: 'raising hands hooray', group: 'people-body' },
  { character: '👏', unicodeName: 'clapping hands', group: 'people-body' },
  { character: '🙏', unicodeName: 'folded hands please thank you', group: 'people-body' },
  { character: '💪', unicodeName: 'flexed biceps strong', group: 'people-body' },
  { character: '🧠', unicodeName: 'brain smart', group: 'people-body' },
  { character: '🐝', unicodeName: 'honeybee bumblebee bee', group: 'animals-nature' },
  { character: '🧸', unicodeName: 'teddy bear cute', group: 'activities' },
  { character: '🐱', unicodeName: 'cat face kitty', group: 'animals-nature' },
  { character: '🐶', unicodeName: 'dog face puppy', group: 'animals-nature' },
  { character: '🦖', unicodeName: 't-rex dinosaur', group: 'animals-nature' },
  { character: '🐙', unicodeName: 'octopus', group: 'animals-nature' },
  { character: '🦋', unicodeName: 'butterfly', group: 'animals-nature' },
  { character: '🍀', unicodeName: 'four leaf clover luck', group: 'animals-nature' },
  { character: '🌻', unicodeName: 'sunflower daisy', group: 'animals-nature' },
  { character: '🌊', unicodeName: 'water wave beach ocean', group: 'travel-places' },
  { character: '☀️', unicodeName: 'sun sunny', group: 'travel-places' },
  { character: '🌙', unicodeName: 'crescent moon night', group: 'travel-places' },
  { character: '⭐', unicodeName: 'star', group: 'travel-places' },
  { character: '⚡', unicodeName: 'high voltage lightning zap', group: 'travel-places' },
  { character: '🍕', unicodeName: 'pizza slice', group: 'food-drink' },
  { character: '🍔', unicodeName: 'hamburger burger', group: 'food-drink' },
  { character: '🍟', unicodeName: 'french fries', group: 'food-drink' },
  { character: '🍦', unicodeName: 'soft ice cream', group: 'food-drink' },
  { character: '🍩', unicodeName: 'doughnut donut', group: 'food-drink' },
  { character: '🍓', unicodeName: 'strawberry', group: 'food-drink' },
  { character: '🧋', unicodeName: 'bubble tea boba', group: 'food-drink' },
  { character: '⚽', unicodeName: 'soccer ball football', group: 'activities' },
  { character: '🏀', unicodeName: 'basketball', group: 'activities' },
  { character: '🎮', unicodeName: 'video game controller gaming', group: 'activities' },
  { character: '🎵', unicodeName: 'musical note music soundtrap', group: 'objects' },
  { character: '🎧', unicodeName: 'headphone music', group: 'objects' },
  { character: '🎸', unicodeName: 'guitar rock', group: 'objects' },
  { character: '🚀', unicodeName: 'rocket launch space', group: 'travel-places' },
  { character: '💎', unicodeName: 'gem stone diamond', group: 'objects' },
  { character: '🏆', unicodeName: 'trophy winner', group: 'activities' },
  { character: '🥇', unicodeName: '1st place medal gold', group: 'activities' },
  { character: '🎀', unicodeName: 'ribbon bow cute', group: 'activities' },
  { character: '🎁', unicodeName: 'wrapped gift present', group: 'activities' },
  { character: '📚', unicodeName: 'books homework school', group: 'objects' },
  { character: '✏️', unicodeName: 'pencil school', group: 'objects' },
  { character: '💻', unicodeName: 'laptop computer meet', group: 'objects' },
  { character: '📱', unicodeName: 'mobile phone text', group: 'objects' },
  { character: '🔒', unicodeName: 'locked secret password', group: 'objects' },
  { character: '🔑', unicodeName: 'key unlock', group: 'objects' },
  { character: '💬', unicodeName: 'speech balloon chat', group: 'smileys-emotion' },
  { character: '💥', unicodeName: 'collision boom', group: 'smileys-emotion' },
  { character: '💫', unicodeName: 'dizzy star', group: 'smileys-emotion' },
  { character: '🌈', unicodeName: 'rainbow', group: 'travel-places' },
];

let cachedApiEmojis: EmojiItem[] | null = null;
let lastEmojiFetchAt = 0;

interface PersistedData {
  groupName: string;
  websiteName?: string;
  customDisplayNames?: Partial<Record<UserId, string>>;
  customGroups?: CustomGroupChat[];
  bloomUnlockedUsers?: UserId[];
  userMessageCounts?: Partial<Record<UserId, number>>;
  unlockedBadges?: Partial<Record<UserId, BadgeId[]>>;
  neverlandLyrics?: NeverlandLyricEntry[];
  neverlandPlans?: NeverlandPlanItem[];
  neverlandProfile?: NeverlandProfile;
  messages: ChatMessage[];
  activeProposal: NameProposal | null;
  nameHistory: GroupNameHistoryEntry[];
  revealedIdentities?: UserId[];
  customPasswords?: Partial<Record<UserId, string>>;
  accountPasswordModelVersion?: number;
  badgesResetVersion?: number;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-seed-1',
    sender: 'system',
    text: 'Group chat "GOATS" initialized. All 4 members (sofi, afiyyy, yufi, nomi) must agree to rename the chat.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    type: 'system',
    reactions: {},
  },
  {
    id: 'msg-seed-2',
    sender: 'sofi',
    text: 'yo everyone made it in!! welcome to GOATS HQ',
    timestamp: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    type: 'chat',
    reactions: { '🐐': ['afiyyy', 'yufi', 'nomi'] },
    readBy: ['sofi', 'afiyyy', 'yufi', 'nomi'],
  },
  {
    id: 'msg-seed-3',
    sender: 'afiyyy',
    text: 'finally a spot where nobody can change the group name without all 4 of us agreeing lol',
    timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    type: 'chat',
    reactions: { '💯': ['sofi', 'nomi'] },
    readBy: ['sofi', 'afiyyy', 'yufi', 'nomi'],
  },
  {
    id: 'msg-seed-4',
    sender: 'yufi',
    text: 'wait so if i try to rename it to something chaotic, you all have to vote yes??',
    timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    type: 'chat',
    reactions: { '😂': ['sofi', 'afiyyy'] },
    readBy: ['sofi', 'afiyyy', 'yufi', 'nomi'],
  },
  {
    id: 'msg-seed-5',
    sender: 'nomi',
    text: 'yep, 4/4 unanimous consensus required. democracy in action.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    type: 'chat',
    replyToId: 'msg-seed-4',
    reactions: { '🔥': ['sofi', 'afiyyy', 'yufi'] },
    readBy: ['sofi', 'afiyyy', 'yufi', 'nomi'],
  },
];

function loadState(): PersistedData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedData;
      if (parsed && typeof parsed.groupName === 'string' && Array.isArray(parsed.messages)) {
        if (parsed.accountPasswordModelVersion !== 4) {
          parsed.revealedIdentities = [];
          parsed.accountPasswordModelVersion = 4;
          fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        }
        if (parsed.badgesResetVersion !== 2) {
          parsed.userMessageCounts = {
            sofi: 0,
            afiyyy: 0,
            yufi: 0,
            nomi: 0,
          };
          parsed.unlockedBadges = {
            sofi: [],
            afiyyy: [],
            yufi: [],
            nomi: [],
          };
          parsed.badgesResetVersion = 2;
          fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load persisted chat state, using seed data:', err);
  }
  return {
    groupName: 'GOATS',
    messages: INITIAL_MESSAGES,
    activeProposal: null,
    nameHistory: [
      {
        id: 'hist-init',
        oldName: 'Untitled Group',
        newName: 'GOATS',
        proposedBy: 'nomi',
        approvedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ],
  };
}

let persisted: PersistedData = loadState();

function saveState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(persisted, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save chat state:', err);
  }
}

// Track connected clients and which persona they selected
const clientIdentity = new Map<WebSocket, UserId>();
const typingMap = new Map<UserId, NodeJS.Timeout>();
const activeVentUsers = new Set<UserId>();

function getOnlineUsers(): UserId[] {
  const set = new Set<UserId>();
  for (const [, userId] of clientIdentity.entries()) {
    set.add(userId);
  }
  return Array.from(set);
}

function getVentUsers(): UserId[] {
  return Array.from(activeVentUsers);
}

function getTypingUsers(): UserId[] {
  return Array.from(typingMap.keys());
}

function computeUserMessageCounts(data: PersistedData): Partial<Record<UserId, number>> {
  const counts: Partial<Record<UserId, number>> = {
    sofi: 0,
    afiyyy: 0,
    yufi: 0,
    nomi: 0,
  };
  for (const uid of ALL_USER_IDS) {
    if (data.userMessageCounts && typeof data.userMessageCounts[uid] === 'number') {
      counts[uid] = data.userMessageCounts[uid]!;
    }
  }
  return counts;
}

function awardBadge(userId: UserId, badgeId: BadgeId): boolean {
  if (!persisted.unlockedBadges) {
    persisted.unlockedBadges = {};
  }
  const list = persisted.unlockedBadges[userId] || [];
  if (!list.includes(badgeId)) {
    persisted.unlockedBadges[userId] = [...list, badgeId];
    return true;
  }
  return false;
}

function getFullState(): ServerState {
  if (!Array.isArray(persisted.bloomUnlockedUsers)) {
    // Only nomi has unlocked the bloom effect initially; yufi, sofi, and afiyyy unlock it when they type a random long word like AHHHHHH or BOOOOOO!
    persisted.bloomUnlockedUsers = ['nomi'];
  }
  if (!Array.isArray(persisted.neverlandLyrics)) {
    persisted.neverlandLyrics = [
      {
        id: 'lyric-seed-1',
        title: 'Welcome to NEVERLAND (Anthem)',
        lyrics:
          'Floating through the stars tonight,\nFour voices shining bright.\nNo turning back, we own the sound,\nIn NEVERLAND where dreams are found!',
        author: 'nomi',
        status: 'published',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ];
  }
  if (!Array.isArray(persisted.neverlandPlans)) {
    persisted.neverlandPlans = [
      {
        id: 'plan-seed-1',
        title: 'Write Opening Verse & Chorus Hook',
        details: 'Everyone drops their favorite clean melody lines and chorus ideas in the Lyrics Studio.',
        assignedTo: 'all',
        status: 'in-progress',
        createdBy: 'nomi',
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: 'plan-seed-2',
        title: 'Record Vocals & Beat in Soundtrap',
        details: 'Sync our published NEVERLAND lyrics with the beat and test harmonies.',
        assignedTo: 'all',
        status: 'planned',
        createdBy: 'yufi',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ];
  }
  if (!persisted.neverlandProfile || typeof persisted.neverlandProfile !== 'object') {
    persisted.neverlandProfile = { ...DEFAULT_NEVERLAND_PROFILE };
  }
  return {
    groupName: persisted.groupName,
    websiteName: persisted.websiteName || 'GOATS Group Chat',
    customDisplayNames: persisted.customDisplayNames || {},
    customGroups: persisted.customGroups || [],
    ventUsers: getVentUsers(),
    bloomUnlockedUsers: persisted.bloomUnlockedUsers,
    userMessageCounts: computeUserMessageCounts(persisted),
    unlockedBadges: persisted.unlockedBadges || {},
    neverlandLyrics: persisted.neverlandLyrics,
    neverlandPlans: persisted.neverlandPlans,
    neverlandProfile: persisted.neverlandProfile,
    messages: persisted.messages,
    activeProposal: persisted.activeProposal,
    nameHistory: persisted.nameHistory,
    onlineUsers: getOnlineUsers(),
    typingUsers: getTypingUsers(),
    revealedIdentities: persisted.revealedIdentities || [],
    customPasswords: persisted.customPasswords || {},
  };
}

function broadcast( wss: WebSocketServer, event: ServerEvent) {
  const payload = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function handleClientAction(action: ClientEvent, wss: WebSocketServer, ws?: WebSocket) {
  switch (action.type) {
    case 'user:identify': {
      if (ALL_USER_IDS.includes(action.userId) && ws) {
        clientIdentity.set(ws, action.userId);
        broadcast(wss, {
          type: 'presence:updated',
          onlineUsers: getOnlineUsers(),
          typingUsers: getTypingUsers(),
        });
      }
      break;
    }

    case 'identity:mark-revealed': {
      if (ALL_USER_IDS.includes(action.userId)) {
        if (!persisted.revealedIdentities) {
          persisted.revealedIdentities = [];
        }
        if (!persisted.revealedIdentities.includes(action.userId)) {
          persisted.revealedIdentities.push(action.userId);
          saveState();
          broadcast(wss, {
            type: 'identity:revealed-updated',
            revealedIdentities: persisted.revealedIdentities,
          });
        }
      }
      break;
    }

    case 'identity:reset-reveals': {
      persisted.revealedIdentities = [];
      saveState();
      broadcast(wss, {
        type: 'identity:revealed-updated',
        revealedIdentities: [],
      });
      break;
    }

    case 'account:update-password': {
      const { userId, newPassword } = action;
      const cleanPass = (newPassword || '').trim().slice(0, 32);
      if (ALL_USER_IDS.includes(userId) && cleanPass.length > 0) {
        if (!persisted.customPasswords) {
          persisted.customPasswords = {};
        }
        persisted.customPasswords[userId] = cleanPass;
        saveState();
        broadcast(wss, {
          type: 'account:passwords-updated',
          customPasswords: persisted.customPasswords,
        });
      }
      break;
    }

    case 'member:rename': {
      const { actorId, targetUserId, newDisplayName } = action;
      const cleanName = (newDisplayName || '').trim().slice(0, 32);
      if (!ALL_USER_IDS.includes(actorId) || !ALL_USER_IDS.includes(targetUserId) || !cleanName) {
        break;
      }
      if (isContentRestricted(cleanName)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'message:blocked',
              warning: formatModerationWarning(persisted.groupName, cleanName),
            } satisfies ServerEvent)
          );
        }
        break;
      }
      if (!persisted.customDisplayNames) {
        persisted.customDisplayNames = {};
      }
      const oldName = persisted.customDisplayNames[targetUserId] || MEMBERS[targetUserId].displayName;
      persisted.customDisplayNames[targetUserId] = cleanName;

      const sysMsg: ChatMessage = {
        id: `msg-rename-user-${Date.now()}`,
        roomId: 'group',
        sender: 'system',
        text:
          actorId === targetUserId
            ? `${oldName} (${actorId}) changed their name to "${cleanName}".`
            : `${actorId} changed ${targetUserId}'s name from "${oldName}" to "${cleanName}".`,
        timestamp: new Date().toISOString(),
        type: 'system',
        reactions: {},
      };
      persisted.messages.push(sysMsg);
      saveState();

      broadcast(wss, {
        type: 'member:names-updated',
        customDisplayNames: persisted.customDisplayNames,
      });
      broadcast(wss, { type: 'message:created', message: sysMsg });
      break;
    }

    case 'website:rename': {
      const { actorId, newWebsiteName } = action;
      const cleanSiteName = (newWebsiteName || '').trim().slice(0, 48);
      if (!ALL_USER_IDS.includes(actorId) || !cleanSiteName) break;
      if (isContentRestricted(cleanSiteName)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'message:blocked',
              warning: formatModerationWarning(persisted.groupName, cleanSiteName),
            } satisfies ServerEvent)
          );
        }
        break;
      }
      const oldSite = persisted.websiteName || 'GOATS Group Chat';
      persisted.websiteName = cleanSiteName;

      const sysMsg: ChatMessage = {
        id: `msg-site-${Date.now()}`,
        roomId: 'group',
        sender: 'system',
        text: `${actorId} changed the website name from "${oldSite}" to "${cleanSiteName}".`,
        timestamp: new Date().toISOString(),
        type: 'system',
        reactions: {},
      };
      persisted.messages.push(sysMsg);
      saveState();

      broadcast(wss, {
        type: 'website:name-updated',
        websiteName: persisted.websiteName,
      });
      broadcast(wss, { type: 'message:created', message: sysMsg });
      break;
    }

    case 'group:create': {
      const { creatorId, name, members } = action;
      const cleanGroupName = (name || '').trim().slice(0, 40);
      if (!ALL_USER_IDS.includes(creatorId) || !cleanGroupName || !Array.isArray(members)) {
        break;
      }
      if (isContentRestricted(cleanGroupName)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'message:blocked',
              warning: formatModerationWarning(persisted.groupName, cleanGroupName),
            } satisfies ServerEvent)
          );
        }
        break;
      }
      const validMembers = Array.from(
        new Set([creatorId, ...members.filter((m) => ALL_USER_IDS.includes(m))])
      );
      if (validMembers.length < 2) break;

      if (!persisted.customGroups) {
        persisted.customGroups = [];
      }
      const newGroup: CustomGroupChat = {
        id: `custom-grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanGroupName,
        members: validMembers,
        createdBy: creatorId,
        createdAt: new Date().toISOString(),
      };
      persisted.customGroups.push(newGroup);

      const sysMsg: ChatMessage = {
        id: `msg-grp-init-${Date.now()}`,
        roomId: newGroup.id,
        sender: 'system',
        text: `${creatorId} created group chat "${cleanGroupName}" with ${validMembers.join(', ')}.`,
        timestamp: new Date().toISOString(),
        type: 'system',
        reactions: {},
      };
      persisted.messages.push(sysMsg);
      saveState();

      broadcast(wss, {
        type: 'groups:updated',
        customGroups: persisted.customGroups,
      });
      broadcast(wss, { type: 'message:created', message: sysMsg });
      break;
    }

    case 'group:rename': {
      const { actorId, groupId, newName } = action;
      if (groupId === NEVERLAND_ROOM_ID) break; // NEVERLAND name is permanently locked
      const cleanNewName = (newName || '').trim().slice(0, 40);
      if (!ALL_USER_IDS.includes(actorId) || !cleanNewName || !persisted.customGroups) break;
      if (isContentRestricted(cleanNewName)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'message:blocked',
              warning: formatModerationWarning(persisted.groupName, cleanNewName),
            } satisfies ServerEvent)
          );
        }
        break;
      }
      const grp = persisted.customGroups.find((g) => g.id === groupId);
      if (!grp) break;
      const oldGrpName = grp.name;
      grp.name = cleanNewName;

      const sysMsg: ChatMessage = {
        id: `msg-grp-rename-${Date.now()}`,
        roomId: grp.id,
        sender: 'system',
        text: `${actorId} renamed the group chat from "${oldGrpName}" to "${cleanNewName}".`,
        timestamp: new Date().toISOString(),
        type: 'system',
        reactions: {},
      };
      persisted.messages.push(sysMsg);
      saveState();

      broadcast(wss, {
        type: 'groups:updated',
        customGroups: persisted.customGroups,
      });
      broadcast(wss, { type: 'message:created', message: sysMsg });
      break;
    }

    case 'vent:join': {
      const { userId } = action;
      if (!ALL_USER_IDS.includes(userId)) break;
      activeVentUsers.add(userId);
      if (awardBadge(userId, 'among_us')) {
        saveState();
        broadcast(wss, {
          type: 'badges:unlocked-updated',
          unlockedBadges: persisted.unlockedBadges || {},
        });
      }
      broadcast(wss, {
        type: 'vent:updated',
        ventUsers: getVentUsers(),
        cleared: false,
      });
      break;
    }

    case 'vent:leave': {
      const { userId } = action;
      if (!ALL_USER_IDS.includes(userId)) break;
      const hadUsers = activeVentUsers.size > 0;
      activeVentUsers.delete(userId);
      let cleared = false;
      // After everyone leaves "Secret Vent", all messages in "Secret Vent" are deleted!
      if (hadUsers && activeVentUsers.size === 0) {
        const beforeCount = persisted.messages.length;
        persisted.messages = persisted.messages.filter(
          (m) => m.roomId !== SECRET_VENT_ROOM_ID
        );
        if (persisted.messages.length !== beforeCount) {
          saveState();
        }
        cleared = true;
      }
      broadcast(wss, {
        type: 'vent:updated',
        ventUsers: getVentUsers(),
        cleared,
      });
      break;
    }

    case 'bloom:unlock': {
      const { userId } = action;
      if (!ALL_USER_IDS.includes(userId)) break;
      if (!Array.isArray(persisted.bloomUnlockedUsers)) {
        persisted.bloomUnlockedUsers = ['nomi'];
      }
      if (!persisted.bloomUnlockedUsers.includes(userId)) {
        persisted.bloomUnlockedUsers.push(userId);
      }
      awardBadge(userId, 'japan_bloom');
      saveState();
      broadcast(wss, {
        type: 'bloom:unlocked-updated',
        bloomUnlockedUsers: persisted.bloomUnlockedUsers,
      });
      broadcast(wss, {
        type: 'badges:unlocked-updated',
        unlockedBadges: persisted.unlockedBadges || {},
      });
      break;
    }

    case 'badge:unlock': {
      const { userId, badgeId } = action;
      if (!ALL_USER_IDS.includes(userId) || !badgeId) break;
      if (awardBadge(userId, badgeId)) {
        saveState();
        broadcast(wss, {
          type: 'badges:unlocked-updated',
          unlockedBadges: persisted.unlockedBadges || {},
        });
      }
      break;
    }

    case 'badges:reset-all': {
      persisted.userMessageCounts = {
        sofi: 0,
        afiyyy: 0,
        yufi: 0,
        nomi: 0,
      };
      persisted.unlockedBadges = {
        sofi: [],
        afiyyy: [],
        yufi: [],
        nomi: [],
      };
      saveState();
      broadcast(wss, {
        type: 'badges:counts-updated',
        userMessageCounts: persisted.userMessageCounts,
      });
      broadcast(wss, {
        type: 'badges:unlocked-updated',
        unlockedBadges: persisted.unlockedBadges,
      });
      break;
    }

    case 'neverland:lyric-save': {
      const { id, userId, title, lyrics, status } = action;
      if (!ALL_USER_IDS.includes(userId)) break;
      const cleanTitle = (title || '').trim().slice(0, 80) || 'Untitled Track';
      const cleanLyrics = (lyrics || '').trim().slice(0, 5000);
      if (!cleanLyrics) break;

      // Strictly block any swear words in NEVERLAND lyrics or song titles
      if (isContentRestricted(cleanTitle) || isContentRestricted(cleanLyrics)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'message:blocked',
              warning: formatModerationWarning(
                NEVERLAND_GROUP_NAME,
                `${cleanTitle} ${cleanLyrics}`
              ),
            } satisfies ServerEvent)
          );
        }
        break;
      }

      if (!Array.isArray(persisted.neverlandLyrics)) {
        persisted.neverlandLyrics = [];
      }

      const nowIso = new Date().toISOString();
      const existingIdx = id
        ? persisted.neverlandLyrics.findIndex((item) => item.id === id)
        : -1;
      let savedEntry: NeverlandLyricEntry;
      let wasNewlyPublished = false;

      if (existingIdx !== -1) {
        const prev = persisted.neverlandLyrics[existingIdx];
        wasNewlyPublished = prev.status !== 'published' && status === 'published';
        savedEntry = {
          ...prev,
          title: cleanTitle,
          lyrics: cleanLyrics,
          status,
          updatedAt: nowIso,
          publishedAt: status === 'published' ? prev.publishedAt || nowIso : prev.publishedAt,
        };
        persisted.neverlandLyrics[existingIdx] = savedEntry;
      } else {
        wasNewlyPublished = status === 'published';
        savedEntry = {
          id: `lyric-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: cleanTitle,
          lyrics: cleanLyrics,
          author: userId,
          status,
          createdAt: nowIso,
          updatedAt: nowIso,
          publishedAt: status === 'published' ? nowIso : undefined,
        };
        persisted.neverlandLyrics.unshift(savedEntry);
      }

      if (status === 'published') {
        if (awardBadge(userId, 'rockstar_song')) {
          broadcast(wss, {
            type: 'badges:unlocked-updated',
            unlockedBadges: persisted.unlockedBadges || {},
          });
        }
      }

      if (wasNewlyPublished) {
        const sysMsg: ChatMessage = {
          id: `msg-neverland-pub-${Date.now()}`,
          roomId: NEVERLAND_ROOM_ID,
          sender: 'system',
          text: `🎵 ${userId} published new lyrics in NEVERLAND: "${cleanTitle}"!`,
          timestamp: nowIso,
          type: 'system',
          reactions: {},
        };
        persisted.messages.push(sysMsg);
        broadcast(wss, { type: 'message:created', message: sysMsg });
      }

      saveState();
      broadcast(wss, {
        type: 'neverland:updated',
        neverlandLyrics: persisted.neverlandLyrics,
        neverlandPlans: persisted.neverlandPlans || [],
        neverlandProfile: persisted.neverlandProfile || DEFAULT_NEVERLAND_PROFILE,
      });
      break;
    }

    case 'neverland:lyric-delete': {
      const { id, userId } = action;
      if (!ALL_USER_IDS.includes(userId) || !Array.isArray(persisted.neverlandLyrics)) break;
      persisted.neverlandLyrics = persisted.neverlandLyrics.filter((item) => item.id !== id);
      saveState();
      broadcast(wss, {
        type: 'neverland:updated',
        neverlandLyrics: persisted.neverlandLyrics,
        neverlandPlans: persisted.neverlandPlans || [],
      });
      break;
    }

    case 'neverland:plan-add': {
      const { userId, title, details, assignedTo } = action;
      if (!ALL_USER_IDS.includes(userId)) break;
      const cleanTitle = (title || '').trim().slice(0, 100);
      const cleanDetails = (details || '').trim().slice(0, 600);
      if (!cleanTitle) break;

      if (isContentRestricted(cleanTitle) || isContentRestricted(cleanDetails)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'message:blocked',
              warning: formatModerationWarning(
                NEVERLAND_GROUP_NAME,
                `${cleanTitle} ${cleanDetails}`
              ),
            } satisfies ServerEvent)
          );
        }
        break;
      }

      if (!Array.isArray(persisted.neverlandPlans)) {
        persisted.neverlandPlans = [];
      }

      const newPlan: NeverlandPlanItem = {
        id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: cleanTitle,
        details: cleanDetails,
        assignedTo:
          assignedTo === 'all' || ALL_USER_IDS.includes(assignedTo) ? assignedTo : 'all',
        status: 'planned',
        createdBy: userId,
        createdAt: new Date().toISOString(),
      };
      persisted.neverlandPlans.unshift(newPlan);
      saveState();
      broadcast(wss, {
        type: 'neverland:updated',
        neverlandLyrics: persisted.neverlandLyrics || [],
        neverlandPlans: persisted.neverlandPlans,
      });
      break;
    }

    case 'neverland:plan-status': {
      const { id, userId, status } = action;
      if (!ALL_USER_IDS.includes(userId) || !Array.isArray(persisted.neverlandPlans)) break;
      const target = persisted.neverlandPlans.find((p) => p.id === id);
      if (!target) break;
      target.status = status;
      saveState();
      broadcast(wss, {
        type: 'neverland:updated',
        neverlandLyrics: persisted.neverlandLyrics || [],
        neverlandPlans: persisted.neverlandPlans,
      });
      break;
    }

    case 'neverland:plan-delete': {
      const { id, userId } = action;
      if (!ALL_USER_IDS.includes(userId) || !Array.isArray(persisted.neverlandPlans)) break;
      persisted.neverlandPlans = persisted.neverlandPlans.filter((p) => p.id !== id);
      saveState();
      broadcast(wss, {
        type: 'neverland:updated',
        neverlandLyrics: persisted.neverlandLyrics || [],
        neverlandPlans: persisted.neverlandPlans,
        neverlandProfile: persisted.neverlandProfile || DEFAULT_NEVERLAND_PROFILE,
      });
      break;
    }

    case 'neverland:profile-update': {
      const { userId, profile } = action;
      if (!ALL_USER_IDS.includes(userId) || !profile || typeof profile !== 'object') break;

      const currentProfile: NeverlandProfile = {
        ...DEFAULT_NEVERLAND_PROFILE,
        ...(persisted.neverlandProfile || {}),
        memberRoles: {
          ...DEFAULT_NEVERLAND_PROFILE.memberRoles,
          ...(persisted.neverlandProfile?.memberRoles || {}),
        },
      };

      const nextTagline =
        typeof profile.tagline === 'string'
          ? profile.tagline.trim().slice(0, 140) || currentProfile.tagline
          : currentProfile.tagline;
      const nextGenre =
        typeof profile.genre === 'string'
          ? profile.genre.trim().slice(0, 80) || currentProfile.genre
          : currentProfile.genre;
      const nextRoles: Record<UserId, string> = { ...currentProfile.memberRoles };
      if (profile.memberRoles && typeof profile.memberRoles === 'object') {
        for (const uid of ALL_USER_IDS) {
          const r = profile.memberRoles[uid];
          if (typeof r === 'string' && r.trim()) {
            nextRoles[uid] = r.trim().slice(0, 50);
          }
        }
      }

      const combinedCheck = `${nextTagline} ${nextGenre} ${Object.values(nextRoles).join(' ')}`;
      if (isContentRestricted(combinedCheck)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'message:blocked',
              warning: formatModerationWarning(NEVERLAND_GROUP_NAME, combinedCheck),
            } satisfies ServerEvent)
          );
        }
        break;
      }

      const allowedThemes = ['indigo', 'emerald', 'rose', 'amber', 'violet', 'cyan'] as const;
      const nextTheme =
        profile.bannerTheme && allowedThemes.includes(profile.bannerTheme)
          ? profile.bannerTheme
          : currentProfile.bannerTheme;

      const nextAvatarEmoji =
        typeof profile.avatarEmoji === 'string' && profile.avatarEmoji.trim()
          ? profile.avatarEmoji.trim().slice(0, 8)
          : currentProfile.avatarEmoji;

      const nextAvatarUrl =
        typeof profile.avatarUrl === 'string'
          ? profile.avatarUrl.trim()
          : currentProfile.avatarUrl;

      persisted.neverlandProfile = {
        avatarEmoji: nextAvatarEmoji,
        avatarUrl: nextAvatarUrl,
        tagline: nextTagline,
        genre: nextGenre,
        bannerTheme: nextTheme,
        memberRoles: nextRoles,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      };

      saveState();
      broadcast(wss, {
        type: 'neverland:updated',
        neverlandLyrics: persisted.neverlandLyrics || [],
        neverlandPlans: persisted.neverlandPlans || [],
        neverlandProfile: persisted.neverlandProfile,
      });
      break;
    }

    case 'typing:set': {
      const { userId, isTyping } = action;
      if (!ALL_USER_IDS.includes(userId)) break;
      const existingTimeout = typingMap.get(userId);
      if (existingTimeout) clearTimeout(existingTimeout);

      if (isTyping) {
        const timeout = setTimeout(() => {
          typingMap.delete(userId);
          broadcast(wss, {
            type: 'presence:updated',
            onlineUsers: getOnlineUsers(),
            typingUsers: getTypingUsers(),
          });
        }, 4000);
        typingMap.set(userId, timeout);
      } else {
        typingMap.delete(userId);
      }

      broadcast(wss, {
        type: 'presence:updated',
        onlineUsers: getOnlineUsers(),
        typingUsers: getTypingUsers(),
      });
      break;
    }

    case 'message:send': {
      const text = (action.text || '').trim().slice(0, 1000);
      const imageUrl =
        typeof action.imageUrl === 'string' &&
        (action.imageUrl.startsWith('data:image/') ||
          action.imageUrl.startsWith('https://') ||
          action.imageUrl.startsWith('http://')) &&
        action.imageUrl.length <= 2_500_000
          ? action.imageUrl
          : undefined;

      if ((!text && !imageUrl) || !ALL_USER_IDS.includes(action.sender)) break;

      if (isContentRestricted(text)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'message:blocked',
              warning: formatModerationWarning(persisted.groupName, text),
            } satisfies ServerEvent)
          );
        }
        break;
      }

      // Idempotency guard — if message already exists, still save effect if newly provided
      const existingMsg = persisted.messages.find((m) => m.id === action.id);
      if (existingMsg) {
        if (action.effect === 'bloom' && existingMsg.effect !== 'bloom') {
          existingMsg.effect = 'bloom';
          saveState();
          broadcast(wss, { type: 'message:updated', message: existingMsg });
        }
        break;
      }

      // Clear typing indicator for sender
      const typingTimer = typingMap.get(action.sender);
      if (typingTimer) {
        clearTimeout(typingTimer);
        typingMap.delete(action.sender);
      }

      const newMsg: ChatMessage = {
        id: action.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        roomId: action.roomId || 'group',
        sender: action.sender,
        text,
        imageUrl,
        effect: action.effect === 'bloom' ? 'bloom' : undefined,
        timestamp: new Date().toISOString(),
        type: 'chat',
        replyToId: action.replyToId,
        reactions: {},
        readBy: [action.sender],
      };

      persisted.messages.push(newMsg);
      if (persisted.messages.length > 200) {
        persisted.messages = persisted.messages.slice(-200);
      }
      const currentCounts = computeUserMessageCounts(persisted);
      currentCounts[action.sender] = (currentCounts[action.sender] || 0) + 1;
      persisted.userMessageCounts = currentCounts;
      if (action.effect === 'bloom') {
        if (!Array.isArray(persisted.bloomUnlockedUsers)) {
          persisted.bloomUnlockedUsers = ['nomi'];
        }
        if (!persisted.bloomUnlockedUsers.includes(action.sender)) {
          persisted.bloomUnlockedUsers.push(action.sender);
        }
        awardBadge(action.sender, 'japan_bloom');
      }
      if (/meet\.google\.com/i.test(text)) {
        awardBadge(action.sender, 'celebrate_gm');
      }
      if (action.roomId === SECRET_VENT_ROOM_ID) {
        awardBadge(action.sender, 'among_us');
      }
      saveState();

      broadcast(wss, { type: 'message:created', message: newMsg });
      broadcast(wss, {
        type: 'badges:counts-updated',
        userMessageCounts: persisted.userMessageCounts,
      });
      broadcast(wss, {
        type: 'badges:unlocked-updated',
        unlockedBadges: persisted.unlockedBadges || {},
      });
      broadcast(wss, {
        type: 'presence:updated',
        onlineUsers: getOnlineUsers(),
        typingUsers: getTypingUsers(),
      });
      break;
    }

    case 'message:edit': {
      const { messageId, userId, newText, effect } = action;
      const cleanText = (newText || '').trim().slice(0, 1000);
      if (!ALL_USER_IDS.includes(userId)) break;

      const target = persisted.messages.find((m) => m.id === messageId);
      if (!target || target.sender !== userId) break;
      if (!cleanText && !target.imageUrl) break;

      if (isContentRestricted(cleanText)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'message:blocked',
              warning: formatModerationWarning(persisted.groupName, cleanText),
            } satisfies ServerEvent)
          );
        }
        break;
      }

      target.text = cleanText;
      if (effect === 'bloom') {
        target.effect = 'bloom';
        awardBadge(userId, 'japan_bloom');
      } else if (effect === null) {
        delete target.effect;
      }
      if (/meet\.google\.com/i.test(cleanText)) {
        awardBadge(userId, 'celebrate_gm');
      }
      target.editedAt = new Date().toISOString();
      saveState();

      broadcast(wss, { type: 'message:updated', message: target });
      broadcast(wss, {
        type: 'badges:unlocked-updated',
        unlockedBadges: persisted.unlockedBadges || {},
      });
      break;
    }

    case 'message:effect': {
      const { messageId, userId, effect } = action;
      if (!ALL_USER_IDS.includes(userId)) break;
      const target = persisted.messages.find((m) => m.id === messageId);
      if (!target) break;
      if (effect === 'bloom') {
        target.effect = 'bloom';
        awardBadge(userId, 'japan_bloom');
      } else {
        delete target.effect;
      }
      saveState();
      broadcast(wss, { type: 'message:updated', message: target });
      broadcast(wss, {
        type: 'badges:unlocked-updated',
        unlockedBadges: persisted.unlockedBadges || {},
      });
      break;
    }

    case 'message:delete': {
      const { messageId, userId } = action;
      if (!ALL_USER_IDS.includes(userId)) break;

      const idx = persisted.messages.findIndex((m) => m.id === messageId);
      if (idx === -1) break;
      if (persisted.messages[idx].sender !== userId) break;

      persisted.messages.splice(idx, 1);
      saveState();

      broadcast(wss, { type: 'message:deleted', messageId });
      break;
    }

    case 'message:react': {
      const { messageId, userId, emoji } = action;
      if (!ALL_USER_IDS.includes(userId) || !emoji) break;
      const target = persisted.messages.find((m) => m.id === messageId);
      if (!target) break;

      if (!target.reactions) target.reactions = {};
      const currentList = target.reactions[emoji] || [];
      if (currentList.includes(userId)) {
        target.reactions[emoji] = currentList.filter((u) => u !== userId);
        if (target.reactions[emoji].length === 0) {
          delete target.reactions[emoji];
        }
      } else {
        target.reactions[emoji] = [...currentList, userId];
      }

      saveState();
      broadcast(wss, { type: 'message:updated', message: target });
      break;
    }

    case 'message:mark-read': {
      const { userId, roomId, messageIds } = action;
      if (!ALL_USER_IDS.includes(userId)) break;
      let changed = false;
      for (const m of persisted.messages) {
        if (m.sender === 'system') continue;
        if (roomId && (m.roomId || 'group') !== roomId) continue;
        if (Array.isArray(messageIds) && messageIds.length > 0 && !messageIds.includes(m.id)) {
          continue;
        }
        const currentReadBy: UserId[] = Array.isArray(m.readBy) ? m.readBy : [m.sender];
        if (!currentReadBy.includes(userId)) {
          m.readBy = [...currentReadBy, userId];
          changed = true;
        }
      }
      if (changed) {
        saveState();
        broadcast(wss, { type: 'messages:read-updated', messages: persisted.messages });
      }
      break;
    }

    case 'message:mark-unread': {
      const { userId, messageId, roomId } = action;
      if (!ALL_USER_IDS.includes(userId)) break;
      let changed = false;
      if (messageId) {
        const targetIdx = persisted.messages.findIndex((m) => m.id === messageId);
        if (targetIdx !== -1) {
          const targetRoom = persisted.messages[targetIdx].roomId || 'group';
          for (let i = targetIdx; i < persisted.messages.length; i++) {
            const m = persisted.messages[i];
            if ((m.roomId || 'group') !== targetRoom || m.sender === 'system') continue;
            const currentReadBy: UserId[] = Array.isArray(m.readBy) ? m.readBy : [m.sender];
            if (currentReadBy.includes(userId)) {
              m.readBy = currentReadBy.filter((u) => u !== userId);
              changed = true;
            }
          }
        }
      } else if (roomId) {
        const roomChatMsgs = persisted.messages.filter(
          (m) => (m.roomId || 'group') === roomId && m.sender !== 'system'
        );
        const lastMsg = roomChatMsgs[roomChatMsgs.length - 1];
        if (lastMsg && lastMsg.sender !== 'system') {
          const currentReadBy: UserId[] = Array.isArray(lastMsg.readBy)
            ? lastMsg.readBy
            : [lastMsg.sender];
          if (currentReadBy.includes(userId)) {
            lastMsg.readBy = currentReadBy.filter((u) => u !== userId);
            changed = true;
          }
        }
      }
      if (changed) {
        saveState();
        broadcast(wss, { type: 'messages:read-updated', messages: persisted.messages });
      }
      break;
    }

    case 'name:propose': {
      const proposedName = action.proposedName.trim().slice(0, 40);
      if (!proposedName || !ALL_USER_IDS.includes(action.userId)) break;
      if (proposedName === persisted.groupName) break;

      if (isContentRestricted(proposedName)) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'message:blocked',
              warning: formatModerationWarning(persisted.groupName, proposedName),
            } satisfies ServerEvent)
          );
        }
        break;
      }

      const proposal: NameProposal = {
        id: `prop-${Date.now()}`,
        proposedName,
        proposedBy: action.userId,
        createdAt: new Date().toISOString(),
        approvals: [action.userId], // Proposer automatically agrees
        rejections: [],
        status: 'pending',
      };

      persisted.activeProposal = proposal;

      const sysMsg: ChatMessage = {
        id: `msg-prop-${Date.now()}`,
        sender: 'system',
        text: `${action.userId} proposed changing the group chat name from "${persisted.groupName}" to "${proposedName}". Waiting for everyone (sofi, afiyyy, yufi, nomi) to agree! (1/4 agreed)`,
        timestamp: new Date().toISOString(),
        type: 'proposal_event',
        reactions: {},
      };
      persisted.messages.push(sysMsg);
      saveState();

      broadcast(wss, {
        type: 'name:updated',
        groupName: persisted.groupName,
        activeProposal: persisted.activeProposal,
        nameHistory: persisted.nameHistory,
      });
      broadcast(wss, { type: 'message:created', message: sysMsg });
      break;
    }

    case 'name:vote': {
      const { userId, vote } = action;
      if (!ALL_USER_IDS.includes(userId) || !persisted.activeProposal) break;
      const prop = persisted.activeProposal;
      if (prop.status !== 'pending') break;

      if (vote === 'approve') {
        if (!prop.approvals.includes(userId)) {
          prop.approvals.push(userId);
        }
        prop.rejections = prop.rejections.filter((u) => u !== userId);
        awardBadge(userId, 'i_agree');

        // Check if all 4 members have agreed
        const everyoneAgreed = ALL_USER_IDS.every((member) => prop.approvals.includes(member));

        if (everyoneAgreed) {
          for (const member of ALL_USER_IDS) {
            awardBadge(member, 'i_agree');
          }
          const oldName = persisted.groupName;
          const newName = prop.proposedName;
          persisted.groupName = newName;
          prop.status = 'approved';

          const historyEntry: GroupNameHistoryEntry = {
            id: `hist-${Date.now()}`,
            oldName,
            newName,
            proposedBy: prop.proposedBy,
            approvedAt: new Date().toISOString(),
          };
          persisted.nameHistory.unshift(historyEntry);
          persisted.activeProposal = null;

          const approvedMsg: ChatMessage = {
            id: `msg-approved-${Date.now()}`,
            sender: 'system',
            text: `Unanimous agreement (4/4)! sofi, afiyyy, yufi & nomi all agreed. Group chat name changed from "${oldName}" to "${newName}".`,
            timestamp: new Date().toISOString(),
            type: 'proposal_event',
            reactions: { '🎉': ['sofi', 'afiyyy', 'yufi', 'nomi'] },
          };
          persisted.messages.push(approvedMsg);
          saveState();

          broadcast(wss, {
            type: 'name:updated',
            groupName: persisted.groupName,
            activeProposal: null,
            nameHistory: persisted.nameHistory,
          });
          broadcast(wss, {
            type: 'badges:unlocked-updated',
            unlockedBadges: persisted.unlockedBadges || {},
          });
          broadcast(wss, { type: 'message:created', message: approvedMsg });
        } else {
          const voteMsg: ChatMessage = {
            id: `msg-vote-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            sender: 'system',
            text: `${userId} agreed to rename the chat to "${prop.proposedName}" (${prop.approvals.length}/4 agreed).`,
            timestamp: new Date().toISOString(),
            type: 'proposal_event',
            reactions: {},
          };
          persisted.messages.push(voteMsg);
          saveState();

          broadcast(wss, {
            type: 'name:updated',
            groupName: persisted.groupName,
            activeProposal: persisted.activeProposal,
            nameHistory: persisted.nameHistory,
          });
          broadcast(wss, {
            type: 'badges:unlocked-updated',
            unlockedBadges: persisted.unlockedBadges || {},
          });
          broadcast(wss, { type: 'message:created', message: voteMsg });
        }
      } else if (vote === 'reject') {
        awardBadge(userId, 'boo');
        const rejectedName = prop.proposedName;
        persisted.activeProposal = null;

        const rejectMsg: ChatMessage = {
          id: `msg-reject-${Date.now()}`,
          sender: 'system',
          text: `${userId} vetoed the group name change to "${rejectedName}". Since everyone must agree, the group name stays "${persisted.groupName}".`,
          timestamp: new Date().toISOString(),
          type: 'proposal_event',
          reactions: {},
        };
        persisted.messages.push(rejectMsg);
        saveState();

        broadcast(wss, {
          type: 'name:updated',
          groupName: persisted.groupName,
          activeProposal: null,
          nameHistory: persisted.nameHistory,
        });
        broadcast(wss, {
          type: 'badges:unlocked-updated',
          unlockedBadges: persisted.unlockedBadges || {},
        });
        broadcast(wss, { type: 'message:created', message: rejectMsg });
      }
      break;
    }

    case 'name:cancel': {
      if (!persisted.activeProposal) break;
      awardBadge(action.userId, 'boo');
      const cancelledName = persisted.activeProposal.proposedName;
      persisted.activeProposal = null;

      const cancelMsg: ChatMessage = {
        id: `msg-cancel-${Date.now()}`,
        sender: 'system',
        text: `${action.userId} withdrew the proposal to rename the chat to "${cancelledName}".`,
        timestamp: new Date().toISOString(),
        type: 'proposal_event',
        reactions: {},
      };
      persisted.messages.push(cancelMsg);
      saveState();

      broadcast(wss, {
        type: 'name:updated',
        groupName: persisted.groupName,
        activeProposal: null,
        nameHistory: persisted.nameHistory,
      });
      broadcast(wss, {
        type: 'badges:unlocked-updated',
        unlockedBadges: persisted.unlockedBadges || {},
      });
      broadcast(wss, { type: 'message:created', message: cancelMsg });
      break;
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    // Send initial state immediately
    const initEvent: ServerEvent = {
      type: 'state:init',
      state: getFullState(),
    };
    ws.send(JSON.stringify(initEvent));

    ws.on('message', (raw) => {
      try {
        const event = JSON.parse(raw.toString()) as ClientEvent;
        handleClientAction(event, wss, ws);
      } catch (err) {
        console.error('Invalid WS message:', err);
      }
    });

    ws.on('close', () => {
      const userId = clientIdentity.get(ws);
      clientIdentity.delete(ws);
      if (userId) {
        const timer = typingMap.get(userId);
        if (timer) {
          clearTimeout(timer);
          typingMap.delete(userId);
        }
        // If this user has no other active WebSocket connections and was in Secret Vent, remove them
        const stillOnline = getOnlineUsers().includes(userId);
        if (!stillOnline && activeVentUsers.has(userId)) {
          activeVentUsers.delete(userId);
          let cleared = false;
          if (activeVentUsers.size === 0) {
            persisted.messages = persisted.messages.filter(
              (m) => m.roomId !== SECRET_VENT_ROOM_ID
            );
            saveState();
            cleared = true;
          }
          broadcast(wss, {
            type: 'vent:updated',
            ventUsers: getVentUsers(),
            cleared,
          });
        }
      }
      broadcast(wss, {
        type: 'presence:updated',
        onlineUsers: getOnlineUsers(),
        typingUsers: getTypingUsers(),
      });
    });
  });

  // HTTP REST fallback endpoints for resilience
  app.get('/api/state', (_req, res) => {
    res.json(getFullState());
  });

  // Emoji API endpoint powered by EMOJI_API_KEY (emoji-api.com + API Ninjas + instant fallback)
  app.get('/api/emojis', async (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const category = String(req.query.category || '').trim().toLowerCase();

    if (q && isContentRestricted(q)) {
      res.json({ emojis: [] });
      return;
    }

    try {
      // Load full catalog from emoji-api.com once and cache in memory for fast response
      const now = Date.now();
      if (!cachedApiEmojis || now - lastEmojiFetchAt > 1000 * 60 * 30) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        try {
          const apiRes = await fetch(
            `https://emoji-api.com/emojis?access_key=${encodeURIComponent(EMOJI_API_KEY)}`,
            { signal: controller.signal }
          );
          clearTimeout(timeout);
          if (apiRes.ok) {
            const rawData = (await apiRes.json()) as Array<{
              character?: string;
              unicodeName?: string;
              slug?: string;
              group?: string;
            }>;
            if (Array.isArray(rawData) && rawData.length > 0) {
              const cleaned = rawData
                .filter(
                  (item) =>
                    item &&
                    typeof item.character === 'string' &&
                    item.character.length > 0 &&
                    !isContentRestricted(item.unicodeName || item.slug || '')
                )
                .map((item) => ({
                  character: item.character!,
                  unicodeName: (item.unicodeName || item.slug || '')
                    .replace(/^E\d+\.\d+\s+/i, '')
                    .trim(),
                  group: item.group || 'smileys-emotion',
                }));
              if (cleaned.length > 0) {
                cachedApiEmojis = cleaned;
                lastEmojiFetchAt = now;
              }
            }
          }
        } catch {
          clearTimeout(timeout);
        }
      }

      // If user searched a query and cachedApiEmojis is not populated, also try emoji-api search or API Ninjas
      let sourceList: EmojiItem[] =
        cachedApiEmojis && cachedApiEmojis.length > 0 ? cachedApiEmojis : FALLBACK_EMOJIS;

      if (q && (!cachedApiEmojis || cachedApiEmojis.length === 0)) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        try {
          const searchRes = await fetch(
            `https://emoji-api.com/emojis?search=${encodeURIComponent(
              q
            )}&access_key=${encodeURIComponent(EMOJI_API_KEY)}`,
            { signal: controller.signal }
          );
          clearTimeout(timeout);
          if (searchRes.ok) {
            const searchData = (await searchRes.json()) as Array<{
              character?: string;
              unicodeName?: string;
              group?: string;
            }>;
            if (Array.isArray(searchData) && searchData.length > 0) {
              const mapped = searchData
                .filter((i) => i && i.character && !isContentRestricted(i.unicodeName || ''))
                .map((i) => ({
                  character: i.character!,
                  unicodeName: (i.unicodeName || '').replace(/^E\d+\.\d+\s+/i, '').trim(),
                  group: i.group || 'smileys-emotion',
                }));
              if (mapped.length > 0) {
                sourceList = [...mapped, ...FALLBACK_EMOJIS];
              }
            }
          }
        } catch {
          clearTimeout(timeout);
        }
      }

      let filtered = sourceList;
      if (category && category !== 'all') {
        filtered = filtered.filter((e) => e.group.toLowerCase().includes(category));
      }
      if (q) {
        filtered = filtered.filter(
          (e) =>
            e.unicodeName.toLowerCase().includes(q) ||
            e.group.toLowerCase().includes(q) ||
            e.character.includes(q)
        );
      }

      // Deduplicate by character and cap at 240 so UI renders smoothly
      const seen = new Set<string>();
      const unique: EmojiItem[] = [];
      for (const item of filtered) {
        if (!seen.has(item.character)) {
          seen.add(item.character);
          unique.push(item);
          if (unique.length >= 240) break;
        }
      }

      res.json({ emojis: unique });
    } catch (err) {
      console.error('Emoji API error:', err);
      res.json({ emojis: FALLBACK_EMOJIS });
    }
  });

  // Klipy GIF API endpoint powered by KLIPY_API_KEY
  app.get('/api/gifs', async (req, res) => {
    const q = String(req.query.q || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);

    if (q && isContentRestricted(q)) {
      res.json({ gifs: [] });
      return;
    }

    const cacheKey = `${q.toLowerCase()}::${page}`;
    const now = Date.now();
    const cached = gifSearchCache.get(cacheKey);
    if (cached && now - cached.timestamp < 1000 * 60 * 5 && cached.items.length > 0) {
      res.json({ gifs: cached.items });
      return;
    }

    try {
      const endpoint = q
        ? `https://api.klipy.com/api/v1/${encodeURIComponent(
            KLIPY_API_KEY
          )}/gifs/search?q=${encodeURIComponent(
            q
          )}&page=${page}&per_page=30&customer_id=goats-chat&content_filter=high`
        : `https://api.klipy.com/api/v1/${encodeURIComponent(
            KLIPY_API_KEY
          )}/gifs/trending?page=${page}&per_page=30&customer_id=goats-chat&content_filter=high`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const apiRes = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });
      clearTimeout(timeout);

      if (!apiRes.ok) {
        res.json({ gifs: cached?.items || [] });
        return;
      }

      const payload = (await apiRes.json()) as {
        result?: boolean;
        data?: {
          data?: Array<{
            id?: string | number;
            slug?: string;
            title?: string;
            file?: {
              hd?: { gif?: { url?: string }; webp?: { url?: string } };
              md?: { gif?: { url?: string }; webp?: { url?: string } };
              sm?: { gif?: { url?: string }; webp?: { url?: string } };
              xs?: { gif?: { url?: string }; webp?: { url?: string } };
            };
          }>;
        };
      };

      const rawItems = Array.isArray(payload?.data?.data) ? payload.data!.data! : [];
      const gifs: GifItem[] = [];

      for (const item of rawItems) {
        const title = (item.title || item.slug || 'GIF').trim();
        const fullUrl =
          item.file?.md?.gif?.url ||
          item.file?.hd?.gif?.url ||
          item.file?.sm?.gif?.url ||
          item.file?.md?.webp?.url ||
          '';
        const previewUrl =
          item.file?.sm?.gif?.url ||
          item.file?.md?.gif?.url ||
          item.file?.xs?.gif?.url ||
          fullUrl;

        if (!fullUrl) continue;
        if (
          isContentRestricted(title) ||
          isContentRestricted(item.slug || '') ||
          isContentRestricted(fullUrl)
        ) {
          continue;
        }

        gifs.push({
          id: String(item.id || item.slug || gifs.length),
          title,
          url: fullUrl,
          previewUrl: previewUrl || fullUrl,
        });
      }

      if (gifs.length > 0) {
        gifSearchCache.set(cacheKey, { timestamp: now, items: gifs });
      }

      res.json({ gifs });
    } catch (err) {
      console.error('Klipy GIF API error:', err);
      res.json({ gifs: cached?.items || [] });
    }
  });

  app.post('/api/recover-password', async (req, res) => {
    const { userId, provider, email, emailPassword } = req.body as {
      userId?: UserId;
      provider?: 'gmail' | 'outlook';
      email?: string;
      emailPassword?: string;
    };

    const cleanEmail = (email || '').trim();
    const cleanPass = (emailPassword || '').trim();

    if (!userId || !ALL_USER_IDS.includes(userId)) {
      res.status(400).json({ ok: false, error: 'Invalid account selected.' });
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanPass) {
      res.status(400).json({
        ok: false,
        error: 'Please enter both your email address and your email password.',
      });
      return;
    }

    const accountPassword =
      (persisted.customPasswords && persisted.customPasswords[userId]) ||
      MEMBERS[userId].accountPassword;

    const smtpConfig =
      provider === 'outlook'
        ? {
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            auth: { user: cleanEmail, pass: cleanPass },
            tls: { ciphers: 'SSLv3', rejectUnauthorized: false },
          }
        : {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { user: cleanEmail, pass: cleanPass },
          };

    try {
      const transporter = nodemailer.createTransport(smtpConfig);
      await transporter.verify();

      await transporter.sendMail({
        from: `"GOATS Group Chat" <${cleanEmail}>`,
        to: cleanEmail,
        subject: `BOOM! Your ${userId.toUpperCase()} Account Password (${persisted.groupName})`,
        text: `Hello ${userId.toUpperCase()},\n\nYour current password for ${persisted.groupName} is: ${accountPassword}\n\nGo back to the app now — you have 30 seconds to change your password or keep it!`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #F7F4EF; border: 1px solid #DFD7C8; border-radius: 16px; color: #2C2520;">
            <h2 style="margin-top: 0;">GOATS Group Chat — Password Recovery</h2>
            <p>Hello <strong>${userId.toUpperCase()}</strong>,</p>
            <p>Here is the current password you have for your account:</p>
            <div style="padding: 16px; background: #FFFFFF; border: 2px solid #2C2520; border-radius: 12px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px; margin: 16px 0;">
              ${accountPassword}
            </div>
            <p style="font-size: 13px; color: #6E645B;">Go back to the app window now! As soon as you click <strong>Go Back</strong>, you have 30 seconds to change your password or keep it.</p>
          </div>
        `,
      });

      res.json({
        ok: true,
        sentViaSmtp: true,
        password: accountPassword,
        message: `Real email sent to ${cleanEmail} via ${provider === 'outlook' ? 'Outlook' : 'Gmail'} SMTP!`,
      });
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      let friendlyError = `Could not authenticate with ${
        provider === 'outlook' ? 'Outlook' : 'Gmail'
      }: ${rawMsg}`;
      if (
        rawMsg.includes('535') ||
        rawMsg.includes('Username and Password not accepted') ||
        rawMsg.includes('Invalid login') ||
        rawMsg.includes('Application-specific password required')
      ) {
        friendlyError =
          provider === 'gmail'
            ? 'Gmail rejected that password (wrong password, or Google requires a 16-character App Password when 2-Step Verification is on).'
            : 'Outlook rejected that email or password. Please check your credentials.';
      }
      res.status(401).json({
        ok: false,
        error: friendlyError,
      });
    }
  });

  app.get('/api/image-search', async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q || isContentRestricted(q)) {
      res.json({ results: [] });
      return;
    }
    try {
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        q
      )}&gsrlimit=28&prop=pageimages|extracts&exintro=1&explaintext=1&exchars=150&piprop=original|thumbnail&pithumbsize=600&uselang=en&format=json&origin=*`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'GOATSChatApp/1.0',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const data = (await response.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              pageid: number;
              title: string;
              extract?: string;
              thumbnail?: { source?: string };
              original?: { source?: string };
            }
          >;
        };
      };
      const pages = data.query?.pages ? Object.values(data.query.pages) : [];
      let results = pages
        .map((p) => {
          const url = p.thumbnail?.source || p.original?.source;
          if (
            !url ||
            url.endsWith('.svg') ||
            url.endsWith('.pdf') ||
            url.toLowerCase().endsWith('.gif')
          ) {
            return null;
          }
          // Strictly filter out any sexual, NSFW, or restricted titles, extracts, or filenames
          if (
            isContentRestricted(p.title) ||
            isContentRestricted(p.extract || '') ||
            isContentRestricted(url)
          ) {
            return null;
          }
          return {
            id: String(p.pageid),
            title: p.title,
            url,
          };
        })
        .filter(Boolean);

      // Fallback to Wikimedia Commons English search if English Wikipedia has fewer than 6 results
      if (results.length < 6) {
        const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          `filetype:bitmap ${q}`
        )}&gsrlimit=24&prop=imageinfo&iiprop=url|dimensions&iiurlwidth=600&uselang=en&format=json&origin=*`;
        const cRes = await fetch(commonsUrl, {
          headers: {
            'User-Agent': 'GOATSChatApp/1.0',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        const cData = (await cRes.json()) as {
          query?: {
            pages?: Record<
              string,
              {
                pageid: number;
                title: string;
                imageinfo?: Array<{ thumburl?: string; url?: string }>;
              }
            >;
          };
        };
        const cPages = cData.query?.pages ? Object.values(cData.query.pages) : [];
        const cResults = cPages
          .map((p) => {
            const info = p.imageinfo?.[0];
            const url = info?.thumburl || info?.url;
            if (!url || url.toLowerCase().endsWith('.gif')) return null;
            const cleanTitle = p.title.replace(/^File:/i, '').replace(/\.[^.]+$/, '');
            // Skip Arabic/non-Latin script titles and any sexual/restricted content
            if (
              /[\u0600-\u06FF]/.test(cleanTitle) ||
              isContentRestricted(cleanTitle) ||
              isContentRestricted(url)
            ) {
              return null;
            }
            return {
              id: `c-${p.pageid}`,
              title: cleanTitle,
              url,
            };
          })
          .filter(Boolean);
        results = [...results, ...cResults];
      }

      res.json({ results });
    } catch (err) {
      console.error('Image search failed:', err);
      res.json({ results: [] });
    }
  });

  // Real-time Audio Transcription Endpoint via Gemini ('gemini-3.5-transcribe')
  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };
      if (!audioBase64 || typeof audioBase64 !== 'string') {
        res.status(400).json({ error: 'Missing audio payload' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const cleanBase64 = audioBase64.includes(',')
        ? audioBase64.split(',')[1]
        : audioBase64;

      const audioPart = {
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: cleanBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: 'Transcribe this audio accurately into plain text. Output only the spoken words without timestamps or extra commentary.',
            },
          ],
        },
      });

      const transcript = (response.text || '').trim();
      res.json({ transcript });
    } catch (err) {
      console.error('Audio transcription error:', err);
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to transcribe audio',
      });
    }
  });

  // Real SMTP Email Delivery Endpoint for Forgot Password (Gmail & Outlook)
  app.post('/api/send-recovery-email', async (req, res) => {
    try {
      const { provider, email, emailPassword, userId, accountPassword } = req.body as {
        provider: 'gmail' | 'outlook';
        email: string;
        emailPassword: string;
        userId: string;
        accountPassword: string;
      };

      if (!email || !emailPassword || !accountPassword) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const transporter = nodemailer.createTransport(
        provider === 'gmail'
          ? {
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: {
                user: email.trim(),
                pass: emailPassword.trim(),
              },
            }
          : {
              host: 'smtp-mail.outlook.com',
              port: 587,
              secure: false,
              tls: { ciphers: 'SSLv3', rejectUnauthorized: false },
              auth: {
                user: email.trim(),
                pass: emailPassword.trim(),
              },
            }
      );

      await transporter.sendMail({
        from: `"GOATS Group Chat" <${email.trim()}>`,
        to: email.trim(),
        subject: `Your ${String(userId).toUpperCase()} Account Password — GOATS Chat`,
        text: `BOOM! Here is the current password for your ${String(userId).toUpperCase()} account in GOATS Group Chat: ${accountPassword}\n\nGo back to the app now — you have 30 seconds to change your password or keep it!`,
        html: `<div style="font-family:sans-serif;padding:20px;background:#F7F4EF;color:#2C2520;border-radius:16px;border:1px solid #DFD7C8;max-width:440px;">
          <h2 style="margin-top:0;">GOATS Group Chat Recovery</h2>
          <p>Here is the current password for your <strong>${String(userId).toUpperCase()}</strong> account:</p>
          <div style="font-size:24px;font-weight:bold;letter-spacing:4px;padding:12px 18px;background:#FFFFFF;border:2px solid #2C2520;border-radius:12px;display:inline-block;">${accountPassword}</div>
          <p style="font-size:12px;color:#6E645B;margin-top:16px;">Go back to the app now — you have 30 seconds to change your password or keep it!</p>
        </div>`,
      });

      res.json({ sentViaSmtp: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'SMTP connection failed';
      res.json({
        sentViaSmtp: false,
        smtpNotice: msg,
      });
    }
  });

  app.post('/api/action', (req, res) => {
    const action = req.body as ClientEvent;
    if (!action || typeof action.type !== 'string') {
      res.status(400).json({ error: 'Invalid action payload' });
      return;
    }
    if (
      (action.type === 'message:send' && isContentRestricted(action.text || '')) ||
      (action.type === 'message:edit' && isContentRestricted(action.newText || '')) ||
      (action.type === 'name:propose' && isContentRestricted(action.proposedName || '')) ||
      (action.type === 'member:rename' && isContentRestricted(action.newDisplayName || '')) ||
      (action.type === 'website:rename' && isContentRestricted(action.newWebsiteName || '')) ||
      (action.type === 'group:create' && isContentRestricted(action.name || '')) ||
      (action.type === 'group:rename' && isContentRestricted(action.newName || ''))
    ) {
      const offending =
        action.type === 'message:send'
          ? action.text
          : action.type === 'message:edit'
          ? action.newText
          : action.type === 'name:propose'
          ? action.proposedName
          : action.type === 'member:rename'
          ? action.newDisplayName
          : action.type === 'website:rename'
          ? action.newWebsiteName
          : action.type === 'group:create'
          ? action.name
          : action.type === 'group:rename'
          ? action.newName
          : '';
      res.status(400).json({
        blocked: true,
        warning: formatModerationWarning(persisted.groupName, offending),
        state: getFullState(),
      });
      return;
    }
    handleClientAction(action, wss);
    res.json(getFullState());
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`GOATS Group Chat server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
