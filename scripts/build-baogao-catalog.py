"""Fetch selected Taoist baogao transcriptions for the offline catalog.

The generated file keeps each source URL and title. Associations to calendar
events are reviewed separately in index.html; this script never infers identity.
"""
import concurrent.futures
import json
import re
import requests
from bs4 import BeautifulSoup
from pathlib import Path

TITLES = '''上元天官大帝宝诰 中元地官大帝宝诰 下元水官大帝宝诰 祖天师宝诰 邱祖宝诰 许真君宝诰 福德正神宝诰 姜太公宝诰 文昌帝君宝诰 东华帝君宝诰 慈航真人宝诰 眼光圣母宝诰 赵元帅宝诰 三茅真君宝诰 中岳大帝宝诰 太阳星君宝诰 妈祖宝诰 鬼谷宝诰 东岳宝诰 吕祖宝诰 碧霞宝诰 神农宝诰 雷祖宝诰 温天君宝诰 邓天君宝诰 城隍宝诰 王灵官宝诰 西王母宝诰 三丰祖师宝诰 北岳宝诰 太阴星君宝诰 酆都宝诰 萨祖宝诰 马天君宝诰 虚靖天师宝诰（已校队） 西岳宝诰 救苦宝诰 南岳宝诰 巧圣仙师宝诰 九天司命宝诰 海琼真人白祖宝诰 北七真宝诰 全真五祖宝诰 五岳总诰 关天君宝诰 天猷元帅宝诰 天蓬元帅宝诰 翊圣元帅宝诰 北斗宝诰 南斗宝诰 九天监生大神宝诰'''.split()
BASE = 'https://doc.daomenwang.com'
TITLES += ['五老宝诰', '玉清宝诰', '葛仙公宝诰', '药王宝诰']
session = requests.Session()
index = BeautifulSoup(session.get(BASE + '/doc/36/', timeout=25).text, 'html.parser')
links = {a.get_text(' ', strip=True): a['href'] for a in index.find_all('a', href=True) if re.fullmatch(r'/doc/\d+/', a['href'])}

def load(title):
    href = links.get(title)
    if not href:
        raise ValueError(f'Missing source: {title}')
    response = session.get(BASE + href, timeout=30)
    response.raise_for_status()
    area = BeautifulSoup(response.text, 'html.parser').select_one('.markdown-body textarea')
    if not area:
        raise ValueError(f'Missing text: {title}')
    content = re.sub(r'\s+', ' ', area.get_text(' ', strip=True)).strip()
    if not content or len(content) > 3000:
        raise ValueError(f'Unexpected text length: {title}: {len(content)}')
    return title, {'title': title, 'text': content, 'source': '道门网文库《' + title + '》收录版本', 'url': BASE + href}

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    records = dict(pool.map(load, sorted(set(TITLES))))
output = 'const sourceBaogaoCatalog=' + json.dumps(records, ensure_ascii=False, separators=(',', ':')) + ';\n'
Path('baogao-catalog.js').write_text(output, encoding='utf-8')
print(f'Wrote {len(records)} sourced records to baogao-catalog.js')
