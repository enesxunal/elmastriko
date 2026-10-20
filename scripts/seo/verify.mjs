import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
let products=[{slug:'test-product',gender:'kadin',product_type:'Hırka',updated_at:'2026-10-20T12:00:00Z'},{slug:'men-product',gender:'erkek',product_type:'Kazak',updated_at:'2026-10-20T12:00:00Z'}],posts=[],failed=false;
const client={from:table=>({select(){return this;},async eq(){return {data:table==='products'?products:posts,error:failed?{code:'unavailable'}:null};}})};
function load(file){const exports={};const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInNewContext(`(function(require,exports){${js}\n})`,{})(name=>name.includes('supabase/public')?{createPublicClient:()=>client}:name.includes('editorial-content')?{editorialPosts:[{slug:'test-guide',updated_at:'2026-10-20T12:00:00Z'}]}:{},exports);return exports;}
const sitemap=load('src/app/sitemap.ts');assert.equal(sitemap.dynamic,'force-dynamic');
let rows=await sitemap.default(),urls=rows.map(r=>r.url);
for(const p of ['/kadin/yeni-gelenler','/erkek/yeni-gelenler','/urun/test-product','/urun/men-product','/blog/test-guide'])assert.ok(urls.includes('https://www.elmastriko.com'+p));
assert.ok(!urls.some(u=>u.endsWith('/kadin/triko')));assert.equal(new Set(urls).size,urls.length);
products=[];rows=await sitemap.default();assert.ok(!rows.some(r=>r.url.endsWith('/erkek/yeni-gelenler')));
failed=true;await assert.rejects(()=>sitemap.default(),/Sitemap data unavailable/);
for(const gender of ['kadin','erkek']){const metadata=load(`src/app/${gender}/yeni-gelenler/page.tsx`).generateMetadata;const base=await metadata({searchParams:Promise.resolve({})});assert.equal(base.robots.index,true);assert.equal(base.alternates.canonical,`/${gender}/yeni-gelenler`);assert.ok(!base.title.includes('Elmas Triko'));for(const params of [{sort:'price-asc'},{type:'Kazak'}])assert.equal((await metadata({searchParams:Promise.resolve(params)})).robots.index,false);}
const redirects=await load('next.config.ts').default.redirects();assert.ok(redirects.some(r=>r.source==='/kadin/triko'&&r.destination==='/kadin'&&r.permanent));
const robots=load('src/app/robots.ts').default();for(const p of ['/yonetim','/hesabim','/influencer','/odeme/'])assert.ok(robots.rules.disallow.includes(p));
console.log('Sitemap completeness, canonical category redirect, duplicate-free titles, filtered-page indexing, private-route exclusions and safe failure: passed.');
