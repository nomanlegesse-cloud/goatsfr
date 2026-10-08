import pinkBlossomBeachUrl from './assets/images/pink_blossom_beach_1791371620054.jpg';
import goldenGiftsWoodUrl from './assets/images/golden_gifts_wood_1791371630640.jpg';
import darkEmeraldCloversUrl from './assets/images/dark_emerald_clovers_1791371640529.jpg';

export type ChatBackgroundId =
  | 'none'
  | 'yellow-bows-bees'
  | 'light-chat-doodles'
  | 'pink-blossom-beach'
  | 'pastel-social-icons'
  | 'kawaii-cream-bears'
  | 'golden-gifts-wood'
  | 'dark-coral-waves'
  | 'bw-doodle-collage'
  | 'dark-emerald-clovers'
  | 'custom';

export interface ChatBackgroundOption {
  id: ChatBackgroundId;
  name: string;
  subtitle: string;
  imageUrl: string;
  backgroundSize: string;
  backgroundRepeat: string;
  isDark?: boolean;
}

function svgToDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

// 1. Yellow Bows, Bees & Daisies on warm cream yellow
const YELLOW_BOWS_BEES_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#FDF7DF"/>
  <!-- Dashed bee flight paths -->
  <path d="M 10 40 Q 90 90 160 50 T 310 90" fill="none" stroke="#8C734B" stroke-width="1.2" stroke-dasharray="4 5" opacity="0.55"/>
  <path d="M 30 250 Q 120 190 210 240 T 310 190" fill="none" stroke="#8C734B" stroke-width="1.2" stroke-dasharray="4 5" opacity="0.55"/>
  <!-- Daisy flower 1 -->
  <g transform="translate(56, 132)">
    <g fill="#FFFDF7" stroke="#6E5A38" stroke-width="1.2">
      <ellipse rx="6" ry="18" transform="rotate(0)"/>
      <ellipse rx="6" ry="18" transform="rotate(30)"/>
      <ellipse rx="6" ry="18" transform="rotate(60)"/>
      <ellipse rx="6" ry="18" transform="rotate(90)"/>
      <ellipse rx="6" ry="18" transform="rotate(120)"/>
      <ellipse rx="6" ry="18" transform="rotate(150)"/>
    </g>
    <circle r="8" fill="#F6B93B" stroke="#6E5A38" stroke-width="1.2"/>
  </g>
  <!-- Daisy flower 2 -->
  <g transform="translate(260, 275) scale(0.85)">
    <g fill="#FFFDF7" stroke="#6E5A38" stroke-width="1.2">
      <ellipse rx="6" ry="18" transform="rotate(0)"/>
      <ellipse rx="6" ry="18" transform="rotate(30)"/>
      <ellipse rx="6" ry="18" transform="rotate(60)"/>
      <ellipse rx="6" ry="18" transform="rotate(90)"/>
      <ellipse rx="6" ry="18" transform="rotate(120)"/>
      <ellipse rx="6" ry="18" transform="rotate(150)"/>
    </g>
    <circle r="8" fill="#F6B93B" stroke="#6E5A38" stroke-width="1.2"/>
  </g>
  <!-- Yellow Watercolor Bow 1 -->
  <g transform="translate(75, 58)">
    <path d="M0,0 C-22,-18 -28,14 0,4 C28,14 22,-18 0,0 Z" fill="#FDE08D" stroke="#D99B38" stroke-width="1.2"/>
    <path d="M-3,3 L-14,26 L-5,23 L-1,6 Z" fill="#FDE08D" stroke="#D99B38" stroke-width="1.1"/>
    <path d="M3,3 L14,26 L5,23 L1,6 Z" fill="#FDE08D" stroke="#D99B38" stroke-width="1.1"/>
    <circle r="3.5" fill="#F8C246" stroke="#D99B38" stroke-width="1.1"/>
  </g>
  <!-- Yellow Watercolor Bow 2 -->
  <g transform="translate(220, 145) scale(1.1)">
    <path d="M0,0 C-22,-18 -28,14 0,4 C28,14 22,-18 0,0 Z" fill="#FDE08D" stroke="#D99B38" stroke-width="1.2"/>
    <path d="M-3,3 L-14,26 L-5,23 L-1,6 Z" fill="#FDE08D" stroke="#D99B38" stroke-width="1.1"/>
    <path d="M3,3 L14,26 L5,23 L1,6 Z" fill="#FDE08D" stroke="#D99B38" stroke-width="1.1"/>
    <circle r="3.5" fill="#F8C246" stroke="#D99B38" stroke-width="1.1"/>
  </g>
  <!-- Yellow Watercolor Bow 3 -->
  <g transform="translate(155, 225) scale(0.9)">
    <path d="M0,0 C-22,-18 -28,14 0,4 C28,14 22,-18 0,0 Z" fill="#FDE08D" stroke="#D99B38" stroke-width="1.2"/>
    <path d="M-3,3 L-14,26 L-5,23 L-1,6 Z" fill="#FDE08D" stroke="#D99B38" stroke-width="1.1"/>
    <path d="M3,3 L14,26 L5,23 L1,6 Z" fill="#FDE08D" stroke="#D99B38" stroke-width="1.1"/>
    <circle r="3.5" fill="#F8C246" stroke="#D99B38" stroke-width="1.1"/>
  </g>
  <!-- Cute Bumblebee 1 -->
  <g transform="translate(95, 215) rotate(-20)">
    <ellipse cx="-4" cy="-10" rx="6" ry="9" fill="#FFFDF9" stroke="#3A2E21" stroke-width="1.2"/>
    <ellipse cx="4" cy="-10" rx="6" ry="9" fill="#FFFDF9" stroke="#3A2E21" stroke-width="1.2"/>
    <ellipse cx="0" cy="0" rx="14" ry="9" fill="#F6B93B" stroke="#3A2E21" stroke-width="1.3"/>
    <path d="M-5,-8 L-5,8 M2,-9 L2,9 M8,-6 L8,6" stroke="#3A2E21" stroke-width="3"/>
  </g>
  <!-- Cute Bumblebee 2 -->
  <g transform="translate(255, 78) rotate(18) scale(0.85)">
    <ellipse cx="-4" cy="-10" rx="6" ry="9" fill="#FFFDF9" stroke="#3A2E21" stroke-width="1.2"/>
    <ellipse cx="4" cy="-10" rx="6" ry="9" fill="#FFFDF9" stroke="#3A2E21" stroke-width="1.2"/>
    <ellipse cx="0" cy="0" rx="14" ry="9" fill="#F6B93B" stroke="#3A2E21" stroke-width="1.3"/>
    <path d="M-5,-8 L-5,8 M2,-9 L2,9 M8,-6 L8,6" stroke="#3A2E21" stroke-width="3"/>
  </g>
  <!-- Little Golden Hearts & Sparkles -->
  <path d="M165,85 C165,80 157,78 157,84 C157,89 165,94 165,97 C165,94 173,89 173,84 C173,78 165,80 165,85 Z" fill="#F5A623" stroke="#5C4422" stroke-width="1"/>
  <path d="M125,130 C125,126 118,124 118,129 C118,134 125,138 125,141 C125,138 132,134 132,129 C132,124 125,126 125,130 Z" fill="#E6951D"/>
  <path d="M210,260 C210,256 203,254 203,259 C203,264 210,268 210,271 C210,268 217,264 217,259 C217,254 210,256 210,260 Z" fill="#F5A623"/>
  <path d="M40,85 L43,92 L50,95 L43,98 L40,105 L37,98 L30,95 L37,92 Z" fill="none" stroke="#6E5A38" stroke-width="1"/>
  <path d="M240,35 L243,42 L250,45 L243,48 L240,55 L237,48 L230,45 L237,42 Z" fill="none" stroke="#6E5A38" stroke-width="1"/>
  <path d="M135,270 L138,277 L145,280 L138,283 L135,290 L132,283 L125,280 L132,277 Z" fill="#FDE08D"/>
</svg>
`);

// 2. Soft Gray Chat & Mail Doodles
const LIGHT_CHAT_DOODLES_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260">
  <rect width="260" height="260" fill="#F4F4F6"/>
  <g fill="none" stroke="#C5BEB9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <!-- Chat Bubble with dots -->
    <g transform="translate(28, 36)">
      <ellipse cx="22" cy="16" rx="20" ry="14"/>
      <path d="M12,28 L6,35 L18,29"/>
      <circle cx="15" cy="16" r="1.5" fill="#C5BEB9"/>
      <circle cx="22" cy="16" r="1.5" fill="#C5BEB9"/>
      <circle cx="29" cy="16" r="1.5" fill="#C5BEB9"/>
    </g>
    <!-- Heart -->
    <path d="M115,32 C115,23 100,20 100,31 C100,40 115,49 115,54 C115,49 130,40 130,31 C130,20 115,23 115,32 Z"/>
    <!-- House -->
    <g transform="translate(175, 24)">
      <path d="M4,18 L22,4 L40,18"/>
      <rect x="9" y="18" width="26" height="20"/>
      <rect x="19" y="26" width="6" height="12"/>
    </g>
    <!-- Envelope -->
    <g transform="translate(95, 88) rotate(-8)">
      <rect x="0" y="0" width="38" height="26" rx="3"/>
      <path d="M0,2 L19,15 L38,2"/>
    </g>
    <!-- Cloud Download -->
    <g transform="translate(160, 92)">
      <path d="M10,26 H36 A9,9 0 0,0 37,8 A13,13 0 0,0 12,6 A10,10 0 0,0 10,26 Z"/>
      <path d="M23,14 V29 M18,24 L23,29 L28,24"/>
    </g>
    <!-- Thumbs Up -->
    <g transform="translate(32, 118)">
      <rect x="0" y="12" width="8" height="16" rx="1"/>
      <path d="M8,14 L15,4 C17,4 19,6 18,10 L16,14 H26 C28,14 29,16 28,19 L25,27 C24,28 22,28 20,28 H8 Z"/>
    </g>
    <!-- Star + Hand -->
    <g transform="translate(205, 155)">
      <polygon points="16,2 20,10 29,11 22,17 24,26 16,21 8,26 10,17 3,11 12,10"/>
    </g>
    <!-- Second Chat Bubble -->
    <g transform="translate(115, 165)">
      <ellipse cx="22" cy="16" rx="20" ry="14"/>
      <path d="M12,28 L6,35 L18,29"/>
      <circle cx="15" cy="16" r="1.5" fill="#C5BEB9"/>
      <circle cx="22" cy="16" r="1.5" fill="#C5BEB9"/>
      <circle cx="29" cy="16" r="1.5" fill="#C5BEB9"/>
    </g>
    <!-- Second Heart -->
    <path d="M52,208 C52,199 37,196 37,207 C37,216 52,225 52,230 C52,225 67,216 67,207 C67,196 52,199 52,208 Z"/>
    <!-- Second Envelope -->
    <g transform="translate(185, 210) rotate(6)">
      <rect x="0" y="0" width="38" height="26" rx="3"/>
      <path d="M0,2 L19,15 L38,2"/>
    </g>
  </g>
</svg>
`);

// 4. Pastel Social App Icons on White
const PASTEL_SOCIAL_ICONS_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#FFFFFF"/>
  <!-- YouTube Pastel Pill -->
  <g transform="translate(30, 68) rotate(18)">
    <rect x="0" y="0" width="84" height="38" rx="11" fill="#FBD5D8"/>
    <text x="42" y="25" font-family="sans-serif" font-weight="800" font-size="20" fill="#FFFFFF" text-anchor="middle">Tube</text>
    <text x="42" y="-6" font-family="sans-serif" font-weight="800" font-size="22" fill="#F6C5C9" text-anchor="middle">You</text>
  </g>
  <!-- Instagram Pastel Outline -->
  <g transform="translate(155, 110) rotate(-10)">
    <rect x="0" y="0" width="70" height="70" rx="18" fill="none" stroke="#E8C5F0" stroke-width="6"/>
    <circle cx="35" cy="35" r="15" fill="none" stroke="#FAD2CC" stroke-width="6"/>
    <circle cx="53" cy="17" r="4" fill="#E8C5F0"/>
  </g>
  <!-- WhatsApp Pastel Green Circle -->
  <g transform="translate(145, 22)">
    <circle cx="28" cy="28" r="24" fill="#D5F5DF"/>
    <path d="M14,48 L18,38 A18,18 0 1,1 28,46 Z" fill="none" stroke="#FFFFFF" stroke-width="3"/>
    <path d="M22,20 C20,25 25,33 33,35" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  </g>
  <!-- Pinterest Pastel P -->
  <g transform="translate(230, 42) rotate(12)">
    <text x="0" y="55" font-family="serif" font-weight="900" font-size="72" fill="#F8D6DA">P</text>
  </g>
  <!-- Facebook Pastel f -->
  <g transform="translate(240, 175) rotate(10)">
    <text x="0" y="65" font-family="sans-serif" font-weight="900" font-size="78" fill="#D2E9FB">f</text>
  </g>
  <!-- Snapchat Ghost Pastel Yellow -->
  <g transform="translate(26, 175) rotate(-8)">
    <path d="M35,10 C20,10 15,24 15,38 C15,48 6,52 6,56 C6,60 16,60 18,64 C20,68 28,66 35,66 C42,66 50,68 52,64 C54,60 64,60 64,56 C64,52 55,48 55,38 C55,24 50,10 35,10 Z" fill="#FEF9D8"/>
  </g>
  <!-- Android Pastel Green -->
  <g transform="translate(145, 220) rotate(8)">
    <path d="M12,26 A20,20 0 0,1 52,26 Z" fill="#E2F3D5"/>
    <rect x="12" y="29" width="40" height="30" rx="5" fill="#E2F3D5"/>
    <circle cx="24" cy="18" r="2.2" fill="#FFFFFF"/>
    <circle cx="40" cy="18" r="2.2" fill="#FFFFFF"/>
  </g>
  <!-- Messenger Blue Bolt Circle -->
  <g transform="translate(95, 185)">
    <circle cx="22" cy="22" r="20" fill="#D6E6FB"/>
    <path d="M12,26 L21,16 L25,22 L33,16 L24,27 L20,21 Z" fill="#FFFFFF"/>
  </g>
</svg>
`);

// 5. Kawaii Cream Teddy Bears Pattern
const KAWAII_CREAM_BEARS_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <rect width="240" height="240" fill="#FFFDF9"/>
  <!-- Polka Dots -->
  <circle cx="25" cy="22" r="3" fill="#F7BAC5"/>
  <circle cx="120" cy="18" r="2.5" fill="#FDE6A8"/>
  <circle cx="215" cy="38" r="3" fill="#F7BAC5"/>
  <circle cx="88" cy="115" r="3" fill="#F7BAC5"/>
  <circle cx="172" cy="112" r="2.5" fill="#FDE6A8"/>
  <circle cx="38" cy="195" r="3" fill="#F7BAC5"/>
  <circle cx="145" cy="215" r="3" fill="#F7BAC5"/>
  <!-- Bear 1 -->
  <g transform="translate(62, 62) rotate(-12)">
    <circle cx="-22" cy="-18" r="11" fill="#FDECC2"/>
    <circle cx="-22" cy="-18" r="6" fill="#F7BAC5"/>
    <circle cx="22" cy="-18" r="11" fill="#FDECC2"/>
    <circle cx="22" cy="-18" r="6" fill="#F7BAC5"/>
    <ellipse cx="0" cy="0" rx="28" ry="22" fill="#FDECC2"/>
    <ellipse cx="0" cy="4" rx="7" ry="5.5" fill="#FFFFFF"/>
    <circle cx="-11" cy="-2" r="2.6" fill="#4A3525"/>
    <circle cx="11" cy="-2" r="2.6" fill="#4A3525"/>
    <path d="M0,2 L0,5 M0,5 L-3,8 M0,5 L3,8" stroke="#4A3525" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  </g>
  <!-- Bear 2 -->
  <g transform="translate(182, 68) rotate(16)">
    <circle cx="-22" cy="-18" r="11" fill="#FDECC2"/>
    <circle cx="-22" cy="-18" r="6" fill="#F7BAC5"/>
    <circle cx="22" cy="-18" r="11" fill="#FDECC2"/>
    <circle cx="22" cy="-18" r="6" fill="#F7BAC5"/>
    <ellipse cx="0" cy="0" rx="28" ry="22" fill="#FDECC2"/>
    <ellipse cx="0" cy="4" rx="7" ry="5.5" fill="#FFFFFF"/>
    <circle cx="-11" cy="-2" r="2.6" fill="#4A3525"/>
    <circle cx="11" cy="-2" r="2.6" fill="#4A3525"/>
    <path d="M0,2 L0,5 M0,5 L-3,8 M0,5 L3,8" stroke="#4A3525" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  </g>
  <!-- Bear 3 -->
  <g transform="translate(116, 168) rotate(8)">
    <circle cx="-22" cy="-18" r="11" fill="#FDECC2"/>
    <circle cx="-22" cy="-18" r="6" fill="#F7BAC5"/>
    <circle cx="22" cy="-18" r="11" fill="#FDECC2"/>
    <circle cx="22" cy="-18" r="6" fill="#F7BAC5"/>
    <ellipse cx="0" cy="0" rx="28" ry="22" fill="#FDECC2"/>
    <ellipse cx="0" cy="4" rx="7" ry="5.5" fill="#FFFFFF"/>
    <circle cx="-11" cy="-2" r="2.6" fill="#4A3525"/>
    <circle cx="11" cy="-2" r="2.6" fill="#4A3525"/>
    <path d="M0,2 L0,5 M0,5 L-3,8 M0,5 L3,8" stroke="#4A3525" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  </g>
</svg>
`);

// 7. Dark Charcoal & Coral Waves (Paper-cut layered neon coral rim)
const DARK_CORAL_WAVES_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900" preserveAspectRatio="none">
  <rect width="600" height="900" fill="#1D1F24"/>
  <!-- Coral glowing rim path -->
  <path d="M 0,0 L 385,0 C 410,120 215,150 220,235 C 225,315 365,370 330,490 C 295,600 40,565 0,635 Z" fill="#FF8C73"/>
  <!-- Dark slate middle layer -->
  <path d="M 0,0 L 372,0 C 396,115 202,148 208,235 C 214,315 355,372 320,490 C 285,598 35,562 0,630 Z" fill="#23262D"/>
  <!-- Deep slate top left layer -->
  <path d="M 0,0 L 315,0 C 335,105 150,145 155,235 C 160,315 295,375 260,485 C 225,585 25,555 0,620 Z" fill="#2D323B"/>
  <!-- Bottom right coral accent wave -->
  <path d="M 600,700 C 520,765 445,755 375,795 C 325,825 315,875 315,900 L 600,900 Z" fill="#FF8C73"/>
  <path d="M 600,706 C 522,770 448,760 380,800 C 330,830 322,878 322,900 L 600,900 Z" fill="#262930"/>
</svg>
`);

// 8. Black & White Hand-Drawn Doodle Collage
const BW_DOODLE_COLLAGE_SVG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">
  <rect width="280" height="280" fill="#FFFFFF"/>
  <g fill="none" stroke="#222222" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Rocket -->
    <g transform="translate(52, 24) rotate(35)">
      <path d="M12,0 C20,10 20,28 12,38 C4,28 4,10 12,0 Z"/>
      <circle cx="12" cy="16" r="4"/>
      <path d="M5,28 L0,36 L8,34 M19,28 L24,36 L16,34"/>
    </g>
    <!-- Octopus with Sunglasses -->
    <g transform="translate(145, 95)">
      <path d="M15,30 C15,10 45,10 45,30 C45,42 58,48 54,54 C50,58 40,46 38,54 C36,62 24,62 22,54 C20,46 10,58 6,54 C2,48 15,42 15,30 Z"/>
      <rect x="19" y="22" width="10" height="7" fill="#222222"/>
      <rect x="33" y="22" width="10" height="7" fill="#222222"/>
      <line x1="29" y1="25" x2="33" y2="25"/>
    </g>
    <!-- Hi Speech Bubble -->
    <g transform="translate(135, 178)">
      <rect x="0" y="0" width="34" height="24" rx="4"/>
      <path d="M8,24 L6,31 L15,24"/>
      <text x="17" y="17" font-family="sans-serif" font-weight="700" font-size="13" fill="#222222" stroke="none" text-anchor="middle">Hi</text>
    </g>
    <!-- BFF text -->
    <text x="195" y="65" font-family="sans-serif" font-weight="800" font-size="16" fill="none" stroke="#222222" stroke-width="1.3" transform="rotate(15 195 65)">BFF</text>
    <!-- Game Controller -->
    <g transform="translate(195, 195) rotate(12)">
      <rect x="0" y="0" width="44" height="24" rx="10"/>
      <path d="M12,8 V16 M8,12 H16"/>
      <circle cx="32" cy="10" r="2"/>
      <circle cx="36" cy="15" r="2"/>
    </g>
    <!-- Pizza Slice -->
    <g transform="translate(32, 210) rotate(-20)">
      <path d="M0,0 L32,12 L12,36 Z"/>
      <circle cx="14" cy="14" r="3"/>
      <circle cx="20" cy="20" r="2.5"/>
    </g>
    <!-- Dinosaur -->
    <g transform="translate(45, 135)">
      <path d="M10,10 C10,2 24,2 24,10 V24 H36 L32,34 H8 V10 Z"/>
      <circle cx="18" cy="8" r="1.5" fill="#222222"/>
    </g>
    <!-- 09:28 Digital Clock -->
    <g transform="translate(150, 232) rotate(-10)">
      <rect x="0" y="0" width="44" height="18" rx="3"/>
      <text x="22" y="13" font-family="monospace" font-weight="700" font-size="11" fill="#222222" stroke="none" text-anchor="middle">09:28</text>
    </g>
    <!-- Little Stars & Dots -->
    <circle cx="22" cy="85" r="2.5"/>
    <circle cx="115" cy="48" r="2"/>
    <circle cx="248" cy="120" r="3"/>
    <circle cx="98" cy="245" r="2.5"/>
  </g>
</svg>
`);

export const CHAT_BACKGROUND_OPTIONS: ChatBackgroundOption[] = [
  {
    id: 'yellow-bows-bees',
    name: '1. Yellow Bows & Bees',
    subtitle: 'Warm cream yellow with watercolor bows, daisies & bumblebees',
    imageUrl: YELLOW_BOWS_BEES_SVG,
    backgroundSize: '300px 300px',
    backgroundRepeat: 'repeat',
    isDark: false,
  },
  {
    id: 'light-chat-doodles',
    name: '2. Soft Chat Doodles',
    subtitle: 'Minimal light gray outline chat bubbles, hearts & mail icons',
    imageUrl: LIGHT_CHAT_DOODLES_SVG,
    backgroundSize: '260px 260px',
    backgroundRepeat: 'repeat',
    isDark: false,
  },
  {
    id: 'pink-blossom-beach',
    name: '3. Pink Blossom Beach',
    subtitle: 'Turquoise crystal shore with floating pink petals & sunbeams',
    imageUrl: pinkBlossomBeachUrl,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    isDark: false,
  },
  {
    id: 'pastel-social-icons',
    name: '4. Pastel Social Icons',
    subtitle: 'Playful pastel YouTube, Instagram, WhatsApp & social logos',
    imageUrl: PASTEL_SOCIAL_ICONS_SVG,
    backgroundSize: '300px 300px',
    backgroundRepeat: 'repeat',
    isDark: false,
  },
  {
    id: 'kawaii-cream-bears',
    name: '5. Kawaii Cream Bears',
    subtitle: 'Cute pastel cream teddy bears & pink polka dots',
    imageUrl: KAWAII_CREAM_BEARS_SVG,
    backgroundSize: '240px 240px',
    backgroundRepeat: 'repeat',
    isDark: false,
  },
  {
    id: 'golden-gifts-wood',
    name: '6. Golden Gifts & Silk',
    subtitle: 'Warm rustic wood tabletop with ivory silk, rose petals & gold gifts',
    imageUrl: goldenGiftsWoodUrl,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    isDark: true,
  },
  {
    id: 'dark-coral-waves',
    name: '7. Dark Coral Waves',
    subtitle: 'Sleek dark charcoal layered waves with glowing coral rim',
    imageUrl: DARK_CORAL_WAVES_SVG,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    isDark: true,
  },
  {
    id: 'bw-doodle-collage',
    name: '8. B&W Doodle Collage',
    subtitle: 'Classic hand-drawn black & white icon collage wallpaper',
    imageUrl: BW_DOODLE_COLLAGE_SVG,
    backgroundSize: '280px 280px',
    backgroundRepeat: 'repeat',
    isDark: false,
  },
  {
    id: 'dark-emerald-clovers',
    name: '9. Midnight Emerald Clovers',
    subtitle: 'Deep moody forest green clover leaves from above',
    imageUrl: darkEmeraldCloversUrl,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    isDark: true,
  },
];
