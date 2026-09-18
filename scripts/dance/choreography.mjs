// Offline choreography, not a browser simulation. Every value is a pure function
// of scroll progress so backwards scrubbing and jumps have no physical history.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
export const rotate = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
export const world = (p, body) => rotate(p, body.lean).map((v, i) => v + body.hip[i]);
export const local = (p, body) => rotate(p.map((v, i) => v - body.hip[i]), -body.lean);

export function solveLimb(start, target, upper, lower, bend) {
  const dx = target[0] - start[0], dy = target[1] - start[1];
  const distance = clamp(Math.hypot(dx, dy), Math.abs(upper - lower) + .001, upper + lower - .001);
  const direction = Math.atan2(dy, dx);
  const a = direction + bend * Math.acos(clamp((upper * upper + distance * distance - lower * lower) / (2 * upper * distance), -1, 1));
  const elbow = [start[0] + upper * Math.cos(a), start[1] + upper * Math.sin(a)];
  const end = [start[0] + distance * Math.cos(direction), start[1] + distance * Math.sin(direction)];
  const b = Math.atan2(end[1] - elbow[1], end[0] - elbow[0]);
  return { elbow, end, upperAngle: a, lowerAngle: Math.atan2(Math.sin(b - a), Math.cos(b - a)) };
}

// 6 reference poses + anticipation, passing, recovery and settling poses.
// hip x/y, torso lean; joined wrist; free groom/bride hands; skirt sweep; turn.
const keys = [
  [0,    [218,327,.02], [385,337,-.04], [300,280], [184,335], [414,344], 0, 0],
  [.07,  [212,333,-.04],[393,342,.03],  [302,270], [163,299], [427,325], -6, 0],
  [.16,  [193,326,-.10],[406,336,.08],  [302,267], [139,160], [451,300], 12, 0],
  [.24,  [220,331,.04], [378,340,-.06], [303,260], [180,218], [403,305], -9, 0],
  [.33,  [251,327,.16], [332,337,-.16], [291,251], [316,285], [271,275], 0, 0],
  [.40,  [238,334,.05], [360,342,-.04], [298,218], [230,301], [402,295], -10, 0],
  [.46,  [231,326,-.03],[370,336,.05],  [299,161], [202,327], [431,268], 18, 0],
  [.50,  [232,327,-.04],[365,337,.02],  [301,158], [203,331], [431,260], 28, .05],
  [.55,  [233,332,.01], [348,339,-.08], [303,163], [207,327], [377,281], 40, .5],
  [.60,  [239,328,.07], [359,336,.04],  [305,180], [213,326], [413,278], -26, 1],
  [.67,  [250,327,.16], [332,337,-.16], [291,250], [315,294], [267,272], -9, 1],
  [.73,  [250,342,.13], [337,350,-.26], [295,273], [303,327], [269,263], 0, 1],
  [.79,  [252,339,.02], [349,312,-.73], [309,315], [362,330], [256,233], 16, 1],
  [.84,  [250,329,-.04],[350,278,-1.12],[315,292], [378,309], [250,218], 26, 1],
  [.92,  [252,326,.02], [352,274,-1.07],[317,289], [382,309], [251,216], 15, 1],
  [1,    [250,327,0],  [351,276,-1.10],[316,290], [380,309], [249,218], 18, 1],
];

export function sampleDance(value) {
  const p = Number.isFinite(value) ? clamp(value, 0, 1) : 0;
  let index = keys.findIndex((key) => key[0] > p) - 1;
  if (index < 0) index = keys.length - 2;
  const a = keys[index], b = keys[index + 1];
  const t = ease(clamp((p - a[0]) / (b[0] - a[0]), 0, 1));
  const blend = (n) => a[n].map((v, i) => mix(v, b[n][i], t));
  const [gx, gy, gr] = blend(1), [bx, by, br] = blend(2);
  const shared = blend(3);
  const turn = mix(a[7], b[7], t);
  const joined = p <= .73;
  const lift = ease(clamp((p - .73) / .11, 0, 1));
  // Feet plant through each transfer; the trailing heel lifts during the open step.
  const step = Math.sin(clamp(p / .33, 0, 1) * Math.PI);
  const groom = {
    hip: [gx, gy], lean: gr, head: -.06 + .08 * Math.sin(p * Math.PI * 4), facing: 1,
    hands: [shared, blend(4)], feet: [[gx + 25, 490], [gx - 25 - step * 26, 490 - step * 23]],
  };
  const bride = {
    hip: [bx, by], lean: br, head: .08 - lift * .12,
    facing: -Math.cos(turn * Math.PI * 2),
    hands: [joined ? [...shared] : world([-33, -118], groom), blend(5)],
    feet: [[bx - 13, 490 - lift * 110], [bx + 23, 490 - lift * 140]],
  };
  return { groom, bride, joined, lift, turn, skirt: mix(a[6], b[6], t),
    veil: Math.sin(p * Math.PI * 10 - .7) * (5 + Math.sin(turn * Math.PI) ** 2 * 18) + lift * 13 };
}
