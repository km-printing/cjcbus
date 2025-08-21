const stops = {
  "51099": {}, // Side of CJC
  "51091": {}  // Opposite CJC
};

let filterBuses = null;
let filterSides = ["51099","51091"];

// Parse query params
function getParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("buses")) {
    filterBuses = params.get("buses").split(",");
  }
  if (params.has("side")) {
    filterSides = params.get("side").split(",");
  }
}

// Fetch bus data
async function fetchBusTimings(stopId) {
  try {
    const response = await fetch(`https://arrivelah2.busrouter.sg/?id=${stopId}`);
    const data = await response.json();
    return data.services || [];
  } catch (error) {
    console.error("Error fetching bus timings:", error);
    return [];
  }
}

// Format arrival
function formatArrival(time) {
  if (!time) return "N/A";
  const now = new Date();
  const arrival = new Date(time);
  const diffMins = Math.round((arrival - now) / 60000);
  if (isNaN(diffMins)) return "N/A";
  if (diffMins <= 0) return "Arriving";
  return `${diffMins} min`;
}

// Render table
function renderTable() {
  const body = document.getElementById("bus-body");
  body.innerHTML = "";

  const allServices = new Set([
    ...Object.keys(stops["51099"]),
    ...Object.keys(stops["51091"])
  ]);

  let servicesToShow = Array.from(allServices);
  if (filterBuses) {
    servicesToShow = servicesToShow.filter(svc => filterBuses.includes(svc));
  }

  if (servicesToShow.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.textContent = "No buses to display.";
    row.appendChild(cell);
    body.appendChild(row);
    return;
  }

  servicesToShow.sort((a, b) => a.localeCompare(b, 'en', {numeric:true}))
  .forEach(busNo => {
    const row = document.createElement("tr");

    const busCell = document.createElement("td");
    busCell.className = "bus-service";
    busCell.textContent = busNo;
    row.appendChild(busCell);

    ["51099","51091"].forEach(stopId => {
      const cell = document.createElement("td");
      cell.classList.add(`col-${stopId}`);
      if (!filterSides.includes(stopId)) {
        cell.style.display = "none";
      } else {
        const data = stops[stopId][busNo];
        cell.textContent = data 
          ? `Next: ${formatArrival(data.next)} | Sub: ${formatArrival(data.next2)}`
          : "-";
      }
      row.appendChild(cell);
    });

    body.appendChild(row);
  });

  // Hide table columns if not selected
  document.querySelectorAll("th.col-51099, td.col-51099").forEach(el => {
    el.style.display = filterSides.includes("51099") ? "" : "none";
  });
  document.querySelectorAll("th.col-51091, td.col-51091").forEach(el => {
    el.style.display = filterSides.includes("51091") ? "" : "none";
  });

  document.getElementById("last-updated").textContent = 
    "Last updated: " + new Date().toLocaleTimeString();

  populateCustomiseOptions(allServices);
}

// Populate customise checkboxes
function populateCustomiseOptions(allServices) {
  const container = document.getElementById("bus-options");
  container.innerHTML = "";
  Array.from(allServices).sort((a, b) => a.localeCompare(b, 'en', {numeric:true}))
  .forEach(busNo => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" name="bus" value="${busNo}" 
      ${!filterBuses || filterBuses.includes(busNo) ? "checked" : ""}> ${busNo}`;
    container.appendChild(label);
  });
}

// Customise link generator
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generate-link").addEventListener("click", () => {
    const form = document.getElementById("customise-form");
    const buses = Array.from(form.querySelectorAll("input[name='bus']:checked")).map(i => i.value);
    const sides = Array.from(form.querySelectorAll("input[name='side']:checked")).map(i => i.value);

    let url = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    if (buses.length > 0) params.set("buses", buses.join(","));
    if (sides.length > 0 && sides.length < 2) params.set("side", sides.join(","));
    url += "?" + params.toString();

    const linkP = document.getElementById("custom-link");
    linkP.innerHTML = `Your custom link: <a href="${url}">${url}</a>`;
  });

  document.getElementById("save-link").addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied! Paste it into Safari/Chrome menu → 'Add to Home Screen'.");
  });
});

// Update cycle
async function updateAllStops() {
  for (const stopId of Object.keys(stops)) {
    const services = await fetchBusTimings(stopId);
    stops[stopId] = {};
    services.forEach(svc => {
      stops[stopId][svc.no] = {
        next: svc.next?.time || null,
        next2: svc.next2?.time || null
      };
    });
  }
  renderTable();
}

// Init
getParams();
updateAllStops();
setInterval(updateAllStops, 30000);
