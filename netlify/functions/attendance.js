
const {cfg,json,store,authPlayer,authAdmin,upcomingTrainings}=require("./_common");
exports.handler=async(event)=>{
  if(event.httpMethod==="OPTIONS") return json(200,{ok:true});
  const s=store();
  if(event.httpMethod==="POST"){
    let b={}; try{b=JSON.parse(event.body||"{}")}catch(e){return json(400,{error:"Bad JSON"})}
    const {player,pin,eventId,status}=b;
    if(!authPlayer(player,pin)) return json(401,{error:"Nieprawidłowy PIN"});
    if(!["yes","no"].includes(status)) return json(400,{error:"Błędny status"});
    const valid=upcomingTrainings(8).some(t=>t.id===eventId);
    if(!valid) return json(400,{error:"Nieprawidłowy lub nieaktualny trening"});
    const key=`${eventId}/${encodeURIComponent(player)}`;
    await s.setJSON(key,{player,status,updatedAt:new Date().toISOString()});
    return json(200,{ok:true});
  }
  if(event.httpMethod==="GET"){
    const q=event.queryStringParameters||{};
    if(!authAdmin(q.adminPin)) return json(401,{error:"Nieprawidłowy PIN trenera"});
    const eventId=q.eventId;
    if(!eventId) return json(400,{error:"Brak eventId"});
    const listed=await s.list({prefix:`${eventId}/`});
    const answers={};
    for(const item of listed.blobs){
      const data=await s.get(item.key,{type:"json",consistency:"strong"});
      if(data&&data.player) answers[data.player]=data;
    }
    const rows=cfg.players.map(player=>({player,status:answers[player]?.status||"none",updatedAt:answers[player]?.updatedAt||null}));
    return json(200,{eventId,rows});
  }
  return json(405,{error:"Method not allowed"});
};
