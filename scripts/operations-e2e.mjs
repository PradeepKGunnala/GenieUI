import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.GENIE_E2E_URL || 'http://127.0.0.1:13000';
const browser=await chromium.launch({headless:true,...(process.env.GENIE_BROWSER_EXECUTABLE?{executablePath:process.env.GENIE_BROWSER_EXECUTABLE}:{})});
const errors=[];
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
try {
 await page.goto(base+'/operations');
 await page.getByLabel('Username',{exact:true}).fill(process.env.GENIE_E2E_USERNAME || 'owner');
 await page.getByLabel('Password',{exact:true}).fill(process.env.GENIE_E2E_PASSWORD);
 await page.getByRole('button',{name:/Sign in/}).click();
 await page.getByRole('heading',{name:'Operations',exact:true}).waitFor();
 await page.getByText('Workspace evidence',{exact:true}).waitFor();
 for(const view of ['agents','workflows','topology','incidents','costs','connectors','tenants','traces']) {
  await page.getByRole('link',{name:view,exact:true}).click();
  await page.waitForFunction(()=>!document.body.innerText.includes('Loading '));
  assert.equal(await page.getByRole('alert').count(),0,view+' reported an error');
 }
 const rows=page.locator('.operations-list a');
 assert.ok(await rows.count()>0,'No real traces recorded');
 await rows.first().click();
 await page.locator('.operations-event').first().waitFor();
 await page.getByRole('link',{name:'All traces',exact:true}).click();
 await page.getByRole('link',{name:'overview',exact:true}).click();
 if(process.env.GENIE_E2E_SCREENSHOT) await page.screenshot({path:process.env.GENIE_E2E_SCREENSHOT,fullPage:true});
 const summaryResponse=await context.request.get(base+'/api/v1/control-plane/operations/summary');
 const original=await summaryResponse.json();
 for(const scenario of [{health:'HEALTHY',waitingApprovals:0,failedRunsLastHour:0},{health:'DEGRADED',waitingApprovals:0,failedRunsLastHour:2},{health:'HEALTHY',waitingApprovals:3,failedRunsLastHour:0}]) {
  await page.route('**/operations/summary',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({...original,...scenario})}));
  await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await page.getByText(scenario.health,{exact:true}).first().waitFor();
  await page.unroute('**/operations/summary');
 }
 await page.route('**/operations/summary',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Observability dependency unavailable'})}));
 await page.getByRole('button',{name:'Refresh',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Observability dependency unavailable'}).waitFor({timeout:20000});
 await page.unroute('**/operations/summary');
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/operations');await page.getByText('Workspace evidence',{exact:true}).waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile layout overflows');
 assert.deepEqual(errors,[],'Browser JavaScript errors');
 console.log(JSON.stringify({liveViews:['overview','agents','workflows','topology','traces'],traceDrilldown:true,mobile:true,fixtureStates:['healthy','degraded','waiting approval','failed','disconnected'],errors}));
} finally {await browser.close();}
