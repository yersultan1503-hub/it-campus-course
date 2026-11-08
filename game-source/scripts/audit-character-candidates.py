"""Read-only public metadata audit; no auth, binary downloads, purchases or scripts."""
import concurrent.futures,datetime,json,urllib.request,urllib.error
from pathlib import Path
CANDIDATES={
 'naruto-run':'db14fc3de5b34b738e49ec3cdb83770a',
 'naruto-walk':'505860183544421a898c132d09dcd2b7',
 'tom-whiskers':'a554a10be2d64d1aac1ea401275e5357',
 'jerry-whiskers':'a73d5990e2da43c4a478cc15f0d7ad92',
 'tom-multiversus':'dc60af62b20c49228584fd91451008a9',
 'jerry-rigged':'1b778cbc0c7f4a93b05cd38a06fbd5ce',
 'optimus-transform':'35f9cb09b1b248c7bd6b12912ac8cd3a',
 'optimus-animated-series':'1c8b5934bc8347b9b63cb1b10e4d3726'
}
def get(url):
 try:
  with urllib.request.urlopen(url,timeout=20) as response:return {'status':response.status,'data':json.load(response)}
 except urllib.error.HTTPError as error:
  try:data=json.loads(error.read(3000))
  except Exception:data=None
  return {'status':error.code,'data':data}
 except Exception as error:return {'status':None,'error':str(error)}
def audit(item):
 key,uid=item;base='https://api.sketchfab.com/v3/models/'+uid
 model=get(base);d=model.get('data') or {};u=d.get('user') or {}
 result={'candidate':key,'uid':uid,'source':d.get('viewerUrl'),'metadataUrl':base,'metadataStatus':model['status'],**{k:d.get(k) for k in ['name','description','isDownloadable','animationCount','faceCount','vertexCount','license']},'uploader':{k:u.get(k) for k in ['displayName','username','profileUrl']}}
 result['downloadWithoutAuthentication']=get(base+'/download')
 return result
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(audit,CANDIDATES.items()))
 out=Path(__file__).resolve().parents[1]/'asset-audit'/'sketchfab-metadata.json'
 out.write_text(json.dumps({'checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Public metadata + unauthenticated official download endpoint; no model binaries acquired','results':results},ensure_ascii=False,indent=2))
 for r in results:print(r['candidate'],r['metadataStatus'],'animations=',r['animationCount'],'download=',r['downloadWithoutAuthentication']['status'])
