import importlib.util, unittest, tempfile, pathlib, json
s=importlib.util.spec_from_file_location('report','scripts/analytics/origin-report.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class Classification(unittest.TestCase):
 def test_spoof_browser_bot(self): self.assertNotEqual(m.classify('Mozilla/5.0 Chrome/120 Safari/537 GPTBot'),'疑似人类')
 def test_ai_fetcher_not_human(self): self.assertNotEqual(m.classify('Mozilla/5.0 Chrome/120 Safari/537 Claude-User'),'疑似人类')
 def test_microsoft_preview(self): self.assertNotEqual(m.classify('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MicrosoftPreview/2.0; +https://aka.ms/MicrosoftPreview) Chrome/130.0.0.0 Safari/537.36'),'疑似人类')
 def test_unknown_not_human(self): self.assertEqual(m.classify(''),'未知')
 def test_ai_referral_is_human_channel(self): self.assertEqual(m.source('https://chatgpt.com/c/abc','')[0],'AI引荐')
 def test_query_not_exported(self): self.assertEqual(m.source('https://example.com/page?secret=abc','utm_source=linkedin')[2],'https://example.com/page')
 def test_internal(self): self.assertEqual(m.source('https://shimodocs.com/pricing','')[0],'站内')
class Aggregation(unittest.TestCase):
 def test_trusted_proxy_only_and_local_calendar(self):
  with tempfile.TemporaryDirectory() as tmp:
   d=pathlib.Path(tmp);root=d/'site';(root/'pricing').mkdir(parents=True);(root/'pricing/index.html').write_text('page')
   entries=[]
   base={'time':'2026-09-15T16:01:00+00:00','peer':'173.245.48.1','client':'192.0.2.10','host':'shimodocs.com','method':'GET','uri':'/pricing','status':200,'referer':'https://chatgpt.com/','ua':'Mozilla/5.0 Chrome/130 Safari/537'}
   entries.append(base);entries.append({**base,'peer':'192.0.2.11'});entries.append({**base,'host':'43.172.115.22'});entries.append({**base,'ua':'Mozilla/5.0 Chrome/130 Safari/537 GPTBot'});entries.append({**base,'time':'2026-09-15T15:59:00+00:00'})
   (d/'shimodocs-analytics.log').write_text('\n'.join(map(json.dumps,entries)))
   out=m.report('2026-09-16',str(d),str(root))
   self.assertEqual(out['summary']['疑似人类页面浏览'],1);self.assertEqual(out['summary']['已知自动化页面请求'],1);self.assertEqual(out['sourceRows'][0]['渠道'],'AI引荐');self.assertNotIn('192.0.2.10',json.dumps(out))
if __name__=='__main__':unittest.main()
