const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('node:assert/strict');
const ts=require('typescript');const base=process.cwd();
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const original=Module._load;
Module._load=function(id,parent,isMain){if(id==='next/navigation')return{useRouter:()=>({refresh(){}})};if(id.startsWith('@/'))id=path.join(base,'src',id.slice(2));return original.call(this,id,parent,isMain)};
const{resolveAnalyticsRange,rangeBuckets,bucketKey}=require('../../src/lib/analytics-range.ts');
const now=new Date('2026-10-15T09:30:00Z');
let assertions=0;const check=(name,fn)=>{fn();assertions++;console.log('PASS',name)};
for(const zone of ['UTC','America/New_York','Asia/Tokyo']){
 process.env.TZ=zone;
 check('Istanbul today start independent of host '+zone,()=>assert.equal(resolveAnalyticsRange({range:'today'},now).from.toISOString(),'2026-10-14T21:00:00.000Z'));
 check('Yesterday includes entire local date '+zone,()=>{const r=resolveAnalyticsRange({range:'yesterday'},now);assert.equal(r.from.toISOString(),'2026-10-13T21:00:00.000Z');assert.equal(r.to.toISOString(),'2026-10-14T21:00:00.000Z');assert.equal(rangeBuckets(r).length,24)});
}
check('today compares yesterday same elapsed time',()=>assert.equal(resolveAnalyticsRange({range:'today'},now).previousTo.toISOString(),'2026-10-14T09:30:00.000Z'));
check('last 24 hours distinct from calendar today',()=>assert.equal(resolveAnalyticsRange({range:'24h'},now).from.toISOString(),'2026-10-14T09:30:00.000Z'));
check('single custom day includes all 24 hours',()=>{const r=resolveAnalyticsRange({range:'custom',from:'2026-10-12',to:'2026-10-12'},now);assert.equal(+r.to-+r.from,86400000);assert.equal(rangeBuckets(r).length,24)});
check('invalid date rejected',()=>assert(resolveAnalyticsRange({range:'custom',from:'2026-02-30',to:'2026-03-02'},now).error));
check('reversed range rejected',()=>assert(resolveAnalyticsRange({range:'custom',from:'2026-10-12',to:'2026-10-11'},now).error));
check('future range rejected',()=>assert(resolveAnalyticsRange({range:'custom',from:'2026-11-01',to:'2026-11-02'},now).error));
check('year range aggregates weeks without skipping',()=>assert.equal(resolveAnalyticsRange({range:'365'},now).bucket,'week'));
check('weekly bucket starts on Monday',()=>assert.equal(bucketKey('2026-10-15T09:30:00Z','week'),'2026-10-11T21:00:00.000Z'));
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const Dashboard=require('../../src/components/AnalyticsBehaviorDashboard.tsx').default;
const period=resolveAnalyticsRange({range:'today'},now);
const report={from:period.from.toISOString(),to:period.to.toISOString(),bucket:'hour',measurementStartedAt:period.from.toISOString(),lastEventAt:now.toISOString(),
 summary:{visitors:928,sessions:1084,pageviews:3278,activeMs:86720000,measuredSessions:1084,measuredPages:3000,activeNow:12,singlePageSessions:160},
 funnel:{sessions:1084,product:792,cart:248,checkout:102,purchase:31,orders:34,revenue:64950,unattributedPaidOrders:2},
 trend:rangeBuckets(period).map((at,i)=>({at,views:i*19,sessions:i*7,visitors:i*6,activeMs:i*520000,measuredSessions:i*7})),
 pages:[{path:'/kadin/yeni-gelenler',views:812,sessions:521,avgSeconds:47},{path:'/urun/uzun-isimli-ornektir-bu-gercek-veri-degildir',views:628,sessions:490,avgSeconds:103},{path:'/checkout',views:105,sessions:102,avgSeconds:96}],
 sources:[{name:'Instagram',sessions:622,visitors:544,avgSeconds:92,purchases:19},{name:'Organik Arama',sessions:318,visitors:270,avgSeconds:67,purchases:10},{name:'Direct',sessions:144,visitors:114,avgSeconds:78,purchases:2}],
 devices:[{name:'Mobil',sessions:884,purchases:27},{name:'Masaüstü',sessions:182,purchases:4},{name:'Tablet',sessions:18,purchases:0}],
 recent:[{id:'fixture-1',started_at:now.toISOString(),source:'Instagram',entry_path:'/kadin/yeni-gelenler',exit_path:'/urun/uzun-isimli-ornektir-bu-gercek-veri-degildir',device_type:'Mobil',pageviews:4,seconds:153}]};
const out=path.join(base,'.qa/ui');fs.mkdirSync(out,{recursive:true});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])}
const css=walk('.next/static').filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync(f,'utf8')).join('\n')+'\n'+fs.readFileSync('src/app/yonetim/istatistikler/analytics-behavior.css','utf8');
fs.writeFileSync(path.join(out,'style.css'),css);
for(const [name,data,error] of [['dashboard',report,false],['empty',{...report,summary:{...report.summary,visitors:0,sessions:0,pageviews:0,activeMs:0,measuredSessions:0,measuredPages:0,activeNow:0},funnel:{sessions:0,product:0,cart:0,checkout:0,purchase:0,orders:0,revenue:0,unattributedPaidOrders:0},trend:[],pages:[],sources:[],devices:[],recent:[]},false],['unavailable',null,true]]){
 const html=renderToStaticMarkup(React.createElement(Dashboard,{period,report:data,previous:null,error}));
 assert(!html.includes('NaN')&&!html.includes('Infinity'));
 fs.writeFileSync(path.join(out,name+'.html'),'<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="background:#f6f7f2"><p style="text-align:center;padding:8px;font-size:12px">TEST VERISI - CANLI VERI DEGILDIR</p><main class="admin-page analytics-page" style="max-width:1480px;margin:auto">'+html+'</main></body></html>');
}
console.log('DATE_AND_UI_FIXTURE_PASS',assertions);
