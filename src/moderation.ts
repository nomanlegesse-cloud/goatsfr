export const SECRET_SOUNDTRAP_WARNING =
  '"Wanna say something? Shh, say it in Soundtrap!" - Noman';

export const SOUNDTRAP_STUDIO_URL = 'https://www.soundtrap.com/home/edu/projects';

export function formatModerationWarning(groupName: string = 'GOATS', text?: string): string {
  if (text && isSecretContent(text)) {
    return SECRET_SOUNDTRAP_WARNING;
  }
  const cleanGroup = (groupName || 'GOATS').trim().replace(/^the\s+/i, '') || 'GOATS';
  return `"Ayo, chill bro! The ${cleanGroup} don't say those type of words." - Noman`;
}

export const SOUNDTRAP_MODERATION_WARNING = formatModerationWarning('GOATS');

export const YUSUF_PRIVATE_CHAT_SUGGESTION =
  'How about you go and talk to them... privately. - Noman';

// Name aliases that refer to each specific member
const MEMBER_NAME_PATTERNS: Array<{ userId: 'afiyyy' | 'nomi' | 'sofi' | 'yufi'; regex: RegExp }> = [
  {
    userId: 'afiyyy',
    regex: /(?:^|[\s,@!?.])@?(?:afi|afiy+|afiyah)\b/i,
  },
  {
    userId: 'nomi',
    regex: /(?:^|[\s,@!?.])@?(?:nomanini|nomani|nomi|noman)\b/i,
  },
  {
    userId: 'sofi',
    regex: /(?:^|[\s,@!?.])@?(?:sofi|sofia)\b/i,
  },
  {
    userId: 'yufi',
    regex: /(?:^|[\s,@!?.])@?(?:yufi|yusuf|yufifi)\b/i,
  },
];

export function detectMentionedMembers(
  text: string
): Array<'sofi' | 'afiyyy' | 'yufi' | 'nomi'> {
  if (!text || !text.trim()) return [];
  const matches: Array<'sofi' | 'afiyyy' | 'yufi' | 'nomi'> = [];
  for (const entry of MEMBER_NAME_PATTERNS) {
    if (entry.regex.test(text)) {
      matches.push(entry.userId);
    }
  }
  return matches;
}

// Multi-word prohibited phrases
const BANNED_PHRASES: string[] = [
  'strip club',
  'strip clubs',
  'stripclub',
  'stripclubs',
  'lap dance',
  'lap dances',
  'pole dance',
  'only fans',
  'onlyfans',
  'keep a secret',
  'dirty secret',
  'top secret',
  'f this',
  'fck this',
  'fuk this',
  'fk this',
  'f that',
  'f u',
  'f you',
  'f off',
  'f it',
  'f him',
  'f her',
  'f them',
  'f yall',
  'f everything',
  'let me tell u smth',
  'let me tell you smth',
  'let me tell u something',
  'let me tell you something',
  'lemme tell u smth',
  'lemme tell you smth',
  'lemme tell u something',
  'wanna know smth',
  'wanna know something',
  'want to know smth',
  'want to know something',
  'son of a b',
  'piece of s',
  'shut the f',
  'what the f',
  'who the f',
  'why the f',
  'how the f',
  'where the f',
  'go to hell',
];

// Prohibited words & short-version swear patterns matched against word boundaries or stems
const BANNED_WORD_PATTERNS: RegExp[] = [
  // "f (something)" — ANY standalone "f" or "f..." followed by another word (e.g. "f you", "f this", "f off", "f bro", "f school", "f everything") or standalone "f"
  /\bf+\s+[a-z0-9@!$*]+/i,
  /^f+$/i,

  // Short-version / abbreviated / censored swear words & acronyms
  /\bf+c*k+(s|ed|er|ers|ing|in)?\b/i,
  /\bf+u*k+(s|ed|er|ers|ing|in)?\b/i,
  /\bf+q+\b/i,
  /\bf+u+\b/i,
  /\bp+h+u+c*k+(s|ed|er|ers|ing)?\b/i,
  /\be+f+f+(ing|ed|s)?\b/i,
  /\bs+h+t+(s|ty|ted|ting)?\b/i,
  /\bs+h+i+z+(nit)?\b/i,
  /\bb+s+\b/i,
  /\bb+t+c+h+(es|y|ing)?\b/i,
  /\bb+i+a+t+c+h+\b/i,
  /\bb+i+z+n+a+t+c+h+\b/i,
  /\ba+z+z+(hole|holes)?\b/i,
  /\ba+h+o+l+e+s?\b/i,
  /\bd+c+k+s?\b/i,
  /\bd+i+k+s?\b/i,
  /\bp+s+s+y+\b/i,
  /\bc+n+t+s?\b/i,
  /\bm+f+(er|ers|ing|s)?\b/i,
  /\bm+o+f+o+s?\b/i,
  /\bs+t+f+u+\b/i,
  /\bw+t+f+\b/i,
  /\bt+f+\b/i,
  /\ba+f+\b/i,
  /\bl+m+f+a+o+\b/i,
  /\bl+m+a+o+\b/i,
  /\bo+m+f+g+\b/i,
  /\bf+m+l+\b/i,
  /\bf+f+s+\b/i,
  /\bs+o+b+\b/i,
  /\bp+o+s+\b/i,
  /\bg+t+f+o+\b/i,
  /\bi+d+g+a+f+\b/i,
  /\bd+g+a+f+\b/i,
  /\bs+m+d+\b/i,
  /\bk+m+a+\b/i,
  /\bk+y+s+\b/i,
  /\bs+y+b+a+u+\b/i,
  /\bp+m+o+\b/i,
  /\bt+s+\s+p+m+o+\b/i,

  // Slurs & short versions
  /\bn+g+a+s?\b/i,
  /\bn+g+r+s?\b/i,
  /\bn+i+g+g*(a|er|as|ers|uh|uhs|let)?\b/i,
  /\bn+i+b+b+(a|as|er|ers)\b/i,
  /\bf+a+g+(s|got|gots|gy)?\b/i,
  /\bd+y+k+e+s?\b/i,
  /\br+e+t+a+r+d+(s|ed)?\b/i,
  /\br+t+a+r+d+(s|ed)?\b/i,
  /\bs+p+a+z+\b/i,
  /\bc+h+i+n+k+s?\b/i,
  /\bs+p+i+c+s?\b/i,
  /\bk+i+k+e+s?\b/i,
  /\bt+r+a+n+n+(y|ies)\b/i,

  // Explicitly requested user phrases & words
  /\bbastards?\b/i,
  /\bb+s+t+r+d+s?\b/i,
  /\bsex(ual|ually|y|iest|ting|uality)?\b/i,
  /\bs+x+y?\b/i,
  /\bstrip\s*clubs?\b/i,
  /\bstripper(s)?\b/i,
  /\bsecrets?\b/i,
  /\bsecretly\b/i,
  /\bl+e+t+\s+m+e+\s+t+e+l+l+\s+(u+|y+o+u+)\s+(s+m+t+h+|s+o+m+e+t+h+i+n+g+)\b/i,
  /\bw+a+n+n+a+\s+k+n+o+w+\s+(s+m+t+h+|s+o+m+e+t+h+i+n+g+)\b/i,

  // Full comprehensive profanity & swear words
  /\bf+u+c+k+(s|ed|er|ers|ing|in|wit|wad|tard|boy|boi|face|head|nut|off|up)?\b/i,
  /\bs+h+i+t+(s|ty|ted|ting|head|heads|hole|holes|bag|bags|stain|faced|show|storm|post)?\b/i,
  /\bb+i+t+c+h+(es|ed|ing|y|ass)?\b/i,
  /\ba+s+s+(hole|holes|es|wipe|hat|clown|face|cheek|cheeks| munch|kiss|kisser|licker)?\b/i,
  /\bd+a+m+n+(it|ed)?\b/i,
  /\bd+a+m+m+i+t+\b/i,
  /\bg+o+d+d+a+m+(n|nit|mit)?\b/i,
  /\bh+e+l+l+\b/i,
  /\bh+e+c+k+\b/i,
  /\bc+r+a+p+(py|s)?\b/i,
  /\bp+i+s+s+(ed|ing|off|er|y)?\b/i,
  /\bd+i+c+k+(s|head|heads|wad|weed|bag|less)?\b/i,
  /\bc+o+c+k+(s|sucker|suckers|head)?\b/i,
  /\bp+u+s+s+(y|ies)\b/i,
  /\bc+u+n+t+(s|y)?\b/i,
  /\bw+h+o+r+e+(s|ish)?\b/i,
  /\bh+o+e+s?\b/i,
  /\bs+l+u+t+(s|ty)?\b/i,
  /\bs+k+a+n+k+(s|y)?\b/i,
  /\bt+h+o+t+(s)?\b/i,
  /\bb+u+l+l+s+h+i+t+\b/i,
  /\bh+o+r+s+e+s+h+i+t+\b/i,
  /\bd+i+p+s+h+i+t+s?\b/i,
  /\bm+o+t+h+e+r+f+u+c+k+(er|ers|ing|in)?\b/i,
  /\bm+u+t+h+a+f+u+c*k+(a|as|er|ers|ing)?\b/i,
  /\bd+o+u+c+h+e+(bag|bags|nozzle|y)?\b/i,
  /\bp+r+i+c+k+(s)?\b/i,
  /\bt+w+a+t+(s)?\b/i,
  /\bw+a+n+k+(er|ers|ing|stain)?\b/i,
  /\bb+o+l+l+o+c+k+s?\b/i,
  /\bb+e+l+l+e+n+d+s?\b/i,
  /\bb+u+g+g+e+r+(s|ed|y)?\b/i,
  /\bb+l+o+o+d+y+\b/i,
  /\bs+h+a+g+(ging|ged|ger)?\b/i,
  /\ba+r+s+e+(hole|holes|wipe)?\b/i,
  /\bj+a+c+k+a+s+s+(es)?\b/i,
  /\bd+u+m+b+a+s+s+(es)?\b/i,
  /\bb+a+d+a+s+s+\b/i,
  /\bf+a+t+a+s+s+\b/i,
  /\bs+m+a+r+t+a+s+s+\b/i,
  /\bs+c+u+m+(bag|bags)?\b/i,
  /\bs+l+a+g+s?\b/i,
  /\bt+o+s+s+e+r+s?\b/i,
  /\bn+o+b+h+e+a+d+s?\b/i,
  /\bk+n+o+b+(head|heads|end)?\b/i,
  /\bp+u+n+a+n+i+\b/i,
  /\bs+c+h+l+o+n+g+s?\b/i,
  /\bd+o+n+g+s?\b/i,
  /\bb+o+n+e+r+s?\b/i,
  /\bc+u+m+(ming|shot|shots|slut|dumpster)?\b/i,
  /\bj+i+z+z+\b/i,
  /\bs+p+u+n+k+\b/i,
  /\bs+e+m+e+n+\b/i,
  /\bs+p+e+r+m+\b/i,
  /\bd+i+l+d+o+s?\b/i,
  /\br+i+m+j+o+b+s?\b/i,
  /\ba+n+a+l+\b/i,
  /\ba+n+u+s+\b/i,
  /\br+e+c+t+u+m+\b/i,
  /\bb+u+t+t+h+o+l+e+s?\b/i,
  /\bs+c+r+o+t+u+m+\b/i,
  /\bt+e+s+t+i+c+l+e+s?\b/i,
  /\bb+a+l+l+s+a+c+k+\b/i,
  /\bn+u+t+s+a+c+k+\b/i,
  /\bd+e+e+z+\s*n+u+t+s+\b/i,

  // Sexual / NSFW / Anatomy / Strip club terms
  /\bp+o+r+n+(o|ography|ographic|hub)?\b/i,
  /\bn+u+d+e+(s|ity)?\b/i,
  /\bn+u+d+i+t+y+\b/i,
  /\bn+a+k+e+d+\b/i,
  /\bh+o+r+n+y+\b/i,
  /\bb+o+o+b+(s|ies)?\b/i,
  /\bb+r+e+a+s+t+(s)?\b/i,
  /\bn+i+p+p+l+e+(s)?\b/i,
  /\bb+u+t+t+(ock|ocks)?\b/i,
  /\bb+i+k+i+n+i+\b/i,
  /\bl+i+n+g+e+r+i+e+\b/i,
  /\bu+n+d+e+r+w+e+a+r+\b/i,
  /\bp+a+n+t+i+e+s+\b/i,
  /\bt+h+o+n+g+\b/i,
  /\bc+l+e+a+v+a+g+e+\b/i,
  /\bg+e+n+i+t+a+l+(s|ia)?\b/i,
  /\bi+n+t+e+r+c+o+u+r+s+e+\b/i,
  /\bf+e+t+i+s+h+\b/i,
  /\bb+d+s+m+\b/i,
  /\bh+e+n+t+a+i+\b/i,
  /\bs+e+d+u+c+(e|tive|tion)\b/i,
  /\bs+e+n+s+u+a+l+\b/i,
  /\bp+l+a+y+b+o+y+\b/i,
  /\bt+i+t+(s|ties|ty)?\b/i,
  /\bp+e+n+i+s+\b/i,
  /\bv+a+g+i+n+a+\b/i,
  /\bv+u+l+v+a+\b/i,
  /\bc+l+i+t+(oris)?\b/i,
  /\bo+r+g+a+s+m+(s)?\b/i,
  /\bb+l+o+w+j+o+b+(s)?\b/i,
  /\bb+j+s?\b/i,
  /\bh+a+n+d+j+o+b+(s)?\b/i,
  /\bm+a+s+t+u+r+b+a+t+(e|ion|ing)\b/i,
  /\be+r+o+t+i+c+(a)?\b/i,
  /\bh+o+o+k+u+p+(s)?\b/i,
  /\bb+r+o+t+h+e+l+(s)?\b/i,
  /\bp+r+o+s+t+i+t+u+t+(e|es|ion)\b/i,
  /\bn+s+f+w+\b/i,
  /\bx+x+x+\b/i,
];

// Detect censored swear patterns like f*ck, f**k, s*it, b*tch, a**, d*ck, p*ssy
const CENSORED_SWEAR_PATTERNS: RegExp[] = [
  /\bf+[\W_]+c*[\W_]*k+\b/i,
  /\bs+[\W_]+h*[\W_]*t+\b/i,
  /\bb+[\W_]+t*[\W_]*c*h+\b/i,
  /\ba+[\W_]{2,}\b/i,
  /\bd+[\W_]+c*k+\b/i,
  /\bp+[\W_]+s+y+\b/i,
  /\bc+[\W_]+n+t+\b/i,
  /\bn+[\W_]+g+[\W_]*a*\b/i,
];

function normalizeLeetspeak(input: string): string {
  return input
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[._\-*]+/g, ' ');
}

// Secret-related phrases & patterns (triggers the Soundtrap warning + Soundtrap button)
const SECRET_PHRASES: string[] = [
  'keep a secret',
  'dirty secret',
  'top secret',
  'have a secret',
  'got a secret',
  'tell u a secret',
  'tell you a secret',
  'let me tell u smth',
  'let me tell you smth',
  'let me tell u something',
  'let me tell you something',
  'lemme tell u smth',
  'lemme tell you smth',
  'lemme tell u something',
  'wanna know smth',
  'wanna know something',
  'want to know smth',
  'want to know something',
  'dont tell anyone',
  "don't tell anyone",
];

const SECRET_PATTERNS: RegExp[] = [
  /\bsecrets?\b/i,
  /\bsecretly\b/i,
  /\bl+e+t+\s+m+e+\s+t+e+l+l+\s+(u+|y+o+u+)\s+(s+m+t+h+|s+o+m+e+t+h+i+n+g+)\b/i,
  /\bw+a+n+n+a+\s+k+n+o+w+\s+(s+m+t+h+|s+o+m+e+t+h+i+n+g+)\b/i,
];

export function isSecretContent(text: string): boolean {
  if (!text || !text.trim()) return false;
  const rawLower = text.toLowerCase().trim();
  const normalized = normalizeLeetspeak(text).trim();
  for (const phrase of SECRET_PHRASES) {
    if (rawLower.includes(phrase) || normalized.includes(phrase)) {
      return true;
    }
  }
  for (const regex of SECRET_PATTERNS) {
    if (regex.test(rawLower) || regex.test(normalized)) {
      return true;
    }
  }
  return false;
}

export function isContentRestricted(text: string): boolean {
  if (!text || !text.trim()) return false;
  if (isSecretContent(text)) return true;

  const rawLower = text.toLowerCase().trim();
  const normalized = normalizeLeetspeak(text).trim();

  for (const reg of CENSORED_SWEAR_PATTERNS) {
    if (reg.test(rawLower)) {
      return true;
    }
  }

  for (const phrase of BANNED_PHRASES) {
    if (rawLower.includes(phrase) || normalized.includes(phrase)) {
      return true;
    }
  }

  for (const regex of BANNED_WORD_PATTERNS) {
    if (regex.test(rawLower) || regex.test(normalized)) {
      return true;
    }
  }

  return false;
}
