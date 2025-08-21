const STOP_IDS = ["51099", "51091"];
const REFRESH_MS = 30000;
const stops = { "51099": {}, "51091": {} };

let filterBuses = null;
let filterSides = ["51099", "51091"];

function sanitizeList(str) {
  return (str || "").split(",").map(s=>s.trim().toUpperCase()).filter(Boolean);
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  const busKey = ["buses","bus","services","service"].find(k=>params.has(k));
  if(busKey) filterBuses = sanitizeList(params.get(busKey));

  const sideKey = ["side","sides"].find(k=>params.has(k));
  if(sideKey) {
    const sides = sanitizeList(params.get(sideKey));
    filterSides = sides.filter(s=>STOP_IDS.includes(s));
  }
}

async function fetchBusTimings(stopId){
  try{
    const res = await fetch(`https://arrivelah2.busrouter.sg/?id=${stopId}`, {cache:"no-store"});
    const data = await res.json();
    return Array.isArray(data.services)? data.services : [];
  } catch(e){ console.error(e); return []; }
}

function formatArrival(time){
  if(!time) return "-";
  const now = new Date();
  const t = new Date(time);
  const diff = Math.round((t-now)/60000);
  if(isNaN(diff)) return "-";
  if(diff<=0) return "Arriving";
  return `${diff} min`;
}

function populateCustomiseOptions(allServices){
  const box = document.getElementById("bus-options");
  if(!box) return;
  if(!allServices.length){ box.textContent="No services available yet."; return; }
  box.innerHTML="";
  allServices.sort((a,b)=>a.localeCompare(b,'en',{numeric:true}))
    .forEach(busNo=>{
      const label = document.createElement("label");
      label.className="cb";
      const checked = !filterBuses || filterBuses.includes(busNo);
      label.innerHTML=`<input type="checkbox" name="bus" value="${busNo}" ${checked?"checked":""}> ${busNo}`;
      box.appendChild(label);
    });
}

function renderTable(){
  const tbody = document.getElementById("bus-body");
  tbody.innerHTML="";

  const union = new Set([...Object.keys(stops["51099"]), ...Object.keys(stops["51091"])]);
  const allServices = Array.from(union);

  populateCustomiseOptions(allServices);

  let showServices = allServices;
  if(filterBuses){
    const set = new Set(filterBuses.map(s=>s.toUpperCase()));
    showServices = allServices.filter(svc => set.has(svc.toUpperCase()));
  }

  if(showServices.length===0){
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan=3; td.textContent="No buses to display for the selected filters.";
    tr.appendChild(td); tbody.appendChild(tr);
  } else {
    showServices.sort((a,b)=>a.localeCompare(b,'en',{numeric:true})).forEach(busNo=>{
      const tr=document.createElement("tr");
      const busCell=document.createElement("td"); busCell.textContent=busNo; busCell.className="bus-service";
      tr.appendChild(busCell);

      STOP_IDS.forEach(stopId=>{
        const td=document.createElement("td"); td.classList.add(`col-${stopId}`);
        if(!filterSides.includes(stopId)){ td.style.display="none"; }
        else{
          const d=stops[stopId][busNo];
          td.textContent=d?`Next: ${formatArrival(d.next)} | Sub: ${formatArrival(d.next2)}`:"-";
        }
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  document.querySelectorAll("th.col-51099, td.col-51099").forEach(el=>{el.style.display=filterSides.includes("51099")?"":"none";});
  document.querySelectorAll("th.col-51091, td.col-51091").forEach(el=>{el.style.display=filterSides.includes("51091")?"":"none";});
  document.getElementById("last-updated").textContent="Last updated: "+new Date().toLocaleTimeString();
}

function bindCustomiseActions(){
  const genBtn=document.getElementById("generate-link");
  const saveBtn=document.getElementById("save-link");
  const linkP=document.getElementById("custom-link");

  if(genBtn){
    genBtn.addEventListener("click",()=>{
      const form=document.getElementById("customise-form");
      const buses=Array.from(form.querySelectorAll("input[name='bus']:checked")).map(i=>i.value.toUpperCase());
      const sides=Array.from(form.querySelectorAll("input[name='side']:checked")).map(i=>i.value);
      let url=window.location.origin+window.location.pathname;
      const params=new URLSearchParams();
      if(buses.length) params.set("buses",buses.join(","));
      if(sides.length) params.set("side",sides.join(","));
      const full=`${url}?${params.toString()}`;
      linkP.innerHTML=`Your custom link: <a href="${full}">${full}</a>`;
      window.location.href=full;
    });
  }

  if(saveBtn){
    saveBtn.addEventListener("click", async ()=>{
      try{ await navigator.clipboard.writeText(window.location.href); alert("Link copied! Use your browser menu → 'Add to Home Screen'."); }
      catch{ alert("Copy failed. Manually copy the URL from address bar."); }
    });
  }
}

async function updateAllStops(){
  for(const stopId of STOP_IDS){
    const services=await fetchBusTimings(stopId);
    stops[stopId]={};
    services.forEach(svc=>{
      const no
