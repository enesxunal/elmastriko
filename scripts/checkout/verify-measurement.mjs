import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import ts from "typescript";
let seq=0;
const local=new Map(),session=new Map(),requests=[],scripts=[];
const store=m=>({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))});
const window={localStorage:store(local),sessionStorage:store(session)};
const location={pathname:"/urun/measurement-product",hostname:"www.elmastriko.com",search:""};
const navigator={userAgent:"Test human browser",webdriver:false,doNotTrack:"0",maxTouchPoints:0};
const context=vm.createContext({window,location,navigator,document:{referrer:"",head:{appendChild:s=>scripts.push(s)},createElement:()=>({})},
 crypto:{randomUUID:()=>`10000000-0000-4000-8000-${String(++seq).padStart(12,"0")}`},innerWidth:390,Date,URL,URLSearchParams,Set,Map,Blob,AbortSignal,
 setTimeout:()=>1,clearTimeout:()=>{},fetch:async(url,options)=>{requests.push(JSON.parse(options.body));return{ok:true};}});
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const output=ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const wrapper=vm.runInContext(`(function(require,exports){${output}\n})`,context);wrapper(spec=>load(spec.startsWith("@/")?path.resolve("src",spec.slice(2)+".ts"):path.resolve(path.dirname(file),spec+".ts")),exports);return exports;}
const analytics=load("src/lib/analytics-client.ts"),meta=load("src/lib/meta-pixel.ts"),tracking=load("src/lib/commerce-tracking.ts");
const product={slug:"measurement-product",name:"Product",type:"Kazak",category:"erkek",price:899,variants:[{id:"variant-1",sku:"ET-S",size:"S",color:"Ekru",price:899,available:5}]};
const line={slug:product.slug,qty:1,size:"S",color:"Ekru"};
const page=analytics.currentAnalyticsPage();meta.metaTrack("PageView",{},page.id);meta.metaTrack("PageView",{},page.id);
tracking.trackProductView(product);tracking.trackProductView({...product});
tracking.trackCartAddition(product,line,899);tracking.trackCartAddition(product,line,899);
location.pathname="/checkout";tracking.trackCheckoutStart([{product,line,unitPrice:899}]);tracking.trackCheckoutStart([{product,line,unitPrice:899}]);
await analytics.flushAnalytics();
const events=requests.flatMap(x=>x.events),pixel=window.fbq.queue.filter(x=>x[0]==="track");
assert.equal(events.filter(x=>x.kind==="page_view").length,2);
assert.equal(events.filter(x=>x.kind==="view_item").length,1);
assert.equal(pixel.filter(x=>x[1]==="PageView").length,1);
assert.equal(pixel.filter(x=>x[1]==="ViewContent").length,1);
assert.equal(pixel.filter(x=>x[1]==="AddToCart").length,2);
assert.equal(pixel.filter(x=>x[1]==="InitiateCheckout").length,1);
const mapping={PageView:"page_view",ViewContent:"view_item",AddToCart:"add_to_cart",InitiateCheckout:"begin_checkout"};
for(const event of pixel)assert.ok(events.some(e=>e.id===event[3].eventID&&e.kind===mapping[event[1]]),"Meta and database IDs must match");
assert.equal(scripts.length,1);assert.equal(pixel.find(x=>x[1]==="AddToCart")[2].content_ids[0],"ET-S");
const beforeEvents=events.length,beforePixel=pixel.length;
for(const blocked of ["/yonetim/istatistikler","/auth/callback","/influencer/giris"]){location.pathname=blocked;tracking.trackCartAddition(product,line,899);meta.metaTrack("PageView",{},String(++seq));}
location.pathname="/urun/measurement-product";location.hostname="localhost";tracking.trackProductView(product);meta.metaTrack("PageView",{},String(++seq));
location.hostname="www.elmastriko.com";local.set("et_analytics_opt_out","1");tracking.trackCartAddition(product,line,899);
local.delete("et_analytics_opt_out");navigator.doNotTrack="1";tracking.trackCartAddition(product,line,899);
navigator.doNotTrack="0";navigator.webdriver=true;tracking.trackCartAddition(product,line,899);
navigator.webdriver=false;location.search="?et_test=1";tracking.trackCartAddition(product,line,899);
location.search="";tracking.trackCartAddition(product,line,899);meta.metaTrack("PageView",{},String(++seq));
assert.equal(session.get("et_technical_test"),"1");
await analytics.flushAnalytics();assert.equal(requests.flatMap(x=>x.events).length,beforeEvents);assert.equal(window.fbq.queue.filter(x=>x[0]==="track").length,beforePixel);
console.log("Shared event IDs, rerender deduplication, distinct repeat adds, checkout deduplication, SKU identity and matching admin/preview/privacy/bot exclusions: passed.");
