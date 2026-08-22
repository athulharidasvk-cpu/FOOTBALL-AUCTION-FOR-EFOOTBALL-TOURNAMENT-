
const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const path=require("path");
const app=express(), server=http.createServer(app), io=new Server(server);
app.use(express.static(path.join(__dirname,"public")));

const players=[
["Kylian Mbappé","Real Madrid","ST/LW",91,40,"Kylian Mbappe"],
["Vinícius Júnior","Real Madrid","LW",90,35,"Vinicius Junior"],
["Jude Bellingham","Real Madrid","CM",90,35,"Jude Bellingham"],
["Federico Valverde","Real Madrid","CM",88,28,"Federico Valverde"],
["Lamine Yamal","Barcelona","RW",89,30,"Lamine Yamal"],
["Pedri","Barcelona","CM",88,28,"Pedri"],
["Raphinha","Barcelona","RW",88,27,"Raphinha"],
["Robert Lewandowski","Barcelona","ST",89,30,"Robert Lewandowski"],
["Erling Haaland","Manchester City","ST",91,40,"Erling Haaland"],
["Phil Foden","Manchester City","RW/AM",89,32,"Phil Foden"],
["Rodri","Manchester City","DM",91,40,"Rodri"],
["Bernardo Silva","Manchester City","AM",88,28,"Bernardo Silva"],
["Mohamed Salah","Liverpool","RW",89,32,"Mohamed Salah"],
["Virgil van Dijk","Liverpool","CB",89,30,"Virgil van Dijk"],
["Alisson Becker","Liverpool","GK",89,25,"Alisson Becker"],
["Bukayo Saka","Arsenal","RW",88,30,"Bukayo Saka"],
["Martin Ødegaard","Arsenal","AM",89,30,"Martin Odegaard"],
["Declan Rice","Arsenal","DM",87,25,"Declan Rice"],
["William Saliba","Arsenal","CB",87,23,"William Saliba"],
["Harry Kane","Bayern Munich","ST",90,35,"Harry Kane"],
["Jamal Musiala","Bayern Munich","AM",90,35,"Jamal Musiala"],
["Joshua Kimmich","Bayern Munich","DM",88,27,"Joshua Kimmich"],
["Michael Olise","Bayern Munich","RW",86,20,"Michael Olise"],
["Ousmane Dembélé","PSG","RW",88,28,"Ousmane Dembele"],
["Khvicha Kvaratskhelia","PSG","LW",88,30,"Khvicha Kvaratskhelia"],
["Achraf Hakimi","PSG","RB",87,23,"Achraf Hakimi"],
["Marquinhos","PSG","CB",87,22,"Marquinhos"],
["Lautaro Martínez","Inter Milan","ST",89,30,"Lautaro Martinez"],
["Nicolò Barella","Inter Milan","CM",87,23,"Nicolo Barella"],
["Alessandro Bastoni","Inter Milan","CB",87,22,"Alessandro Bastoni"],
["Rafael Leão","AC Milan","LW",88,28,"Rafael Leao"],
["Theo Hernández","AC Milan","LB",87,23,"Theo Hernandez"],
["Mike Maignan","AC Milan","GK",87,22,"Mike Maignan"],
["Christian Pulisic","AC Milan","RW",86,20,"Christian Pulisic"],
["Dušan Vlahović","Juventus","ST",84,18,"Dusan Vlahovic"],
["Kenan Yıldız","Juventus","AM/LW",82,12,"Kenan Yildiz"],
["Nico Williams","Athletic Club","LW",86,22,"Nico Williams"],
["Antoine Griezmann","Atlético Madrid","AM/ST",88,25,"Antoine Griezmann"]
];

const rooms=new Map();
const makeCode=()=>{let c; do{c=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(c)); return c};
function pub(r){return {code:r.code,started:r.started,host:r.host,players:r.players.map(({id,name,budget,squad})=>({id,name,budget,squad:squad.length})),current:r.current,history:r.history.slice(0,30),poolLeft:r.pool.length};}
function broadcast(r){io.to(r.code).emit("state",pub(r));}
function next(r){
 if(r.pool.length===0){r.started=false;r.current=null;broadcast(r);io.to(r.code).emit("finished");return}
 const p=r.pool.pop();
 r.current={player:p,bid:p[4],leader:null,time:20};
 clearInterval(r.timer);
 r.timer=setInterval(()=>{
   if(!r.current)return;
   r.current.time--;
   io.to(r.code).emit("tick",{time:r.current.time});
   if(r.current.time<=0) sell(r);
 },1000);
 broadcast(r);
}
function sell(r){
 if(!r.current)return;
 clearInterval(r.timer);
 const c=r.current;
 if(c.leader){
   const t=r.players.find(x=>x.id===c.leader);
   t.budget-=c.bid;t.squad.push(c.player);
   r.history.unshift(`🔨 SOLD — ${c.player[0]} to ${t.name} for €${c.bid}M`);
   io.to(r.code).emit("sold",{player:c.player,bid:c.bid,team:t.name});
 }else r.history.unshift(`⚪ UNSOLD — ${c.player[0]}`);
 r.current=null; broadcast(r);
 setTimeout(()=>r.started&&next(r),2500);
}
io.on("connection",s=>{
 s.on("create",({name},cb)=>{
   const code=makeCode(),id=s.id;
   const r={code,host:id,started:false,players:[{id,name:(name||"Team 1").slice(0,18),budget:200,squad:[]}],pool:[],current:null,history:[],timer:null};
   rooms.set(code,r);s.join(code);cb({ok:true,code,id});broadcast(r);
 });
 s.on("join",({code,name},cb)=>{
   const r=rooms.get((code||"").toUpperCase());
   if(!r)return cb({ok:false,error:"Room not found"});
   if(r.started)return cb({ok:false,error:"Auction already started"});
   if(r.players.length>=12)return cb({ok:false,error:"Room is full"});
   const id=s.id;r.players.push({id,name:(name||"Team").slice(0,18),budget:200,squad:[]});s.join(r.code);cb({ok:true,code:r.code,id});broadcast(r);
 });
 s.on("start",({code})=>{
   const r=rooms.get(code); if(!r||s.id!==r.host||r.players.length<2)return;
   r.started=true;r.pool=[...players].sort(()=>Math.random()-.5);r.history.unshift("🏁 Auction started");
   next(r);
 });
 s.on("bid",({code})=>{
   const r=rooms.get(code),t=r?.players.find(x=>x.id===s.id);
   if(!r||!r.started||!r.current||!t)return;
   const amount=r.current.bid+5;
   if(t.budget<amount)return;
   r.current.bid=amount;r.current.leader=t.id;
   if(r.current.time<=5)r.current.time=5;
   io.to(r.code).emit("tick",{time:r.current.time});
   r.history.unshift(`💰 ${t.name} bid €${amount}M for ${r.current.player[0]}`);
   broadcast(r);
 });
 s.on("disconnect",()=>{
   for(const r of rooms.values()){
     const i=r.players.findIndex(x=>x.id===s.id);
     if(i>=0&&!r.started){
       r.players.splice(i,1);
       if(r.host===s.id)r.host=r.players[0]?.id;
       broadcast(r);
     }
   }
 });
});
server.listen(process.env.PORT||3000,()=>console.log("Football Auction running on port "+(process.env.PORT||3000)));
