export default async function handler(req, res) {
 if (req.method !== 'POST') return res.status(405).json({error:'Método no permitido'});
 if (!process.env.AI_API_KEY) return res.status(503).json({error:'Configura AI_API_KEY en Vercel'});
 const body = req.body || {};
 const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {method:'POST', headers:{Authorization:'Bearer '+process.env.AI_API_KEY,'Content-Type':'application/json'}, body:JSON.stringify({model:'openrouter/free',messages:[{role:'system',content:'Eres Forge, un asistente de programación. No afirmes que ejecutaste código ni modificaste archivos. No tienes terminal ni acceso al repositorio.'},{role:'user',content:String(body.context||'').slice(0,40000)+'\n\n'+String(body.message||'').slice(0,10000)}]})});
 const data = await upstream.json();
 if (!upstream.ok) return res.status(502).json({error:'El proveedor de IA devolvió un error'});
 return res.status(200).json({reply:data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || 'Sin respuesta'});
}
