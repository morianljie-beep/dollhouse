export const config = {
  api: {
    bodyParser: false, // 关掉 Vercel 默认的解析，防止 WebDAV 格式报错
  },
};

export default async function handler(req, res) {
  // 1. 跨域放行
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,OPTIONS,PUT,DELETE,PROPFIND');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // 2. 拦截浏览器的探路请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 拼接坚果云地址
  const targetUrl = 'https://dav.jianguoyun.com/dav' + req.url;

  try {
    const headers = {
      'Authorization': req.headers.authorization || '',
    };
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    // 4. 读取原始数据流（防止数据变形）
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
    }

    // 5. 转发给坚果云
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'follow',
    });

    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).send(error.message);
  }
}
