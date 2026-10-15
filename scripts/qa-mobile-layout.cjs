/* eslint-disable @typescript-eslint/no-require-imports */
// Run: npm exec --yes --package=playwright@1.58.2 -- node scripts/qa-mobile-layout.cjs
// Local browser tests only; no orders or payments are submitted.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=process.env.PATH.split(path.delimiter).map(p=>path.join(p,'..','playwright')).find(p=>{try{return require(path.join(p,'package.json')).version==='1.58.2'}catch{return false}});
if(!root)throw new Error('Expected isolated Playwright 1.58.2');
const pw=require(root),base=process.env.AUDIT_BASE||'http://127.0.0.1:3107';
const out=process.env.AUDIT_OUTPUT||path.resolve('.qa/mobile-layout');fs.mkdirSync(out,{recursive:true});
const results=[];
async function check(name,fn){await fn();results.push(name);console.log('PASS',name)}
// Use customer link navigation; repeated page.goto can cancel WebKit prefetches.
async function navigateInApp(page, target) {
 if (target === '/sepet') await page.locator('.header-actions a[aria-label="Sepet"]').click();
 else if (target === '/checkout') await page.locator('.cart-summary a[href="/checkout"]').click();
 else if (target.startsWith('/urun/')) await page.locator('.catalog-card-image[href="'+target+'"]').first().click();
 else {
  if (!(await page.locator('.mobile-menu[open]').count())) await page.locator('.mobile-menu summary').click();
  await page.locator('.mobile-menu-panel a[href="'+target+'"]').first().click();
 }
 await page.waitForURL(url => url.pathname === target);
 await page.waitForLoadState('networkidle');
}
(async()=>{
 const catalog=await fetch(base+'/api/catalog').then(r=>r.json());
 const male=catalog.products.find(p=>p.category==='erkek'&&p.variants?.some(v=>v.available>0));assert(male);
 for(const engine of ['chromium','webkit']){
  const browser=await pw[engine].launch({headless:true});
  const context=await browser.newContext({...pw.devices['iPhone 13'],viewport:{width:390,height:844},locale:'tr-TR',deviceScaleFactor:1});
  const blockedWrites=[];
  await context.route(/google-analytics|googletagmanager|connect\.facebook|facebook\.com\/tr/,r=>r.abort());
  await context.route(/\/api\/(orders|payments|contact)([/?]|$)/,async route=>{const r=route.request();if(r.url().startsWith(base)&&r.method()!=='GET'){blockedWrites.push(r.url());return route.abort();}return route.continue();});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
  try{
   await page.goto(base+'/',{waitUntil:'networkidle',timeout:60000});
   await check(engine+' homepage shares the working mobile menu',async()=>{
    assert.equal(await page.locator('.site-header').count(),1);await page.locator('.mobile-menu summary').click();assert.equal(await page.locator('.mobile-menu[open]').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('.mobile-menu[open]').count(),0);
    assert.equal(await page.getByText('Hızlı ekle',{exact:true}).count(),0);
   });
   await navigateInApp(page,'/erkek/yeni-gelenler');
   await check(engine+' header alignment and touch targets',async()=>{
    const m=await page.evaluate(()=>{const b=document.querySelector('.brand').getBoundingClientRect();return{center:Math.abs(b.x+b.width/2-innerWidth/2),actions:[...document.querySelectorAll('.header-actions a')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))}});
    assert(m.center<=2,JSON.stringify(m));assert.equal(m.actions.length,2);assert(m.actions.every(a=>a.w>=44&&a.h>=44));
   });
   await check(engine+' card buttons and prices aligned',async()=>{
    const cards=await page.locator('.catalog-card').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),b=e.querySelector('.catalog-quick-add').getBoundingClientRect(),p=e.querySelector('.catalog-price').getBoundingClientRect();return{top:r.top,button:b.top,bh:b.height,price:p.top}}));
    assert(cards.length===catalog.products.filter(p=>p.category==='erkek').length);for(let i=0;i<cards.length-1;i++){if(Math.abs(cards[i].top-cards[i+1].top)<1){assert(Math.abs(cards[i].button-cards[i+1].button)<=1);assert(Math.abs(cards[i].price-cards[i+1].price)<=1)}}assert(cards.every(c=>c.bh>=44));
   });
   await check(engine+' new arrivals compact title',async()=>{assert.equal(await page.locator('.listing-hero').count(),0);assert(await page.locator('.new-arrivals-title').isVisible())});
   await check(engine+' menu attached to header and Escape closes',async()=>{
    await page.locator('.mobile-menu summary').click();const m=await page.evaluate(()=>({header:document.querySelector('.site-header').getBoundingClientRect().bottom,panel:document.querySelector('.mobile-menu-panel').getBoundingClientRect().top}));assert(Math.abs(m.panel-m.header)<=1,JSON.stringify(m));await page.keyboard.press('Escape');assert.equal(await page.locator('.mobile-menu[open]').count(),0);
   });
   await check(engine+' menu works after scrolling',async()=>{
    await page.evaluate(()=>window.scrollTo(0,300));await page.locator('.mobile-menu summary').click();const m=await page.evaluate(()=>({header:document.querySelector('.site-header').getBoundingClientRect().bottom,panel:document.querySelector('.mobile-menu-panel').getBoundingClientRect().top}));assert(Math.abs(m.panel-m.header)<=1,JSON.stringify(m));await page.locator('.brand').click();assert.equal(await page.locator('.mobile-menu[open]').count(),0);
   });
   await check(engine+' women menu navigates and closes',async()=>{await page.locator('.mobile-menu summary').click();await page.locator('.mobile-subgrid a[href="/kadin/yeni-gelenler"]').click();await page.waitForURL('**/kadin/yeni-gelenler');assert.equal(await page.locator('.mobile-menu[open]').count(),0)});
   await navigateInApp(page,'/erkek/yeni-gelenler');
   await check(engine+' quick add updates cart',async()=>{await page.locator('.catalog-quick-add:not([disabled])').first().click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('elmas-cart')||'[]').length>0)});
   await navigateInApp(page,'/urun/'+male.slug);
   await check(engine+' size guide fits and closes',async()=>{await page.getByRole('button',{name:/Beden Tablosu/}).click();const box=await page.getByRole('dialog').boundingBox();assert(box&&box.x>=0&&box.width<=390&&box.y>=0&&box.y+box.height<=845);await page.getByRole('button',{name:'Beden tablosunu kapat'}).click();assert.equal(await page.getByRole('dialog').count(),0)});
   await check(engine+' purchase controls are full width and touchable',async()=>{
    const m=await page.locator('.product-buy-row').evaluate(e=>{const r=e.getBoundingClientRect(),b=e.querySelector('.add-cart').getBoundingClientRect(),q=e.querySelector('.qty button').getBoundingClientRect();return{rw:r.width,bw:b.width,bh:b.height,qw:q.width,qh:q.height}});assert(Math.abs(m.rw-m.bw)<=1&&m.bh>=52&&m.qw>=44&&m.qh>=44,JSON.stringify(m));await page.locator('.product-buy-row').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+engine+'-product.png'});
   });
   await check(engine+' product add and cart quantity changes',async()=>{
    await page.locator('.add-cart').click();await navigateInApp(page,'/sepet');await page.locator('.cart-line').first().waitFor();const line=page.locator('.cart-line').first(),before=Number(await line.locator('.cart-qty span').innerText());await line.getByRole('button',{name:'Adedi art\u0131r',exact:true}).click();await page.waitForTimeout(250);assert.equal(Number(await line.locator('.cart-qty span').innerText()),before+1);await line.getByRole('button',{name:'Adedi azalt',exact:true}).click();await page.waitForTimeout(250);assert.equal(Number(await line.locator('.cart-qty span').innerText()),before);await page.screenshot({path:out+'/'+engine+'-cart.png',fullPage:true});
   });
   await check(engine+' populated checkout layout without submitting order',async()=>{
    await navigateInApp(page,'/checkout');await page.locator('.checkout-page').waitFor();assert(await page.locator('.checkout-page input').count()>0);const m=await page.evaluate(()=>({vw:innerWidth,width:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('.checkout-page input:not([type=radio]):not([type=checkbox]),.checkout-page select')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({font:parseFloat(getComputedStyle(e).fontSize),right:e.getBoundingClientRect().right})).filter(e=>e.font<16||e.right>innerWidth+1)}));assert(m.width<=m.vw&&m.bad.length===0,JSON.stringify(m));await page.screenshot({path:out+'/'+engine+'-checkout.png',fullPage:true});assert.equal(blockedWrites.length,0);
   });
   await check(engine+' discount-code input stays usable',async()=>{
    const input=page.locator('#affiliate-promo-code'),button=page.locator('.affiliate-checkout-promo > div > button');
    const i=await input.boundingBox(),b=await button.boundingBox();assert(i&&b&&i.width>=180&&i.height>=44&&b.y>=i.y+i.height-1,JSON.stringify({i,b}));
    await input.fill('GORSELTEST');assert.equal(await input.inputValue(),'GORSELTEST');await input.fill('');
   });
   await check(engine+' short-screen menu scroll is contained',async()=>{await page.setViewportSize({width:390,height:500});await navigateInApp(page,'/erkek');await page.locator('.mobile-menu summary').click();const m=await page.locator('.mobile-menu-panel').evaluate(e=>({bottom:e.getBoundingClientRect().bottom,vh:innerHeight,scroll:e.scrollHeight,h:e.clientHeight}));assert(m.bottom<=m.vh+1,JSON.stringify(m));await page.locator('.mobile-menu-secondary a').last().scrollIntoViewIfNeeded();assert(await page.locator('.mobile-menu-secondary a').last().isVisible());await page.keyboard.press('Escape')});
   await check(engine+' narrow-screen category chips remain reachable',async()=>{
    await page.setViewportSize({width:320,height:700});await navigateInApp(page,'/kadin/yeni-gelenler');
    const last=page.locator('.filter-group:not(.filter-sort) a').last(),type=await last.innerText();await last.scrollIntoViewIfNeeded();
    const box=await last.boundingBox();assert(box&&box.x>=0&&box.x+box.width<=321,JSON.stringify(box));await last.click();
    await page.waitForFunction(()=>new URL(location.href).searchParams.has('type'));await page.locator('.catalog-card').first().waitFor();
    const slugs=await page.locator('.catalog-card-image').evaluateAll(es=>es.map(e=>e.getAttribute('href').split('/').pop()));
    assert(slugs.length>0&&slugs.every(s=>catalog.products.some(p=>p.slug===s&&p.category==='kadin'&&p.type===type)));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   });
   await check(engine+' no uncaught application errors',async()=>assert.deepEqual(errors,[]));
  }finally{await context.close();await browser.close()}
 }
 fs.writeFileSync(out+'/results.json',JSON.stringify({passed:results.length,checks:results},null,2));console.log('FLOWS_COMPLETE',results.length);
})().catch(e=>{fs.writeFileSync(out+'/failure.json',JSON.stringify({passed:results,error:e.stack},null,2));console.error(e);process.exit(1)});
