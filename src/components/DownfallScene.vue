<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { createPixelFilter } from '../graphics/pixelFilter';

type Scene = 'school' | 'before' | 'dose' | 'mirror' | 'shortage' | 'debt' | 'enforcer' | 'conflict' | 'loss' | 'escape' | 'collapse' | 'flatline' | 'memorial';
const props = withDefaults(defineProps<{ scene: Scene; intensity?: number; paused?: boolean; reducedMotion?: boolean }>(), {
  intensity: 1,
  paused: false,
});
const canvasRef = ref<HTMLCanvasElement | null>(null);
const descriptions: Record<Scene, string> = {
  school: 'Behind the school gym bleachers, a sixteen-year-old is offered a stimulant pill to ease exam stress.',
  before: 'Behind the school gym bleachers, a sixteen-year-old is offered a stimulant pill to ease exam stress.',
  dose: 'At school, the student takes another pill. His weekly allowance is running out.',
  mirror: 'Tolerance and withdrawal leave the student trembling and exhausted.',
  shortage: 'Shivering outside school, the student has run out of money. The help from family and a friend is not enough.',
  debt: 'A black car stops outside school. A loan shark offers money with weekly interest.',
  enforcer: 'Working for the syndicate, the young man faces a debt collection target in a dark backstreet.',
  conflict: 'Working for the syndicate, the young man faces a debt collection target in a dark backstreet.',
  loss: 'Broke and sick, the young man is alone in the rain after being dumped by the syndicate.',
  escape: 'The young man runs across rooftops with stolen cash as a helicopter searchlight sweeps the buildings.',
  collapse: 'On a rain-soaked rooftop beneath a water tower, the young man clutches his chest and collapses, stolen cash in hand.',
  flatline: 'A hospital-style heartbeat monitor slows to a steady flat line.',
  memorial: 'A steady flat line remains on the heartbeat monitor. The illusion of control has ended.',
};
const sceneDescription = computed(() => descriptions[props.scene]);
let frameId = 0;
let elapsed = 0;
let lastTime = 0;
let lastPaint = -Infinity;
let reduceMotion = false;
let motionQuery: MediaQueryList | null = null;
let ctx: CanvasRenderingContext2D | null = null;
const applyPixelFilter = createPixelFilter(320, 180);

const palette = {
  ink: '#080e16', dark: '#111c27', navy: '#182b36', steel: '#2e454d', teal: '#507879',
  skin: '#ba9275', lightSkin: '#dbb393', hair: '#171c21', shirt: '#6c9e99',
  worn: '#526664', warm: '#e9b77b', coral: '#cb7965', cream: '#ddd2b4',
};
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = (value: number) => { const v = clamp(value); return v * v * (3 - 2 * v); };
const noise = (i: number) => { const n = Math.sin(i * 127.1 + 39.2) * 43758.5453; return n - Math.floor(n); };

function rect(x: number, y: number, w: number, h: number, color: string) {
  if (!ctx) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function polygon(points: number[][], color: string) {
  if (!ctx || !points.length) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x = 0, y = 0], i) => i ? ctx!.lineTo(Math.round(x), Math.round(y)) : ctx!.moveTo(Math.round(x), Math.round(y)));
  ctx.closePath();
  ctx.fill();
}
function line(x1: number, y1: number, x2: number, y2: number, color: string, width = 1) {
  if (!ctx) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(Math.round(x1), Math.round(y1));
  ctx.lineTo(Math.round(x2), Math.round(y2));
  ctx.stroke();
}
function lettering(text: string, x: number, y: number, color: string, size = 9) {
  if (!ctx) return;
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px monospace`;
  ctx.fillText(text, x, y);
}
function glow(x: number, y: number, radius: number, color: string) {
  if (!ctx) return;
  const light = ctx.createRadialGradient(x, y, 1, x, y, radius);
  light.addColorStop(0, color);
  light.addColorStop(1, 'transparent');
  ctx.fillStyle = light;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
function shadow(x: number, y: number, width: number) {
  if (!ctx) return;
  ctx.fillStyle = '#050b1290';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, width, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function skyline(daylight = false) {
  if (!ctx) return;
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, daylight ? '#546a73' : '#121d30');
  sky.addColorStop(1, daylight ? '#cba88b' : '#4b525d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 640, 360);
  rect(450, 33, 28, 24, daylight ? '#e8caa3' : '#bec5bd');
  rect(446, 39, 36, 12, daylight ? '#e8caa3' : '#bec5bd');
  if (!daylight) {
    for (let i = 0; i < 28; i++) rect(noise(i) * 640, noise(i + 90) * 95, 1, 1, '#8da0ac');
  }
  for (let i = 0; i < 13; i++) {
    const x = i * 56 - 15;
    const height = 65 + noise(i + 50) * 75;
    rect(x, 217 - height, 48, height, daylight ? '#51626b' : '#243341');
    rect(x + 5, 211 - height, 38, 6, '#344653');
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 4; col++) {
        if (row * 12 < height - 15) rect(x + col * 10 + 7, 229 - height + row * 12, 4, 5,
          noise(i * 47 + row * 11 + col) > .62 ? '#b39970' : '#394b58');
      }
    }
    line(x + 11, 207 - height, x + 11, 195 - height, '#394b58');
  }
}

function pavement(wet: boolean, time: number) {
  rect(0, 280, 640, 80, '#182830');
  rect(0, 281, 640, 2, '#546361');
  for (let i = 0; i < 9; i++) line(i * 91 - 50, 280, i * 111 - 90, 360, '#24383f');
  [297, 323, 355].forEach(y => line(0, y, 640, y, '#2c4146'));
  for (let i = 0; i < 55; i++) {
    const x = noise(i + 800) * 640;
    const y = 286 + noise(i + 450) * 73;
    rect(x, y, 1 + noise(i) * 13, 1, '#314950');
  }
  if (wet) {
    for (let i = 0; i < 30; i++) {
      const y = 288 + i * 2.1;
      const ripple = Math.floor(Math.sin(time * .6 + i) * 4);
      rect(120 + ripple - i * .7, y, 21 + noise(i + 1) * 47, 1, i % 3 ? '#ad8f6048' : '#749b9a40');
      rect(467 + ripple, y + 5, noise(i + 4) * 34, 1, '#a45f5140');
    }
  }
}

function street(time: number, abandoned = false, morning = false) {
  skyline(morning);
  rect(0, 129, 209, 150, '#36494d');
  rect(0, 126, 218, 7, '#1d303a');
  rect(6, 159, 191, 119, '#142730');
  rect(15, 169, 173, 108, abandoned ? '#263b40' : '#314c50');
  for (let y = 173; y < 275; y += 7) rect(15, y, 173, 2, '#172c33');
  rect(11, 143, 181, 20, '#15262d');
  lettering(abandoned ? 'CLOSED / NO VACANCIES' : 'AFTER HOURS · REPAIRS', 23, 157, '#a7b2a0', 9);
  rect(433, 105, 207, 175, '#303f47');
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 6; col++) rect(433 + col * 39 + (row % 2) * 15, 111 + row * 22, 36, 1, '#415057');
  }
  rect(465, 163, 75, 117, '#111e29');
  rect(472, 170, 60, 110, '#29373d');
  rect(478, 175, 47, 102, '#344047');
  rect(519, 224, 3, 5, '#ab9b78');
  rect(549, 134, 65, 47, '#182730');
  rect(553, 138, 57, 37, morning ? '#acaa8b' : '#6a7164');
  rect(576, 137, 3, 39, '#223139');
  rect(552, 154, 59, 3, '#223139');
  rect(601, 188, 29, 22, '#67716c');
  for (let y = 192; y < 207; y += 3) rect(605, y, 21, 1, '#384a4e');
  line(624, 210, 624, 280, '#171e29', 3);
  rect(207, 235, 227, 3, '#687674');
  for (let x = 214; x < 433; x += 23) rect(x, 238, 3, 40, '#263e47');
  rect(209, 263, 224, 3, '#536365');
  pavement(!morning, time);
  rect(139, 94, 4, 187, '#0e202b');
  rect(141, 95, 29, 4, '#0e202b');
  rect(155, 98, 19, 5, '#d5b680');
  polygon([[156, 104], [90, 280], [224, 280], [173, 104]], '#e7bd6011');
  glow(164, 115, 125, '#ebbd6920');
  if (abandoned) {
    rect(488, 192, 32, 42, '#d3bb8d');
    lettering('NO', 497, 203, '#653c35', 7);
    lettering('CREDIT', 490, 212, '#653c35', 7);
    for (let y = 218; y < 229; y += 4) rect(493, y, 21, 1, '#897357');
  }
}

function rooftop(time: number) {
  skyline();
  // The same neighbourhood, now seen from above and very far away.
  rect(0, 240, 640, 43, '#293b43');
  rect(0, 236, 640, 7, '#526367');
  rect(0, 248, 640, 2, '#172b35');
  for (let x = 0; x < 640; x += 82) rect(x, 250, 2, 31, '#1b3039');
  pavement(true, time);
  rect(467, 79, 106, 87, '#32444d');
  rect(462, 86, 116, 6, '#58676a');
  rect(462, 151, 116, 7, '#526266');
  polygon([[468, 78], [482, 66], [558, 66], [572, 78]], '#596866');
  rect(481, 79, 5, 71, '#536267');
  rect(555, 79, 8, 71, '#243a44');
  line(481, 166, 474, 279, '#172c37', 7);
  line(558, 166, 565, 279, '#172c37', 7);
  line(482, 173, 563, 267, '#334b52', 3);
  line(557, 173, 476, 267, '#334b52', 3);
  rect(574, 155, 5, 124, '#506368');
  rect(590, 155, 4, 124, '#506368');
  for (let y = 169; y < 279; y += 13) rect(575, y, 19, 3, '#54666a');
  rect(55, 236, 78, 43, '#435659');
  rect(51, 231, 87, 7, '#6c7872');
  for (let y = 242; y < 273; y += 6) rect(62, y, 63, 2, '#253d47');
  line(89, 230, 89, 184, '#3d5359', 10);
  rect(80, 178, 18, 7, '#66756f');
  glow(470, 198, 170, '#718f9220');
}

function room(mirror = false) {
  rect(0, 0, 640, 360, '#1b282d');
  rect(0, 30, 640, 251, '#344146');
  rect(0, 30, 218, 252, '#27383f');
  line(218, 30, 218, 282, '#15242c', 3);
  for (let i = 0; i < 88; i++) rect(noise(i) * 638, 37 + noise(i + 100) * 236, 1, 2, '#7a817419');
  rect(0, 279, 640, 7, '#14232b');
  rect(0, 287, 640, 73, '#29383c');
  for (let i = 0; i < 8; i++) line(i * 100 - 100, 287, i * 130 - 180, 360, '#405051');
  [303, 326, 351].forEach(y => line(0, y, 640, y, '#172a32'));
  rect(38, 71, 136, 115, '#a89a7a');
  rect(43, 76, 126, 105, '#182c40');
  for (let i = 0; i < 7; i++) {
    const height = 21 + noise(i) * 55;
    rect(45 + i * 18, 178 - height, 16, height, '#2c4350');
    for (let j = 0; j < 4; j++) rect(48 + i * 18, 177 - j * 13, 3, 4, '#b9996c');
  }
  rect(104, 76, 4, 105, '#6b7269');
  rect(42, 122, 130, 4, '#6b7269');
  rect(31, 62, 17, 131, '#534f4b');
  rect(165, 62, 17, 131, '#534f4b');
  for (let i = 0; i < 3; i++) rect(34 + i * 5, 68, 2, 119, '#74665a');
  rect(366, 244, 223, 9, '#a18565');
  rect(375, 253, 6, 44, '#695b4c');
  rect(577, 253, 6, 44, '#695b4c');
  rect(526, 229, 24, 6, '#574c40');
  rect(537, 195, 3, 35, '#ac9d75');
  polygon([[525, 185], [549, 185], [556, 203], [518, 203]], '#d5ad74');
  glow(536, 210, 129, '#efba6530');
  polygon([[520, 203], [439, 243], [586, 243], [555, 203]], '#f2d28512');
  rect(439, 236, 32, 6, '#b0b39a');
  rect(443, 232, 31, 5, '#7d918b');
  rect(479, 237, 25, 4, '#bdbaa0');
  rect(483, 233, 25, 3, '#758c88');
  rect(404, 225, 11, 17, '#a0b3aa');
  rect(406, 224, 7, 2, '#d0d1b3');
  rect(400, 125, 64, 54, '#222c31');
  rect(405, 130, 54, 44, '#9d9380');
  lettering('SEPTEMBER', 409, 140, '#39423e', 7);
  for (let i = 0; i < 20; i++) rect(411 + i % 5 * 9, 147 + Math.floor(i / 5) * 6, 3, 2, '#697365');
  if (mirror) {
    rect(230, 63, 110, 180, '#746b5a');
    rect(237, 70, 96, 165, '#647974');
    rect(242, 75, 86, 154, '#3a555a');
    polygon([[242, 75], [289, 75], [242, 179]], '#bdc6b114');
    line(308, 73, 282, 110, '#bac3b46b');
    line(282, 110, 297, 132, '#bac3b46b');
    line(297, 132, 270, 175, '#bac3b46b');
    line(282, 110, 258, 102, '#bac3b446');
  } else {
    rect(177, 244, 165, 38, '#655750');
    rect(169, 237, 173, 10, '#9b8f7b');
    rect(172, 247, 169, 22, '#677b77');
    for (let i = 0; i < 6; i++) rect(174, 250 + i * 3, 163, 1, '#a4a38b33');
    rect(182, 221, 45, 15, '#b4b49d');
    rect(179, 232, 53, 5, '#8a9c91');
    rect(179, 279, 5, 13, '#343238');
    rect(330, 279, 5, 13, '#343238');
  }
}

type Pose = 'idle' | 'dose' | 'hunched' | 'point' | 'offer' | 'strike' | 'recoil' | 'walk' | 'run' | 'kneel';
function person(x: number, y: number, pose: Pose, time: number, options: { facing?: number; shirt?: string; gaunt?: boolean; scale?: number } = {}) {
  if (!ctx) return;
  const facing = options.facing ?? 1;
  const sick = options.gaunt ?? false;
  const shirt = options.shirt ?? (sick ? palette.worn : palette.shirt);
  const breath = reduceMotion ? 0 : Math.round(Math.sin(time * 1.5) * .65);
  const lean = pose === 'hunched' || pose === 'kneel' ? 10 : pose === 'strike' || pose === 'run' ? 11 : pose === 'recoil' ? -12 : 0;
  const crouch = pose === 'kneel' ? 35 : pose === 'hunched' ? 5 : 0;
  const walk = pose === 'walk' || pose === 'run' ? Math.round(Math.sin(time * (pose === 'run' ? 9 : 5)) * (pose === 'run' ? 19 : 13)) : 0;
  shadow(x, y, 23 * (options.scale ?? 1));
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(facing * (options.scale ?? 1), options.scale ?? 1);
  const segment = (a: number[], b: number[], color: string, width: number) => {
    line(a[0]!, a[1]!, b[0]!, b[1]!, palette.ink, width + 4);
    line(a[0]!, a[1]!, b[0]!, b[1]!, color, width);
  };
  const hips = [0, -58 + crouch];
  const shoulder = [lean, -103 + crouch + breath];
  // Back leg, weight-bearing front leg, and firmly planted shoes.
  segment([-6, hips[1]!], [-11 - walk * .6, -29 + crouch * .45], '#293b47', 10);
  segment([-11 - walk * .6, -29 + crouch * .45], [-12 - walk, -6], '#273b48', 9);
  segment([6, hips[1]!], [10 + walk * .5, -30 + crouch * .7], '#3a4f58', 11);
  segment([10 + walk * .5, -30 + crouch * .7], [12 + walk, -5], '#354b55', 9);
  rect(-19 - walk, -7, 20, 7, '#101b25');
  rect(7 + walk, -7, 22, 7, '#16212a');
  rect(-19 - walk, -1, 20, 2, '#71827c');
  rect(7 + walk, -1, 22, 2, '#89978b');
  const bodyWidth = sick ? 11 : 14;
  polygon([[lean - bodyWidth - 2, shoulder[1]! - 3], [lean + bodyWidth, shoulder[1]! - 3], [16, hips[1]! + 3], [-14, hips[1]! + 3]], palette.ink);
  polygon([[lean - bodyWidth, shoulder[1]!], [lean + bodyWidth - 2, shoulder[1]!], [12, hips[1]!], [-11, hips[1]!]], shirt);
  polygon([[lean - bodyWidth, shoulder[1]!], [lean - 5, shoulder[1]! + 7], [-5, hips[1]!], [-11, hips[1]!]], '#304d51');
  line(lean + 9, shoulder[1]! + 8, 8, hips[1]! - 8, '#a6b8a53b', 2);
  line(-6, hips[1]! - 4, 10, hips[1]! - 4, '#20343d', 2);
  line(lean - 3, shoulder[1]! + 25, lean + 8, shoulder[1]! + 28, '#172c3238', 2);
  // Neck and an asymmetrical profile keep the person recognizable across chapters.
  rect(lean - 3, shoulder[1]! - 12, 9, 15, sick ? '#927c67' : palette.skin);
  const hx = lean + (sick ? 5 : 2);
  const hy = shoulder[1]! - 25 + (sick ? 3 : 0);
  rect(hx - 10, hy - 7, 23, 26, palette.ink);
  rect(hx - 8, hy - 6, 19, 24, sick ? '#ac947d' : palette.skin);
  rect(hx + 3, hy, 8, 13, sick ? '#b9a58b' : palette.lightSkin);
  rect(hx + 10, hy + 5, 4, 5, sick ? '#ad947c' : palette.skin);
  rect(hx - 10, hy - 9, 22, 9, palette.hair);
  rect(hx - 10, hy - 2, 6, 12, palette.hair);
  rect(hx - 7, hy + 6, 4, 6, palette.skin);
  rect(hx + 5, hy + 3, 5, 2, '#202b2c');
  rect(hx + 7, hy + 5, 2, 2, '#162124');
  rect(hx + 7, hy + 13, 5, pose === 'point' ? 3 : 1, '#654d44');
  if (sick) {
    rect(hx + 3, hy + 7, 7, 2, '#786f67');
    rect(hx - 1, hy + 12, 5, 4, '#8c7f70');
    rect(-4, hips[1]! - 16, 4, 7, '#354949');
  }
  const armStart = [lean + 10, shoulder[1]! + 5];
  let elbow = [lean + 17, shoulder[1]! + 27];
  let hand = [lean + 15, shoulder[1]! + 47];
  if (pose === 'point') { elbow = [lean + 29, shoulder[1]! + 11]; hand = [lean + 52, shoulder[1]! + 5]; }
  if (pose === 'offer') { elbow = [lean + 20, shoulder[1]! + 27]; hand = [lean + 43, shoulder[1]! + 25]; }
  if (pose === 'strike') { elbow = [lean + 33, shoulder[1]! + 3]; hand = [lean + 57, shoulder[1]!]; }
  if (pose === 'dose') { elbow = [lean + 25, shoulder[1]! + 16]; hand = [hx + 12, hy + 13]; }
  if (pose === 'recoil') { elbow = [lean + 20, shoulder[1]! + 10]; hand = [lean + 30, shoulder[1]! - 14]; }
  if (pose === 'hunched' || pose === 'kneel') { elbow = [lean + 18, shoulder[1]! + 25]; hand = [lean + 17, shoulder[1]! + 43]; }
  if (pose === 'walk') { elbow[0]! -= walk * .5; hand[0]! -= walk; }
  if (pose === 'run') { elbow = [lean - walk * .6, shoulder[1]! + 22]; hand = [lean + 15 - walk, shoulder[1]! + 6]; }
  segment([lean - 12, shoulder[1]! + 4], [lean - 18, shoulder[1]! + 26], '#365359', 8);
  segment([lean - 18, shoulder[1]! + 26], [lean - 12, shoulder[1]! + 44], sick ? '#94826e' : palette.skin, 6);
  segment(armStart, elbow, shirt, 9);
  segment(elbow, hand, sick ? '#af9780' : palette.skin, 7);
  rect(hand[0]! - 3, hand[1]! - 3, 7, 7, sick ? '#baa189' : palette.lightSkin);
  if (pose === 'point') rect(hand[0]! + 2, hand[1]! - 3, 9, 3, palette.skin);
  ctx.restore();
}

function rain(time: number) {
  if (!ctx) return;
  const movement = reduceMotion ? 0 : time;
  ctx.globalAlpha = .24 * clamp(props.intensity);
  for (let i = 0; i < 73; i++) {
    const x = (noise(i + 77) * 690 - movement * (i % 2 ? 13 : 19) + 20000) % 690 - 25;
    const y = (noise(i + 99) * 390 + movement * (i % 2 ? 67 : 102)) % 390 - 20;
    line(x, y, x - 2, y + (i % 2 ? 6 : 11), '#aec0c0');
  }
  ctx.globalAlpha = 1;
}

function schoolyard(time: number) {
  skyline(true);
  rect(0, 67, 640, 210, '#596667');
  rect(0, 69, 640, 9, '#81908b');
  rect(75, 95, 150, 42, '#364d55');
  rect(84, 101, 132, 29, '#9aaca0');
  for (let x = 111; x < 220; x += 33) rect(x, 100, 3, 32, '#526c6d');
  rect(365, 94, 150, 43, '#364d55');
  rect(374, 101, 132, 29, '#9aaca0');
  for (let x = 399; x < 508; x += 33) rect(x, 100, 3, 32, '#526c6d');
  lettering('SCHOOL GYM', 271, 110, '#cfceb2', 13);
  rect(0, 145, 640, 136, '#354b50');
  for (let row = 0; row < 5; row++) {
    const y = 151 + row * 24;
    rect(32 - row * 6, y, 574 + row * 12, 8, '#b2aaa0');
    rect(36 - row * 6, y + 8, 566 + row * 12, 5, '#718081');
    for (let x = 55; x < 630; x += 100) line(x, y + 13, x - 11, y + 33, '#263d47', 4);
  }
  pavement(false, time);
  line(0, 337, 640, 337, '#9bada26e', 2);
  rect(286, 280, 20, 27, '#304753');
  rect(290, 277, 12, 4, '#6b827f');
  rect(289, 290, 14, 10, '#617b79');
}

function blackCar() {
  shadow(459, 298, 119);
  polygon([[346, 254], [377, 250], [399, 222], [498, 222], [527, 250], [565, 256], [572, 285], [343, 285]], '#101922');
  polygon([[399, 229], [440, 229], [440, 250], [383, 250]], '#465960');
  polygon([[447, 229], [492, 229], [515, 250], [447, 250]], '#384b55');
  line(447, 255, 447, 281, '#43545a');
  rect(453, 260, 13, 3, '#7b8580');
  rect(347, 262, 11, 8, '#ad8469');
  rect(558, 262, 10, 9, '#d0be8d');
  rect(377, 277, 31, 24, '#080f18');
  rect(384, 282, 17, 15, '#526064');
  rect(519, 277, 31, 24, '#080f18');
  rect(526, 282, 17, 15, '#526064');
  rect(346, 280, 224, 4, '#263940');
}

function flatline(time: number) {
  rect(0, 0, 640, 360, '#101b21');
  for (let x = 24; x < 640; x += 24) line(x, 26, x, 332, '#1d3238');
  for (let y = 26; y < 334; y += 24) line(24, y, 616, y, '#1d3238');
  lettering('FINAL HEARTBEAT', 37, 58, '#78938a', 15);
  lettering('00', 457, 98, '#c29a76', 48);
  lettering('BPM', 531, 97, '#78938a', 15);
  line(34, 194, 606, 194, '#a87b66', 3);
  glow(320, 194, 155, '#ad7f5c13');
  const cursor = 34 + (time * 38) % 572;
  rect(cursor, 191, 4, 6, '#d7b894');
  lettering('NO CARDIAC RHYTHM', 37, 297, '#ab9984', 14);
  lettering('THE ILLUSION OF CONTROL', 37, 320, '#657f7e', 10);
}

function draw(time: number) {
  if (!ctx) return;
  ctx.clearRect(0, 0, 640, 360);
  ctx.imageSmoothingEnabled = false;
  const scene = props.scene;
  if (scene === 'school' || scene === 'before' || scene === 'dose' || scene === 'shortage') schoolyard(time);
  else if (scene === 'mirror') room(true);
  else if (scene === 'collapse' || scene === 'escape') rooftop(time);
  else if (scene === 'flatline' || scene === 'memorial') flatline(time);
  else street(time, scene === 'loss');

  if (scene === 'school' || scene === 'before') {
    const taking = time > 1.2 && time < 3.6;
    person(289, 303, taking ? 'dose' : 'idle', time, { shirt: '#aab9a9', scale: .94 });
    person(385, 302, time < 1.2 ? 'offer' : 'idle', time + 1, { shirt: '#839792', facing: -1, scale: .94 });
    if (time < 1.2) rect(341, 227, 4, 3, '#e2dcc0');
    if (taking && time < 2.5) rect(302, 195, 4, 3, '#e2dcc0');
  } else if (scene === 'dose') {
    const raising = time > 1.1 && time < 3.8;
    person(321, 304, raising ? 'dose' : 'hunched', time, { shirt: '#9aaa9c', gaunt: true });
    if (!raising && time < 1.1) rect(348, 247, 4, 3, '#e4d9bd');
    if (raising && time < 2.2) rect(338, 192, 4, 3, '#e4d9bd');
    rect(402, 274, 27, 9, '#565445');
    rect(407, 273, 12, 3, '#a5b09a');
  } else if (scene === 'mirror') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(243, 76, 84, 153);
    ctx.clip();
    person(278, 245, 'hunched', time, { gaunt: true, facing: -1, scale: .82 });
    rect(242, 75, 86, 154, '#98b7b220');
    ctx.restore();
    person(340, 300, 'hunched', time, { gaunt: true, facing: -1 });
    line(308, 73, 282, 110, '#c0cdb18c');
    line(282, 110, 297, 132, '#c0cdb18c');
    line(297, 132, 270, 175, '#c0cdb18c');
    rect(0, 0, 640, 360, '#10212922');
  } else if (scene === 'shortage' || scene === 'loss') {
    person(327, 302, scene === 'loss' ? 'kneel' : 'hunched', time, { gaunt: true, facing: -1 });
    rect(0, 0, 640, 360, '#10202a22');
    rain(time);
  } else if (scene === 'debt') {
    blackCar();
    person(259, 306, 'hunched', time, { gaunt: true });
    person(364, 306, 'offer', time + 1, { shirt: '#28363b', facing: -1, scale: 1.04 });
    rect(314, 224, 15, 6, '#b5b89d');
    rect(317, 226, 9, 2, '#637f6c');
    rect(0, 0, 640, 360, '#0a142014');
    rain(time);
  } else if (scene === 'enforcer' || scene === 'conflict') {
    const striking = time > 1.9 && time < 2.35;
    person(282 + (striking ? 5 : 0), 303, striking ? 'strike' : time > 2.35 ? 'hunched' : 'point', time, { shirt: '#263e46', gaunt: true });
    person(354 + (time > 2.1 ? 14 : 0), 304, time > 2.1 ? 'recoil' : 'idle', time, { shirt: '#705c4d', facing: -1 });
    rect(0, 0, 640, 360, '#08162235');
    rain(time);
  } else if (scene === 'escape') {
    const travel = reduceMotion ? 0 : Math.sin(time * .55) * 58;
    const bob = reduceMotion ? 0 : Math.abs(Math.sin(time * 9)) * 5;
    person(300 + travel, 300 - bob, 'run', time, { gaunt: true });
    rect(312 + travel, 233 - bob, 14, 9, '#aab295');
    rect(315 + travel, 237 - bob, 9, 2, '#5c7b66');
    const sweep = reduceMotion ? 320 : 320 + Math.sin(time * .32) * 190;
    polygon([[84, 12], [sweep - 80, 315], [sweep + 100, 315], [94, 12]], '#d2d6b814');
    rect(70, 18, 39, 13, '#1c2a34');
    rect(44, 22, 28, 5, '#1c2a34');
    line(49, 14, 126, 14, '#263842', 3);
    rain(time);
  } else if (scene === 'collapse') {
    const falling = smooth((time - 1.8) / 2.4);
    if (falling < .95) {
      ctx.save();
      ctx.translate(315, 300);
      ctx.rotate(-falling * Math.PI / 2);
      person(0, 0, falling > .05 ? 'kneel' : 'hunched', time, { gaunt: true });
      ctx.restore();
    } else {
      shadow(279, 303, 58);
      polygon([[229, 285], [260, 277], [285, 283], [298, 291], [338, 294], [343, 303], [271, 304], [239, 298]], '#172a32');
      rect(238, 283, 44, 18, '#4c6461');
      rect(277, 290, 39, 12, '#344951');
      rect(306, 293, 34, 8, '#293e48');
      rect(335, 291, 14, 12, '#111c26');
      rect(219, 278, 22, 18, '#aa917b');
      rect(215, 277, 17, 11, '#1a252a');
      rect(228, 289, 5, 1, '#534c43');
      line(257, 293, 242, 305, '#9c8773', 7);
      line(242, 305, 219, 306, '#ad967f', 6);
    }
    rect(203, 305, 19, 7, '#aeb29b');
    rect(209, 309, 17, 6, '#bfc1a6');
    rect(213, 310, 9, 2, '#698774');
    rain(time);
    rect(0, 0, 640, 360, 'rgba(6, 15, 24, ' + (.12 + falling * .2) + ')');
  }
  // A steady CRT finish sits over an actual low-resolution raster filter.
  for (let y = 0; y < 360; y += 4) rect(0, y, 640, 1, '#07111c12');
  const vignette = ctx.createRadialGradient(320, 172, 120, 320, 172, 385);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, '#060c188c');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 640, 360);
  if (!reduceMotion && !props.paused && time < .6) rect(0, 0, 640, 360, 'rgba(8, 14, 22, ' + ((1 - time / .6) * .55) + ')');
  applyPixelFilter(ctx);
}

function renderTime() {
  if (!reduceMotion) return elapsed;
  if (props.scene === 'enforcer' || props.scene === 'conflict') return 2.5;
  if (props.scene === 'school' || props.scene === 'before') return 0;
  if (props.scene === 'dose') return 1.8;
  return 8;
}

function animate(now: number) {
  if (lastTime && !props.paused && !document.hidden) elapsed += Math.min((now - lastTime) / 1000, .1);
  lastTime = now;
  if (now - lastPaint > 1000 / 12) {
    draw(renderTime());
    lastPaint = now;
  }
  frameId = requestAnimationFrame(animate);
}
function updateMotion(event: MediaQueryListEvent) {
  reduceMotion = props.reducedMotion ?? event.matches;
  draw(renderTime());
}
watch(() => props.reducedMotion, (value) => {
  reduceMotion = value ?? (motionQuery?.matches ?? false);
  draw(renderTime());
});
watch(() => props.scene, () => {
  elapsed = 0;
  lastTime = 0;
  draw(renderTime());
});
onMounted(() => {
  ctx = canvasRef.value?.getContext('2d') ?? null;
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduceMotion = props.reducedMotion ?? motionQuery.matches;
  motionQuery.addEventListener('change', updateMotion);
  draw(renderTime());
  frameId = requestAnimationFrame(animate);
});
onUnmounted(() => {
  cancelAnimationFrame(frameId);
  motionQuery?.removeEventListener('change', updateMotion);
});
</script>

<template>
  <div class="downfall-scene" :data-scene="scene">
    <canvas ref="canvasRef" width="640" height="360" role="img" :aria-label="sceneDescription">
      {{ sceneDescription }}
    </canvas>
    <div class="scene-corner scene-corner--top" aria-hidden="true"></div>
    <div class="scene-corner scene-corner--bottom" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.downfall-scene {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #111c27;
  isolation: isolate;
}
canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
.scene-corner {
  position: absolute;
  pointer-events: none;
  width: 14px;
  height: 14px;
  opacity: .65;
}
.scene-corner--top { top: 10px; left: 10px; border-left: 1px solid #c8ba92; border-top: 1px solid #c8ba92; }
.scene-corner--bottom { right: 10px; bottom: 10px; border-right: 1px solid #c8ba92; border-bottom: 1px solid #c8ba92; }
</style>
