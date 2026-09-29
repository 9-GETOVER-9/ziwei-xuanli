const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
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
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, { textContent: '', innerHTML: '', classList: { toggle() {} }, querySelectorAll() { return []; } });
      return elements.get(selector);
    },
  };
  const context = vm.createContext({ Date: ClockDate, Intl, document, console });
  vm.runInContext(script, context);
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
assert.match(multiple.content, /原文待核对/);

let verifiedDate;
for (let month = 1; month <= 12 && !verifiedDate; month++) {
  for (let day = 1; day <= 31; day++) {
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

console.log('smoke tests passed: empty day, multiple birthdays, sourced baogao');
