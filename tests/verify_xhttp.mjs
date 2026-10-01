// 本地模拟 Worker 全链路:POST /api/generate → GET /sub/{id} → 校验 XHTTP 参数
// 用法: node tests/verify_xhttp.mjs
import worker from '../src/worker.js';

const kv = new Map();
const env = {
  SUB_STORE: {
    async get(k) { return kv.get(k) ?? null; },
    async put(k, v) { kv.set(k, v); },
  },
  SUB_ACCESS_TOKEN: '',
  ASSETS: { async fetch() { return new Response('asset'); } },
};

const link = 'vless://9b29150c-d085-4406-a231-a32f4a58c2c0@172.67.196.94:443?encryption=none&security=tls&type=xhttp&path=%2Fh2%2Fk9m2qx&host=cf.guyan1208.top&mode=packet-up&sni=cf.guyan1208.top&fp=chrome#cdn-xhttp';

const genReq = new Request('https://x.test/api/generate', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ nodeLinks: link, preferredIps: '104.16.1.1#测试', namePrefix: 'YT', keepOriginalHost: true }),
});
const genResp = await worker.fetch(genReq, env);
const genData = await genResp.json();
console.log('generate:', genResp.status, JSON.stringify(genData.urls));

const subResp = await worker.fetch(new Request(genData.urls.raw.replace('https://cloudflaresub.ezguyan.workers.dev', 'https://x.test')), env);
const b64 = await subResp.text();
const decoded = Buffer.from(b64, 'base64').toString('utf-8');
console.log('订阅内容:', decoded);

const checks = {
  'mode=packet-up': decoded.includes('mode=packet-up'),
  'encryption=none': decoded.includes('encryption=none'),
  'path 保留': decoded.includes('path=%2Fh2%2Fk9m2qx'),
  'IP 已替换': decoded.includes('@104.16.1.1:443'),
  'sni 保留': decoded.includes('sni=cf.guyan1208.top'),
};
console.log(checks);
console.log(Object.values(checks).every(Boolean) ? 'ALL_PASS' : 'SOME_FAIL');
