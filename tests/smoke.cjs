const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const catalog = fs.readFileSync(path.join(__dirname, '..', 'baogao-catalog.js'), 'utf8');
const intros = fs.readFileSync(path.join(__dirname, '..', 'deity-intros.js'), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, '页面应有脚本');
const script = match[1].replace(/\binit\(\);\s*$/, '');

function pageOn(isoDate) {
  const RealDate = Date;
  class ClockDate extends RealDate {
    constructor(...args) { super(...(args.length ? args : [isoDate + 'T12:00:00+08:00'])); }
  }
  const elements = new Map();
  const document = {
    querySelectorAll() { return []; },
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, { textContent: '', innerHTML: '', classList: { toggle() {} }, querySelectorAll() { return []; } });
      return elements.get(selector);
    },
  };
  const context = vm.createContext({ Date: ClockDate, Intl, document, console });
  vm.runInContext(catalog + intros + script, context);
  vm.runInContext('renderToday()', context);
  return { context, elements, content: elements.get('#todayContent').innerHTML };
}

const ordinary = pageOn('2026-09-29');
assert.match(ordinary.content, /今日暂无收录的神仙圣诞/);
assert.match(ordinary.content, /浏览月历/);

const multiple = pageOn('2026-10-18');
assert.match(multiple.content, /斗姥元君圣诞/);
assert.match(multiple.content, /今日其他圣诞/);
assert.match(multiple.content, /重阳帝君圣诞/);
assert.match(multiple.content, /酆都大帝圣诞/);
assert.match(multiple.content, /斗姥诰/);
assert.ok(multiple.content.indexOf('斗姥元君圣诞') < multiple.content.indexOf('重阳帝君圣诞'));
assert.equal(vm.runInContext("birthdayRank({deity:'doumu'}) < birthdayRank({deity:'yuhuang'})", multiple.context), true);
assert.equal(vm.runInContext("birthdayRank({deity:'laojun'}) < birthdayRank({deity:'houtu'})", multiple.context), true);

let verifiedDate;
for (let month = 1; month <= 12 && !verifiedDate; month++) {
  for (let day = 1; day <= new Date(Date.UTC(2026, month, 0)).getUTCDate(); day++) {
    const iso = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const found = vm.runInContext(`getEvents(dateUTC(2026,${month},${day})).some(e=>e.deity==='ziwei'&&e.cat==='birthday')`, multiple.context);
    if (found) { verifiedDate = iso; break; }
  }
}
assert.ok(verifiedDate, '应能找到紫微大帝圣诞');
const verified = pageOn(verifiedDate);
assert.match(verified.content, /星主宝诰/);
assert.match(verified.content, /taoist\.org\.cn/);
assert.doesNotMatch(verified.content, /原文待核对/);

const fiscal = pageOn('2026-09-03');
vm.runInContext('state.selected=dateUTC(2026,9,3);renderDetail()', fiscal.context);
assert.match(fiscal.elements.get('#detailPanel').innerHTML, /财帛星君宝诰/);
assert.match(fiscal.elements.get('#detailPanel').innerHTML, /金星下凡/);

const kitchen = pageOn('2026-09-13');
vm.runInContext('state.selected=dateUTC(2026,9,13);renderDetail()', kitchen.context);
assert.match(kitchen.elements.get('#detailPanel').innerHTML, /九天司命宝诰/);

const nine = pageOn('2026-10-12');
vm.runInContext('state.selected=dateUTC(2026,10,12);renderDetail()', nine.context);
assert.match(nine.elements.get('#detailPanel').innerHTML, /九皇斋第3日 · 真人禄存星君/);
assert.match(nine.elements.get('#detailPanel').innerHTML, /北斗宝诰/);
assert.match(nine.elements.get('#detailPanel').innerHTML, /北斗九皇是道教星斗信仰/);
assert.match(nine.content, /今日神仙纪念/);
assert.deepEqual(Array.from(vm.runInContext('fixed.filter(e=>isDivineEvent(e)&&!eventDeityIntro(e)).map(e=>e.name)', nine.context)), [], '每个神仙纪念日都应有简介');

console.log('smoke tests passed: empty day, multiple birthdays, sourced baogao');
