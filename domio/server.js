import http from 'node:http';
import {createHmac,createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const base=path.dirname(fileURLToPath(import.meta.url)),port=process.env.PORT||3000;
const roots={eu:'https://openapi.tuyaeu.com',we:'https://openapi-weaz.tuyaeu.com',us:'https://openapi.tuyaus.com'};
const short=(x)=>String(x||'').slice(0,110);
const safeEqual=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y)};
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj))}
const sha=x=>createHash('sha256').update(x).digest('hex');
const sig=(x)=>createHmac('sha256',process.env.DOMIO_ADMIN_TOKEN||'not-configured').update(x).digest('hex');
let tokenCache={token:'',expires:0},deviceCache={devices:[],expires:0};
function headers(id,secret,method,url,token='',body=''){
 const t=String(Date.now()),nonce=randomBytes(16).toString('hex'),hash=sha(body);
 const stringToSign=method+'\n'+hash+'\n\n'+url;
 const signed=id+token+t+nonce+stringToSign;
 return {client_id:id,t,nonce,sign_method:'HMAC-SHA256',sign:createHmac('sha256',secret).update(signed).digest('hex').toUpperCase(),...(token?{access_token:token}:{})};
}
async function callApi(method,url,body='',token=''){
 const id=process.env.TUYA_CLIENT_ID,secret=process.env.TUYA_CLIENT_SECRET,root=roots[process.env.TUYA_REGION||'eu'];
 if(!id||!secret||!root)throw Error('not_configured');
 const response=await fetch(root+url,{method,headers:{...headers(id,secret,method,url,token,body),...(body?{'Content-Type':'application/json'}:{})},...(body?{body}:{}),signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('HTTP_'+response.status);
 const data=await response.json();
 if(!data.success)throw Error('tuya_'+short(data.code)+'_'+short(data.msg));
 return data.result;
}
async function accessToken(){if(tokenCache.expires>Date.now()+60000)return tokenCache.token;const t=await callApi('GET','/v1.0/token?grant_type=1');if(!t?.access_token)throw Error('no_access_token');tokenCache={token:t.access_token,expires:Date.now()+Math.min((t.expire_time||7200)*1000,3600000)};return t.access_token}
async function devices(force=false){
 if(!force&&deviceCache.expires>Date.now())return deviceCache.devices;
 const token=await accessToken(),seed=process.env.TUYA_SEED_DEVICE_ID;if(!seed)throw Error('seed_missing');
 const source=await callApi('GET','/v1.0/devices/'+encodeURIComponent(seed),'',token);
 if(!source?.uid)throw Error('user_uid_missing');
 const list=await callApi('GET','/v1.0/users/'+encodeURIComponent(source.uid)+'/devices?page_no=1&page_size=100','',token);
 const arr=Array.isArray(list)?list:(list?.devices||list?.list||[]);
 if(!Array.isArray(arr))throw Error('unexpected_devices_format');
 deviceCache={devices:arr,expires:Date.now()+15000};
 return arr;
}
const cookieName='domio_session',maxAge=86400;
function sessionValid(req){const raw=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='));if(!raw)return false;let val;try{val=decodeURIComponent(raw.split('=').slice(1).join('='))}catch{return false}const [stamp,nonce,mac]=val.split('.');if(!stamp||!nonce||!mac||!/^[0-9]+$/.test(stamp))return false;const now=Date.now();if(Number(stamp)<now||Number(stamp)>now+maxAge*1000)return false;return safeEqual(mac,sig(stamp+'.'+nonce))}
const attempts=new Map();
function canAttempt(req){const key=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].slice(0,70);let record=attempts.get(key)||{count:0,until:0};if(Date.now()>record.until)record={count:0,until:Date.now()+15*60*1000};record.count++;attempts.set(key,record);if(attempts.size>5000)attempts.clear();return record.count<=8}
const originOK=req=>{const origin=req.headers.origin;return !origin||origin===('https://'+req.headers.host)};
async function bodyJSON(req){let bytes='';for await(const part of req){bytes+=part;if(bytes.length>8000)throw Error('too_large')}return JSON.parse(bytes||'{}')}
const serve=async(res,file,type)=>{try{const contents=await readFile(path.join(base,file));res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'"});res.end(contents)}catch{json(res,500,{error:'File unavailable'})}};
http.createServer(async(req,res)=>{
 const p=new URL(req.url,'http://localhost').pathname;
 if(p==='/health')return json(res,200,{ok:true,app:'Domio'});
 if(p==='/api/status')return json(res,200,{configured:Boolean(process.env.TUYA_CLIENT_ID&&process.env.TUYA_CLIENT_SECRET&&process.env.DOMIO_ADMIN_TOKEN),connected:sessionValid(req),mode:'secure'});
 if(p==='/api/login'&&req.method==='POST'){
  if(!originOK(req))return json(res,403,{error:'Origin not allowed'});
  if(!canAttempt(req))return json(res,429,{error:'Too many attempts. Try later.'});
  try{const b=await bodyJSON(req);if(!process.env.TUYA_CLIENT_SECRET||!safeEqual(b.secret,process.env.TUYA_CLIENT_SECRET))return json(res,401,{error:'Incorrect Tuya Access Secret'});
   const expires=Date.now()+maxAge*1000,nonce=randomBytes(16).toString('hex'),mac=sig(expires+'.'+nonce);
   res.setHeader('Set-Cookie',cookieName+'='+encodeURIComponent(expires+'.'+nonce+'.'+mac)+'; Max-Age='+maxAge+'; Path=/; HttpOnly; Secure; SameSite=Strict');
   return json(res,200,{ok:true})
  }catch{return json(res,400,{error:'Invalid request'})}
 }
 if(p==='/api/logout'&&req.method==='POST'){if(!originOK(req))return json(res,403,{error:'Origin not allowed'});res.setHeader('Set-Cookie',cookieName+'=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict');return json(res,200,{ok:true})}
 if(p.startsWith('/api/')){
  if(!sessionValid(req))return json(res,401,{error:'Authentication required'});
  try{
   if(p==='/api/devices'&&req.method==='GET'){
    const a=await devices(true);return json(res,200,{devices:a.map(d=>({id:d.id,name:d.name,online:Boolean(d.online),category:d.category||'',status:Array.isArray(d.status)?d.status:[],product_name:d.product_name||''})),count:a.length});
   }
   if(p==='/api/device-functions'&&req.method==='GET'){
    const id=new URL(req.url,'http://localhost').searchParams.get('id'),arr=await devices();if(!arr.some(d=>d.id===id))return json(res,404,{error:'Device not found'});
    const fn=await callApi('GET','/v1.0/iot-03/devices/'+encodeURIComponent(id)+'/functions','',await accessToken());return json(res,200,{functions:fn});
   }
   if(p==='/api/toggle'&&req.method==='POST'){
    if(!originOK(req))return json(res,403,{error:'Origin not allowed'});
    const b=await bodyJSON(req),arr=await devices(),dev=arr.find(d=>d.id===b.id);
    if(!dev)return json(res,404,{error:'Device not found'});if(!dev.online)return json(res,409,{error:'Device offline'});
    const permitted=new Set(['switch_led','switch_led_1','switch','switch_1','switch_2','switch_3','switch_4','switch_5','switch_6','switch_7','switch_8']);
    const status=Array.isArray(dev.status)?dev.status:[];
    const candidates=status.filter(x=>permitted.has(x.code)&&typeof x.value==='boolean');
    if(!candidates.length)return json(res,422,{error:'Device has no supported on/off function'});
    const requested=String(b.code||candidates[0].code);if(!candidates.some(x=>x.code===requested))return json(res,422,{error:'Unsupported switch'});
    if(typeof b.value!=='boolean')return json(res,400,{error:'Expected boolean value'});
    const payload=JSON.stringify({commands:[{code:requested,value:b.value}]});
    await callApi('POST','/v1.0/iot-03/devices/'+encodeURIComponent(dev.id)+'/commands',payload,await accessToken());
    deviceCache.expires=0;return json(res,200,{ok:true})
   }
   return json(res,404,{error:'Unknown API endpoint'});
  }catch(err){console.log('Domio API failure:',short(err.message));return json(res,502,{error:'Tuya request failed. Check device permissions and API services.'})}
 }
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 if(p==='/app.js')return serve(res,'app.js','text/javascript; charset=utf-8');
 if(p==='/'||p==='/index.html')return serve(res,'index.html','text/html; charset=utf-8');
 return json(res,404,{error:'Not found'});
}).listen(port,'0.0.0.0',async()=>{
 console.log('Domio secure server running');
 try{const a=await devices(true);console.log('Tuya device sync confirmed: '+a.length)}catch(e){console.log('Tuya sync failure: '+short(e.message))}
});
