
const {cfg,json,store,authAdmin,upcomingTrainings}=require("./_common");
exports.handler=async(event)=>{
  if(event.httpMethod==="OPTIONS") return json(200,{ok:true});
  if(event.httpMethod!=="GET") return json(405,{error:"Method not allowed"});
  const trainings=upcomingTrainings(8);
  return json(200,{trainings,matches:cfg.matches,players:cfg.players});
};
