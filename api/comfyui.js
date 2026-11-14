import { requireSession } from "./auth.js";

const json = (res, status, body) => { res.setHeader("Cache-Control","no-store"); return res.status(status).json(body); };
export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };\n\nconst MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/png","image/jpeg","image/webp"]);
const replaceTokens = (value, replacements) => {
  if (typeof value === "string") return replacements[value] ?? value;
  if (Array.isArray(value)) return value.map(v => replaceTokens(v,replacements));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replaceTokens(v,replacements)]));
  return value;
};

export default async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  if (!requireSession(req,res)) return;
  const base = String(process.env.COMFYUI_URL || "").replace(/\/$/,"");
  const token = process.env.COMFYUI_API_TOKEN || "";
  if (!base) return json(res,503,{error:"Motor ComfyUI no configurado. Define COMFYUI_URL en las variables privadas de Vercel."});
  if (req.method === "POST") {
    const {prompt,image,mimeType,fileName,authorized} = req.body || {};
    if (authorized !== true) return json(res,403,{error:"Confirma que tienes autorización para usar esta imagen y que no se utilizará para crear contenido íntimo no consentido."});
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length>4000) return json(res,400,{error:"La instrucción debe tener entre 1 y 4.000 caracteres."});
    if (typeof image !== "string" || !image.startsWith("data:") || !TYPES.has(mimeType)) return json(res,415,{error:"Adjunta una imagen PNG, JPG o WebP."});
    const bytes=Buffer.from(image.slice(image.indexOf(",")+1),"base64");
    if (!bytes.length || bytes.length>MAX_BYTES) return json(res,413,{error:"La imagen debe pesar como máximo 8 MB."});
    let workflow;
    try { workflow=JSON.parse(process.env.COMFYUI_WORKFLOW_JSON || ""); }
    catch { return json(res,503,{error:"COMFYUI_WORKFLOW_JSON no contiene un JSON válido."}); }
    if (!workflow || typeof workflow!=="object") return json(res,503,{error:"Configura un workflow API de ComfyUI en COMFYUI_WORKFLOW_JSON."});
    const headers=token?{Authorization:"Bearer "+token}:{};
    try {
      const form=new FormData();
      form.append("image",new Blob([bytes],{type:mimeType}),(fileName||"nexus-image").replace(/[^a-zA-Z0-9._-]/g,"_"));
      form.append("type","input"); form.append("overwrite","true");
      const uploaded=await fetch(base+"/upload/image",{method:"POST",headers,body:form,signal:AbortSignal.timeout(30000)});
      const uploadData=await uploaded.json().catch(()=>({}));
      if(!uploaded.ok || !uploadData.name) return json(res,502,{error:uploadData.error||"ComfyUI no pudo recibir la fotografía."});
      const graph=replaceTokens(workflow,{"__NEXUS_PROMPT__":prompt.trim(),"__NEXUS_IMAGE__":uploadData.name});
      const queued=await fetch(base+"/prompt",{method:"POST",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify({prompt:graph,client_id:"nexus-image-studio"}),signal:AbortSignal.timeout(30000)});
      const queueData=await queued.json().catch(()=>({}));
      if(!queued.ok || !queueData.prompt_id) return json(res,502,{error:queueData.error?.message||"ComfyUI rechazó el workflow. Revisa los nodos y modelos instalados."});
      return json(res,202,{promptId:queueData.prompt_id,status:"queued"});
    } catch(error) { return json(res,502,{error:error.name==="TimeoutError"?"ComfyUI tardó demasiado en responder.":"No fue posible conectar con el motor ComfyUI."}); }
  }
  if(req.method==="GET") {
    const promptId=String(req.query?.promptId||"");
    if(!/^[a-f0-9-]{8,80}$/i.test(promptId)) return json(res,400,{error:"Identificador de tarea no válido."});
    try {
      const headers=token?{Authorization:"Bearer "+token}:{};
      const response=await fetch(base+"/history/"+encodeURIComponent(promptId),{headers,signal:AbortSignal.timeout(20000)});
      const history=await response.json().catch(()=>({}));
      if(!response.ok) return json(res,502,{error:"No se pudo consultar el estado de ComfyUI."});
      const entry=history[promptId];
      if(!entry) return json(res,200,{status:"running"});
      if(entry.status?.status_str==="error" || entry.status?.completed===false && entry.status?.messages?.some(m=>m[0]==="execution_error")) return json(res,200,{status:"failed",error:"ComfyUI no pudo completar el workflow."});
      const outputs=entry.outputs||{};
      for(const node of Object.values(outputs)) {
        const files=[...(node.images||[]),...(node.gifs||[])];
        if(files.length) {
          const f=files[0],url=new URL(base+"/view");
          url.searchParams.set("filename",f.filename);url.searchParams.set("subfolder",f.subfolder||"");url.searchParams.set("type",f.type||"output");
          const result=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});
          if(!result.ok) continue;
          const buffer=Buffer.from(await result.arrayBuffer());
          if(buffer.length>15*1024*1024) return json(res,413,{error:"El resultado supera el límite de descarga."});
          const mime=result.headers.get("content-type")||"image/png";
          return json(res,200,{status:"completed",image:"data:"+mime+";base64,"+buffer.toString("base64")});
        }
      }
      return json(res,200,{status:"running"});
    } catch(error) { return json(res,502,{error:"No se pudo consultar el resultado en ComfyUI."}); }
  }
  res.setHeader("Allow","GET, POST");
  return json(res,405,{error:"Método no permitido."});
}
