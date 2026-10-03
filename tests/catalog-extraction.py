"""Regression tests for source pages with versions, commentary and images."""
import importlib.util
from pathlib import Path
import unittest

module_path = Path(__file__).resolve().parents[1] / 'scripts' / 'build-baogao-catalog.py'
spec = importlib.util.spec_from_file_location('catalog_builder', module_path)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class ExtractionTests(unittest.TestCase):
    def test_commentary_is_not_part_of_liturgy(self):
        raw = '邱祖宝诰\n至心皈命礼。隐显莫测。广援普度天尊。\n![](/image.png)\n## 邱祖宝诰注解\n现代讲解'
        text, _ = builder.extract_text('邱祖宝诰', raw)
        self.assertEqual(text, '至心皈命礼。隐显莫测。广援普度天尊。')

    def test_multiple_editions_are_not_concatenated(self):
        raw = '志心皈命礼。太微正曜。阳明普度天尊。\n另一版\n至心皈命礼。位崇南极。南斗六司延寿星君。'
        text, version = builder.extract_text('南斗宝诰', raw)
        self.assertNotIn('位崇南极', text)
        self.assertIn('首篇', version)

    def test_changed_or_unknown_boundary_stops_generation(self):
        for title, raw in [('邱祖宝诰', '志心皈命礼。终句已变。'),
                           ('未知宝诰', '志心皈命礼。正文。\n## 注解'),
                           ('未知宝诰', '志心皈命礼。版本一。至心皈命礼。版本二。')]:
            with self.subTest(title=title, raw=raw), self.assertRaises(ValueError):
                builder.extract_text(title, raw)


if __name__ == '__main__':
    unittest.main()
