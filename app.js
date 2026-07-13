const splash=document.getElementById('splash');
const app=document.getElementById('app');
const home=document.getElementById('homeScreen');
const trainer=document.getElementById('trainerScreen');
const modal=document.getElementById('maestroModal');
const maestroText=document.getElementById('maestroText');
const toast=document.getElementById('toast');

const jokes=[
  'Спокойно. Это была не ошибка. Это была разведка местности.',
  'Соседняя струна тоже хорошая. Но сегодня не её очередь.',
  'Гитара немного удивилась. Давай покажем ей, что всё под контролем.',
  'Не торопись. Быстро и криво — это уже отдельный музыкальный жанр.',
  'Чисто! Даже метроном на секунду почувствовал себя лишним.',
  'Ещё одна попытка. Пальцы просто проводят внутреннее совещание.',
  'Если бы гитары умели улыбаться, твоя сейчас бы улыбалась.',
  'Ну наконец-то. Я уже начал думать, что ты ушёл играть на барабанах.'
];

let toastTimer;
function showToast(text){
  toast.textContent=text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'),1800);
}

window.addEventListener('load',()=>{
  setTimeout(()=>{
    splash.classList.add('out');
    app.classList.remove('hidden');
  },1900);
});

document.querySelectorAll('[data-toast]').forEach(btn=>{
  btn.addEventListener('click',()=>showToast(btn.dataset.toast));
});

function openMaestro(){
  maestroText.textContent=jokes[Math.floor(Math.random()*jokes.length)];
  modal.classList.remove('hidden-screen');
}
document.getElementById('openMaestro').onclick=openMaestro;
document.getElementById('trainerMaestro').onclick=openMaestro;
document.getElementById('nextMaestro').onclick=openMaestro;
document.getElementById('closeMaestro').onclick=()=>modal.classList.add('hidden-screen');

document.getElementById('startLesson').onclick=()=>{
  home.classList.add('hidden-screen');
  trainer.classList.remove('hidden-screen');
  render();
};
document.getElementById('backHome').onclick=()=>{
  running=false;
  trainer.classList.add('hidden-screen');
  home.classList.remove('hidden-screen');
};

const stage=document.getElementById('tabStage');
const strings=document.getElementById('strings');
const status=document.getElementById('status');
const countdown=document.getElementById('countdown');
const tempo=document.getElementById('tempo');
const tempoValue=document.getElementById('tempoValue');

for(let i=0;i<6;i++){
  const line=document.createElement('div');
  line.className='string';
  line.style.top=`${i*20}%`;
  strings.appendChild(line);
}

const melody=[
  [0,0,1],[0,2,1],[0,4,1],[0,5,1],[0,7,2],
  [0,5,1],[0,4,1],[0,2,1],[0,0,2]
];
const openFreq=[329.63,246.94,196,146.83,110,82.41];

let notes=[];
let totalBeat=0;
melody.forEach(([stringIndex,fret,duration])=>{
  const el=document.createElement('div');
  el.className='note';
  el.textContent=fret;
  stage.appendChild(el);
  notes.push({stringIndex,fret,duration,beat:totalBeat,el,hit:false});
  totalBeat+=duration;
});

let audioCtx=null;
let running=false;
let songBeat=-4;
let lastFrame=performance.now();
let lastTriggered=-999;

function ensureAudio(){
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended') audioCtx.resume();
}

function pluck(stringIndex,fret){
  ensureAudio();
  const osc=audioCtx.createOscillator();
  const gain=audioCtx.createGain();
  const filter=audioCtx.createBiquadFilter();
  osc.type='triangle';
  osc.frequency.value=openFreq[stringIndex]*Math.pow(2,fret/12);
  filter.type='lowpass';
  filter.frequency.value=1700;
  gain.gain.setValueAtTime(.18,audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.55);
  osc.connect(filter).connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime+.58);
}

function beatToX(beat){
  return stage.clientWidth*.22+(beat-songBeat)*Math.max(90,stage.clientWidth*.13);
}

function render(){
  const usable=stage.clientHeight-50;
  notes.forEach(note=>{
    const x=beatToX(note.beat);
    note.el.style.left=x+'px';
    note.el.style.top=(25+note.stringIndex*(usable/5))+'px';
    note.el.style.display=(x>-60&&x<stage.clientWidth+60)?'grid':'none';
  });
}

function trigger(){
  const current=Math.floor(songBeat+.03);
  if(current!==lastTriggered){
    lastTriggered=current;
    notes.forEach(note=>{
      if(Math.floor(note.beat)===current&&!note.hit){
        note.hit=true;
        note.el.classList.add('hit');
        pluck(note.stringIndex,note.fret);
        const praise=[
          'Вот это уже музыка!',
          'Чисто. Маэстро одобряет.',
          'Соседи пока не жалуются — продолжаем.',
          'Красиво. Даже гитара немного удивилась.'
        ];
        status.textContent=praise[Math.floor(Math.random()*praise.length)];
        setTimeout(()=>note.el.classList.remove('hit'),230);
      }
    });
  }
  countdown.textContent=songBeat<0?Math.ceil(-songBeat):'';
}

function loop(timestamp){
  const dt=(timestamp-lastFrame)/1000;
  lastFrame=timestamp;
  if(running){
    songBeat+=dt*(Number(tempo.value)/60);
    trigger();
    if(songBeat>totalBeat+1){
      running=false;
      status.textContent='Урок пройден. Гитара выжила. Ты тоже молодец.';
    }
  }
  render();
  requestAnimationFrame(loop);
}

document.getElementById('playBtn').onclick=()=>{
  ensureAudio();
  running=true;
  lastFrame=performance.now();
  status.textContent='Поехали. Красная линия — твой новый начальник.';
};
document.getElementById('pauseBtn').onclick=()=>{
  running=false;
  status.textContent='Пауза. Пальцы проводят техническое обслуживание.';
};
document.getElementById('restartBtn').onclick=()=>{
  songBeat=-4;
  lastTriggered=-999;
  notes.forEach(note=>note.hit=false);
  status.textContent='С начала. Теперь гитара знает, с кем связалась.';
  render();
};
tempo.oninput=()=>{
  tempoValue.textContent=tempo.value+' BPM';
};

window.addEventListener('resize',render);
render();
requestAnimationFrame(loop);

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
