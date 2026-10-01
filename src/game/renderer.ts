import * as THREE from 'three';
import { assetUrl } from '../config/site';
import type { GameState, LevelConfig, LevelSymbol, Vec2 } from './model';
import { EYE_HEIGHT } from './simulation';
import { createIndustrialSurfaces } from './visuals/surfaces';

export interface WorldOptions {
  onContextLost?: () => void;
  onContextRestored?: () => void;
  onAssetError?: (path: string) => void;
}
export interface WorldMetrics {
  drawCalls: number; triangles: number; geometries: number; textures: number; pixelRatio: number; contextLost: boolean;
}
export interface GameWorld {
  canvas: HTMLCanvasElement;
  render(state: Readonly<GameState>, dt: number, reducedMotion?: boolean): void;
  setGuide(points: readonly Vec2[]): void;
  resize(): void;
  dispose(): void;
  getMetrics(): WorldMetrics;
}
type Placement = { x: number; y: number; z: number; sx: number; sy: number; sz: number; rx?: number; ry?: number; rz?: number };
type AltarView = { glyph: THREE.Group; halo: THREE.Mesh; energy: THREE.MeshBasicMaterial; conduit: THREE.MeshBasicMaterial; light: THREE.PointLight; crown: THREE.Group; active: boolean };

/** Rendering adapter only: no combat, collision, navigation, progression, or private frame loop. */
export function createWorld(host: HTMLElement, level: LevelConfig, options: WorldOptions = {}): GameWorld {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !coarse, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = false;
  const canvas = renderer.domElement;
  canvas.className = 'game-canvas';
  canvas.setAttribute('aria-label', 'Instalação industrial: três selos aprisionam o sinal de Woodstock');
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  host.append(canvas);
  let disposed = false;
  let contextLost = false;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const instancedMeshes = new Set<THREE.InstancedMesh>();
  const geometry = <T extends THREE.BufferGeometry>(value: T): T => { geometries.add(value); return value; };
  const material = <T extends THREE.Material>(value: T): T => { materials.add(value); return value; };
  const texture = <T extends THREE.Texture>(value: T): T => { textures.add(value); return value; };
  const scene = new THREE.Scene();
  const atmosphere = new THREE.Color('#12090b');
  scene.background = atmosphere;
  scene.fog = new THREE.FogExp2(atmosphere, .027);
  const camera = new THREE.PerspectiveCamera(coarse ? 76 : 72, 1, .045, 85);
  camera.rotation.order = 'YXZ'; scene.add(camera);
  const surfaces = createIndustrialSurfaces(renderer, texture);
  surfaces.floor.repeat.set(10, 16);
  surfaces.hazard.repeat.set(4, 1);
  const concrete = material(new THREE.MeshStandardMaterial({ color:'#3a3033', map:surfaces.concrete, bumpMap:surfaces.concrete, bumpScale:.085, roughness:.9, metalness:.035 }));
  const floorMaterial = material(new THREE.MeshStandardMaterial({ color:'#24191c', map:surfaces.floor, bumpMap:surfaces.floor, bumpScale:.045, roughness:.72, metalness:.1 }));
  const iron = material(new THREE.MeshStandardMaterial({ color:'#67545a', metalness:.65, roughness:.48 }));
  const darkIron = material(new THREE.MeshStandardMaterial({ color:'#130c0f', metalness:.62, roughness:.5 }));
  const edgeIron = material(new THREE.MeshStandardMaterial({ color:'#d5c7c2', metalness:.6, roughness:.42 }));
  const rust = material(new THREE.MeshStandardMaterial({ color:'#7d202d', roughness:.73, metalness:.32 }));
  const redPaint = material(new THREE.MeshStandardMaterial({ color:'#b71931', roughness:.6, metalness:.24 }));
  const black = material(new THREE.MeshStandardMaterial({ color:'#080608', roughness:.78, metalness:.2 }));
  const copper = material(new THREE.MeshStandardMaterial({ color:'#8b343e', roughness:.52, metalness:.6 }));
  const bone = material(new THREE.MeshStandardMaterial({ color:'#e8ded8', roughness:.48, metalness:.16 }));
  const amber = material(new THREE.MeshBasicMaterial({ color:'#f02d45' }));
  const red = material(new THREE.MeshBasicMaterial({ color:'#ff1738' }));
  const cyan = material(new THREE.MeshBasicMaterial({ color:'#f6eee8' }));
  const dimCyan = material(new THREE.MeshBasicMaterial({ color:'#61232e' }));
  const hazard = material(new THREE.MeshStandardMaterial({ color:'#c1b298', map:surfaces.hazard, roughness:.82, metalness:.1 }));
  const contactMat = material(new THREE.MeshBasicMaterial({ map:surfaces.contact, transparent:true, opacity:.78, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-1 }));
  const crackMat = material(new THREE.MeshBasicMaterial({ map:surfaces.cracks, transparent:true, opacity:.72, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2 }));
  const unitBox = geometry(new THREE.BoxGeometry(1,1,1));
  const unitCylinder = geometry(new THREE.CylinderGeometry(1,1,1,12));
  const unitPlane = geometry(new THREE.PlaneGeometry(1,1));
  const boltShape = geometry(new THREE.CylinderGeometry(.045,.045,.035,6));
  const ringShape = geometry(new THREE.TorusGeometry(1,.055,6,40));
  const batches = new Map<THREE.Material, Placement[]>();
  const addBox = (w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,rotation=0) => {
    const batch = batches.get(mat) ?? []; batch.push({x,y,z,sx:w,sy:h,sz:d,ry:rotation}); batches.set(mat,batch);
  };
  function box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,parent:THREE.Object3D=scene) {
    const mesh = new THREE.Mesh(unitBox,mat); mesh.scale.set(w,h,d); mesh.position.set(x,y,z); parent.add(mesh); return mesh;
  }
  function cylinder(radius:number,height:number,x:number,y:number,z:number,mat:THREE.Material,parent:THREE.Object3D=scene) {
    const mesh = new THREE.Mesh(unitCylinder,mat); mesh.scale.set(radius,height,radius); mesh.position.set(x,y,z); parent.add(mesh); return mesh;
  }
  function flat(w:number,d:number,x:number,z:number,mat:THREE.Material,y=.016,parent:THREE.Object3D=scene) {
    const mesh = new THREE.Mesh(unitPlane,mat); mesh.rotation.x=-Math.PI/2; mesh.scale.set(w,d,1); mesh.position.set(x,y,z); parent.add(mesh); return mesh;
  }
  function ring(radius:number,x:number,y:number,z:number,mat:THREE.Material,parent:THREE.Object3D=scene,horizontal=false) {
    const mesh = new THREE.Mesh(ringShape,mat); mesh.scale.setScalar(radius); mesh.position.set(x,y,z); if(horizontal) mesh.rotation.x=-Math.PI/2; parent.add(mesh); return mesh;
  }
  function instances(shape:THREE.BufferGeometry,mat:THREE.Material,placements:Placement[]) {
    const mesh = new THREE.InstancedMesh(shape,mat,placements.length); instancedMeshes.add(mesh);
    const transform = new THREE.Object3D();
    placements.forEach((p,i)=>{transform.position.set(p.x,p.y,p.z);transform.scale.set(p.sx,p.sy,p.sz);transform.rotation.set(p.rx??0,p.ry??0,p.rz??0);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});
    mesh.instanceMatrix.needsUpdate=true; mesh.computeBoundingSphere(); scene.add(mesh); return mesh;
  }
  const poolMats = ['#8d1c2f','#e62a42','#f0ded8'].map(color=>material(new THREE.MeshBasicMaterial({color,map:surfaces.glow,transparent:true,opacity:.22,depthWrite:false,blending:THREE.AdditiveBlending})));
  const zoneIndex = (z:number) => z>5?0:z>-10?1:2;
  const zoneNeon = (z:number) => [amber,red,cyan][zoneIndex(z)];
  const palette = ['#ef233c','#f6eee8','#9d1429'];

  // A restrained key/fill plus three local pools. Contact and fixture illumination are baked quads.
  scene.add(new THREE.HemisphereLight('#f1ded8','#1b090d',1.35));
  const key = new THREE.DirectionalLight('#f7e8e1',1.8); key.position.set(-8,12,15); scene.add(key);
  const fill = new THREE.DirectionalLight('#a51f32',.8); fill.position.set(8,6,-18); scene.add(fill);
  for(const [x,z,color,power] of [[0,15,'#f02d45',24],[8,-2,'#9c162b',20],[-4,-19,'#f5e4de',22]] as const) {
    const light = new THREE.PointLight(color,power,17,2); light.position.set(x,3.4,z); scene.add(light);
  }
  const width=level.bounds.maxX-level.bounds.minX, length=level.bounds.maxZ-level.bounds.minZ;
  flat(width+2,length+2,0,0,floorMaterial,-.02);
  const ceiling = flat(width+2,length+2,0,0,black,4.9); ceiling.rotation.x=Math.PI/2;
  const bars:Placement[]=[], pipes:Placement[]=[], chains:Placement[]=[], bolts:Placement[]=[];
  for(const [index,wall] of level.walls.entries()) {
    if(wall.kind==='concrete') {
      const shape=geometry(new THREE.BoxGeometry(wall.width,wall.height,wall.depth));
      const uv=shape.getAttribute('uv');
      for(let i=0;i<uv.count;i++){const face=Math.floor(i/4);const u=face<2?wall.depth:wall.width;const v=face===2||face===3?wall.depth:wall.height;uv.setXY(i,uv.getX(i)*u/2.8,uv.getY(i)*v/2.8);}
      const mesh=new THREE.Mesh(shape,concrete);mesh.position.set(wall.x,wall.height/2,wall.z);scene.add(mesh);
      addBox(wall.width+.07,.28,wall.depth+.07,wall.x,.14,wall.z,darkIron);
      addBox(wall.width+.08,.16,wall.depth+.08,wall.x,wall.height-.05,wall.z,iron);
      addBox(wall.width+.055,.055,wall.depth+.055,wall.x,.46,wall.z,zoneNeon(wall.z));
      if(wall.width>3 && wall.depth<2) {
        for(let x=wall.x-wall.width/2+.3;x<wall.x+wall.width/2;x+=2.7) {
          addBox(.11,wall.height,.11,x,wall.height/2,wall.z+wall.depth/2+.04,iron);
          bolts.push({x,y:.67,z:wall.z+wall.depth/2+.08,sx:1,sy:1,sz:1,rx:Math.PI/2});
        }
      }
      if(index>3){ const fissure=new THREE.Mesh(unitPlane,crackMat);fissure.scale.set(1.1,1.8,1);fissure.position.set(wall.x+Math.min(1.7,wall.width*.25),1.4,wall.z+wall.depth/2+.012);scene.add(fissure); }
    } else {
      const alongX=wall.width>=wall.depth,span=alongX?wall.width:wall.depth,count=Math.ceil(span/.36);
      for(let i=0;i<=count;i++){const off=(i/count-.5)*span;bars.push({x:wall.x+(alongX?off:0),y:wall.height/2,z:wall.z+(alongX?0:off),sx:.065,sy:wall.height,sz:.065});}
      for(const y of [.17,1.04,wall.height-.12]) bars.push({x:wall.x,y,z:wall.z,sx:alongX?span+.2:.15,sy:.12,sz:alongX?.15:span+.2});
      for(let off=-span/2;off<=span/2;off+=Math.max(2,span/4)) {
        bars.push({x:wall.x+(alongX?off:0),y:wall.height/2,z:wall.z+(alongX?0:off),sx:.24,sy:wall.height+.22,sz:.24});
        addBox(.3,.32,.3,wall.x+(alongX?off:0),.17,wall.z+(alongX?0:off),rust);
      }
    }
    flat(wall.width+1.5,wall.depth+1.5,wall.x,wall.z,contactMat,.007);
  }
  // Repeated structural modules stay inside existing wall volumes or above the player.
  for(let z=-21;z<=22;z+=7) {
    addBox(width,.3,.3,0,4.48,z,darkIron);
    addBox(width,.055,.42,0,4.62,z,iron);
    for(const x of [-14.8,14.8]) {addBox(.35,4.5,.5,x,2.25,z,iron);addBox(.48,.14,.64,x,.15,z,copper);}
    for(const x of [-8,0,8]) {
      addBox(2.15,.18,.38,x,4.31,z,black);addBox(1.75,.045,.16,x,4.2,z,zoneNeon(z));
      flat(7.5,9,x,z,poolMats[zoneIndex(z)],.022);
    }
    pipes.push({x:0,y:4.06,z:z+.74,sx:.085,sy:width,sz:.085,rz:Math.PI/2});
  }
  for(const x of [-2.8,2.8,-13.4,13.4]) pipes.push({x,y:4.37,z:0,sx:.075,sy:length,sz:.075,rx:Math.PI/2});
  for(const [x,z] of [[-3.4,16],[3.4,13],[-10.2,-3],[10.2,-9],[-7.8,-18],[7.6,-19]]) {
    for(let link=0;link<14;link++) chains.push({x,y:4.35-link*.135,z,sx:.8,sy:1.15,sz:1,ry:link%2?Math.PI/2:0});
  }
  // Narrow maintenance channels, seams, and worn hazard thresholds give the floor a real scale.
  for(const x of [-2.5,2.5,-12.7,12.7]) {
    addBox(.23,.018,length,x,.018,0,darkIron);
    for(let z=-23;z<=23;z+=.55) addBox(.25,.014,.08,x,.03,z,iron);
  }
  for(const z of [18,10,-10,-20]) flat(z===18?5.4:8,.3,0,z,hazard,.033);
  for(const x of [-2.84,2.84]) addBox(.04,.025,9,x,.045,17,amber);

  // Entry portal and the sealed album reliquary form a strong first-frame silhouette.
  for(const x of [-3.5,3.5]) {
    addBox(.76,4.5,.85,x,2.25,12,iron);addBox(.9,.5,1.05,x,.25,12,darkIron);
    addBox(.12,3.2,.035,x+(x<0?.4:-.4),2.05,12.45,amber);
    addBox(.72,.7,.06,x,1.6,12.46,hazard);
  }
  addBox(7.7,.55,.85,0,4.2,12,darkIron);addBox(6.5,.08,.13,0,3.9,12.44,amber);
  for(const x of [-2.24,2.24]) {
    addBox(.72,3.55,.23,x,1.83,8.12,darkIron);addBox(.055,2.7,.05,x+(x<0?.3:-.3),1.95,8.28,amber);
    for(let y=.7;y<3.3;y+=.34) addBox(.52,.085,.06,x,y,8.27,iron);
  }
  addBox(3.42,.21,.33,0,.26,8.16,darkIron);addBox(3.42,.22,.33,0,3.7,8.16,darkIron);

  function labelTexture(top:string,bottom:string,color='#ebdebf') {
    const label=document.createElement('canvas');label.width=512;label.height=256;const ctx=label.getContext('2d')!;
    ctx.fillStyle='#101c20';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#596967';ctx.lineWidth=3;ctx.strokeRect(9,9,494,238);
    ctx.fillStyle=color;ctx.font='700 48px Arial';ctx.textAlign='center';ctx.fillText(top,256,111,458);
    ctx.fillStyle='#a9b6ae';ctx.font='21px Arial';ctx.fillText(bottom,256,176,458);
    ctx.fillStyle=color;ctx.fillRect(24,213,56,5);ctx.fillRect(432,213,56,5);
    const map=texture(new THREE.CanvasTexture(label));map.colorSpace=THREE.SRGBColorSpace;return map;
  }
  function sign(top:string,bottom:string,x:number,y:number,z:number,w:number,h:number,color?:string,parent:THREE.Object3D=scene) {
    const mat=material(new THREE.MeshBasicMaterial({map:labelTexture(top,bottom,color),toneMapped:false}));
    const mesh=new THREE.Mesh(unitPlane,mat);mesh.scale.set(w,h,1);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  sign('LIBERTE O SINAL','WOODSTOCK / CÂMARA 01',0,3.19,12.5,3.4,1.13);
  sign('OLHO  /  01','SELO DE VIGILÂNCIA',-7.4,2.25,7.43,2.1,.85,'#ffd28d');
  sign('MÃO  /  02','SELO DE CONTROLE',8.7,2.25,4.43,2.1,.85,'#ff9696');

  // Original artwork remains complete, with its square composition and original colors intact.
  const artworkPath='/assets/cover-dark-640.webp';
  const plateMaterial=material(new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}));
  const art=texture(new THREE.TextureLoader().load(assetUrl(artworkPath),loaded=>{
    if(disposed){loaded.dispose();return;}loaded.colorSpace=THREE.SRGBColorSpace;plateMaterial.map=loaded;plateMaterial.needsUpdate=true;
  },undefined,()=>{if(disposed)return;plateMaterial.map=null;plateMaterial.color.set('#252023');plateMaterial.needsUpdate=true;options.onAssetError?.(artworkPath);}));
  art.colorSpace=THREE.SRGBColorSpace;plateMaterial.map=art;
  function artPanel(x:number,y:number,z:number,size:number,rotation:number) {
    const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=rotation;scene.add(group);
    box(size+.16,size+.16,.1,0,0,-.015,iron,group);
    const panel=new THREE.Mesh(unitPlane,plateMaterial);panel.scale.set(size,size,1);panel.position.z=.045;group.add(panel);
  }
  artPanel(0,1.95,8.18,2.55,0);
  artPanel(-14.94,1.85,-12.5,1.65,Math.PI/2);

  // Three physical-looking seal machines stay visible after collection. Their energy is persistent state.
  const symbolViews=new Map<string,AltarView>();
  const conduitRoutes:Vec2[][]=[
    [{x:-9,z:4},{x:-13.6,z:4},{x:-13.6,z:-21.8},{x:0,z:-21.8}],
    [{x:9,z:-3},{x:13.6,z:-3},{x:13.6,z:-22.1},{x:0,z:-22.1}],
    [{x:-8,z:-15},{x:-4.3,z:-15},{x:-4.3,z:-21.5},{x:0,z:-21.5}],
  ];
  function createGlyph(kind:LevelSymbol['kind'],mat:THREE.Material) {
    const glyph=new THREE.Group();
    if(kind==='eye') {
      const contour=ring(.29,0,0,0,mat,glyph);contour.scale.set(.44,.21,.3);
      const pupil=new THREE.Mesh(geometry(new THREE.SphereGeometry(.115,12,8)),mat);pupil.scale.z=.65;glyph.add(pupil);
      for(const direction of [-1,1]) box(.07,.08,.06,direction*.45,0,0,mat,glyph).rotation.z=Math.PI/4;
    } else if(kind==='hand') {
      box(.3,.29,.1,0,-.075,0,mat,glyph);
      for(const [x,h] of [[-.12,.25],[-.04,.37],[.045,.34],[.125,.25]]) box(.055,h,.09,x,h/2+.055,0,mat,glyph);
      box(.075,.23,.1,-.2,-.05,0,mat,glyph).rotation.z=.65;
    } else {
      const linkShape=geometry(new THREE.TorusGeometry(.145,.038,6,18));
      for(const direction of [-1,1]) {const link=new THREE.Mesh(linkShape,mat);link.scale.y=1.55;link.position.set(direction*.095,direction*.135,direction*.035);link.rotation.z=-.55;glyph.add(link);}
    }
    return glyph;
  }
  for(const [index,symbol] of level.symbols.entries()) {
    const energy=material(new THREE.MeshBasicMaterial({color:palette[index]}));
    const conduit=material(new THREE.MeshBasicMaterial({color:'#26383b'}));
    const group=new THREE.Group();group.position.set(symbol.x,0,symbol.z);scene.add(group);
    flat(2.8,2.8,0,0,contactMat,.008,group);
    cylinder(.82,.1,0,.06,0,darkIron,group);
    cylinder(.61,.11,0,.145,0,iron,group);
    const baseRing=ring(.7,0,.205,0,energy,group,true);baseRing.scale.y=.7;
    cylinder(.24,.76,0,.57,0,darkIron,group);
    cylinder(.34,.13,0,1,0,edgeIron,group);
    cylinder(.075,1.28,0,1.12,0,energy,group);
    const glyph=createGlyph(symbol.kind,energy);glyph.position.y=1.72;group.add(glyph);
    const halo=ring(.67,0,1.72,0,copper,group);
    const crown=new THREE.Group();crown.position.y=2.54;group.add(crown);
    ring(.58,0,0,0,darkIron,crown,true);ring(.48,0,.015,0,energy,crown,true);
    for(let j=0;j<3;j++) {
      const angle=j*Math.PI*2/3+Math.PI/6,x=Math.cos(angle)*.7,z=Math.sin(angle)*.7;
      addBox(.12,2.43,.14,symbol.x+x,1.35,symbol.z+z,iron,angle);
      addBox(.18,.24,.22,symbol.x+x,2.5,symbol.z+z,darkIron,angle);
      box(.08,.28,.08,Math.cos(angle)*.54,.02,Math.sin(angle)*.54,energy,crown);
    }
    const field=material(new THREE.MeshBasicMaterial({color:palette[index],map:surfaces.glow,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending}));
    const aura=new THREE.Mesh(unitPlane,field);aura.scale.set(2.4,2.8,1);aura.position.y=1.65;glyph.add(aura);aura.position.y=0;
    flat(4.8,4.8,0,0,field,.027,group);
    sign(['01 / OLHO','02 / MÃO','03 / ELO'][index],'SELO DO SINAL',0,.64,.35,.77,.38,palette[index],group);
    const route=conduitRoutes[index]??[symbol,level.exit];
    const pieces:Placement[]=[];
    for(let i=1;i<route.length;i++) {
      const a=route[i-1],b=route[i],distance=Math.hypot(b.x-a.x,b.z-a.z),angle=Math.atan2(b.x-a.x,b.z-a.z);
      addBox(.13,.025,distance,(a.x+b.x)/2,.025,(a.z+b.z)/2,black,angle);
      pieces.push({x:(a.x+b.x)/2,y:.046,z:(a.z+b.z)/2,sx:.045,sy:.018,sz:distance,ry:angle});
    }
    instances(unitBox,conduit,pieces);
    const light=new THREE.PointLight(palette[index],3,5,2);light.position.set(symbol.x,1.7,symbol.z);scene.add(light);
    symbolViews.set(symbol.id,{glyph,halo,energy,conduit,light,crown,active:false});
  }

  // A transmission tower behind split shutters: three signals accumulate, then its cage opens.
  const exit=new THREE.Group();exit.position.set(level.exit.x,0,level.exit.z-.65);scene.add(exit);
  flat(6,5,0,0,contactMat,.009,exit);
  cylinder(1.5,.16,0,.08,0,darkIron,exit);cylinder(1.23,.08,0,.2,0,iron,exit);
  ring(1.33,0,.25,0,dimCyan,exit,true);
  const towerMaterial=material(new THREE.MeshStandardMaterial({color:'#6c1a29',emissive:'#ef233c',emissiveIntensity:.08,metalness:.45,roughness:.28}));
  const tower=new THREE.Mesh(geometry(new THREE.OctahedronGeometry(.7,0)),towerMaterial);tower.scale.set(.7,1.5,.7);tower.position.y=1.65;exit.add(tower);
  const towerRings=new THREE.Group();towerRings.position.y=1.65;exit.add(towerRings);
  for(const [height,radius] of [[-.87,.57],[0,.92],[.87,.57]]) {const hoop=ring(radius,0,height,0,iron,towerRings,true);hoop.rotation.z=.17;}
  const coreGlow=material(new THREE.MeshBasicMaterial({color:'#79fff4',map:surfaces.glow,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending}));
  const coreAura=new THREE.Mesh(unitPlane,coreGlow);coreAura.scale.set(4,4,1);coreAura.position.set(0,1.7,.1);exit.add(coreAura);
  const transmissionLamp=new THREE.PointLight('#67fff0',1,12,2);transmissionLamp.position.set(0,2.4,1);exit.add(transmissionLamp);
  for(const x of [-1.75,1.75]) {box(.33,3.8,.6,x,1.9,0,darkIron,exit);box(.08,3.2,.08,x,1.75,.34,cyan,exit);box(.65,.4,.8,x,.2,0,iron,exit);}
  box(4.2,.37,.65,0,3.75,0,darkIron,exit);
  const leftDoor=new THREE.Group();leftDoor.position.x=-.65;exit.add(leftDoor);
  const rightDoor=new THREE.Group();rightDoor.position.x=.65;exit.add(rightDoor);
  for(const [door,direction] of [[leftDoor,-1],[rightDoor,1]] as const) {
    box(1.24,2.64,.11,0,1.53,.42,black,door);
    for(const x of [-.43,0,.43]) box(.08,2.66,.1,x,1.53,.49,iron,door);
    for(const y of [.37,2.6]) box(1.24,.14,.1,0,y,.53,rust,door);
    box(.055,2.2,.03,direction*-.5,1.5,.56,red,door);
  }
  const exitSign=sign('TORRE DO SINAL','LIBERTE OS TRÊS SELOS',0,3.3,.4,2.9,.82,'#9cdbdf',exit);
  const lockedSign=exitSign.material;
  const unlockedSign=material(new THREE.MeshBasicMaterial({map:labelTexture('SINAL LIBERADO','ATIVE A TRANSMISSÃO','#9cfff0'),toneMapped:false}));
  const transmittedSign=material(new THREE.MeshBasicMaterial({map:labelTexture('NO AR','WOODSTOCK / SINAL LIBERTO','#cefff0'),toneMapped:false}));
  const exitIndicators=level.symbols.map((_,i)=>box(.19,.19,.07,-.35+i*.35,2.65,.6,dimCyan,exit));
  const pulseWaves=[0,1,2].map(()=>{
    const mat=material(new THREE.MeshBasicMaterial({color:'#86fff0',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
    const wave=new THREE.Mesh(geometry(new THREE.RingGeometry(.95,1.025,48)),mat);wave.rotation.x=-Math.PI/2;wave.position.y=.1;exit.add(wave);wave.visible=false;return wave;
  });
  const exitBeamMaterial=material(new THREE.MeshBasicMaterial({color:'#5ef7dd',transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  const exitBeam=new THREE.Mesh(geometry(new THREE.CylinderGeometry(.15,.7,3.1,16,1,true)),exitBeamMaterial);exitBeam.position.y=1.75;exitBeam.visible=false;exit.add(exitBeam);

  // The sentinel is an original articulated surveillance engine; no album art is used as a sprite.
  const enemy=new THREE.Group();scene.add(enemy);
  const enemyArmor=material(new THREE.MeshStandardMaterial({color:'#747d7b',metalness:.67,roughness:.39,emissive:'#ce393b',emissiveIntensity:0}));
  const shell=new THREE.Mesh(geometry(new THREE.IcosahedronGeometry(.58,0)),enemyArmor);shell.scale.set(1.16,.77,.76);enemy.add(shell);
  const eyeLens=material(new THREE.MeshStandardMaterial({color:'#dfc6a6',emissive:'#fd4c44',emissiveIntensity:.45,roughness:.24,metalness:.12}));
  const eye=new THREE.Mesh(geometry(new THREE.SphereGeometry(.32,18,10)),eyeLens);eye.scale.set(1.25,.66,.5);eye.position.z=.38;enemy.add(eye);
  const pupil=cylinder(.11,.055,0,0,.56,black,enemy);pupil.rotation.x=Math.PI/2;
  const iris=ring(.19,0,0,.57,red,enemy);iris.scale.y=.13;
  const gimbal=new THREE.Group();enemy.add(gimbal);
  const halo=ring(.78,0,0,0,iron,gimbal);halo.rotation.z=.35;
  const diagonal=ring(.69,0,0,0,copper,gimbal);diagonal.rotation.y=Math.PI/2;diagonal.rotation.x=.45;
  for(const direction of [-1,1]) {
    const guard=box(.4,.16,.26,direction*.51,.25,.24,enemyArmor,enemy);guard.rotation.z=direction*-.43;
    box(.27,.1,.18,direction*.46,-.3,.25,darkIron,enemy).rotation.z=direction*.4;
    cylinder(.075,.3,direction*.55,-.48,-.04,iron,enemy);
    box(.08,.22,.08,direction*.66,.13,0,red,enemy);
  }
  cylinder(.14,.34,0,-.51,0,darkIron,enemy);
  ring(.2,0,-.68,0,red,enemy,true);
  const enemyShadow=flat(2.7,2.7,0,0,contactMat,.02);
  const enemyLamp=new THREE.PointLight('#ff4a42',4,4,2);enemyLamp.position.z=.75;enemy.add(enemyLamp);

  // Machined handheld pulse emitter, with exposed induction coils and a small charge readout.
  const emitter=new THREE.Group();emitter.position.set(.3,-.29,-.52);emitter.rotation.y=-.055;emitter.scale.setScalar(.84);camera.add(emitter);
  const gripMaterial=material(new THREE.MeshStandardMaterial({color:'#514943',roughness:.87,metalness:.02}));
  const housingShape=new THREE.Shape();housingShape.moveTo(-.085,-.07);housingShape.lineTo(.085,-.07);housingShape.lineTo(.095,.035);housingShape.lineTo(.065,.085);housingShape.lineTo(-.065,.085);housingShape.lineTo(-.095,.035);housingShape.closePath();
  const housing=new THREE.Mesh(geometry(new THREE.ExtrudeGeometry(housingShape,{depth:.25,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.014,bevelThickness:.015})),iron);housing.position.z=-.1;emitter.add(housing);
  box(.075,.2,.1,0,-.16,.055,gripMaterial,emitter).rotation.x=-.25;
  box(.15,.04,.2,0,.096,-.035,darkIron,emitter);
  const barrel=cylinder(.054,.27,0,.025,-.22,darkIron,emitter);barrel.rotation.x=Math.PI/2;
  const bore=cylinder(.068,.055,0,.025,-.36,edgeIron,emitter);bore.rotation.x=Math.PI/2;
  const boreHole=cylinder(.042,.06,0,.025,-.368,black,emitter);boreHole.rotation.x=Math.PI/2;
  const coils=[-.17,-.23,-.29].map(z=>ring(.065,0,.025,z,copper,emitter));
  for(const x of [-.073,.073]) box(.027,.034,.25,x,.066,-.19,darkIron,emitter);
  box(.05,.025,.09,0,.123,-.06,black,emitter);
  const charge=box(.031,.008,.045,0,.139,-.067,cyan,emitter);
  box(.022,.022,.025,0,.117,-.2,amber,emitter);
  const hand=box(.1,.075,.12,.022,-.1,.15,gripMaterial,emitter);hand.rotation.x=-.2;
  const sleeve=cylinder(.066,.18,.023,-.15,.245,darkIron,emitter);sleeve.rotation.x=1.14;
  for(let i=0;i<3;i++) box(.013,.06,.035,-.083+i*.012,-.012,.11,black,emitter);
  const weaponLight=new THREE.PointLight('#d5e5ed',2.8,1.7,2);weaponLight.position.set(-.18,.23,.1);camera.add(weaponLight);
  const pulseMaterial=material(new THREE.MeshBasicMaterial({color:'#c1fff4',transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  const pulse=new THREE.Mesh(geometry(new THREE.RingGeometry(.045,.069,20)),pulseMaterial);pulse.position.set(0,.025,-.43);pulse.visible=false;emitter.add(pulse);
  const muzzleGlow=new THREE.Mesh(unitPlane,material(new THREE.MeshBasicMaterial({map:surfaces.glow,color:'#a2fff1',transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending})));muzzleGlow.scale.set(.4,.4,1);muzzleGlow.position.set(0,.025,-.42);muzzleGlow.visible=false;emitter.add(muzzleGlow);

  // Atmosphere particles use one small draw call, only around restored seals.
  const dustPositions=new Float32Array(72*3);
  const dustGeometry=geometry(new THREE.BufferGeometry());dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dustMaterial=material(new THREE.PointsMaterial({color:'#a4ffe9',size:.026,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));
  const dust=new THREE.Points(dustGeometry,dustMaterial);dust.visible=false;dust.frustumCulled=false;scene.add(dust);
  let dustMask='';
  function updateDust(collected:readonly string[]) {
    const mask=collected.join('|');if(mask===dustMask)return;dustMask=mask;
    const active=level.symbols.filter(s=>collected.includes(s.id));dust.visible=active.length>0;if(!active.length)return;
    for(let i=0;i<72;i++){const s=active[i%active.length],angle=i*2.39996,r=.4+(i%13)/13*.65;dustPositions[i*3]=s.x+Math.cos(angle)*r;dustPositions[i*3+1]=.25+(i%17)/17*2.9;dustPositions[i*3+2]=s.z+Math.sin(angle)*r;}
    dustGeometry.attributes.position.needsUpdate=true;
  }
  for(const [mat,placements] of batches) instances(unitBox,mat,placements);
  instances(unitBox,iron,bars);instances(unitCylinder,copper,pipes);
  instances(geometry(new THREE.TorusGeometry(.09,.024,5,10)),iron,chains);
  instances(boltShape,edgeIron,bolts);
  batches.clear();

  // Navigation is computed by the runtime. The renderer only displays its bounded point pool.
  const guide=new THREE.InstancedMesh(unitBox,cyan,30);guide.count=0;guide.visible=false;guide.frustumCulled=false;instancedMeshes.add(guide);scene.add(guide);
  const guideGlowMat=material(new THREE.MeshBasicMaterial({color:'#53dbc9',map:surfaces.glow,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));
  const guideGlow=new THREE.InstancedMesh(unitPlane,guideGlowMat,30);guideGlow.count=0;guideGlow.visible=false;guideGlow.frustumCulled=false;instancedMeshes.add(guideGlow);scene.add(guideGlow);
  const guideTransform=new THREE.Object3D();
  function setGuide(points:readonly Vec2[]) {
    if(disposed)return;
    const count=Math.min(points.length,30);guide.count=guideGlow.count=count;guide.visible=guideGlow.visible=count>0;
    for(let i=0;i<count;i++) {
      guideTransform.position.set(points[i].x,.052,points[i].z);guideTransform.rotation.set(0,Math.PI/4,0);guideTransform.scale.set(.105,.024,.105);guideTransform.updateMatrix();guide.setMatrixAt(i,guideTransform.matrix);
      guideTransform.position.y=.041;guideTransform.rotation.set(-Math.PI/2,0,0);guideTransform.scale.set(.53,.53,1);guideTransform.updateMatrix();guideGlow.setMatrixAt(i,guideTransform.matrix);
    }
    guide.instanceMatrix.needsUpdate=guideGlow.instanceMatrix.needsUpdate=true;
  }

  let hasRendered = false;
  function resize() {
    if (disposed) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const budget = coarse ? 900_000 : 1_650_000;
    const ratio = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.6, Math.sqrt(budget / (width * height)));
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    emitter.position.x = Math.min(.3, camera.aspect * .28);
    if (hasRendered && !contextLost) renderer.render(scene, camera);
  }
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  observer?.observe(host);
  if (!observer) window.addEventListener('resize', resize);
  const onLost = (event: Event) => {
    event.preventDefault();
    if (!disposed) { contextLost = true; options.onContextLost?.(); }
  };
  const onRestored = () => {
    if (!disposed) { contextLost = false; resize(); options.onContextRestored?.(); }
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  resize();

  return {
    canvas,
    setGuide,
    render(state: Readonly<GameState>, dt: number, reducedMotion = false) {
      if (disposed || contextLost) return;
      camera.position.set(state.player.x, EYE_HEIGHT, state.player.z);
      camera.rotation.set(state.player.pitch, state.player.yaw, 0, 'YXZ');
      for (const symbol of level.symbols) {
        const view = symbolViews.get(symbol.id)!;
        const active = state.collected.includes(symbol.id);
        view.active = active;
        view.glyph.quaternion.copy(camera.quaternion);
        view.glyph.position.y = active && !reducedMotion ? 1.72 + Math.sin(state.elapsed * 2.5) * .04 : 1.72;
        view.halo.material = active ? amber : view.energy;
        view.conduit.color.set(active ? '#79fff0' : '#26383b');
        view.light.intensity = active ? 7 : 1.2;
        view.crown.rotation.y += reducedMotion ? 0 : dt * (active ? .8 : .15);
      }
      updateDust(state.collected);
      if (dust.visible && !reducedMotion) dust.rotation.y += dt * .12;
      const restored = state.collected.length;
      const unlocked = restored >= level.symbols.length;
      const transmitting = state.phase === 'won';
      leftDoor.position.x = unlocked ? -1.85 : -.65;
      rightDoor.position.x = unlocked ? 1.85 : .65;
      exitSign.material = transmitting ? transmittedSign : unlocked ? unlockedSign : lockedSign;
      exitBeam.visible = transmitting;
      exitBeamMaterial.opacity = transmitting ? .08 + Math.sin(state.elapsed * 3) * .025 : .055;
      transmissionLamp.intensity = unlocked ? 13 : 1;
      towerMaterial.emissiveIntensity = unlocked ? .7 : .1;
      for (const [index, indicator] of exitIndicators.entries()) {
        (indicator.material as THREE.MeshBasicMaterial).color.set(state.collected.includes(level.symbols[index]!.id) ? palette[index] : '#284c50');
      }
      pulseWaves.forEach((wave, index) => {
        wave.visible = transmitting;
        const phase = ((state.elapsed * 1.8 + index * .24) % 1);
        wave.scale.setScalar(.7 + phase * 2.7);
        (wave.material as THREE.MeshBasicMaterial).opacity = transmitting ? (1 - phase) * .34 : 0;
      });
      enemy.visible = state.enemy.health > 0;
      enemy.position.set(state.enemy.x, 1.35 + (reducedMotion ? 0 : Math.sin(state.elapsed * 2.2) * .05), state.enemy.z);
      enemy.rotation.y = Math.atan2(state.player.x - state.enemy.x, state.player.z - state.enemy.z);
      const stunned = state.enemy.stunRemaining > 0;
      enemyArmor.emissiveIntensity = stunned ? .8 : .04;
      eyeLens.emissiveIntensity = stunned ? 1.2 : .45;
      gimbal.rotation.z += reducedMotion ? 0 : dt * (stunned ? 2.8 : .55);
      enemyLamp.intensity = stunned ? 7 : 4;
      const firing = Math.min(1, Math.max(0, state.muzzleFlash / .11));
      emitter.position.z = -.52 + (reducedMotion ? 0 : firing * .045);
      charge.scale.x = .4 + firing * .6;
      charge.material = firing > 0 ? cyan : amber;
      pulse.visible = firing > 0 && !reducedMotion;
      muzzleGlow.visible = firing > 0 && !reducedMotion;
      pulse.scale.setScalar(1 + (1 - firing) * 2.5);
      pulseMaterial.opacity = firing * .8;
      renderer.render(scene, camera);
      hasRendered = true;
    },
    resize,
    getMetrics: () => ({ drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
      pixelRatio: renderer.getPixelRatio(), contextLost }),
    dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      for (const item of instancedMeshes) item.dispose();
      for (const item of geometries) item.dispose();
      for (const item of materials) item.dispose();
      for (const item of textures) item.dispose();
      scene.clear(); renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
      geometries.clear(); materials.clear(); textures.clear(); instancedMeshes.clear(); symbolViews.clear();
    },
  };
}
