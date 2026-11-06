import * as THREE from './three.module.js';
const $=id=>document.getElementById(id);
let worker,pending=null,requestId=0,currentImage=null,currentDepth=null,mesh,renderer,scene,camera,texture,depthTexture;
let panorama=false,panoMesh=null,yaw=0,pitch=0,panoFov=75;
let exploring=false,depthVisible=false,busy=false,drag=null,offset={x:0,y:0,z:0};
const host=$('canvasHost'),viewport=$('viewport');
function status(message,error=false){$('statusText').textContent=message;$('status').classList.toggle('error',error)}
function loading(show,message='Preparing your picture…'){$('loadingOverlay').hidden=!show;$('loadingDetail').textContent=message;$('progressWrap').hidden=!show}
function setBusy(value){busy=value;for(const id of ['sampleButton','panoSampleButton','enterButton','imageInput','panoInput'])$(id).disabled=value;$('dropzone').setAttribute('aria-busy',value)}
function controlsReady(ready){for(const id of ['exploreButton','depthRange','depthButton','resetButton','downloadButton'])$(id).disabled=!ready}
function initializeRenderer(){
 if(renderer)return;
 try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})}catch{throw new Error('This browser cannot start the 3D viewer. Try current Chrome, Edge, or Safari.')}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x0e1317);renderer.outputColorSpace=THREE.SRGBColorSpace;
 host.appendChild(renderer.domElement);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(45,1,.01,100);
 new ResizeObserver(resize).observe(viewport);renderer.setAnimationLoop(()=>{if(exploring)renderer.render(scene,camera)});resize();
}
function resize(){if(!renderer)return;const {width,height}=viewport.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();updateCamera()}
function updateCamera(){if(panorama&&camera){camera.fov=panoFov;camera.position.set(0,0,0);camera.updateProjectionMatrix();const y=THREE.MathUtils.degToRad(yaw),p=THREE.MathUtils.degToRad(pitch);camera.lookAt(Math.sin(y)*Math.cos(p),Math.sin(p),-Math.cos(y)*Math.cos(p));$('bearing').value=Math.round(((yaw%360)+360)%360)+'°';return;}if(!camera||!currentImage)return;const imageAspect=currentImage.width/currentImage.height,vertical=Math.max(1,imageAspect/camera.aspect);camera.fov=2*Math.atan(Math.tan(THREE.MathUtils.degToRad(45)/2)*vertical)*180/Math.PI;camera.updateProjectionMatrix();camera.position.set(offset.x,offset.y,offset.z);camera.lookAt(0,0,-4)}
function depthAt(u,v){const d=currentDepth,x=Math.min(d.width-1,Math.round(u*(d.width-1))),y=Math.min(d.height-1,Math.round(v*(d.height-1)));return d.pixels[(y*d.width+x)*d.channels]/255}
function buildGeometry(){
 const aspectRatio=currentImage.width/currentImage.height,gridX=Math.max(16,Math.round(180*Math.min(1,aspectRatio))),gridY=Math.max(16,Math.round(180*Math.min(1,1/aspectRatio))),strength=Number($('depthRange').value);
 const p=[],uv=[],indices=[],depths=[],tan=Math.tan(THREE.MathUtils.degToRad(45)/2),aspect=currentImage.width/currentImage.height;
 for(let y=0;y<=gridY;y++)for(let x=0;x<=gridX;x++){const u=x/gridX,v=y/gridY,d=depthAt(u,v),distance=4+(1-d)*3*strength;depths.push(d);p.push((u-.5)*2*tan*aspect*distance,(.5-v)*2*tan*distance,-distance);uv.push(u,1-v)}
 // Keep the visible surface connected. Cutting depth edges creates holes even at the source viewpoint.
 const add=(a,b,c)=>indices.push(a,b,c);
 for(let y=0;y<gridY;y++)for(let x=0;x<gridX;x++){const a=y*(gridX+1)+x,b=a+1,c=a+gridX+1,d=c+1;add(a,c,b);add(b,c,d)}
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geom.setIndex(indices);
 if(mesh){mesh.geometry.dispose();mesh.geometry=geom}else{mesh=new THREE.Mesh(geom,new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));scene.add(mesh)}
 mesh.material.map=depthVisible?depthTexture:texture;mesh.material.needsUpdate=true;$('depthValue').value=strength.toFixed(2);$('sceneInfo').textContent='Estimated depth · limited viewpoint exploration';
}
function createDepthTexture(){const c=document.createElement('canvas');c.width=currentDepth.width;c.height=currentDepth.height;const ctx=c.getContext('2d'),im=ctx.createImageData(c.width,c.height);for(let i=0;i<c.width*c.height;i++){const d=currentDepth.pixels[i*currentDepth.channels];im.data.set([d,d,d,255],i*4)}ctx.putImageData(im,0,0);return new THREE.CanvasTexture(c)}
function showMode(explore){exploring=explore;host.hidden=!explore;$('originalImage').hidden=explore;$('startOverlay').hidden=explore||!!currentDepth;$('viewHint').hidden=!explore;$('sceneLabel').textContent=explore?(panorama?'INSIDE THE PAINTING · 360°':'A SPATIAL PERSPECTIVE'):(panorama?'THE PANORAMA':'THE ORIGINAL');$('exploreButton').classList.toggle('selected',explore);$('originalButton').classList.toggle('selected',!explore);$('exploreButton').setAttribute('aria-pressed',explore);$('originalButton').setAttribute('aria-pressed',!explore);if(explore){resize();viewport.focus({preventScroll:true})}}
function installDepth(depth){initializeRenderer();panorama=false;document.body.classList.remove("panorama-mode");$("panoramaReadout").hidden=true;if(panoMesh)panoMesh.visible=false;if(mesh)mesh.visible=true;$("viewHint").textContent="Drag to change perspective · scroll to move closer";currentDepth=depth;texture?.dispose();depthTexture?.dispose();texture=new THREE.Texture(currentImage);texture.needsUpdate=true;texture.colorSpace=THREE.SRGBColorSpace;depthTexture=createDepthTexture();depthVisible=false;$('depthButton').setAttribute('aria-pressed','false');offset={x:0,y:0,z:0};buildGeometry();controlsReady(true);showMode(true);status('Ready. Drag gently to discover the depth.')}
function runDepth(image){return new Promise((resolve,reject)=>{
 if(!worker){worker=new Worker('./depth-worker.js',{type:'module'});worker.onmessage=({data})=>{if(!pending||data.id!==pending.id)return;if(data.type==='status'){status(data.message);$('loadingDetail').textContent=data.message}else if(data.type==='progress'){$('progressBar').style.width=Math.max(0,Math.min(100,data.progress||0))+'%'}else if(data.type==='result'){const p=pending;pending=null;p.resolve(data)}else if(data.type==='error'){const p=pending;pending=null;p.reject(new Error(data.message))}};worker.onerror=()=>{pending?.reject(new Error('The depth model could not load. Check your connection and try again.'));pending=null;worker.terminate();worker=null}}
 const id=++requestId;pending={id,resolve,reject};worker.postMessage({id,image});
})}
async function decode(source){const image=new Image();image.src=source;await image.decode();const scale=Math.min(1,1024/Math.max(image.width,image.height)),c=document.createElement('canvas');c.width=Math.round(image.width*scale);c.height=Math.round(image.height*scale);c.getContext('2d').drawImage(image,0,0,c.width,c.height);const resized=new Image();resized.src=c.toDataURL('image/jpeg',.92);await resized.decode();return resized}
async function processImage(source,name,credit,isSample=false){
 if(busy)return;setBusy(true);loading(true);status('Preparing picture…');controlsReady(false);showMode(false);currentDepth=null;$('progressBar').style.width='0%';
 try{currentImage=await decode(source);$('originalImage').src=currentImage.src;$('originalImage').alt=name;$('thumbnail').src=currentImage.src;$('imageName').textContent=name;$('imageCredit').textContent=credit;
 let depth;if(isSample){const response=await fetch('./sample-depth.json');if(response.ok){const d=await response.json();depth={...d,pixels:new Uint8Array(d.pixels)}}}
 if(!depth)depth=await runDepth(currentImage.src);installDepth(depth);
 }catch(e){status(e.message||'We could not process this picture.',true);$('sceneInfo').textContent='Processing failed — choose another image or try the example.';$('startOverlay').hidden=false}
 finally{setBusy(false);loading(false)}
}
async function openFile(file){if(!file||busy)return;if(file.size>20*1024*1024){status('Choose an image smaller than 20 MB.',true);return}if(!file.type.startsWith('image/')){status('Choose a supported image file.',true);return}const url=URL.createObjectURL(file);try{await processImage(url,file.name,'Your picture · processed on this device')}finally{URL.revokeObjectURL(url);$('imageInput').value=''}}
const sample=()=>processImage('./sample.jpg','A Sunday on La Grande Jatte','Georges Seurat · Art Institute of Chicago',true);
$('sampleButton').onclick=sample;$('enterButton').onclick=()=>openPanorama('./sample-panorama.png',true);$('imageInput').onchange=e=>openFile(e.target.files[0]);
$('originalButton').onclick=()=>{if(!busy)showMode(false)};$('exploreButton').onclick=()=>showMode(true);
$('depthRange').oninput=()=>{if(currentDepth)buildGeometry()};$('resetButton').onclick=()=>{offset={x:0,y:0,z:0};yaw=0;pitch=0;panoFov=75;updateCamera()};
$('depthButton').onclick=()=>{depthVisible=!depthVisible;$('depthButton').setAttribute('aria-pressed',depthVisible);mesh.material.map=depthVisible?depthTexture:texture;mesh.material.needsUpdate=true;showMode(true)};
$('downloadButton').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='into-the-picture.png';a.href=renderer.domElement.toDataURL('image/png');a.click()};
$('shareButton').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('shareButton').textContent='Link copied ✓';setTimeout(()=>$('shareButton').textContent='Copy demo link ↗',2500)}catch{status('Copy the page address from your browser to share the demo.')}};
$('aboutButton').onclick=()=>$('about').showModal();$('closeAbout').onclick=()=>$('about').close();
const drop=$('dropzone');for(const type of ['dragenter','dragover'])drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('dragging')});for(const type of ['dragleave','drop'])drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove('dragging')});drop.addEventListener('drop',e=>openFile(e.dataTransfer.files[0]));
viewport.addEventListener('pointerdown',e=>{if(!exploring||busy)return;drag={x:e.clientX,y:e.clientY};viewport.setPointerCapture(e.pointerId)});viewport.addEventListener('pointermove',e=>{if(!drag)return;if(panorama){yaw-=(e.clientX-drag.x)*.15;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.15,-85,85);drag={x:e.clientX,y:e.clientY};updateCamera();return;}offset.x=THREE.MathUtils.clamp(offset.x-(e.clientX-drag.x)*.002,-.55,.55);offset.y=THREE.MathUtils.clamp(offset.y+(e.clientY-drag.y)*.002,-.35,.35);drag={x:e.clientX,y:e.clientY};updateCamera()});for(const type of ['pointerup','pointercancel'])viewport.addEventListener(type,()=>drag=null);
viewport.addEventListener('wheel',e=>{if(!exploring)return;e.preventDefault();if(panorama){panoFov=THREE.MathUtils.clamp(panoFov+e.deltaY*.04,35,100);updateCamera();return;}offset.z=THREE.MathUtils.clamp(offset.z-e.deltaY*.001,-.5,.8);updateCamera()},{passive:false});viewport.addEventListener('keydown',e=>{if(!exploring)return;const moves={ArrowLeft:[-.07,0],ArrowRight:[.07,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]};if(moves[e.key]){e.preventDefault();if(panorama){yaw+=e.key==='ArrowLeft'?-5:e.key==='ArrowRight'?5:0;pitch=THREE.MathUtils.clamp(pitch+(e.key==='ArrowUp'?5:e.key==='ArrowDown'?-5:0),-85,85);updateCamera();return;}offset.x=THREE.MathUtils.clamp(offset.x+moves[e.key][0],-.55,.55);offset.y=THREE.MathUtils.clamp(offset.y+moves[e.key][1],-.35,.35);updateCamera()}if(e.key==='Escape')showMode(false)});
window.pictureDemo={getDepth:()=>currentDepth?{width:currentDepth.width,height:currentDepth.height,channels:currentDepth.channels,pixels:Array.from(currentDepth.pixels)}:null,getState:()=>({exploring,busy,panorama,yaw,pitch,panoFov,hasDepth:!!currentDepth,offset:{...offset}})};

async function openPanorama(source,isSample=false,name='Your panorama'){
 if(busy)return;setBusy(true);loading(true,'Opening your surrounding scene…');
 try{const image=new Image();image.src=source;await image.decode();if(Math.abs(image.width/image.height-2)>.06)throw new Error('Use a full 360° equirectangular panorama with a 2:1 width-to-height ratio. Ordinary photos use Choose your picture.');initializeRenderer();
 const t=new THREE.Texture(image);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;if(panoMesh){panoMesh.geometry.dispose();panoMesh.material.map.dispose();panoMesh.material.dispose();scene.remove(panoMesh)}
 const g=new THREE.SphereGeometry(10,96,64);g.scale(-1,1,1);panoMesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:t}));scene.add(panoMesh);if(mesh)mesh.visible=false;
 panorama=true;currentImage=image;yaw=0;pitch=0;panoFov=75;document.body.classList.add('panorama-mode');$('panoramaReadout').hidden=false;$('originalImage').src=image.src;$('originalImage').alt='Full surrounding panorama';$('thumbnail').src=isSample?'./sample.jpg':image.src;$('imageName').textContent=isSample?'Inside Seurat’s park':name;$('imageCredit').textContent=isSample?'AI interpretation · imagined surroundings':'Your panorama · displayed on this device';controlsReady(true);$('viewHint').textContent='Drag to look around · scroll to zoom';$('sceneInfo').textContent='360° panorama · one fixed viewpoint';showMode(true);status('You’re inside. Turn around to see the imagined surroundings.');
 }catch(e){status(e.message||'Unable to open this panorama.',true)}finally{loading(false);setBusy(false)}
}
$('panoSampleButton').onclick=()=>openPanorama('./sample-panorama.png',true);
$('panoInput').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(file.size>30*1024*1024){status('Choose a panorama smaller than 30 MB.',true);e.target.value='';return;}const url=URL.createObjectURL(file);try{await openPanorama(url,false,file.name)}finally{URL.revokeObjectURL(url);e.target.value=''}};
