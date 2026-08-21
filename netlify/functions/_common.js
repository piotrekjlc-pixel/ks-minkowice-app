
const { getStore } = require("@netlify/blobs");
const cfg = require("./config.json");

function json(statusCode, body) {
  return { statusCode, headers: {
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"Content-Type, X-Admin-Pin",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS"
  }, body: JSON.stringify(body) };
}
function store(){ return getStore("ks-minkowice-attendance"); }
function authPlayer(name,pin){ return cfg.pins[name] && cfg.pins[name] === String(pin||""); }
function authAdmin(pin){ return String(pin||"") === String(cfg.adminPin); }
function warsawDateParts(date=new Date()){
  const f = new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Warsaw",year:"numeric",month:"2-digit",day:"2-digit",weekday:"short"});
  const p = Object.fromEntries(f.formatToParts(date).filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
  return p;
}
function ymdPlus(days){
  const now = new Date();
  const d = new Date(now.getTime()+days*86400000);
  const p = warsawDateParts(d);
  return `${p.year}-${p.month}-${p.day}`;
}
function upcomingTrainings(count=8){
  const out=[];
  for(let i=0;i<30 && out.length<count;i++){
    const d=new Date(Date.now()+i*86400000);
    const p=warsawDateParts(d);
    if(p.weekday==="Tue" || p.weekday==="Thu"){
      const ymd=`${p.year}-${p.month}-${p.day}`;
      const label=p.weekday==="Tue"?"Wtorek":"Czwartek";
      out.push({id:`training-${ymd}`,date:ymd,label,time:"18:30",place:"Minkowice Oławskie"});
    }
  }
  return out;
}
module.exports={cfg,json,store,authPlayer,authAdmin,upcomingTrainings};
