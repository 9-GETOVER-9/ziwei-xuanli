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

for (const id of ['ziwei', 'gouchen', 'nanji', 'tianpeng', 'tianyou', 'zhenwu']) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'deities', id + '.webp')), id + ' portrait missing');
  const rendered = vm.runInContext(`renderBaogao('${id}')`, context);
  assert.match(rendered, /<ruby>/, id + ' should show pinyin');
  assert.match(rendered, /拼音初稿/, id + ' pinyin needs review label');
  assert.match(rendered, /出处：/, id + ' needs source');
}
console.log('deity portrait and pinyin page checks passed');
