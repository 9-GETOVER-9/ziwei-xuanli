"""Fetch selected Taoist baogao transcriptions for the offline catalog.

The generated file keeps each source URL and title. Associations to calendar
events are reviewed separately in index.html; this script never infers identity.
"""
import concurrent.futures
import hashlib
import json
import re
import requests
from bs4 import BeautifulSoup
from pathlib import Path

TITLES = '''上元天官大帝宝诰 中元地官大帝宝诰 下元水官大帝宝诰 祖天师宝诰 邱祖宝诰 许真君宝诰 福德正神宝诰 姜太公宝诰 文昌帝君宝诰 东华帝君宝诰 慈航真人宝诰 眼光圣母宝诰 赵元帅宝诰 三茅真君宝诰 中岳大帝宝诰 太阳星君宝诰 妈祖宝诰 鬼谷宝诰 东岳宝诰 吕祖宝诰 碧霞宝诰 神农宝诰 雷祖宝诰 温天君宝诰 邓天君宝诰 城隍宝诰 王灵官宝诰 西王母宝诰 三丰祖师宝诰 北岳宝诰 太阴星君宝诰 酆都宝诰 萨祖宝诰 马天君宝诰 虚靖天师宝诰（已校队） 西岳宝诰 救苦宝诰 南岳宝诰 巧圣仙师宝诰 九天司命宝诰 海琼真人白祖宝诰 北七真宝诰 全真五祖宝诰 五岳总诰 关天君宝诰 天猷元帅宝诰 天蓬元帅宝诰 翊圣元帅宝诰 北斗宝诰 南斗宝诰 九天监生大神宝诰'''.split()
BASE = 'https://doc.daomenwang.com'
TITLES += ['五老宝诰', '玉清宝诰', '葛仙公宝诰', '药王宝诰']
# These pages contain multiple editions and/or commentary after the liturgy.
# Keep one explicitly selected source edition, never concatenate them.
ENDINGS = {
    '祖天师宝诰': ('降魔护道天尊。', '文库首篇（本来南土）'),
    '邱祖宝诰': ('广援普度天尊。', '文库正文；不含注解'),
    '虚靖天师宝诰（已校队）': ('碧霄演教天尊。', '文库首篇（碧霄演教天尊）'),
    '东华帝君宝诰': ('东王木公天尊。', '文库首篇（东王木公）'),
    '南斗宝诰': ('阳明普度天尊。', '文库首篇（太微正曜）'),
    '药王宝诰': ('护国救民灵感孙大真人。', '文库首篇（太极宫中）'),
    '西王母宝诰': ('无极瑶池大圣西王金母天尊。', '文库首篇（天池开泰）'),
}


def extract_text(title, raw):
    start = re.search(r'[志至]心皈命', raw)
    if not start:
        raise ValueError(f'Missing opening: {title}')
    content = raw[start.start():]
    version = '文库所载版本'
    if title in ENDINGS:
        ending, version = ENDINGS[title]
        end = content.find(ending)
        if end < 0:
            raise ValueError(f'Missing reviewed ending: {title}')
        content = content[:end + len(ending)]
    content = re.sub(r'\s+', ' ', content).replace('\u200b', '').strip()
    # Punctuation at the invocation boundary was misplaced in this source.
    if title == '慈航真人宝诰':
        content = content.replace('志心皈命。礼', '志心皈命礼。', 1)
    if (not content or len(content) > 1000
            or len(re.findall(r'[志至]心皈命', content)) != 1
            or re.search(r'!\[|#{1,6}|宝诰注解|以上內容|仅供参考', content)):
        raise ValueError(f'Unexpected liturgy boundary: {title}')
    return content, version

def load(title, links):
    href = links.get(title)
    if not href:
        raise ValueError(f'Missing source: {title}')
    response = requests.get(BASE + href, timeout=30)
    response.raise_for_status()
    area = BeautifulSoup(response.text, 'html.parser').select_one('.markdown-body textarea')
    if not area:
        raise ValueError(f'Missing text: {title}')
    content, version = extract_text(title, area.get_text())
    canonical = title.replace('（已校队）', '')
    return canonical, {'title': canonical, 'text': content, 'version': version,
                       'source': '道门网文库《' + canonical + '》', 'url': BASE + href}

def main():
    response = requests.get(BASE + '/doc/36/', timeout=25)
    response.raise_for_status()
    index = BeautifulSoup(response.text, 'html.parser')
    links = {a.get_text(' ', strip=True): a['href'] for a in index.find_all('a', href=True)
             if re.fullmatch(r'/doc/\d+/', a['href'])}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        records = dict(pool.map(lambda title: load(title, links), sorted(set(TITLES))))
    output = 'const sourceBaogaoCatalog=' + json.dumps(records, ensure_ascii=False, indent=2) + ';\n'
    target = Path(__file__).resolve().parents[1] / 'baogao-catalog.js'
    page = target.with_name('index.html')
    revision = hashlib.sha256(output.encode('utf-8')).hexdigest()[:12]
    html, replacements = re.subn(r'(<script src="baogao-catalog\.js)(?:\?v=[^"]+)?("></script>)',
                                rf'\1?v={revision}\2', page.read_text(encoding='utf-8'))
    if replacements != 1:
        raise ValueError('Expected one catalog script reference; no files written')
    target.write_text(output, encoding='utf-8')
    page.write_text(html, encoding='utf-8')
    print(f'Wrote {len(records)} sourced records to {target.name}')


if __name__ == '__main__':
    main()
