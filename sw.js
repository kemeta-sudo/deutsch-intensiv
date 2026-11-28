/* Deutsch Intensiv : fonctionnement hors ligne. Version 202611280958 */
const V="deutsch-intensiv-v1";
const CORE=["./","index.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(r.mode==="navigate"||(u.origin===location.origin&&(u.pathname.endsWith("/")||u.pathname.endsWith("/index.html")))){
    /* la page : réseau d'abord pour recevoir les mises à jour ; au bout de 4 s ou hors ligne, la copie enregistrée */
    e.respondWith(new Promise(res=>{
      let done=false;const fromCache=()=>caches.match("index.html").then(c=>{if(c&&!done){done=true;res(c)}return c});
      const t=setTimeout(fromCache,4000);
      fetch(r).then(resp=>{clearTimeout(t);if(resp.ok){const cp=resp.clone();caches.open(V).then(c=>c.put("index.html",cp))}if(!done){done=true;res(resp)}})
        .catch(()=>{clearTimeout(t);fromCache().then(c=>{if(!c&&!done){done=true;res(Response.error())}})});
    }));return;
  }
  if(u.origin===location.origin||/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    /* fichiers de l'app et polices : copie enregistrée d'abord */
    e.respondWith(caches.match(r).then(c=>c||fetch(r).then(resp=>{if(resp.ok||resp.type==="opaque"){const cp=resp.clone();caches.open(V).then(ca=>ca.put(r,cp))}return resp})));
  }
});
