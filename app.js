const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const splash=$('#splash'),app=$('#app'),home=$('#home'),trainer=$('#trainer'),result=$('#result');
setTimeout(()=>{splash.classList.add('out');app.classList.remove('hidden')},1700);

let toastTimer;function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),1700)}
$$('[data-toast]').forEach(b=>b.onclick=()=>toast(b.dataset.toast));

const jokes=['Спокойно. Это была не ошибка. Это была разведка местности.','Соседняя струна тоже хорошая. Но сегодня не её очередь.','Не торопись. Быстро и криво — это отдельный музыкальный жанр.','Чисто! Даже метроном почувствовал себя лишним.','Пальцы просто проводят внутреннее совещание.'];
function openMaestro(){ $('#maestroText').textContent=jokes[Math.floor(Math.random()*jokes.length)];$('#maestroModal').classList.remove('off') }
$$('[data-maestro]').forEach(b=>b.onclick=openMaestro);$('#maestroClose').onclick=()=>$('#maestroModal').classList.add('off');$('#maestroNext').onclick=openMaestro;

$('#start').onclick=()=>{home.classList.add('off');trainer.classList.remove('off');reset();render()};
$('#back').onclick=()=>{running=false;trainer.classList.add('off');home.classList.remove('off')};

const stage=$('#stage'),strings=$('#strings'),frets=$('#frets'),notesLayer=$('#notes'),count=$('#count'),controls=$('#controls');
const thickness=[1,1.4,1.9,2.6,3.4,4.3];
for(let i=0;i<6;i++){const s=document.createElement('div');s.className='string';s.style.top=(i*20)+'%';s.style.height=thickness[i]+'px';strings.appendChild(s)}
for(let i=1;i<13;i++){const f=document.createElement('div');f.className='fret';f.style.left=(i/13*100)+'%';frets.appendChild(f)}

const melody=[[0,0,1],[1,1,1],[2,0,1],[3,2,1],[4,3,1],[0,0,1],[2,0,1],[3,2,1],[4,3,2]];
let notes=[],beat=0;melody.forEach(([si,fret,dur])=>{const el=document.createElement('div');el.className='note';el.textContent=fret;notesLayer.appendChild(el);notes.push({si,fret,dur,beat,el,hit:false});beat+=dur});
let audioCtx,running=false,songBeat=-4,last=performance.now(),lastTrig=-99,speed=.75,overlayTimer;
const freqs=[329.63,246.94,196,146.83,110,82.41];
function audio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}
function pluck(si,f){audio();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),fl=audioCtx.createBiquadFilter();o.type='triangle';o.frequency.value=freqs[si]*Math.pow(2,f/12);fl.type='lowpass';fl.frequency.value=1800;g.gain.setValueAtTime(.18,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.55);o.connect(fl).connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.58)}
function x(b){return stage.clientWidth*.18+(b-songBeat)*Math.max(100,stage.clientWidth*.12)}
function render(){const top=stage.clientHeight*.1,usable=stage.clientHeight*.8;notes.forEach(n=>{const xx=x(n.beat);n.el.style.left=xx+'px';n.el.style.top=(top+n.si*(usable/5))+'px';n.el.style.display=(xx>-60&&xx<stage.clientWidth+60)?'grid':'none'});$('#progress').value=Math.max(0,Math.min(100,(songBeat/beat)*100))}
function trigger(){const c=Math.floor(songBeat+.03);if(c!==lastTrig){lastTrig=c;notes.forEach(n=>{if(Math.floor(n.beat)===c&&!n.hit){n.hit=true;n.el.classList.add('hit');pluck(n.si,n.fret);setTimeout(()=>n.el.classList.remove('hit'),220)}})}count.textContent=songBeat<0?Math.ceil(-songBeat):''}
function loop(ts){const dt=(ts-last)/1000;last=ts;if(running){songBeat+=dt*(70/60)*speed;trigger();if(songBeat>beat+1){running=false;showResult()}}render();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
function reset(){songBeat=-4;lastTrig=-99;notes.forEach(n=>n.hit=false);$('#play').innerHTML='▶<small>Старт</small>';render()}
$('#play').onclick=()=>{audio();running=!running;$('#play').innerHTML=running?'Ⅱ<small>Пауза</small>':'▶<small>Старт</small>'};
$('#restart').onclick=reset;$('#rew').onclick=()=>songBeat=Math.max(-4,songBeat-5*(70/60)*speed);$('#fwd').onclick=()=>songBeat=Math.min(beat,songBeat+5*(70/60)*speed);$('#loop').onclick=()=>toast('Повтор включён — Маэстро доволен');
$$('[data-speed]').forEach(b=>b.onclick=()=>{$$('[data-speed]').forEach(x=>x.classList.remove('active'));b.classList.add('active');speed=+b.dataset.speed;toast('Скорость '+b.textContent)});
$('#progress').oninput=e=>{songBeat=(+e.target.value/100)*beat;lastTrig=Math.floor(songBeat)-1};
function showControls(){controls.classList.remove('hide');clearTimeout(overlayTimer);overlayTimer=setTimeout(()=>controls.classList.add('hide'),3500)}stage.onclick=showControls;showControls();
function showResult(){trainer.classList.add('off');result.classList.remove('off');$('#avgSpeed').textContent=Math.round(70*speed)+' BPM'}
$('#finishBtn').onclick=showResult;$('#again').onclick=()=>{result.classList.add('off');trainer.classList.remove('off');reset()};$('#homeBtn').onclick=()=>{result.classList.add('off');home.classList.remove('off')};

let stream;$('#cameraBtn').onclick=async()=>{try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});$('#camera').srcObject=stream;$('#cameraModal').classList.remove('off')}catch(e){toast('Камера недоступна или не разрешена')}};$('#cameraClose').onclick=()=>{$('#cameraModal').classList.add('off');if(stream)stream.getTracks().forEach(t=>t.stop())};

if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
