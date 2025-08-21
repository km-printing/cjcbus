const stops = {
  "51099": {}, // Side of CJC
  "51091": {}  // Opposite CJC
};

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

function formatArrival(time) {
  if (!time) return "N/A";
  const now = new Date();
  const arrival = new Date(time);
  const diffMins = Math.round((arrival - now) / 60000);
  if (isNaN(diffMins)) return "N/A";   // safeguard
  if (diffMins <= 0) return "Arriving";
  return `${diffMins} min`;
}

function renderTable() {
  const body = document.getElementById("bus-body");
  body.innerHTML = "";

  const allServices = new Set([
    ...Object.keys(stops["51099"]),
    ...Object.keys(stops["51091"])
  ]);

  if (allServices.size === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.textContent = "No data available right now.";
    row.appendChild(cell);
    body.appendChild(row);
    return;
  }

  Array.from(allServices)
    .sort((a, b) => a.localeCompare(b, 'en', {numeric:true}))
    .forEach(busNo => {
      const row = document.createElement("tr");

      // Bus number
      const busCell = document.createElement("td");
      busCell.className = "bus-service";
      busCell.textContent = busNo;
      row.appendChild(busCell);

      // Side of CJC timings
      const sideCell = document.createElement("td");
      const sideData = stops["51099"][busNo];
      sideCell.textContent = sideData 
        ? `Next: ${formatArrival(sideData.next)} | Sub: ${formatArrival(sideData.next2)}`
        : "-";
      row.appendChild(sideCell);

      // Opposite CJC timings
      const oppCell = document.createElement("td");
      const oppData = stops["51091"][busNo];
      oppCell.textContent = oppData 
        ? `Next: ${formatArrival(oppData.next)} | Sub: ${formatArrival(oppData.next2)}`
        : "-";
      row.appendChild(oppCell);

      body.appendChild(row);
    });

  document.getElementById("last-updated").textContent = 
    "Last updated: " + new Date().toLocaleTimeString();
}

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

// Initial load
updateAllStops();
// Refresh every 30s
setInterval(updateAllStops, 30000);
