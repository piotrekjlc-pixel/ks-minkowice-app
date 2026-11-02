const rooms=['Wszystkie','Salon','Kuchnia','Sypialnia','Ogród'];let selected='Wszystkie',realDevices=[],isAuthenticated=false;
const a=[['Światło główne','Salon',1],['Lampa stojąca','Salon',0],['Oświetlenie kuchenne','Kuchnia',1],['Gniazdko TV','Salon',1],['Światło sufitowe','Sypialnia',0],['Lampki ogrodowe','Ogród',1]].map(([name,room,on],id)=>({id,name,room,on:!!on,kind:name.includes('Gniazdko')?'plug':'light'}));
const e=id=>document.getElementById(id),say=t=>e('msg').textContent=t;
const ROOM_OPTIONS=['Bez pomieszczenia','Salon','Kuchnia','Sypialnia','Pokój Laury','Łazienka','Przedpokój','Ogród','Taras','Garaż','Inne'];
let devicePrefs={};try{devicePrefs=JSON.parse(localStorage.getItem('domio_device_prefs_v1')||'{}')||{}}catch{devicePrefs={}}
let activeRoom='Wszystkie';
function displayName(d){return (devicePrefs[d.id]&&devicePrefs[d.id].name)||d.name}
function deviceRoom(d){return (devicePrefs[d.id]&&devicePrefs[d.id].room)||'Bez pomieszczenia'}
function applyPrefs(){for(const d of realDevices){d.tuyaName=d.name;d.name=displayName(d)}}
function savePrefs(){localStorage.setItem('domio_device_prefs_v1',JSON.stringify(devicePrefs))}
function editDevice(d){const current=devicePrefs[d.id]||{};const newName=prompt('Nazwa urządzenia w Domio:',current.name||d.tuyaName||d.name);if(newName===null)return;const clean=newName.trim();if(clean.length>55)return say('Nazwa może mieć maksymalnie 55 znaków.');const room=prompt('Pomieszczenie (wybierz z listy):\n'+ROOM_OPTIONS.join(', '),current.room||'Bez pomieszczenia');if(room===null)return;const found=ROOM_OPTIONS.find(x=>x.toLocaleLowerCase('pl')===room.trim().toLocaleLowerCase('pl'));if(!found)return say('Wpisz jedną z podanych nazw pomieszczeń.');devicePrefs[d.id]={name:clean||d.tuyaName||d.name,room:found};savePrefs();d.name=displayName({...d,name:d.tuyaName});renderReal();say('Zapisano: '+d.name+' · '+found)}

const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function renderDemo(){e('lights').textContent=a.filter(x=>x.kind==='light'&&x.on).length;e('rooms').innerHTML=rooms.map(r=>'<button class="room '+(r===selected?'active':'')+'" data-room="'+escapeHtml(r)+'">'+escapeHtml(r)+'</button>').join('');e('devices').innerHTML=a.filter(x=>selected==='Wszystkie'||selected===x.room).map(x=>'<div class="device"><div class="head"><span class="icon">'+(x.kind==='light'?'💡':'🔌')+'</span><button class="toggle '+(x.on?'on':'')+'" data-id="'+x.id+'">'+(x.on?'Włączone':'Wyłączone')+'</button></div><div><b>'+escapeHtml(x.name)+'</b><small>'+escapeHtml(x.room)+' • demo</small></div></div>').join('');document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>{selected=b.dataset.room;renderDemo()});document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{a[+b.dataset.id].on=!a[+b.dataset.id].on;renderDemo();say('Zmieniono stan testowy: '+a[+b.dataset.id].name)})}
function scene(s){if(s==='night'||s==='out')a.forEach(x=>x.on=false);if(s==='home')a.forEach(x=>{if(x.kind==='light')x.on=true});if(s==='movie')a.forEach(x=>{if(x.kind==='light')x.on=x.name==='Lampa stojąca'});renderDemo();say('Wykonano tylko scenę testową')}
async function api(endpoint,options={}){const response=await fetch(endpoint,{credentials:'same-origin',...options});const data=await response.json();if(!response.ok)throw Error(data.error||'Błąd serwera');return data}
function supportedSwitch(d){return (d.status||[]).find(x=>['switch_led','switch_led_1','switch','switch_1','switch_2','switch_3','switch_4','switch_5','switch_6','switch_7','switch_8'].includes(x.code)&&typeof x.value==='boolean')}
async function syncDevices(){try{say('Pobieram urządzenia Smart Life…');const data=await api('/api/devices');realDevices=data.devices||[];applyPrefs();e('realCount').textContent='· '+realDevices.length;renderReal();say('Pobrano '+realDevices.length+' urządzeń z Smart Life.')}catch(err){say('Odczyt urządzeń: '+err.message);if(err.message==='Authentication required')showLoggedOut()}}
function renderReal(){const target=e('realDevices');target.replaceChildren();const chooser=e('realRooms');if(chooser){const available=['Wszystkie',...new Set(realDevices.map(deviceRoom))];if(!available.includes(activeRoom))activeRoom='Wszystkie';chooser.replaceChildren();for(const room of available){const b=document.createElement('button');b.className='room '+(activeRoom===room?'active':'');b.textContent=room;b.onclick=()=>{activeRoom=room;renderReal()};chooser.appendChild(b)}}for(const d of realDevices.filter(x=>activeRoom==='Wszystkie'||deviceRoom(x)===activeRoom)){const sw=supportedSwitch(d),card=document.createElement('div');card.className='device';const top=document.createElement('div');top.className='head';const ico=document.createElement('span');ico.className='icon';ico.textContent=sw?'💡':(d.category==='cz'?'🔌':'🏠');top.appendChild(ico);const state=document.createElement('span');state.className='muted';state.textContent=d.online?'● Online':'○ Offline';top.appendChild(state);const bottom=document.createElement('div');const name=document.createElement('b');name.textContent=d.name;bottom.appendChild(name);const desc=document.createElement('small');desc.textContent=d.product_name||d.category||'Smart Life';bottom.appendChild(desc);const roomLabel=document.createElement('small');roomLabel.style.display='block';roomLabel.textContent='📍 '+deviceRoom(d);bottom.appendChild(roomLabel);const edit=document.createElement('button');edit.className='room';edit.style.cssText='margin-top:8px;padding:7px 10px;font-size:12px';edit.textContent='✎ Zmień nazwę / pokój';edit.onclick=()=>editDevice(d);bottom.appendChild(edit);
const advanced=document.createElement('button');advanced.className='room';advanced.textContent='🎨 Jasność / kolory';advanced.style.cssText='margin:8px 0 0 6px;padding:7px 10px;font-size:12px';advanced.onclick=()=>openLightControls(d,card,advanced);bottom.appendChild(advanced);if(sw){const btn=document.createElement('button');btn.className='toggle '+(sw.value?'on':'');btn.style.marginTop='9px';btn.disabled=!d.online;btn.textContent=sw.value?'Wyłącz':'Włącz';btn.onclick=()=>toggleDevice(d.id,sw.code,!sw.value,btn);bottom.appendChild(document.createElement('br'));bottom.appendChild(btn)}else{const hint=document.createElement('small');hint.style.display='block';hint.textContent='Podgląd — brak obsługi przełącznika';bottom.appendChild(hint)}card.append(top,bottom);target.appendChild(card)}}
async function openLightControls(d,card,trigger){
 const existing=document.querySelector('.lightOverlay');if(existing){existing.remove();return}
 trigger.disabled=true;say('Sprawdzam możliwości urządzenia '+d.name+'…');
 try{
  const result=await api('/api/device-functions?id='+encodeURIComponent(d.id));
  const fn=Array.isArray(result.functions)?result.functions:(result.functions?.functions||[]);
  const filtered=fn.filter(x=>['bright_value','bright_value_v2','temp_value','temp_value_v2','work_mode','colour_data','colour_data_v2','scene_data','scene_data_v2'].includes(x.code));
  const overlay=document.createElement('div');overlay.className='lightOverlay';overlay.style.cssText='position:fixed;inset:0;z-index:1000;background:#090f20;overflow:auto;padding:calc(24px + env(safe-area-inset-top)) 18px calc(50px + env(safe-area-inset-bottom));color:white';const close=document.createElement('button');close.textContent='✕ Zamknij';close.className='room';close.style.cssText='float:right;position:sticky;top:0;z-index:3';close.onclick=()=>overlay.remove();overlay.appendChild(close);const titleHead=document.createElement('h2');titleHead.textContent=d.name;overlay.appendChild(titleHead);const preview=document.createElement('div');preview.style.cssText='height:160px;border:1px solid #405680;border-radius:24px;margin:18px 0;background:linear-gradient(105deg,#8b3dec,#325ffb,#f5c95e,#d84cc7);box-shadow:0 0 35px #577ffb33';overlay.appendChild(preview);const info=document.createElement('p');info.className='muted';info.textContent='Podgląd poglądowy. Dostępne funkcje zależą od sterownika Tuya.';overlay.appendChild(info);const panel=document.createElement('div');panel.className='lightControls';panel.style.cssText='border-top:1px solid #405474;margin-top:12px;padding-top:10px;display:grid;gap:10px';
  if(!filtered.length){panel.textContent='Sterownik nie udostępnia dodatkowych funkcji przez Tuya Cloud. Kolory segmentowe i animacje ze Smart Life mogą być niedostępne.'}
  for(const functionInfo of filtered){
   let schema={};try{schema=typeof functionInfo.values==='string'?JSON.parse(functionInfo.values):functionInfo.values||{}}catch{}
   const row=document.createElement('div');
   const title=document.createElement('small');title.style.display='block';
   title.textContent=({bright_value:'Jasność',bright_value_v2:'Jasność',temp_value:'Barwa bieli',temp_value_v2:'Barwa bieli',work_mode:'Tryb',colour_data:'Kolor światła',colour_data_v2:'Kolor światła',scene_data:'Sceny urządzenia',scene_data_v2:'Sceny urządzenia'})[functionInfo.code];row.appendChild(title);
   if((functionInfo.type==='Integer'||functionInfo.type==='Value')&&Number.isFinite(schema.min)&&Number.isFinite(schema.max)){
     const slider=document.createElement('input');slider.type='range';slider.min=schema.min;slider.max=schema.max;slider.step=Number.isFinite(schema.step)&&schema.step>0?schema.step:1;const status=(d.status||[]).find(x=>x.code===functionInfo.code);slider.value=typeof status?.value==='number'?status.value:schema.min;slider.style.width='100%';const label=document.createElement('small');label.textContent=slider.value;
     slider.oninput=()=>label.textContent=slider.value;
     slider.onchange=async()=>{slider.disabled=true;try{await lightCommand(d,functionInfo.code,Number(slider.value));say('Zapisano ustawienie '+d.name)}catch(err){say('Błąd: '+err.message)}finally{slider.disabled=false}};
     row.append(slider,label);
   }else if(functionInfo.type==='Enum'&&Array.isArray(schema.range)){
     const select=document.createElement('select');select.className='room';select.style.width='100%';
     for(const value of schema.range){const opt=document.createElement('option');opt.value=value;opt.textContent=value;select.appendChild(opt)}
     select.value=(d.status||[]).find(x=>x.code===functionInfo.code)?.value||schema.range[0];
     select.onchange=async()=>{select.disabled=true;try{await lightCommand(d,functionInfo.code,select.value);say('Tryb zmieniony')}catch(err){say('Błąd: '+err.message)}finally{select.disabled=false}};
     row.appendChild(select);
   }else if(['colour_data','colour_data_v2'].includes(functionInfo.code)&&functionInfo.type==='String'){
     const color=document.createElement('input');color.type='color';color.value='#ff9933';color.style.cssText='height:44px;width:100%;padding:3px';
     const btn=document.createElement('button');btn.className='room';btn.textContent='Ustaw kolor';btn.onclick=async()=>{const hex=color.value;const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);const max=Math.max(...rgb),min=Math.min(...rgb),delta=max-min;let h=0;if(delta){if(max===rgb[0])h=((rgb[1]-rgb[2])/delta)%6;else if(max===rgb[1])h=(rgb[2]-rgb[0])/delta+2;else h=(rgb[0]-rgb[1])/delta+4;h=(h*60+360)%360}const v=Math.round(max*1000),sat=Math.round((max?delta/max:0)*1000);btn.disabled=true;try{await lightCommand(d,functionInfo.code,JSON.stringify({h:Math.round(h),s:sat,v}));say('Wysłano kolor do '+d.name)}catch(err){say('Nie udało się ustawić koloru: '+err.message)}finally{btn.disabled=false}};row.append(color,btn);
   }else{continue}
   panel.appendChild(row);
  }
  overlay.appendChild(panel);document.body.appendChild(overlay);say('Funkcje urządzenia: '+filtered.length);
 }catch(err){say('Nie mogę pobrać funkcji: '+err.message)}
 finally{trigger.disabled=false}
}
async function lightCommand(d,code,value){return api('/api/light-control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:d.id,code,value})})}
async function toggleDevice(id,code,value,btn){if(!isAuthenticated)return;btn.disabled=true;const d=realDevices.find(x=>x.id===id);say('Wysyłam polecenie do '+(d?.name||'urządzenia')+'…');try{await api('/api/toggle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,code,value})});say('Polecenie wysłane. Odświeżam stan…');await new Promise(r=>setTimeout(r,750));await syncDevices()}catch(err){say('Nie udało się wykonać polecenia: '+err.message);btn.disabled=false}}
function showLoggedIn(){isAuthenticated=true;e('connectPanel').classList.add('hidden');e('realPanel').classList.remove('hidden');e('home').querySelector('.stats').classList.add('hidden');e('demoTitle').classList.add('hidden');e('rooms').classList.add('hidden');e('devices').classList.add('hidden');e('home').querySelector('.scenes').classList.add('hidden');e('home').querySelectorAll('h2').forEach(h=>{if(h.textContent==='Pomieszczenia'||h.textContent==='Urządzenia'||h.textContent==='Sceny')h.classList.add('hidden')});e('demoBanner').classList.add('hidden');e('linkState').textContent='połączone';syncDevices()}
function showLoggedOut(){isAuthenticated=false;realDevices=[];e('connectPanel').classList.remove('hidden');e('realPanel').classList.add('hidden');e('demoBanner').classList.remove('hidden');e('linkState').textContent='wymaga zalogowania'}
e('login').onclick=async()=>{const pin=e('secret').value.trim();if(!/^[0-9]{8}$/.test(pin)){e('loginMsg').textContent='Wpisz 8 cyfr PIN-u Domio';return}e('login').disabled=true;try{await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});e('secret').value='';showLoggedIn()}catch(err){e('loginMsg').textContent=err.message}finally{e('login').disabled=false}};
e('logout').onclick=async()=>{try{await api('/api/logout',{method:'POST'})}catch{}showLoggedOut()};
function normalizeName(v){return String(v||'').toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function aliases(d){const raw=normalizeName(d.name),set=new Set([raw]);if(raw.endsWith(' lights'))set.add(raw.replace(/ lights$/,' swiatla'));if(raw.includes('swiatelka'))set.add(raw.replace('swiatelka','lampki'));if(raw.includes('wall lights')){set.add('swiatla scienne');set.add('lampy scienne')}return [...set].filter(x=>x.length>2)}
function resolveTargets(t){const c=normalizeName(t),available=realDevices.filter(d=>d.online&&supportedSwitch(d));const byName=available.filter(d=>aliases(d).some(name=>c.includes(name)));if(byName.length===1)return byName;if(byName.length>1)return [];return []}
let pendingVoice=null;
function speakFeedback(t){say(t);try{if(window.speechSynthesis&&window.SpeechSynthesisUtterance){const utterance=new SpeechSynthesisUtterance(t);utterance.lang='pl-PL';utterance.rate=1.04;window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance)}}catch{}}
async function command(input){
 const raw=String(input||'').trim(),t=normalizeName(raw);
 if(!t)return say('Wpisz lub wypowiedz polecenie.');
 if(!isAuthenticated)return say('Najpierw zaloguj się do Domio.');
 if(/spotify|nest mini|muzyk/.test(t))return say('Sterowanie muzyką na Nest Mini nie jest jeszcze dostępne.');
 if(pendingVoice){
   const pending=pendingVoice;pendingVoice=null;
   if(/^(tak|potwierdzam|wykonaj)$/.test(t)){say('Wykonuję '+pending.items.length+' poleceń…');let ok=0;for(const d of pending.items){try{const sw=supportedSwitch(d);if(sw){await api('/api/toggle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:d.id,code:sw.code,value:pending.value})});ok++}}catch{}}await syncDevices();return speakFeedback('Wykonano '+ok+' z '+pending.items.length+' poleceń.')}
   if(/^(nie|anuluj|stop)$/.test(t))return speakFeedback('Anulowano.');
 }
 const off=/\\b(wylacz|zgas|zgasnij|zgasic|wylaczcie)\\b/.test(t),on=/\\b(wlacz|zapal|zaswiec|zaswiecic)\\b/.test(t);
 if(on===off)return say('Powiedz na przykład: Włącz Wall lights.');
 const matching=resolveTargets(raw);
 if(matching.length===1){const d=matching[0],sw=supportedSwitch(d);if(sw.value===on)return speakFeedback(d.name+' już jest '+(on?'włączone.':'wyłączone.'));try{await api('/api/toggle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:d.id,code:sw.code,value:on})});await syncDevices();return speakFeedback(on?'Włączono '+d.name+'.':'Wyłączono '+d.name+'.')}catch{return say('Nie udało się sterować: '+d.name)}}
 if(/\\b(wszystkie|wszystko|cale|caly)\\b/.test(t)&&/swiatl|lamp/.test(t)){
   const targets=realDevices.filter(d=>d.online&&supportedSwitch(d)&&(/swiat|light|lamp|led|bulb|gwiazd|stars|choink|tree/.test(normalizeName(d.name))||/dj|dd|light/.test(d.category||'')));
   if(!targets.length)return say('Nie znalazłem kompatybilnych świateł online.');
   pendingVoice={items:targets,value:on};
   return speakFeedback('Znaleziono '+targets.length+' świateł. Powiedz „potwierdzam”, aby '+(on?'włączyć':'wyłączyć')+' wszystkie, lub „anuluj”.');
 }
 return say('Nie rozpoznałem jednoznacznie urządzenia. Wypowiedz dokładną nazwę z listy, np. „Włącz Wall lights”.');
}

document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>scene(b.dataset.scene));
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b));['home','music','settings'].forEach(v=>e(v).classList.toggle('hidden',v!==b.dataset.view))});
e('send').onclick=()=>{command(e('input').value);e('input').value=''};e('input').addEventListener('keydown',ev=>{if(ev.key==='Enter')e('send').click()});
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(SR){const sr=new SR();sr.lang='pl-PL';sr.onresult=ev=>{const t=ev.results[0][0].transcript;e('input').value=t;command(t)};sr.onerror=ev=>say('Mikrofon: '+ev.error+'. Możesz wpisać polecenie poniżej.');e('mic').onclick=()=>{try{sr.start();say('Słucham po polsku…')}catch{say('Mikrofon jest już aktywny')}}}else e('mic').onclick=()=>say('Rozpoznawanie głosu niedostępne w tej przeglądarce');
renderDemo();api('/api/status').then(x=>{e('health').textContent='działa';if(x.connected)showLoggedIn();else showLoggedOut()}).catch(()=>{e('health').textContent='niedostępny';showLoggedOut()});
