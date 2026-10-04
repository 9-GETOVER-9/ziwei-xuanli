const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1].replace(/\binit\(\);\s*$/, '');
assert.ok(script, '页面脚本应存在');
const code = fs.readFileSync(path.join(root, 'baogao-catalog.js'), 'utf8') +
  fs.readFileSync(path.join(root, 'baogao-pinyin.js'), 'utf8') + script;
const context = vm.createContext({ Date, Intl, console });
vm.runInContext(code, context);
const elements = new Map();
context.document = {
  body: { style: {} },
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, {
      innerHTML: '', scrollTop: 0, classList: { add() {}, remove() {} },
      querySelector() { return null; }, querySelectorAll() { return []; },
    });
    return elements.get(selector);
  },
};
context.location = { hash: '' };

for (const id of ['ziwei', 'gouchen', 'nanji', 'tianpeng', 'tianyou', 'zhenwu', 'yuhuang', 'doumu', 'houtu', 'yisheng', 'biyuewu', 'laojun', 'lingbao', 'caibo', 'siming']) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'deities', id + '.webp')), id + ' portrait missing');
  const rendered = vm.runInContext(`renderBaogao('${id}')`, context);
  if (!['biyuewu'].includes(id)) {
    assert.match(rendered, /<ruby>/, id + ' should show pinyin');
    assert.match(rendered, /拼音初稿/, id + ' pinyin needs review label');
  }
  if (id !== 'biyuewu') assert.match(rendered, /出处：/, id + ' needs source');
  else assert.match(rendered, /尚未找到可核对的专属宝诰/, 'Bijuewu should not receive an invented text');
}
const audit = JSON.parse(vm.runInContext(`JSON.stringify(fixed.filter(e => isDivineEvent(e) && baogaoRecords(e).length).map(e => ({name:e.name, titles:baogaoRecords(e).map(r=>r.title), html:renderEventBaogao(e,true)})))`, context));
const ziweiText = vm.runInContext("renderBaogao('ziwei')", context);
assert.match(ziweiText, /<ruby>法<rt>fǎ<\/rt><\/ruby><ruby>号/);
assert.doesNotMatch(ziweiText, /佛号/);
assert.equal(audit.length, 105, 'all sourced divine events should have a reading page');
for (const event of audit) {
  assert.match(event.html, /出处：/, event.name + ' needs source');
  assert.match(event.html, /<ruby>/, event.name + ' needs pinyin draft');
  vm.runInContext(`renderEventPage(fixed.find(e=>e.name===${JSON.stringify(event.name)}))`, context);
  assert.match(elements.get('#deityPageBody').innerHTML, /对应文本/, event.name + ' page should render');
}
vm.runInContext('renderCatalogIndex()', context);
assert.equal((elements.get('#catalogContent').innerHTML.match(/class="catalog-card"/g) || []).length, 105);
assert.match(html, /data-deity="houtu"/, 'four ministers graph should include Houtu');
assert.match(html, /data-event="南斗六司下降 · 第1日"/, 'graph should link South Dipper');
console.log('deity portrait and pinyin page checks passed');
