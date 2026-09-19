export type CombatPose = 'idle' | 'windup' | 'strike' | 'recover' | 'block' | 'hit' | 'down';
export interface FighterVisual {
  x: number;
  player: boolean;
  level: number;
  pose: CombatPose;
  kick: boolean;
  extension: number;
  time: number;
  reducedMotion: boolean;
  boosted?: boolean;
  sluggish?: boolean;
}

function box(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function poly(c: CanvasRenderingContext2D, points: number[][], color: string) {
  c.fillStyle = color; c.beginPath();
  points.forEach(([x = 0, y = 0], i) => i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y)));
  c.closePath(); c.fill();
}
function line(c: CanvasRenderingContext2D, x: number, y: number, xx: number, yy: number, color: string, width = 1) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'square'; c.beginPath();
  c.moveTo(Math.round(x), Math.round(y)); c.lineTo(Math.round(xx), Math.round(yy)); c.stroke();
}
function text(c: CanvasRenderingContext2D, value: string, x: number, y: number, color: string, size = 10) {
  c.fillStyle = color; c.font = `bold ${size}px monospace`; c.fillText(value, x, y);
}
function light(c: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  const glow = c.createRadialGradient(x, y, 2, x, y, radius);
  glow.addColorStop(0, color); glow.addColorStop(1, 'transparent');
  c.fillStyle = glow; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export function drawCombatEnvironment(c: CanvasRenderingContext2D, level: number) {
  box(c, 0, 0, 640, 380, '#14212b');
  box(c, 0, 27, 640, 276, level === 2 ? '#292b32' : level === 3 ? '#283b43' : '#32454a');
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 13; col++) {
      const x = col * 55 - (row % 2) * 27;
      box(c, x, 31 + row * 23, 51, 1, '#81958b16');
      box(c, x, 31 + row * 23, 1, 21, '#81958b12');
    }
  }
  if (level === 1) {
    box(c, 38, 61, 560, 30, '#10222b');
    box(c, 44, 66, 548, 2, '#b9ad7f');
    text(c, 'CORNER GROCERY', 226, 81, '#d5c69d', 16);
    box(c, 45, 106, 170, 165, '#172b33');
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 9; i++) {
        const x = 57 + i * 17;
        box(c, x, 128 + row * 44, 11, 26, ['#9b8b65', '#789489', '#a86d59'][i % 3]!);
        box(c, x + 2, 122 + row * 44, 7, 7, '#b6b39a');
        box(c, x + 1, 141 + row * 44, 9, 5, '#c7c2a0');
      }
      box(c, 46, 155 + row * 44, 168, 5, '#829486');
    }
    box(c, 446, 103, 124, 153, '#718b88');
    box(c, 452, 108, 112, 141, '#283f48');
    for (let row = 0; row < 3; row++) {
      box(c, 455, 145 + row * 37, 107, 3, '#758e85');
      for (let i = 0; i < 7; i++) box(c, 460 + i * 14, 121 + row * 37, 8, 22, '#74978b');
    }
    box(c, 506, 109, 4, 140, '#829b90');
    box(c, 511, 167, 3, 21, '#d0ccb0');
    box(c, 477, 274, 94, 31, '#846e50');
    box(c, 486, 261, 75, 16, '#728861');
    for (let i = 0; i < 8; i++) box(c, 492 + i * 8, 259 - i % 2 * 3, 7, 7, '#aaae6f');
    light(c, 328, 86, 220, '#ead89520');
    poly(c, [[254, 93], [130, 308], [488, 308], [388, 93]], '#e9d09b0b');
  } else if (level === 2) {
    box(c, 49, 70, 139, 103, '#101b25');
    box(c, 55, 76, 127, 90, '#5a3c48');
    for (let y = 78; y < 166; y += 8) box(c, 57, y, 123, 2, '#302c39');
    box(c, 452, 60, 109, 33, '#1b212c');
    text(c, 'MEMBERS ONLY', 460, 81, '#c3857e', 12);
    box(c, 75, 228, 109, 10, '#637269');
    box(c, 84, 238, 7, 65, '#493e3d');
    box(c, 168, 238, 7, 65, '#493e3d');
    poly(c, [[63, 224], [80, 207], [174, 207], [191, 224]], '#3e675e');
    [[102, 213], [119, 209], [134, 215]].forEach(([x = 0, y = 0]) => box(c, x, y, 11, 15, '#ccbea1'));
    box(c, 153, 214, 10, 4, '#a8705e');
    box(c, 151, 220, 10, 4, '#9b986d');
    box(c, 447, 178, 143, 81, '#253332');
    box(c, 452, 187, 133, 11, '#637566');
    box(c, 448, 253, 142, 8, '#495347');
    for (let i = 0; i < 8; i++) {
      box(c, 461 + i * 15, 159, 9, 25, ['#6e8564', '#a18b63', '#677c77'][i % 3]!);
      box(c, 463 + i * 15, 153, 5, 8, '#a3a388');
    }
    line(c, 319, 24, 319, 97, '#16242b', 4);
    poly(c, [[284, 96], [353, 96], [366, 119], [271, 119]], '#90785c');
    box(c, 283, 117, 69, 4, '#d6b779');
    poly(c, [[279, 121], [148, 310], [504, 310], [359, 121]], '#c6a56512');
    light(c, 319, 160, 175, '#d5ab7430');
  } else {
    for (let x = 18; x < 640; x += 145) {
      box(c, x, 23, 14, 279, '#172c35');
      box(c, x + 3, 24, 3, 278, '#658078');
      line(c, x + 14, 26, x + 140, 131, '#223840', 5);
    }
    box(c, 189, 55, 252, 190, '#1b303a');
    for (let y = 62; y < 245; y += 12) box(c, 196, y, 240, 3, '#435b5f');
    box(c, 70, 197, 99, 105, '#756949');
    box(c, 46, 246, 133, 57, '#92805a');
    for (let x = 55; x < 178; x += 27) box(c, x, 248, 3, 52, '#564f3d');
    line(c, 75, 199, 164, 297, '#403f35', 5);
    box(c, 475, 231, 104, 72, '#645d48');
    box(c, 498, 189, 75, 41, '#7b7154');
    line(c, 481, 236, 572, 296, '#9a8861', 5);
    line(c, 535, 17, 535, 149, '#798377', 3);
    line(c, 535, 149, 523, 163, '#798377', 4);
    line(c, 523, 163, 535, 175, '#798377', 4);
    box(c, 249, 40, 123, 5, '#bac5b0');
    light(c, 317, 107, 220, '#b6d3c11c');
    poly(c, [[250, 47], [152, 310], [484, 310], [372, 47]], '#d8e0c70b');
  }
  box(c, 0, 306, 640, 74, '#1a2c34');
  box(c, 0, 306, 640, 3, '#5c6c68');
  for (let x = -50; x < 710; x += 81) line(c, x, 309, x - 36, 380, '#3f525514');
  [327, 353, 376].forEach(y => line(c, 0, y, 640, y, '#83918812'));
  for (let i = 0; i < 34; i++) box(c, (i * 149) % 638, 314 + (i * 17) % 62, 2 + i % 17, 1, '#71908422');
  const shade = c.createRadialGradient(322, 230, 110, 322, 201, 379);
  shade.addColorStop(0, 'transparent'); shade.addColorStop(1, '#071018b8');
  c.fillStyle = shade; c.fillRect(0, 0, 640, 380);
}

export function drawCombatFighter(c: CanvasRenderingContext2D, f: FighterVisual) {
  const { pose, extension: ext } = f;
  const heavy = !f.player && f.level === 3;
  const short = !f.player && f.level === 1;
  const scale = short ? .94 : heavy ? 1.1 : 1;
  const shoulderWidth = heavy ? 23 : 17;
  const lean = pose === 'windup' ? -9 : pose === 'hit' ? -14 : pose === 'block' ? -5 : ext * 9;
  const breathing = f.reducedMotion ? 0 : Math.floor(Math.sin(f.time * 2) * .7);
  const crouch = pose === 'windup' ? 5 : pose === 'block' ? 4 : 0;
  const shoulderY = -107 + crouch + breathing;
  const waistY = -60 + crouch;
  const shirt = f.player ? (f.sluggish ? '#6b6753' : '#557976') : heavy ? '#697b74' : short ? '#93866c' : '#675961';
  const shade = f.player ? '#334f55' : '#3e4047';
  const skin = f.player ? '#b09d84' : '#c0a187';
  c.save();
  c.fillStyle = '#07121bcc'; c.beginPath(); c.ellipse(f.x, 316, pose === 'down' ? 61 : 36, 7, 0, 0, Math.PI * 2); c.fill();
  c.translate(Math.round(f.x), 315); c.scale((f.player ? 1 : -1) * scale, scale);
  if (pose === 'down') {
    poly(c, [[-62, -16], [-39, -25], [0, -20], [25, -12], [61, -10], [64, 0], [-41, 0]], shade);
    box(c, -45, -21, 39, 20, shirt); box(c, -68, -20, 20, 16, skin); box(c, -73, -22, 14, 13, '#162831');
    box(c, 49, -12, 17, 10, '#0d1c27'); c.restore(); return;
  }
  const limb = (a: number[], b: number[], color: string, width: number) => {
    line(c, a[0]!, a[1]!, b[0]!, b[1]!, '#0b1922', width + 4);
    line(c, a[0]!, a[1]!, b[0]!, b[1]!, color, width);
  };
  // Back arm and planted leg are drawn first; the front limbs share real joints.
  limb([-10, waistY], [-20 - ext * 5, -31], '#283d47', 12);
  limb([-20 - ext * 5, -31], [-24 - ext * 8, -7], '#304750', 10);
  box(c, -32 - ext * 8, -8, 24, 8, '#101e2a');
  if (f.kick && ext > .1) {
    limb([8, waistY], [36 + ext * 12, -61 - ext * 13], '#3e555c', 13);
    limb([36 + ext * 12, -61 - ext * 13], [42 + ext * 39, -55 - ext * 28], '#4e6467', 11);
    box(c, 40 + ext * 39, -60 - ext * 28, 22, 12, '#15242c');
  } else {
    limb([8, waistY], [17 + ext * 9, -31], '#40575d', 13);
    limb([17 + ext * 9, -31], [22 + ext * 17, -7], '#3e555d', 11);
    box(c, 14 + ext * 17, -8, 29, 8, '#15242c'); box(c, 14 + ext * 17, -1, 29, 2, '#91a195');
  }
  limb([lean - shoulderWidth, shoulderY + 3], [lean - 26, shoulderY + 24], shade, 11);
  limb([lean - 26, shoulderY + 24], [lean - 8, shoulderY + 10], skin, 8);
  poly(c, [[lean - shoulderWidth - 2, shoulderY - 5], [lean + shoulderWidth + 2, shoulderY - 4], [19, waistY + 3], [-17, waistY + 3]], '#10222c');
  poly(c, [[lean - shoulderWidth, shoulderY - 3], [lean + shoulderWidth, shoulderY - 2], [15, waistY], [-14, waistY]], shirt);
  poly(c, [[lean - shoulderWidth, shoulderY], [lean - 5, shoulderY + 8], [-4, waistY], [-14, waistY]], shade);
  line(c, lean + 5, shoulderY + 10, 5, waistY - 4, '#b4c0a728', 2);
  if (f.player) { box(c, lean - 6, shoulderY + 31, 18, 11, shade); line(c, lean + 6, shoulderY + 5, 6, waistY - 2, '#adc0ac44'); }
  else if (short) { poly(c, [[lean - 9, shoulderY + 10], [lean + 11, shoulderY + 10], [15, waistY + 9], [-13, waistY + 9]], '#b9ab86'); box(c, -4, waistY - 16, 13, 9, '#8a8268'); }
  else if (heavy) { box(c, lean - 14, shoulderY + 7, 29, 5, '#8e9b88'); box(c, -7, waistY - 5, 21, 5, '#283b43'); }
  else { poly(c, [[lean - 5, shoulderY], [lean + 9, shoulderY], [3, shoulderY + 26]], '#c0ac92'); line(c, lean + 3, shoulderY + 8, 0, shoulderY + 26, '#5b4343', 3); }
  box(c, lean - 4, shoulderY - 11, 12, 14, skin);
  const headX = lean + (pose === 'hit' ? -5 : 3);
  box(c, headX - 12, shoulderY - 38, 27, 29, '#14232c');
  box(c, headX - 8, shoulderY - 33, 19, 24, skin);
  box(c, headX + 7, shoulderY - 26, 7, 11, '#c6af92');
  box(c, headX - 11, shoulderY - 38, 25, 9, '#172832');
  box(c, headX - 11, shoulderY - 31, 6, 15, '#172832');
  box(c, headX + 5, shoulderY - 25, 6, 2, '#293334');
  box(c, headX + 7, shoulderY - 15, 6, 2, '#71574b');
  if (f.player) { poly(c, [[headX - 13, shoulderY - 37], [headX - 3, shoulderY - 44], [headX + 10, shoulderY - 41], [headX + 16, shoulderY - 32], [headX - 8, shoulderY - 30]], shade); }
  else if (!short && !heavy) { box(c, headX - 14, shoulderY - 37, 37, 4, '#a08d72'); box(c, headX - 8, shoulderY - 49, 23, 12, '#796d60'); }
  const shoulder = [lean + shoulderWidth - 3, shoulderY + 5];
  let elbow = [lean + 27, shoulderY + 22];
  let hand = [lean + 33, shoulderY + 1];
  if (pose === 'windup') { elbow = [lean + 9, shoulderY + 26]; hand = [lean - 3, shoulderY + 10]; }
  if (ext > 0 && !f.kick) { elbow = [lean + 30 + ext * 9, shoulderY + 9 - ext * 7]; hand = [lean + 32 + ext * 37, shoulderY + 1]; }
  if (pose === 'block') { elbow = [lean + 26, shoulderY + 16]; hand = [lean + 22, shoulderY - 18]; }
  if (pose === 'hit') { elbow = [lean + 20, shoulderY + 27]; hand = [lean + 8, shoulderY + 39]; }
  limb(shoulder, elbow, shirt, heavy ? 14 : 11); limb(elbow, hand, skin, heavy ? 11 : 8);
  box(c, hand[0]! - 5, hand[1]! - 5, 11, 10, skin);
  if (f.player) box(c, hand[0]! - 5, hand[1]! + 1, 9, 4, '#c0c6ad');
  if (!f.player && f.level === 2 && pose !== 'hit') line(c, hand[0]! + 4, hand[1]! + 3, hand[0]! + 12, hand[1]! - 30, '#8c9a94', 4);
  if (f.boosted) line(c, lean - shoulderWidth - 2, shoulderY + 3, -16, waistY, '#7fc6b2', 2);
  c.restore();
}
