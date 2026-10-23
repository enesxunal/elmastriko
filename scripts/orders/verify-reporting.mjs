import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code = ts.transpileModule(fs.readFileSync('src/lib/order-reporting.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context = {exports:{}};
vm.runInNewContext(code, context);
const {isPaidSale} = context.exports;
const shipped = {status:'shipped',payment_status:'paid',is_test:false,archived_at:null,grand_total:948};
const delivered = {...shipped,status:'delivered',grand_total:1048};
const pending = {...shipped,status:'awaiting_payment',payment_status:'pending',grand_total:4299};
const rows = [shipped,delivered,pending];
assert.equal(rows.length,3);
assert.equal(rows.filter(isPaidSale).length,2);
assert.equal(rows.filter(isPaidSale).reduce((sum,o)=>sum+o.grand_total,0),1996);
for (const patch of [{is_test:true},{archived_at:'2026-10-21'},{status:'cancelled'},{status:'refunded'},{status:'returned'},{payment_status:'failed'},{payment_status:'customer_notified'}]) {
  assert.equal(isPaidSale({...shipped,...patch}),false,JSON.stringify(patch));
}
console.log('3 records correctly produce 2 paid sales and 1,996 TL revenue. Unpaid, test, archived, cancelled and refunded records excluded: passed.');
