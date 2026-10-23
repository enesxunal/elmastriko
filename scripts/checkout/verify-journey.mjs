import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';
const store=new Map(), requests=[], beacons=[], timers=[], listeners={};
let allowed=true, sid='23000000-0000-4000-8000-000000000001', fail=true, identityReads=0;
const identity={analyticsAllowed:()=>allowed,currentAnalyticsSession:()=>{identityReads++;return{id:sid};},readStorage:(_,key)=>store.get(key)||null,writeStorage:(_,key,value)=>store.set(key,value)};
const fields={};
function module(file,imports,scope={}) {
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};
 vm.runInNewContext('(function(exports,require){'+code+'\n})',{...scope})(exports,name=>{if(name in imports)return imports[name];throw new Error('Unexpected import '+name);});
 return exports;
}
Object.assign(fields,module('src/lib/checkout-diagnostics.ts',{}));
const scope={crypto:crypto.webcrypto,Date,JSON,Promise,Blob,AbortSignal,
 window:{addEventListener:(event,fn)=>{listeners[event]=fn;}},document:{visibilityState:'visible',addEventListener:(event,fn)=>{listeners[event]=fn;}},
 navigator:{sendBeacon:(url,body)=>{beacons.push({url,body});return true;}},setTimeout:fn=>{timers.push(fn);return timers.length;},
 fetch:async(url,options)=>{requests.push({url,...options});return{ok:!fail};}};
const client=module('src/lib/checkout-diagnostics-client.ts',{'./analytics-identity':identity,'./checkout-diagnostics':fields},scope);
const initial=client.checkoutAttemptId();
const reload=module('src/lib/checkout-diagnostics-client.ts',{'./analytics-identity':identity,'./checkout-diagnostics':fields},scope);
assert.equal(reload.checkoutAttemptId(),initial,'Reload must preserve attempt ID');
client.trackCheckoutProgress('form_invalid','validation','contact','phone');
await client.flushCheckoutProgress();
assert.equal(requests.length,1);
await client.flushCheckoutProgress(true);
assert.equal(beacons.length,1,'Pending event must be preserved for page exit');
assert.equal(await beacons[0].body.text(),requests[0].body,'Beacon retry must use original event ID');
fail=false;
await client.flushCheckoutProgress();
assert.equal(requests.length,2);assert.equal(requests[0].body,requests[1].body,'Acknowledged retry must be idempotent');
const body=JSON.parse(requests[1].body);
assert.deepEqual(Object.keys(body).sort(),['stage','code','fieldGroup','fieldName','eventId','at','sessionId','attemptId'].sort());
assert.equal(body.fieldName,'phone');assert.equal(body.attemptId,initial);
allowed=false;
const before=identityReads, saved=JSON.stringify([...store]);
client.trackCheckoutProgress('form_started');client.checkoutAttemptId();
assert.equal(requests.length,2);assert.equal(identityReads,before,'Privacy opt-out must not create analytics identity');assert.equal(JSON.stringify([...store]),saved);
allowed=true;sid='23000000-0000-4000-8000-000000000002';
assert.notEqual(client.checkoutAttemptId(),initial,'New session must use a new attempt ID');
const helper=module('src/lib/checkout-journey.ts',{'./checkout-diagnostics':fields});
const row=stages=>({payment_status:null,timeline:stages.map(stage=>({stage}))});
assert.match(helper.journeySummary(row(['cart_added','checkout_viewed'])),/form etkileşimi kaydedilmedi/);
assert.match(helper.journeySummary(row(['cart_added'])),/ödeme başlangıcı kaydedilmedi/);
assert.match(helper.journeySummary(row(['card_submitted'])),/doğrulanmış ödeme sonucu yok/);
assert.match(helper.journeySummary({payment_status:'review_required',timeline:[]}),/Tahsilat var/);
assert.match(helper.journeySummary({payment_status:null,timeline:[{stage:'form_invalid',code:'validation',field_name:'phone'}]}),/Telefon/);
console.log('Journey visibility, accurate stop reasons, reload/session identity, acknowledged retries, exit replay deduplication, privacy opt-out and field-name-only payloads: passed. No external requests made.');
