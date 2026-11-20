import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';

/* YEMENI FIT — Vanilla JS / Three.js showroom.
   Replace the procedural mannequin with a licensed, rigged GLB at:
   assets/models/yemeni-male-avatar.glb
   A real garment-to-body simulation requires matching rigged garment assets.
*/

const $ = (id) => document.getElementById(id);
const money = n => `$${n.toFixed(2)}`;
const products = [
  {id:'tee-01',type:'shirts',name:'Sanaa Essential Tee',price:32,color:'#d9d1c4',colorName:'Ivory',description:'A clean everyday silhouette in a soft neutral tone.'},
  {id:'tee-02',type:'shirts',name:'Old City Heavy Tee',price:38,color:'#343536',colorName:'Obsidian',description:'A structured heavyweight tee with a relaxed profile.'},
  {id:'tee-03',type:'shirts',name:'Desert Sand Tee',price:34,color:'#ad9275',colorName:'Sand',description:'Warm sand tones with an understated finish.'},
  {id:'pant-01',type:'pants',name:'Highland Straight Pants',price:54,color:'#44484b',colorName:'Graphite',description:'A versatile straight-leg cut for everyday movement.'},
  {id:'pant-02',type:'pants',name:'Old Sana’a Chino',price:58,color:'#aa9278',colorName:'Khaki',description:'A refined chino in a timeless earthy shade.'},
  {id:'pant-03',type:'pants',name:'Nightfall Trousers',price:62,color:'#25282c',colorName:'Black',description:'A tailored dark trouser with a clean line.'}
];
let scene,camera,renderer,controls,raycaster,pointer,room,avatar,avatarParts={};
let garmentMeshes=new Map(), selected=null, selectedSize='M', selectedColor=null, currentSection='shirts';
let shirtOn=null,pantsOn=null,cart=JSON.parse(localStorage.getItem('yf-cart')||'[]');
let avatarAngle=0;

function mat(color,roughness=.72,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function box(parent,w,h,d,material,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,r1,r2,h,material,x,y,z,segments=24){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}

function init3D(){
  const host=$('threeCanvas');
  scene=new THREE.Scene();scene.background=new THREE.Color('#282521');scene.fog=new THREE.Fog('#282521',12,25);
  camera=new THREE.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.1,100);camera.position.set(7,5.4,10);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.appendChild(renderer.domElement);
  controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.5,0);controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=16;controls.maxPolarAngle=Math.PI/2.02;
  raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
  buildRoom();buildRails();buildAvatar();buildGarments();loadAvatarIfPresent();
  const hemi=new THREE.HemisphereLight('#fff1d9','#55483d',2.1);scene.add(hemi);
  const key=new THREE.SpotLight('#ffe0b2',90,30,Math.PI/5,.45,1.3);key.position.set(1,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
  const fill=new THREE.PointLight('#d5c4a9',22,18);fill.position.set(-5,4,2);scene.add(fill);
  const rim=new THREE.PointLight('#c19a6b',18,14);rim.position.set(4,4,-5);scene.add(rim);
  renderer.domElement.addEventListener('pointerdown',onSceneClick);
  window.addEventListener('resize',resize3D);
  animate();
}
function buildRoom(){
  room=new THREE.Group();scene.add(room);
  const floor=mat('#51483d',.82),wall=mat('#393530'),back=mat('#302e2a'),trim=mat('#9a7a54',.35,.7);
  box(room,18,.2,15,floor,0,-.12,0);
  box(room,18,7,.18,back,0,3.35,-7.4);
  box(room,.18,7,15,wall,-9,3.35,0);box(room,.18,7,15,wall,9,3.35,0);
  box(room,18,.18,15,wall,0,6.9,0);
  // Architectural trim and warm wall panels
  for(let x=-7.5;x<=7.5;x+=3){box(room,.035,4.8,.04,trim,x,3.25,-7.28);}
  box(room,18,.12,.15,trim,0,.18,-7.25);
  const rug=mat('#746553');const r=box(room,8,.035,5,rug,0,.015,1.2);r.receiveShadow=true;
  // Ceiling recessed light details
  for(let x=-5;x<=5;x+=5){const glow=new THREE.Mesh(new CircleGeometry(.22,24),new MeshBasicMaterial({color:'#f6d7a8'}));glow.rotation.x=-Math.PI/2;glow.position.set(x,6.79,-1);room.add(glow);}
}
function buildRails(){
  const metal=mat('#b99a72',.25,.85),dark=mat('#272522',.4,.6);
  [-3.2,3.2].forEach((x,i)=>{
    const g=new THREE.Group();g.position.set(x,0,-1.2);scene.add(g);
    cylinder(g,.055,.055,3.6,metal,0,2.25,0);
    cylinder(g,.055,.055,2.55,metal,0,3.8,0);
    cylinder(g,.045,.045,2.5,metal,-.85,3.1,0);
    cylinder(g,.045,.045,2.5,metal,.85,3.1,0);
    box(g,2.3,.08,.08,dark,0,1.25,0);
    for(const xx of [-.85,.85]){cylinder(g,.035,.035,.08,metal,xx,.1,0);cylinder(g,.035,.035,.08,metal,xx,1.25,0);}
    const plaque=box(g,1.55,.42,.05,dark,0,5.45,.1);
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#292622';ctx.fillRect(0,0,512,128);ctx.fillStyle='#d1b18a';ctx.font='bold 38px Arial';ctx.textAlign='center';ctx.fillText(i===0?'01  T-SHIRTS':'02  PANTS',256,79);
    const tex=new THREE.CanvasTexture(canvas);const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.38),new THREE.MeshBasicMaterial({map:tex}));sign.position.set(x,5.45,-1.12);scene.add(sign);
  });
}
function createTee(color){
  const group=new THREE.Group(),fabric=mat(color,.92),sleeveMat=mat(color,.94);
  // T-shirt torso with tapered shoulders and a simple 3D silhouette
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.43,.48,1.25,32,1,false),fabric);torso.position.y=.05;torso.castShadow=true;group.add(torso);
  const shoulder=new THREE.Mesh(new THREE.BoxGeometry(1.05,.25,.56),fabric);shoulder.position.y=.55;shoulder.castShadow=true;group.add(shoulder);
  for(const side of [-1,1]){const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.19,.23,.55,20),sleeveMat);sleeve.rotation.z=side*.82;sleeve.position.set(side*.59,.48,0);sleeve.castShadow=true;group.add(sleeve);}
  const neck=new THREE.Mesh(new THREE.TorusGeometry(.17,.045,8,24),mat('#5b5148'));neck.rotation.x=Math.PI/2;neck.position.y=.69;group.add(neck);
  return group;
}
function createPants(color){
  const group=new THREE.Group(),fabric=mat(color,.9);
  const waist=box(group,.86,.18,.34,fabric,0,.58,0);
  for(const side of [-1,1]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.37,1.18,.34),fabric);leg.position.set(side*.22,-.08,0);leg.castShadow=true;group.add(leg);
  }
  return group;
}
function buildGarments(){
  products.forEach((p,i)=>{
    const isShirt=p.type==='shirts',g=isShirt?createTee(p.color):createPants(p.color);
    g.userData.productId=p.id;g.userData.baseY=isShirt?2.8:2.68;g.userData.type=p.type;
    g.position.set((isShirt?-3.2:3.2)+(i%3-1)*.66,g.userData.baseY,-1.2);
    g.scale.setScalar(isShirt?.67:.68);
    const hanger=new THREE.Group();hanger.position.set(g.position.x,g.position.y+.85,g.position.z);
    const hook=cylinder(hanger,.018,.018,.3,mat('#b99a72',.2,.9),0,.14,0,10);hook.rotation.z=Math.PI/2;
    const bar=box(hanger,.7,.025,.035,mat('#b99a72',.25,.8),0,0,0);scene.add(hanger);
    g.userData.hanger=hanger;scene.add(g);garmentMeshes.set(p.id,g);
  });
}
function buildAvatar(){
  avatar=new THREE.Group();avatar.position.set(0,0,3.1);scene.add(avatar);
  const skin=mat('#9a6b4e'),shirt=mat('#d9d1c4'),trouser=mat('#343a40'),shoe=mat('#242321'),hair=mat('#211b18');
  const head=cylinder(avatar,.22,.2,.38,skin,0,2.65,0,24);head.scale.set(.85,1.2,.85);
  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.22,24,16,0,Math.PI*2,0,Math.PI*.58),hair);hairCap.position.set(0,2.82,0);avatar.add(hairCap);
  const neck=cylinder(avatar,.09,.1,.18,skin,0,2.38,0);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.72,6,12),shirt);torso.position.y=1.82;torso.castShadow=true;avatar.add(torso);avatarParts.torso=torso;
  const armMat=skin;
  for(const s of [-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.68,5,10),armMat);arm.position.set(s*.48,1.8,0);arm.rotation.z=s*-.12;avatar.add(arm);}
  const hips=new THREE.Mesh(new THREE.BoxGeometry(.58,.3,.32),trouser);hips.position.y=1.17;avatar.add(hips);avatarParts.hips=hips;
  for(const s of [-1,1]){
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.15,.78,5,10),trouser);leg.position.set(s*.17,.62,0);avatar.add(leg);
    const foot=box(avatar,.25,.13,.42,shoe,s*.17,.12,.08);
  }
  avatar.userData.procedural=true;
}
async function loadAvatarIfPresent(){
  try{
    const gltf=await new GLTFLoader().loadAsync('./assets/models/yemeni-male-avatar.glb');
    // Replace the demo mannequin only when a compatible licensed model is supplied.
    scene.remove(avatar);avatar=gltf.scene;avatar.position.set(0,0,3.1);avatar.scale.setScalar(1);scene.add(avatar);
    $('sceneStatus').textContent='Avatar model loaded';
  }catch(e){console.info('Optional GLB not found; procedural mannequin is active.');}
}
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}
function resize3D(){const host=$('threeCanvas');if(!renderer)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);}
function onSceneClick(e){
  const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([...garmentMeshes.values()].flatMap(g=>g.children.length?[g,...g.children]:[g]),true);
  if(!hits.length)return;
  let obj=hits[0].object;while(obj&&!obj.userData.productId)obj=obj.parent;
  if(obj?.userData.productId)selectProduct(obj.userData.productId);
}
function selectProduct(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  selected=p;selectedColor=p.color;selectedSize='M';
  $('productCategory').textContent=p.type==='shirts'?'SECTION 01 / T-SHIRTS':'SECTION 02 / PANTS';
  $('productName').textContent=p.name;$('productPrice').textContent=money(p.price);$('productDescription').textContent=p.description;
  $('sizeOptions').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.textContent==='M'));
  $('colorOptions').innerHTML='';
  [p.color,'#d9d1c4','#343536','#ad9275'].filter((v,i,a)=>a.indexOf(v)===i).forEach((c,i)=>{const b=document.createElement('button');b.className='color-swatch'+(c===p.color?' active':'');b.style.background=c;b.title=c;b.onclick=()=>{selectedColor=c;$('colorOptions').querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');recolorProduct(p,c);};$('colorOptions').appendChild(b);});
  $('productCard').classList.add('open');$('sceneStatus').textContent=p.name+' selected';
  document.querySelectorAll('.section-tag').forEach(b=>b.classList.toggle('selected',b.dataset.section===p.type));
  const g=garmentMeshes.get(id);if(g){
    gsap.to(g.position,{duration:.65,x:0,y:2.45,z:2.2,ease:'power3.out'});
    gsap.to(g.rotation,{duration:.7,y:Math.PI,ease:'power2.inOut'});
    gsap.to(camera.position,{duration:1,x:3.2,y:3.5,z:8,ease:'power2.inOut'});
    gsap.to(controls.target,{duration:1,x:0,y:2.4,z:2,ease:'power2.inOut'});
    Object.values(garmentMeshes).forEach?.(()=>{});
  }
}
function recolorProduct(p,color){
  const g=garmentMeshes.get(p.id);g?.traverse(o=>{if(o.isMesh&&o.material?.color)o.material.color.set(color);});
  if(p.type==='shirts'&&shirtOn?.id===p.id){$('miniShirt').style.background=color;}
  if(p.type==='pants'&&pantsOn?.id===p.id){$('miniPants').style.background=color;}
}
function tryOn(){
  if(!selected)return;
  const p={...selected,color:selectedColor,size:selectedSize};
  const slot=p.type==='shirts'?'shirt':'pants';
  if(slot==='shirt')shirtOn=p;else pantsOn=p;
  const mesh=garmentMeshes.get(p.id);
  if(mesh){gsap.to(mesh.position,{duration:.65,x:p.type==='shirts'?0:0,y:p.type==='shirts'?1.85:1.05,z:3.1,ease:'power2.inOut'});gsap.to(mesh.scale,{duration:.5,x:.01,y:.01,z:.01});}
  updateOutfit();$('sceneStatus').textContent=p.name+' added to avatar preview';toast('Added '+p.name+' to your outfit');
}
function updateOutfit(){
  $('chosenShirt').textContent=shirtOn?`${shirtOn.name} · ${shirtOn.size}`:'No T-shirt selected';
  $('chosenPants').textContent=pantsOn?`${pantsOn.name} · ${pantsOn.size}`:'No pants selected';
  $('outfitTotal').textContent=money((shirtOn?.price||0)+(pantsOn?.price||0));
  $('miniShirt').style.background=shirtOn?.color||'#d9d1c4';$('miniPants').style.background=pantsOn?.color||'#343a40';
}
function addCart(item){
  const key=item.id+'-'+(item.size||'M')+'-'+(item.color||'');
  const found=cart.find(x=>x.key===key);if(found)found.qty++;else cart.push({...item,key,qty:1});
  persistCart();renderCart();toast('Added to your bag');
}
function persistCart(){localStorage.setItem('yf-cart',JSON.stringify(cart));$('cartCount').textContent=cart.reduce((a,b)=>a+b.qty,0);}
function renderCart(){
  $('cartItems').innerHTML='';
  if(!cart.length){$('cartItems').innerHTML='<p class="empty-cart">Your bag is waiting for something good.</p>';}
  cart.forEach(item=>{
    const el=document.createElement('div');el.className='cart-item';
    el.innerHTML=`<div><h4>${item.name}</h4><p>${item.size||'M'} · ${item.colorName||'Selected color'}</p><div class="qty-controls"><button data-act="minus">−</button><span>${item.qty}</span><button data-act="plus">+</button><button data-act="remove">×</button></div></div><strong>${money(item.price*item.qty)}</strong>`;
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>{const act=b.dataset.act;if(act==='plus')item.qty++;if(act==='minus')item.qty--;if(act==='remove'||item.qty<=0)cart=cart.filter(x=>x.key!==item.key);persistCart();renderCart();});
    $('cartItems').appendChild(el);
  });
  $('cartSubtotal').textContent=money(cart.reduce((a,b)=>a+b.price*b.qty,0));
}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2200);}
function openCart(){$('cartOverlay').classList.add('open');}
function jumpSection(type){currentSection=type;const p=products.find(x=>x.type===type);if(p)selectProduct(p.id);$('showroom').scrollIntoView({behavior:'smooth'});}
function resetView(){gsap.to(camera.position,{duration:.8,x:7,y:5.4,z:10});gsap.to(controls.target,{duration:.8,x:0,y:1.5,z:0});}
function resetOutfit(){shirtOn=null;pantsOn=null;updateOutfit();products.forEach(p=>{const g=garmentMeshes.get(p.id);if(g){gsap.to(g.scale,{duration:.35,x:.67,y:.67,z:.67});gsap.to(g.position,{duration:.5,x:(p.type==='shirts'?-3.2:3.2)+(products.indexOf(p)%3-1)*.66,y:g.userData.baseY,z:-1.2});gsap.to(g.rotation,{duration:.5,x:0,y:0,z:0});}});toast('Outfit reset');}

$('sizeOptions').addEventListener('click',e=>{if(e.target.tagName!=='BUTTON')return;selectedSize=e.target.textContent;$('sizeOptions').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===e.target));});
$('tryOnBtn').onclick=tryOn;
$('addToCartBtn').onclick=()=>{if(!selected)return toast('Select a garment first');addCart({...selected,size:selectedSize,color:selectedColor});};
$('closeProduct').onclick=()=>$('productCard').classList.remove('open');
$('cartTrigger').onclick=openCart;$('closeCart').onclick=()=>$('cartOverlay').classList.remove('open');
$('cartOverlay').onclick=e=>{if(e.target===$('cartOverlay'))$('cartOverlay').classList.remove('open');};
$('checkoutBtn').onclick=()=>toast('Demo checkout only — connect a payment provider for live orders.');
$('resetViewBtn').onclick=resetView;
$('orbitBtn').onclick=()=>{controls.enabled=!controls.enabled;$('orbitBtn').classList.toggle('active',controls.enabled);};
document.querySelectorAll('.section-tag').forEach(b=>b.onclick=()=>jumpSection(b.dataset.section));
document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>jumpSection(b.dataset.jump));
$('avatarRotate').onclick=()=>{avatarAngle+=Math.PI*2;gsap.to(avatar.rotation,{duration:2,y:avatarAngle,ease:'power2.inOut'});$('avatarMini').style.transform=`rotateY(${avatarAngle}rad)`;};
$('resetOutfit').onclick=resetOutfit;
$('removeShirt').onclick=()=>{shirtOn=null;updateOutfit();$('miniShirt').style.background='#d9d1c4';toast('T-shirt removed from outfit');};
$('removePants').onclick=()=>{pantsOn=null;updateOutfit();$('miniPants').style.background='#343a40';toast('Pants removed from outfit');};
$('addOutfitBtn').onclick=()=>{if(!shirtOn&&!pantsOn)return toast('Choose at least one garment');if(shirtOn)addCart(shirtOn);if(pantsOn)addCart(pantsOn);};
$('saveOutfitBtn').onclick=()=>{const saved=JSON.parse(localStorage.getItem('yf-saved-outfits')||'[]');saved.push({shirt:shirtOn,pants:pantsOn,at:new Date().toISOString()});localStorage.setItem('yf-saved-outfits',JSON.stringify(saved));$('savedMessage').textContent='♡ Outfit saved on this device.';};
init3D();persistCart();renderCart();
setTimeout(()=>$('loadingScreen').classList.add('done'),950);
