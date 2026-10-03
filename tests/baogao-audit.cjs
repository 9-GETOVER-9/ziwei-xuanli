const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const inline = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\binit\(\);\s*$/, '');
const context = vm.createContext({ Date, Intl });
vm.runInContext(fs.readFileSync(path.join(root, 'baogao-catalog.js'), 'utf8') + inline, context);
const read = expression => vm.runInContext(expression, context);
const records = read('Object.values(sourceBaogaoCatalog)');
for (const record of records) {
  assert.equal((record.text.match(/[志至]心皈命/g) || []).length, 1, record.title + '应为单篇版本');
  assert.doesNotMatch(record.text, /!\[|#{1,6}|宝诰注解|祖庭|以上內容|仅供参考/, record.title + '不应包含网页注解');
  assert.ok(record.version && record.url.startsWith('https://'), record.title + '应记录版本和出处');
}
for (const [title, ending] of [
  ['祖天师宝诰', '降魔护道天尊。'], ['邱祖宝诰', '广援普度天尊。'],
  ['虚靖天师宝诰', '碧霄演教天尊。'], ['东华帝君宝诰', '东王木公天尊。'],
  ['药王宝诰', '护国救民灵感孙大真人。'], ['南斗宝诰', '阳明普度天尊。']
]) assert.ok(read(`sourceBaogaoCatalog[${JSON.stringify(title)}].text`).endsWith(ending), title);

// Every named association must resolve. Missing keys must not silently disappear.
for (const [name, titles] of read('Object.entries(eventBaogaoTitles)')) {
  for (const title of titles) assert.ok(read(`Boolean(sourceBaogaoCatalog[${JSON.stringify(title)}]||sourcedBaogao[${JSON.stringify(title)}])`), name + ': ' + title);
}
for (const title of read('Object.values(deityCatalogTitles).flat()')) {
  assert.ok(read(`sourceBaogaoCatalog[${JSON.stringify(title)}]`), title);
}

// Same objects and same chosen text are used by event cards and deity profiles.
for (const id of ['siming', 'nandou', 'beidou', 'yuhuang', 'ziwei', 'tianyou']) {
  assert.equal(read(`renderEventBaogao({deity:'${id}'}).includes(renderBaogao('${id}'))`), true, id);
}
for (const name of ['地母娘娘圣诞', '南方雷祖圣诞', '北方雷祖圣诞', '南极大帝中方雷祖圣诞']) {
  assert.match(read(`renderEventBaogao(fixed.find(e=>e.name===${JSON.stringify(name)}))`), /相关|分别展示/);
}
assert.match(read("renderEventBaogao(fixed.find(e=>e.name==='马祖丹阳真人圣诞'))"), /合诰/);
assert.equal(read("isDivineEvent(fixed.find(e=>e.name==='祭灶王'))"), true);
assert.match(read("renderOtherEvents([fixed.find(e=>e.name==='祭灶王')])"), /九天司命宝诰/);
assert.equal(read("fixed.some(e=>e.name==='长生谭真君成道之辰')"), false);
assert.match(read("fixed.find(e=>e.m===4&&e.d===1).name"), /长真.*谭处端/);
assert.equal(read("new Set(fixed.filter(e=>e.deity==='beidou').map(e=>e.name)).size"), 9);
assert.match(read("renderEventBaogao(fixed.find(e=>e.deity==='beidou'))"), /九天共用同文/);
assert.match(read("sourcedBaogao.nanji.text"), /高上神霄府/);
// Hong Kong Observatory's 2026 calendar (UTC+8); eight-term descent dates.
assert.deepEqual(Array.from(read('eightTerms.map(t=>dateKey(termDate(2026,t.i)))')),
  ['2026-02-04','2026-03-20','2026-05-05','2026-06-21','2026-08-07','2026-09-23','2026-11-07','2026-12-22']);

// Scan real calendar days, including a leap-lunar-month year, for unhandled gaps.
const totals = read(`(() => {
  const rows=[];
  for(const year of [2026,2027,2028]) {
    let days=0,events=0,withText=0;const unresolved=new Set();
    for(let date=dateUTC(year,1,1);date.getUTCFullYear()===year;date.setUTCDate(date.getUTCDate()+1)) {
      days++;for(const event of getEvents(date).filter(isDivineEvent)) {
        events++;const records=baogaoRecords(event);if(records.length)withText++;else {
          if(!unresolvedBaogaoNotes[event.name])throw Error('Unexplained missing text: '+event.name);
          unresolved.add(event.name);
        }
        if(!renderEventBaogao(event))throw Error('Empty event output: '+event.name);
      }
    }
    rows.push({year,days,events,withText,unresolved:[...unresolved]});
  }
  return rows;
})()`);
assert.deepEqual(Array.from(totals, row => row.days), [365,365,366]);
console.log(JSON.stringify({catalogRecords: records.length, calendarAudit: totals}, null, 2));
