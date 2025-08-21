 <script>
    const stops = {
      college: "51099",
      opposite: "51091"
    };

    const urlParams = new URLSearchParams(window.location.search);
    const selectedBuses = urlParams.get("buses") ? urlParams.get("buses").split(",") : null;
    const selectedSides = urlParams.get("side") ? urlParams.get("side").split(",") : ["college","opposite"];

    async function fetchBusData(stopId) {
      const res = await fetch(`https://arrivelah2.busrouter.sg/?id=${stopId}`);
      return await res.json();
    }

    function getArrivalTimes(services, bus) {
      const svc = services.find(s => s.no === bus);
      if (!svc) return ["-", "-"];
      const t1 = svc.next ? Math.round(svc.next.duration_ms / 60000) : null;
      const t2 = svc.subsequent ? Math.round(svc.subsequent.duration_ms / 60000) : null;
      return [
        t1 !== null ? (t1 === 0 ? "Arr" : `${t1} min`) : "-",
        t2 !== null ? (t2 === 0 ? "Arr" : `${t2} min`) : "-"
      ];
    }

    async function loadTable() {
      const [collegeData, oppositeData] = await Promise.all([
        fetchBusData(stops.college),
        fetchBusData(stops.opposite)
      ]);

      const buses = Array.from(new Set([
        ...collegeData.services.map(s => s.no),
        ...oppositeData.services.map(s => s.no)
      ])).sort((a,b)=>a-b);

      const tbody = document.querySelector("#busTable tbody");
      tbody.innerHTML = "";

      buses.forEach(bus => {
        if (selectedBuses && !selectedBuses.includes(bus)) return;

        const row = document.createElement("tr");
        const busCell = document.createElement("td");
        busCell.textContent = bus;
        row.appendChild(busCell);

        if (selectedSides.includes("college")) {
          const [t1, t2] = getArrivalTimes(collegeData.services, bus);
          row.appendChild(makeCell(`${t1}, ${t2}`));
        } else {
          row.appendChild(makeCell("-"));
        }

        if (selectedSides.includes("opposite")) {
          const [t1, t2] = getArrivalTimes(oppositeData.services, bus);
          row.appendChild(makeCell(`${t1}, ${t2}`));
        } else {
          row.appendChild(makeCell("-"));
        }

        tbody.appendChild(row);
      });

      loadBusOptions(buses);
    }

    function makeCell(content) {
      const td = document.createElement("td");
      td.textContent = content;
      return td;
    }

    function loadBusOptions(buses) {
      const container = document.getElementById("bus-options");
      container.innerHTML = "";
      buses.forEach(bus => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" value="${bus}" ${!selectedBuses || selectedBuses.includes(bus) ? "checked" : ""}> ${bus}`;
        container.appendChild(label);
        container.appendChild(document.createElement("br"));
      });
    }

    document.getElementById("applyFilters").addEventListener("click", () => {
      const chosenBuses = Array.from(document.querySelectorAll("#bus-options input:checked")).map(i => i.value);
      const chosenSides = [];
      if (document.getElementById("side-college").checked) chosenSides.push("college");
      if (document.getElementById("side-opposite").checked) chosenSides.push("opposite");
      const newUrl = `${window.location.pathname}?buses=${chosenBuses.join(",")}&side=${chosenSides.join(",")}`;
      window.location.href = newUrl;
    });

    document.getElementById("saveHome").addEventListener("click", () => {
      alert("To save this page to your Home Screen:\n\nOn iOS Safari: Tap Share → Add to Home Screen\nOn Android Chrome: Tap ⋮ → Add to Home Screen");
    });

    loadTable();
  </script>