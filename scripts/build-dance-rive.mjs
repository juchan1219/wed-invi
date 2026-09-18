import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { sampleDance, solveLimb, local } from './dance/choreography.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const project = resolve(root, 'assets/rive/wedding-dance');
const INK = 'FF252423', PAPER = 'FFFDFBF7', SOFT = 'FFBDB4A8';
let nextId = 100;
const id = () => `0:${nextId++}`;
const fmt = (v) => Number(v.toFixed(5));
const tracks = new Map();
const samples = Array.from({ length: 201 }, (_, i) => sampleDance(i / 200));
function track(objectId, key, values) {
  if ([15,84,86].includes(key)) {
    values = [...values];
    for (let i=1;i<values.length;i++) {
      while (values[i]-values[i-1]>Math.PI) values[i]-=2*Math.PI;
      while (values[i]-values[i-1]<-Math.PI) values[i]+=2*Math.PI;
    }
  }
  if (values.every((v) => Math.abs(v - values[0]) < .00001)) return;
  if (!tracks.has(objectId)) tracks.set(objectId, []);
  tracks.get(objectId).push(`<KeyedProperty propertyKey="${key}">${values.map((v, i) => `<KeyFrameDouble frame="${i * 6}" value="${fmt(v)}" interpolationType="linear"/>`).join('')}</KeyedProperty>`);
}
const attr = (obj) => Object.entries(obj).map(([key, value]) => `${key}="${typeof value === 'number' ? fmt(value) : value}"`).join(' ');
function animated(type, name, props, values, children) {
  const oid = id();
  const properties = { x: type === 'RootBone' ? 90 : 13, y: type === 'RootBone' ? 91 : 14, rotation: 15, scaleX: 16, scaleY: 17, opacity: 18 };
  for (const [key, data] of Object.entries(values)) track(oid, properties[key], data);
  return `<${type} id="${oid}" name="${name}" ${attr(props)}>${children}</${type}>`;
}
function paint(fill, stroke = INK, width = 2.1) {
  return `${fill ? `<Fill><SolidColor colorValue="${fill}"/></Fill>` : ''}${stroke ? `<Stroke thickness="${width}" cap="round" join="round"><SolidColor colorValue="${stroke}"/></Stroke>` : ''}`;
}
function curves(points, closed = true, smooth = .7) {
  return points.map(([x, y], i) => {
    const prev = points[i - 1] ?? (closed ? points.at(-1) : points[i]);
    const next = points[i + 1] ?? (closed ? points[0] : points[i]);
    const dx = (next[0] - prev[0]) * smooth / 6, dy = (next[1] - prev[1]) * smooth / 6;
    return { x, y, inRotation: Math.atan2(-dy, -dx), outRotation: Math.atan2(dy, dx), inDistance: Math.hypot(dx, dy), outDistance: Math.hypot(dx, dy) };
  });
}
function path(name, points, fill, { closed = true, smooth = .7, stroke = INK, width = 2.1, morph } = {}) {
  const verts = curves(points, closed, smooth);
  const frames = morph?.map((p) => curves(p, closed, smooth));
  const keys = { x: 24, y: 25, inRotation: 84, inDistance: 85, outRotation: 86, outDistance: 87 };
  return `<Shape name="${name}"><PointsPath isClosed="${closed}">${verts.map((v, i) => {
    const vid = id();
    if (frames) for (const key of Object.keys(keys)) track(vid, keys[key], frames.map((f) => f[i][key]));
    return `<CubicDetachedVertex id="${vid}" ${attr(v)}/>`;
  }).join('')}</PointsPath>${paint(fill, stroke, width)}</Shape>`;
}
const line = (name, pts, width = 1.4, stroke = INK) => path(name, pts, null, { closed: false, width, stroke });
function ellipse(name, x, y, w, h, fill, stroke = INK, width = 2) {
  return `<Shape name="${name}" x="${x}" y="${y}"><Ellipse width="${w}" height="${h}" originX="0.5" originY="0.5"/>${paint(fill, stroke, width)}</Shape>`;
}
function limb(name, starts, targets, lengths, bend, kind, bodies) {
  const solved = samples.map((s, i) => solveLimb(starts[i], local(targets[i], bodies[i]), ...lengths, typeof bend === 'function' ? bend(s) : bend));
  // Unwrap rotations before keying: crossing +/-PI must not spin an elbow.
  const unwrap = (angles) => angles.map((a, i) => {
    if (!i) return a;
    while (a - angles[i - 1] > Math.PI) a -= 2 * Math.PI;
    while (a - angles[i - 1] < -Math.PI) a += 2 * Math.PI;
    angles[i] = a; return a;
  });
  const upper = unwrap(solved.map((v) => v.upperAngle));
  const lower = unwrap(solved.map((v) => v.lowerAngle));
  const leg = kind === 'trouser';
  const suit = kind === 'sleeve' || leg;
  const radius = leg ? 13 : suit ? 10 : 5.5;
  const segment = (length, index) => path(`${name} ${index}`, [[-3,-radius],[length*.6,-radius*.88],[length+3,-radius*.6],[length+4,radius*.58],[length*.45,radius*.95],[-3,radius]], suit ? INK : PAPER, { width: 1.8 });
  const endShape = leg
    ? animated('Node', `${name} planted shoe`, { x:lengths[1], rotation: -upper[0]-lower[0]-bodies[0].lean },
      { rotation: samples.map((_,i) => -upper[i]-lower[i]-bodies[i].lean) },
      path('Leather shoe', [[-11,-5],[5,-6],[17,2],[23,6],[23,10],[-12,10]], INK))
    : `<Node x="${lengths[1]}">${line('Fingers', [[2,-1],[8,1],[10,4]], 1)}${ellipse('Hand', 2,0,15,10,PAPER,INK,1.5)}${suit ? path('White cuff',[[-7,-6],[0,-6],[1,6],[-7,6]],PAPER,{smooth:0,width:1}) : ''}</Node>`;
  const lowerBone = animated('Bone', `${name} elbow`, { length:lengths[1], rotation:lower[0] }, { rotation:lower }, endShape + segment(lengths[1], 'forearm'));
  return animated('RootBone', `${name} shoulder`, { x:starts[0][0],y:starts[0][1],length:lengths[0],rotation:upper[0] },
    {x:starts.map(p=>p[0]), y:starts.map(p=>p[1]), rotation:upper}, lowerBone + segment(lengths[0], 'upper'));
}

function head(bride, bodies) {
  const art = [
    line('Smile', [[16,16],[20,17],[23,15]], 1.2),
    ellipse('Eye',15,-1,2.1,2.8,INK,null),
    line('Eyebrow',[[11,-8],[16,-9],[19,-7]],1.3),
    bride ? ellipse('Pearl earring',-10,14,4,5,PAPER,INK,1) : '',
    line('Ear', [[-15,0],[-20,-2],[-21,7],[-16,10]], 1.1),
    path('Face profile', [[-20,-19],[2,-28],[20,-17],[22,-4],[29,5],[24,8],[23,20],[12,27],[-7,23],[-16,12]], PAPER, {width:1.8}),
  ].join('');
  const hair = bride
    ? path('Swept hair', [[-24,8],[-30,-12],[-22,-29],[-1,-34],[18,-24],[21,-15],[3,-19],[-6,-9],[-14,-4],[-16,11]], INK)
      + ellipse('Bun',-31,-25,27,27,INK)
    : path('Wavy hair', [[-24,8],[-30,-8],[-25,-20],[-28,-26],[-18,-30],[-10,-37],[0,-33],[12,-36],[17,-29],[25,-25],[24,-15],[16,-12],[5,-17],[-6,-13],[-14,0],[-15,11]],INK);
  const rotations = bodies.map(b=>b.head);
  const facing = bodies.map(b => b.facing);
  // Head outline is mirrored for the bride, and narrows through her turn.
  return animated('Node', bride ? 'Bride head' : 'Groom head', { x:0,y:bride?-137:-151,rotation:rotations[0] }, {rotation:rotations},
    animated('Node','Profile turn',{scaleX:facing[0]}, {scaleX:facing}, hair + art))
    + path('Neck',[[-10,-130],[-9,-99],[10,-96],[12,-129]],PAPER,{smooth:.2,width:1.6});
}

function skirtPoints(s, fold = false) {
  const w = s.skirt;
  const droop = s.lift * 19;
  if (fold) return [[-10,6],[-17+w*.15,60],[w*.4-32,123+droop],[w*.5-39,145+droop]];
  return [[-19,-4],[-26,43],[-48+w*.25,103],[-75+w*.6,147+droop],[-43+w*.7,159+droop],[5+w*.75,161],[66+w*.8,151-droop*.4],[48+w*.55,124],[29+w*.18,57],[19,-4]];
}
function veilPoints(s) {
  const w = s.veil;
  const standing = [[13,-156],[31,-126],[47+w*.4,-54],[76+w,28],[96+w*1.3,98],[58+w*.9,101],[28+w*.5,66],[17+w*.2,-7],[4,-126]];
  const carried = [[13,-156],[-10,-157],[-48,-133],[-96,-105],[-117,-65],[-97,-28],[-65,-51],[-15,-72],[4,-126]];
  return standing.map((p,i)=>p.map((v,j)=>v+(carried[i][j]-v)*s.lift));
}
function person(bride) {
  const bodies = samples.map(s=>bride?s.bride:s.groom);
  const name = bride?'Bride':'Groom';
  const turnWidth = bodies.map(b=>bride ? .35+.65*Math.abs(b.facing) : 1);
  const near = bodies.map((b,i)=>[(bride?-14:19)*turnWidth[i],bride?-86:-98]);
  const far = bodies.map((b,i)=>[(bride?14:-19)*turnWidth[i],bride?-86:-98]);
  const frontArm = limb(`${name} joined arm`,near,bodies.map(b=>b.hands[0]),bride?[59,57]:[67,64],bride?-1:1,bride?'skin':'sleeve',bodies);
  const backArm = limb(`${name} free arm`,far,bodies.map(b=>b.hands[1]),bride?[59,57]:[67,64],-1,bride?'skin':'sleeve',bodies);
  const torso = bride
    ? line('Bodice seam',[[-19,-7],[0,-2],[19,-7]],1.1)
      + path('Sweetheart bodice',[[-17,-94],[-8,-84],[1,-89],[13,-94],[22,-77],[13,-47],[20,-4],[-20,-4],[-15,-51],[-22,-77]],PAPER)
    : line('Jacket seam',[[2,-77],[0,-19],[4,13]],1,SOFT)
      + ellipse('Button',5,-10,3,3,SOFT,null)
      + path('Tie',[[-3,-92],[4,-92],[8,-58],[2,-47],[-4,-60]],INK,{smooth:0,width:1})
      + path('Shirt opening',[[-15,-106],[13,-106],[12,-86],[3,-49],[-15,-82]],PAPER,{smooth:0,width:1})
      + line('Left lapel',[[-17,-101],[-25,-77],[-13,-71],[-18,-60],[0,-25]],1,SOFT)
      + line('Right lapel',[[16,-100],[25,-75],[16,-68],[21,-57],[5,-29]],1,SOFT)
      + path('Tailored jacket',[[-18,-108],[-34,-96],[-31,-59],[-23,-17],[-30,17],[-7,23],[1,17],[23,23],[30,14],[22,-32],[31,-79],[27,-98],[12,-108]],INK);
  const dress = bride
    ? path('Skirt fold left',skirtPoints(samples[0],true),null,{closed:false,width:1.2,stroke:SOFT,morph:samples.map(s=>skirtPoints(s,true))})
      + path('Skirt fold right',[[7,8],[18,53],[29,117]],null,{closed:false,width:1,stroke:SOFT,morph:samples.map(s=>[[7,8],[18+s.skirt*.2,53],[29+s.skirt*.6,117]])})
      + path('Flowing skirt',skirtPoints(samples[0]),PAPER,{morph:samples.map(s=>skirtPoints(s))})
    : '';
  const legs = bride ? '' : [0,1].map(i=>limb(`${name} leg ${i+1}`,bodies.map(()=>[i? -13:13,4]),bodies.map(b=>b.feet[i]),[83,83],i?1:-1,'trouser',bodies)).join('');
  const veil = bride ? path('Veil',veilPoints(samples[0]),'B3FDFBF7',{width:1.3,stroke:SOFT,morph:samples.map(veilPoints)}) : '';
  return animated('Node',`${name} pelvis`,{x:bodies[0].hip[0],y:bodies[0].hip[1],rotation:bodies[0].lean},
    {x:bodies.map(b=>b.hip[0]),y:bodies.map(b=>b.hip[1]),rotation:bodies.map(b=>b.lean)},
    head(bride,bodies) + frontArm + animated('Node',`${name} torso turn`,{scaleX:turnWidth[0]},{scaleX:turnWidth},torso) + backArm + dress + legs + veil);
}

const art = person(true) + person(false)
  + ellipse('Floor shadow',300,502,263,10,'10252423',null);
const animation = `<LinearAnimation name="Choreography" id="0:20" fps="60" duration="1200" loopValue="oneShot">${[...tracks].map(([oid,props])=>`<KeyedObject objectId="${oid}">${props.join('')}</KeyedObject>`).join('')}</LinearAnimation>`;
const scene = `<Rive version="1" kind="fragment">
<Artboard name="WeddingCouple" id="0:1" width="600" height="560" styleId="0:4" defaultStateMachineId="0:2" viewModelId="0:40" viewModelInstanceId="0:41">
<LayoutComponentStyle id="0:4"/>
${art}
<Joystick name="Scroll choreography" xId="0:20"><DataBindContext propertyKey="299" sourcePathIds="0:40-0:45" converterId="0:50"/></Joystick>
${animation}
<LinearAnimation name="Rest" id="0:21" duration="60" loopValue="loop"/>
<StateMachine name="WeddingDance" id="0:2"><StateMachineLayer name="Scrub"><AnyState x="0" y="-150"/><ExitState x="250" y="-150"/><EntryState x="0" y="0"><StateTransition stateToId="0:3"/></EntryState><AnimationState x="250" y="0" id="0:3" animationId="0:21"/></StateMachineLayer></StateMachine>
</Artboard>
<ViewModel name="Dance" id="0:40" defaultInstanceId="0:41"><ViewModelPropertyNumber name="danceProgress" id="0:45"/><ViewModelInstance name="Default" id="0:41" exports="true"><ViewModelInstanceNumber viewModelPropertyId="0:45" propertyValue="0"/></ViewModelInstance></ViewModel>
<DataConverterRangeMapper id="0:50" minInput="0" maxInput="100" minOutput="-1" maxOutput="1" clampLower="true" clampUpper="true"/>
</Rive>`;
await mkdir(project,{recursive:true});
await writeFile(resolve(project,'scene.rml'),scene);
console.log(`Authored ${nextId-100} vector components; ${tracks.size} animated objects.`);
if (!process.argv.includes('--source-only')) {
  const cli = process.env.RIVE_CLI || 'rive';
  execFileSync(cli,[project,'--once'],{stdio:'inherit'});
  await copyFile(resolve(project,'build/wedding-dance.riv'),resolve(root,'public/story/wedding-dance/wedding-dance.riv'));
  await copyFile(resolve(root,'node_modules/@rive-app/canvas/rive.wasm'),resolve(root,'public/story/wedding-dance/rive.wasm'));
}
