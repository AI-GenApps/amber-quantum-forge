// Throwaway balance sketch for Cloud Observatory task 00 (not shipped code). Run: node balance-sketch.mjs
// Task 02 replaces this with the real headless simulator test in cloud-observatory-core.
// throwaway balance sketch
let INS = [
 ["telescope",15,0.2,1.14],["lens",120,1.2,1.14],["prism",1100,8,1.15],["orrery",12000,55,1.15],
 ["star-map",130000,380,1.15],["beacon",1.4e6,2600,1.16],["archive",2e7,18000,1.16],["aurora-coil",3.3e8,130000,1.17]];
const UPG_AT=[10,25,50], UPG_MULT=[2,2,3], UPG_COSTMULT=[10,100,1000];
let CH=[ // chart cost, requires [instrumentIdx,count]
 [100,[0,3]],[600,[0,8]],[3500,[1,6]],[20000,[2,5]],[110000,[3,5]],[600000,[3,12]],[3.5e6,[4,8]],[2e7,[5,6]],[1.2e8,[5,12]],[7e8,[6,8]],[4e9,[7,5]],[2.5e10,[7,10]]];
const CHART_BONUS=0.05;
function run(opts={}){
 const boons=opts.boons||{};
 const own=Array(8).fill(0), up=Array(8).fill(0);
 let sl=boons.start||10, life=0, t=0, charted=opts.charted||0;
 const startOwn=boons.startOwn||[];
 startOwn.forEach((n,i)=>own[i]=n);
 let lastBuy=0,maxGap=0,gaps=[]; let firstChart=null;
 const costMult=boons.cost||1;
 const mult=(i)=>{let m=1;for(let k=0;k<up[i];k++)m*=UPG_MULT[k];if(i===0&&boons.tele)m*=boons.tele;return m};
 const glob=()=>(1+CHART_BONUS*(boons.atlas||1)*charted)*(boons.corona||1);
 const sps=()=>{let s=0;INS.forEach((x,i)=>s+=own[i]*x[2]*mult(i));return s*glob()};
 const tapv=()=>1*Math.pow(2,up[0]);
 const icost=i=>INS[i][1]*Math.pow(INS[i][3],own[i])*costMult;
 const ucost=i=>INS[i][1]*UPG_COSTMULT[up[i]]*costMult*(i>0?1:1);
 let tapRate=opts.tapRate??2;
 while(t<3600*8){
  // tap
  const rate = t<600? tapRate : tapRate*0.25;
  const s=sps();
  sl+=(s+rate*tapv()*glob())*1; life+=(s+rate*tapv()*glob()); t++;
  if(opts.trace&&t%1800===0)console.log('t',t/60,'min life',life.toExponential(2),'sps',sps().toExponential(2),'own',own.join(','),'up',up.join(','),'ch',charted);
  if(t%5) continue;
  let bought=true;
  while(bought){
   bought=false;
   const cs=sps();
   // constellation
   if(charted<12){const [c,[ii,n]]=CH[charted];const cc=c*costMult; if(sl>=cc&&own[ii]>=n){sl-=cc;charted++;bought=true;if(firstChart===null)firstChart=t;gaps.push(t-lastBuy);lastBuy=t;continue}}
   let best=-1,bv=0,kind;
   for(let i=0;i<8;i++){
    if(own[i]===0 && i>0 && own[i-1]<1) continue;
    const c=icost(i); if(sl>=c){const d=INS[i][2]*mult(i)*glob(); const v=d/c; if(v>bv){bv=v;best=i;kind='i'}}
    if(up[i]<3&&own[i]>=UPG_AT[up[i]]){const c2=ucost(i); if(sl>=c2){const d=own[i]*INS[i][2]*mult(i)*(UPG_MULT[up[i]]-1)*glob(); const v=d/c2; if(v>bv){bv=v;best=i;kind='u'}}}
   }
   if(best>=0){ if(kind==='i'){sl-=icost(best);own[best]++}else{sl-=ucost(best);up[best]++} bought=true; gaps.push(t-lastBuy); lastBuy=t; }
  }
  if(opts.stopShards){const sh=Math.floor(Math.pow(life/opts.E0,opts.p)); if(sh>=opts.stopShards) return {t,life,sh,firstChart,maxGap:Math.max(...gaps),own:own.slice(),up:up.slice(),charted,sps:sps()}}
 }
 return {t,life,firstChart,own,up,charted,maxGap:Math.max(...gaps)};
}

function setIns(x){INS=x}
function setCH(x){CH=x}

const T=[["telescope",15,0.2,1.12],["lens",100,1.2,1.12],["prism",700,7.5,1.12],["orrery",5000,47,1.125],["star-map",36000,290,1.125],["beacon",250000,1800,1.13],["archive",1.8e6,11500,1.13],["aurora-coil",1.3e7,72000,1.135]];
setIns(T);
const reqs=[[0,2],[0,8],[1,6],[2,5],[3,5],[3,12],[4,8],[5,6],[5,12],[6,8],[7,5],[7,10]];
const costs=[60,400,1600,6000,24000,1e5,4e5,1.6e6,6.5e6,2.6e7,1e8,4e8];
setCH(costs.map((c,i)=>[c,reqs[i]]));
const base=run({trace:false,stopShards:5,E0:1e9,p:0.5});
console.log('cycle1',base.t/60,'min life',base.life.toExponential(2),'firstChart',base.firstChart,'maxGap',base.maxGap,'charted',base.charted);
for (const sh of [8,10,15]) {const r=run({stopShards:sh,E0:1e9,p:0.5}); console.log('shards',sh,(r.t/60).toFixed(0),'min');}
// cycle 2 with boons set 1..3 (1+2+3=6 shards... first eclipse yields ~5-8)
const b2={start:1000,tele:2,corona:1};
let r=run({stopShards:5,E0:1e9,p:0.5,charted:12,boons:b2}); console.log('c2 early boons',(r.t/60).toFixed(0),'min maxGap',r.maxGap, r.firstChart);
const b3={start:1000,tele:2,cost:0.95,startOwn:[5,3],corona:1};
r=run({stopShards:5,E0:1e9,p:0.5,charted:12,boons:b3}); console.log('c3',(r.t/60).toFixed(0),'min');
const b4={start:1000,tele:2,cost:0.95,startOwn:[5,3],corona:1.5,atlas:1.5};
r=run({stopShards:5,E0:1e9,p:0.5,charted:12,boons:b4}); console.log('c4 5sh',(r.t/60).toFixed(0),'min');
r=run({stopShards:15,E0:1e9,p:0.5,charted:12,boons:b4}); console.log('c4 15sh',(r.t/60).toFixed(0),'min');
