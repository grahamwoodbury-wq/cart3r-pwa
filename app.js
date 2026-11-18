const $ = (s) => document.querySelector(s);
const chat = $("#chat"), workspace = $("#workspace");
let backend = localStorage.getItem("cart3r_backend") || "";
let token = sessionStorage.getItem("cart3r_token") || "";

function addBubble(role, text) {
  const el = document.createElement("div");
  el.className = `bubble ${role}`;
  const label = document.createElement("b"); label.textContent = role === "user" ? "YOU" : "CART3R";
  const p = document.createElement("p"); p.textContent = text;
  el.append(label,p); chat.append(el); chat.scrollTop = chat.scrollHeight;
}
function setStatus(online, label) {
  $("#statusText").textContent = label;
  $(".pulse").classList.toggle("online", online);
  $("#systemState").textContent = online ? "Connected" : "Not connected";
}
function authHeaders(){ return {"Authorization":`Bearer ${token}`,"Content-Type":"application/json"}; }
async function api(path, options={}) {
  if(!backend || !token) throw new Error("Add your backend address and access token in Settings first.");
  const res = await fetch(backend.replace(/\/+$/,"")+path,{...options,headers:{...authHeaders(),...(options.headers||{})}});
  if(!res.ok) throw new Error(`Server returned ${res.status}. Check the backend address, token and server logs.`);
  return res.json();
}
async function checkConnection(){
  try { await api("/health"); setStatus(true,"ONLINE"); }
  catch(e){ setStatus(false,"OFFLINE"); }
}
$("#chatForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const input=$("#prompt"), objective=input.value.trim(); if(!objective)return;
  addBubble("user",objective); input.value=""; $("#sendBtn").disabled=true;
  const wait=document.createElement("div"); wait.className="bubble bot"; wait.textContent="CART3R is working…"; chat.append(wait); chat.scrollTop=chat.scrollHeight;
  try {
    const result=await api("/agent/run",{method:"POST",body:JSON.stringify({objective})});
    wait.remove(); addBubble("bot",result.answer || "Task completed.");
    setStatus(true,"ONLINE");
  } catch(err){ wait.remove(); addBubble("bot",`Connection issue: ${err.message}`); setStatus(false,"OFFLINE"); }
  finally { $("#sendBtn").disabled=false; }
});
function showSettings(){
  workspace.innerHTML="";
  const wrap=document.createElement("div");
  wrap.innerHTML=`<div class="field"><label for="backend">Backend URL (https://…)</label><input id="backend" placeholder="https://your-cart3r-server.example"></div><div class="field"><label for="token">CART3R access token</label><input id="token" type="password" placeholder="Paste your backend token"></div><button class="action" id="saveConfig">Save & test connection</button><p class="hint">Use the private HTTPS address of your deployed CART3R backend. The token is kept only for this browser session; the server must be configured to allow this website's origin.</p>`;
  workspace.append(wrap); $("#backend").value=backend; $("#token").value=token;
  $("#saveConfig").onclick=async()=>{
    backend=$("#backend").value.trim().replace(/\/+$/,""); token=$("#token").value.trim();
    if(!backend.startsWith("https://")){alert("Enter a secure https:// backend address.");return;}
    if(!token){alert("Enter the backend access token.");return;}
    localStorage.setItem("cart3r_backend",backend); sessionStorage.setItem("cart3r_token",token);
    await checkConnection(); alert($("#statusText").textContent==="ONLINE"?"CART3R connected.":"Could not connect. Check the URL, token and CORS settings.");
  };
}
async function showList(kind){
  workspace.innerHTML="<p class='muted'>Loading…</p>";
  try{
    const data=await api("/"+kind);
    const rows=data[kind]||[];
    workspace.innerHTML="";
    if(!rows.length){workspace.innerHTML="<p class='muted'>Nothing saved here yet.</p>";return;}
    rows.forEach(item=>{
      const el=document.createElement("div");el.className="entry";
      const title=document.createElement("b");
      title.textContent=item.title || item.action || `Item ${item.id}`;
      const detail=document.createElement("small");
      detail.textContent=item.body || item.details || item.status || "";
      el.append(title,detail);workspace.append(el);
    });
  }catch(e){workspace.innerHTML="";const p=document.createElement("p");p.className="muted";p.textContent=e.message;workspace.append(p);}
}
async function showApprovals(){
  workspace.innerHTML="<p class='muted'>Loading…</p>";
  try{
    const data=await api("/approvals"); workspace.innerHTML="";
    const rows=data.approvals||[];
    if(!rows.length){workspace.innerHTML="<p class='muted'>No proposals waiting for review.</p>";return;}
    rows.forEach(item=>{
      const el=document.createElement("div");el.className="entry";
      const title=document.createElement("b");title.textContent=item.action+" · "+item.status;
      const detail=document.createElement("small");detail.textContent=item.details;
      el.append(title,detail);
      if(item.status==="pending"){
        for(const decision of ["approve","reject"]){
          const btn=document.createElement("button");btn.className="action "+(decision==="reject"?"secondary":"");btn.textContent=decision==="approve"?"Record approval":"Reject";
          btn.onclick=async()=>{try{await api(`/approvals/${item.id}/review`,{method:"POST",body:JSON.stringify({decision})});showApprovals();}catch(e){alert(e.message);}};
          el.append(btn);
        }
      }
      workspace.append(el);
    });
    const note=document.createElement("p");note.className="hint";note.textContent="Approvals only record your decision; they do not execute external actions.";workspace.append(note);
  }catch(e){workspace.innerHTML="";const p=document.createElement("p");p.className="muted";p.textContent=e.message;workspace.append(p);}
}
document.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>{
  const view=btn.dataset.view;
  if(view==="settings")showSettings(); else if(view==="approvals")showApprovals(); else showList(view);
}));
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
checkConnection();