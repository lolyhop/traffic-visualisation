let countryStats = new Map();

const COUNTRY_COORDINATES = {
  RU: { minLat: 41.2, maxLat: 81.9, minLng: 19.2, maxLng: 169.0 },
  FR: { minLat: 41.3, maxLat: 51.1, minLng: -5.1, maxLng: 9.6 },
  DE: { minLat: 47.3, maxLat: 55.1, minLng: 5.9, maxLng: 15.0 },
  GB: { minLat: 49.9, maxLat: 60.9, minLng: -8.6, maxLng: 1.8 },
  IT: { minLat: 35.5, maxLat: 47.1, minLng: 6.6, maxLng: 18.5 },
  CN: { minLat: 18.2, maxLat: 53.6, minLng: 73.6, maxLng: 134.8 },
  JP: { minLat: 24.0, maxLat: 45.5, minLng: 122.9, maxLng: 153.9 },
  IN: { minLat: 6.8, maxLat: 35.5, minLng: 68.2, maxLng: 97.4 },
  US: { minLat: 24.5, maxLat: 49.4, minLng: -124.7, maxLng: -66.9 },
  CA: { minLat: 41.7, maxLat: 83.1, minLng: -141.0, maxLng: -52.6 },
};

function getCountryFromCoordinates(lat, lng) {
  for (const [countryCode, bounds] of Object.entries(COUNTRY_COORDINATES)) {
    if (
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lng >= bounds.minLng &&
      lng <= bounds.maxLng
    ) {
      return countryCode;
    }
  }
  return "OTHER";
}

function startSendingPackets() {
  const startButton = document.getElementById("start-button");
  startButton.disabled = true;
  startButton.textContent = "Sending...";

  fetch(`${SENDER_URL}/start_packages_sending`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Started sending packets:", data);
    })
    .catch((error) => {
      console.error("Error starting packet sending:", error);
      startButton.disabled = false;
      startButton.textContent = "Start Sending Packets";
    });
}

function startPolling() {
  if (isPolling) return;

  isPolling = true;
  pollData();

  setInterval(pollData, POLL_INTERVAL);
}

function updateCountryStats(packet) {
  try {
    const countryCode = getCountryFromCoordinates(
      packet.latitude,
      packet.longitude
    );
    const count = countryStats.get(countryCode) || 0;
    countryStats.set(countryCode, count + 1);
    updateCountryDisplay();
  } catch (error) {
    console.error("Error updating country stats:", error);
  }
}

function updateCountryDisplay() {
  const countryList = document.getElementById("country-list");
  if (!countryList) return;

  countryList.innerHTML = "";

  const sortedCountries = Array.from(countryStats.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([code]) => code !== "OTHER")
    .slice(0, 5); // Top 5 only

  const maxCount = sortedCountries[0]?.[1] || 0;

  sortedCountries.forEach(([countryCode, count], index) => {
    const item = document.createElement("div");
    item.className = "country-item";
    item.style.position = "relative";

    const bar = document.createElement("div");
    bar.className = "country-bar";
    bar.style.width = `${(count / maxCount) * 100}%`;

    const nameDiv = document.createElement("div");
    nameDiv.className = "country-name";

    const position = document.createElement("span");
    position.className = "position";
    position.textContent = `#${index + 1} `;
    const flag = document.createElement("img");
    flag.className = "country-flag";
    flag.src = `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
    flag.alt = countryCode;
    flag.onerror = () => {
      flag.style.display = "none";
    };

    nameDiv.appendChild(position);
    nameDiv.appendChild(flag);
    nameDiv.appendChild(document.createTextNode(getCountryName(countryCode)));

    const countDiv = document.createElement("div");
    countDiv.className = "country-count";
    countDiv.textContent = count;

    item.appendChild(bar);
    item.appendChild(nameDiv);
    item.appendChild(countDiv);
    countryList.appendChild(item);
  });
}

function getCountryName(countryCode) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode);
  } catch (error) {
    return countryCode;
  }
}

function pollData() {
  fetch(`${SERVER_URL}/get_data`)
    .then((response) => response.json())
    .then((response) => {
      if (response.status === 200 && response.data) {
        const newPackets = response.data.filter((packet) => {
          return !packetsData.some(
            (p) =>
              p.ip_address === packet.ip_address &&
              p.timestamp === packet.timestamp
          );
        });

        if (newPackets.length > 0) {
          packetsData = [...packetsData, ...newPackets];
          newPackets.forEach(updateCountryStats);
          newPackets.forEach(visualizePacket);
          const currentCount = packetsData.length;
          const packetsThisSecond = currentCount - lastPacketCount;
          lastPacketCount = currentCount;
          const now = new Date();
          const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
          packetsPerSecond.push({
            time: timeString,
            count: packetsThisSecond,
          });

          if (packetsPerSecond.length > 60) {
            packetsPerSecond.shift();
          }
        }
      }
    })
    .catch((error) => {
      console.error("Error polling data:", error);
    });
}

function init() {
  initThreeJS();
  initChart();
  document
    .getElementById("start-button")
    .addEventListener("click", startSendingPackets);

  startPolling();
}
