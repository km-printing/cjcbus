const stops = [
  { id: "51099", elementId: "bus-51099" },
  { id: "51091", elementId: "bus-51091" }
];

async function fetchBusTimings(stopId) {
  try {
    const response = await fetch(`https://arrivelah2.busrouter.sg/?id=${stopId}`);
    const data = await response.json();
    return data.services;
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
  if (diffMins <= 0) return "Arriving";
  return `${diffMins} min`;
}

function renderBusTimings(stopId, services) {
  const container = document.getElementById(`bus-${stopId}`);
  container.innerHTML = "";

  if (!services || services.length === 0) {
    container.innerHTML = "<p>No bus data available</p>";
    return;
  }

  services.forEach(service => {
    const card = document.createElement("div");
    card.className = "bus-card";

    const serviceDiv = document.createElement("div");
    serviceDiv.className = "bus-service";
    serviceDiv.textContent = service.no;

    const timesDiv = document.createElement("div");
    timesDiv.className = "bus-times";

    const nextBus = document.createElement("span");
    nextBus.className = "bus-time";
    nextBus.textContent = `Next: ${formatArrival(service.next.time)}`;

    const next2Bus = document.createElement("span");
    next2Bus.className = "bus-time";
    next2Bus.textContent = `Subsequent: ${formatArrival(service.next2.time)}`;

    timesDiv.appendChild(nextBus);
    timesDiv.appendChild(next2Bus);

    card.appendChild(serviceDiv);
    card.appendChild(timesDiv);

    container.appendChild(card);
  });
}

async function updateAllStops() {
  for (const stop of stops) {
    const services = await fetchBusTimings(stop.id);
    renderBusTimings(stop.id, services);
  }
}

// Initial load
updateAllStops();
// Refresh every 30 seconds
setInterval(updateAllStops, 30000);
