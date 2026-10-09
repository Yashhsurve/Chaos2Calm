/**
 * CityPulse PMR - Main Application Script
 * Smart Exploration, Safety & Insights across Pune Metropolitan Region
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  let appData = {
    places: [],
    unsafeZones: [],
    trafficZones: [],
    neighborhoodInsights: []
  };

  let userReports = JSON.parse(localStorage.getItem('citypulse_user_reports') || '[]');
  
  let map;
  let layers = {
    places: L.layerGroup(),
    unsafe: L.layerGroup(),
    traffic: L.layerGroup(),
    userReports: L.layerGroup()
  };

  let selectedPlaceId = null;
  let reportTargetCoords = null;
  let reportTempMarker = null;
  let isPickingMapLocation = false;
  let isInitialLoad = true;

  // WMO Weather Code Map
  const weatherCodeMap = {
    0: { desc: 'Clear Sky', icon: '☀️' },
    1: { desc: 'Mainly Clear', icon: '🌤️' },
    2: { desc: 'Partly Cloudy', icon: '⛅' },
    3: { desc: 'Overcast', icon: '☁️' },
    45: { desc: 'Foggy', icon: '🌫️' },
    51: { desc: 'Light Drizzle', icon: '🌦️' },
    61: { desc: 'Rain Showers', icon: '🌧️' },
    80: { desc: 'Heavy Rain', icon: '⛈️' }
  };

  // Initialize Application
  async function init() {
    initTabs();
    initMap();
    await loadData();
    fetchLiveWeather();
    setupEventListeners();
    renderUserReportsList();

    // Window Resize Handler for Leaflet
    window.addEventListener('resize', () => {
      if (map) map.invalidateSize();
    });
  }

  // Navigation Tab Switching with WAI-ARIA and Keyboard Navigation
  function initTabs() {
    const tabList = document.querySelector('.nav-tabs');
    const tabs = Array.from(document.querySelectorAll('.nav-tab'));
    const views = document.querySelectorAll('.view-panel');

    function activateTab(targetTab) {
      const viewTarget = targetTab.dataset.view;

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      views.forEach(v => v.classList.remove('active'));

      targetTab.classList.add('active');
      targetTab.setAttribute('aria-selected', 'true');
      targetTab.setAttribute('tabindex', '0');

      const targetView = document.getElementById(`view-${viewTarget}`);
      if (targetView) targetView.classList.add('active');

      if (viewTarget === 'explore') {
        setTimeout(() => { if (map) map.invalidateSize(); }, 200);
      } else if (viewTarget === 'insights') {
        renderInsightsView();
      }
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        activateTab(tab);
      });
    });

    // Arrow-key support for tab navigation (Left/Right, Up/Down, Home, End)
    if (tabList) {
      tabList.addEventListener('keydown', (e) => {
        const activeTab = document.activeElement;
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          nextIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          nextIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          nextIndex = tabs.length - 1;
        } else {
          return;
        }

        tabs[nextIndex].focus();
        activateTab(tabs[nextIndex]);
      });
    }
  }

  // Initialize Leaflet Map
  function initMap() {
    // Default center set broadly to cover PMR region
    const pmrCenter = [18.5800, 73.7800];
    
    map = L.map('map', {
      center: pmrCenter,
      zoom: 10,
      zoomControl: true
    });

    // Add accessible labels to Leaflet default zoom controls
    setTimeout(() => {
      const zoomIn = document.querySelector('.leaflet-control-zoom-in');
      const zoomOut = document.querySelector('.leaflet-control-zoom-out');
      if (zoomIn) zoomIn.setAttribute('aria-label', 'Zoom in');
      if (zoomOut) zoomOut.setAttribute('aria-label', 'Zoom out');
    }, 100);

    // Tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // Add layer groups to map
    layers.places.addTo(map);
    layers.unsafe.addTo(map);
    layers.traffic.addTo(map);
    layers.userReports.addTo(map);

    // Click map to select location for Issue Reporting
    map.on('click', (e) => {
      if (isPickingMapLocation || document.getElementById('report-modal').classList.contains('active')) {
        setReportCoordinates(e.latlng.lat, e.latlng.lng);
      }
    });
  }

  // Fetch data.json
  async function loadData() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) throw new Error('Failed to load place data');
      appData = await response.json();

      renderPlacesOnMap();
      renderUnsafeZones();
      renderTrafficZones();
      renderUserReportMarkers();
      updateUserReportCount();
    } catch (err) {
      console.error('Data loading error:', err);
    }
  }

  // Render Category Place Pins on Map & Fit Bounds to show whole PMR Region
  function renderPlacesOnMap() {
    layers.places.clearLayers();

    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const regionFilter = document.getElementById('region-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    const budgetFilter = document.getElementById('budget-filter').value;
    const minSafety = parseFloat(document.getElementById('safety-filter').value);

    const filteredPlaces = appData.places.filter(place => {
      const matchesSearch = place.name.toLowerCase().includes(searchTerm) ||
                            place.description.toLowerCase().includes(searchTerm) ||
                            place.address.toLowerCase().includes(searchTerm) ||
                            place.category.toLowerCase().includes(searchTerm);
      
      const matchesRegion = regionFilter === 'all' || place.region === regionFilter;
      const matchesCategory = categoryFilter === 'all' || place.category === categoryFilter;
      const matchesBudget = budgetFilter === 'all' || place.budget === budgetFilter;
      const matchesSafety = place.safetyScore >= minSafety;

      return matchesSearch && matchesRegion && matchesCategory && matchesBudget && matchesSafety;
    });

    const resultsCountEl = document.getElementById('filter-results-count');
    if (resultsCountEl) {
      const count = filteredPlaces.length;
      resultsCountEl.textContent = `${count} ${count === 1 ? 'place' : 'places'} found`;
    }

    const markerGroup = [];

    filteredPlaces.forEach(place => {
      let iconChar = '📍';
      let pinClass = 'pin-food';

      if (place.category === 'Food') { iconChar = '🍽️'; pinClass = 'pin-food'; }
      else if (place.category === 'History') { iconChar = '🏰'; pinClass = 'pin-history'; }
      else if (place.category === 'Hospitality') { iconChar = '🏨'; pinClass = 'pin-hospitality'; }
      else if (place.category === 'Parks/Attractions') { iconChar = '🌳'; pinClass = 'pin-parks'; }

      const markerText = `${place.name} (${place.category})`;
      const customIcon = L.divIcon({
        className: 'custom-pin-wrapper',
        html: `<div class="custom-pin ${pinClass}" role="img" aria-label="${markerText}" title="${markerText}">${iconChar}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([place.lat, place.lng], {
        icon: customIcon,
        title: markerText,
        alt: markerText
      });

      marker.on('click', () => {
        openSidePanel(place);
        map.flyTo([place.lat, place.lng], 14, { duration: 0.8 });
      });

      marker.addTo(layers.places);
      markerGroup.push(marker);
    });

    // Auto-fit bounds on initial load so the entire PMR region is visible
    if (isInitialLoad && markerGroup.length > 0) {
      const featureGroup = L.featureGroup(markerGroup);
      map.fitBounds(featureGroup.getBounds(), { padding: [40, 40] });
      isInitialLoad = false;
    }
  }

  // Render Demo Unsafe Zones (Circles)
  function renderUnsafeZones() {
    layers.unsafe.clearLayers();
    appData.unsafeZones.forEach(zone => {
      const circle = L.circle([zone.lat, zone.lng], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.25,
        radius: zone.radius,
        weight: 2
      });

      circle.bindPopup(`
        <div style="font-family: var(--font-family); padding: 4px;">
          <h4 style="color:#ef4444; margin-bottom:4px;">⚠️ Unsafe Zone: ${zone.name}</h4>
          <p style="font-size:12px; margin-bottom:4px;"><strong>Severity:</strong> ${zone.severity}</p>
          <p style="font-size:12px; color:#475569;">${zone.reason}</p>
        </div>
      `);

      circle.addTo(layers.unsafe);
    });
  }

  // Render Demo Traffic Congestion Areas (Circles)
  function renderTrafficZones() {
    layers.traffic.clearLayers();
    appData.trafficZones.forEach(zone => {
      const circle = L.circle([zone.lat, zone.lng], {
        color: '#f97316',
        fillColor: '#f97316',
        fillOpacity: 0.2,
        radius: zone.radius,
        weight: 2,
        dashArray: '6, 6'
      });

      circle.bindPopup(`
        <div style="font-family: var(--font-family); padding: 4px;">
          <h4 style="color:#f97316; margin-bottom:4px;">🚦 Traffic Jam: ${zone.name}</h4>
          <p style="font-size:12px; margin-bottom:4px;"><strong>Est. Delay:</strong> +${zone.delayMinutes} mins</p>
          <p style="font-size:12px; color:#475569;">${zone.tip}</p>
        </div>
      `);

      circle.addTo(layers.traffic);
    });
  }

  // Render User Report Markers from localStorage
  function renderUserReportMarkers() {
    layers.userReports.clearLayers();
    userReports.forEach(report => {
      const reportText = `${report.title} (${report.type})`;
      const customIcon = L.divIcon({
        className: 'custom-pin-wrapper',
        html: `<div class="custom-pin pin-report" role="img" aria-label="${reportText}" title="${reportText}">🚨</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([report.lat, report.lng], {
        icon: customIcon,
        title: reportText,
        alt: reportText
      });
      marker.bindPopup(`
        <div style="font-family: var(--font-family); padding: 4px;">
          <h4 style="color:#ec4899; margin-bottom:4px;">🚨 ${report.title}</h4>
          <p style="font-size:11px; color:#334155; margin-bottom:4px;">Category: <strong>${report.type}</strong></p>
          <p style="font-size:12px; color:#1e293b;">${report.desc}</p>
          <span style="font-size:10px; color:#475569; display:block; margin-top:4px;">Reported by citizen on ${new Date(report.timestamp).toLocaleDateString()}</span>
        </div>
      `);

      marker.addTo(layers.userReports);
    });
  }

  let lastDetailsTrigger = null;

  // Open Place Details Side Panel
  function openSidePanel(place) {
    lastDetailsTrigger = document.activeElement;
    selectedPlaceId = place.id;
    const panel = document.getElementById('place-details-panel');
    const categoryTag = document.getElementById('panel-category');
    const content = document.getElementById('panel-content');

    panel.classList.remove('closed');
    categoryTag.textContent = `${place.region} • ${place.category}`;

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

    content.innerHTML = `
      <div>
        <h2 class="place-title">${place.name}</h2>
        <p class="place-address">📍 ${place.address}</p>
      </div>

      <div class="place-badges">
        <span class="badge badge-rating">⭐ ${place.rating} / 5.0</span>
        <span class="badge badge-budget">Budget: ${place.budget}</span>
        <span class="badge" style="background: var(--primary-light); color: var(--primary);">${place.region}</span>
      </div>

      <p style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.5;">
        ${place.description}
      </p>

      <!-- Metrics Card -->
      <div class="metrics-card">
        <div class="metric-row">
          <div class="metric-header">
            <span class="metric-label">🛡️ Safety Score</span>
            <span class="metric-value">${place.safetyScore} / 10</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill fill-safety" style="width: ${place.safetyScore * 10}%;"></div>
          </div>
        </div>

        <div class="metric-row">
          <div class="metric-header">
            <span class="metric-label">🧹 Cleanliness Score</span>
            <span class="metric-value">${place.cleanlinessScore} / 10</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill fill-cleanliness" style="width: ${place.cleanlinessScore * 10}%;"></div>
          </div>
        </div>

        <div class="metric-row">
          <div class="metric-header">
            <span class="metric-label">💵 Affordability Score</span>
            <span class="metric-value">${place.affordabilityScore} / 10</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill fill-affordability" style="width: ${place.affordabilityScore * 10}%;"></div>
          </div>
        </div>
      </div>

      <!-- Localized Safety Tip -->
      <div class="safety-tip-box">
        <h4>💡 PMR Exploration Tip</h4>
        <p>${place.safetyTip}</p>
      </div>

      <a href="${googleMapsUrl}" target="_blank" class="btn btn-primary direction-btn">
        🗺️ Get Directions on Map
      </a>
    `;

    // Move focus into the details panel
    const closeBtn = document.getElementById('panel-close-btn');
    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 50);
    }
  }

  // Close Side Panel and return focus
  function closeSidePanel() {
    const panel = document.getElementById('place-details-panel');
    panel.classList.add('closed');
    if (lastDetailsTrigger && typeof lastDetailsTrigger.focus === 'function') {
      lastDetailsTrigger.focus();
      lastDetailsTrigger = null;
    }
  }

  document.getElementById('panel-close-btn').addEventListener('click', closeSidePanel);

  // Render City Insights View
  function renderInsightsView() {
    const regionFilter = document.getElementById('insights-region-filter').value;
    const sortBy = document.getElementById('sort-insights').value;
    const grid = document.getElementById('insights-grid');
    const highlights = document.getElementById('insights-highlights');

    const filteredInsights = appData.neighborhoodInsights.filter(n => {
      return regionFilter === 'all' || n.region === regionFilter;
    });

    const sorted = [...filteredInsights].sort((a, b) => {
      if (sortBy === 'safety') return b.safetyScore - a.safetyScore;
      if (sortBy === 'cleanliness') return b.cleanlinessScore - a.cleanlinessScore;
      if (sortBy === 'affordability') return b.affordabilityScore - a.affordabilityScore;
      return 0;
    });

    // Render Top Highlights
    const topSafety = [...appData.neighborhoodInsights].sort((a,b) => b.safetyScore - a.safetyScore)[0];
    const topClean = [...appData.neighborhoodInsights].sort((a,b) => b.cleanlinessScore - a.cleanlinessScore)[0];
    const topAfford = [...appData.neighborhoodInsights].sort((a,b) => b.affordabilityScore - a.affordabilityScore)[0];

    highlights.innerHTML = `
      <div class="highlight-card">
        <div class="highlight-icon safety">🛡️</div>
        <div class="highlight-info">
          <h4>Safest PMR Zone</h4>
          <div class="name">${topSafety.name}</div>
          <div class="score">Score: ${topSafety.safetyScore}/10</div>
        </div>
      </div>

      <div class="highlight-card">
        <div class="highlight-icon cleanliness">🧹</div>
        <div class="highlight-info">
          <h4>Cleanest Area</h4>
          <div class="name">${topClean.name}</div>
          <div class="score">Score: ${topClean.cleanlinessScore}/10</div>
        </div>
      </div>

      <div class="highlight-card">
        <div class="highlight-icon affordability">💰</div>
        <div class="highlight-info">
          <h4>Most Affordable</h4>
          <div class="name">${topAfford.name}</div>
          <div class="score">Score: ${topAfford.affordabilityScore}/10</div>
        </div>
      </div>
    `;

    // Render Cards
    grid.innerHTML = sorted.map((n, index) => `
      <div class="neighborhood-card">
        <div class="card-top">
          <div>
            <div class="card-title">${n.name}</div>
            <div class="card-type">${n.region} • ${n.type}</div>
          </div>
          <span class="rank-badge">Rank #${index + 1}</span>
        </div>

        <p class="card-summary">${n.summary}</p>

        <div class="metrics-card">
          <div class="metric-row">
            <div class="metric-header">
              <span class="metric-label">Safety</span>
              <span class="metric-value">${n.safetyScore}/10</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill fill-safety" style="width: ${n.safetyScore * 10}%;"></div>
            </div>
          </div>

          <div class="metric-row">
            <div class="metric-header">
              <span class="metric-label">Cleanliness</span>
              <span class="metric-value">${n.cleanlinessScore}/10</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill fill-cleanliness" style="width: ${n.cleanlinessScore * 10}%;"></div>
            </div>
          </div>

          <div class="metric-row">
            <div class="metric-header">
              <span class="metric-label">Affordability</span>
              <span class="metric-value">${n.affordabilityScore}/10</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill fill-affordability" style="width: ${n.affordabilityScore * 10}%;"></div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Fetch Live Weather using Open-Meteo API for Central PMR
  async function fetchLiveWeather() {
    const widget = document.getElementById('weather-widget');
    const alertBar = document.getElementById('alert-text');

    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=18.5204&longitude=73.8567&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m');
      if (!res.ok) throw new Error('Weather API network error');
      
      const data = await res.json();
      const current = data.current;
      const code = current.weather_code;
      const temp = Math.round(current.temperature_2m);
      const humidity = current.relative_humidity_2m;
      const wind = Math.round(current.wind_speed_10m);

      const weatherInfo = weatherCodeMap[code] || { desc: 'Clear', icon: '☀️' };

      widget.innerHTML = `
        <span style="font-size: 1.5rem;">${weatherInfo.icon}</span>
        <div class="weather-info">
          <span class="weather-temp">${temp}°C</span>
          <div class="weather-details">
            <span class="weather-desc">PMR Region: ${weatherInfo.desc}</span>
            <span class="weather-sub">Humidity: ${humidity}% | Wind: ${wind} km/h</span>
          </div>
        </div>
      `;

      // Smart Weather Insights Alert across PMR
      if (temp > 34) {
        alertBar.textContent = `☀️ High temperature alert (${temp}°C) across PMR! Stay hydrated while exploring outdoor spots in Hinjewadi, Lonavala or Shaniwar Wada.`;
      } else if (code >= 51) {
        alertBar.textContent = `🌧️ Monsoon Rain/Drizzle alert in PMR region! Drive cautiously on Pune-Mumbai Expressway near Talegaon & Lonavala Ghat.`;
      } else {
        alertBar.textContent = `🌤️ Pleasant PMR weather (${temp}°C, ${weatherInfo.desc}). Great conditions for exploring Pune City, PCMC, and Talegaon!`;
      }

    } catch (err) {
      widget.innerHTML = `<span style="color:#f59e0b;">🌤️ PMR Region: 28°C (Live Weather API Offline)</span>`;
      alertBar.textContent = `🌤️ Ideal exploration weather across Pune Metropolitan Region. Enjoy your city tour!`;
    }
  }

  // Render Citizen Reports List (Tab 3)
  function renderUserReportsList() {
    const list = document.getElementById('reports-list');
    if (userReports.length === 0) {
      list.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No citizen reports submitted yet. Use the "Report an Issue" button to add safety concerns on the map.</p>`;
      return;
    }

    list.innerHTML = userReports.map(r => `
      <div class="report-card">
        <div class="report-details">
          <h4>🚨 ${r.title}</h4>
          <p>${r.desc}</p>
          <div class="report-meta">
            <span>Type: ${r.type}</span>
            <span>Date: ${new Date(r.timestamp).toLocaleDateString()}</span>
            <span>Location: ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}</span>
          </div>
        </div>
        <span class="severity-tag severity-${r.severity.toLowerCase()}">${r.severity}</span>
      </div>
    `).join('');
  }

  function updateUserReportCount() {
    document.getElementById('user-report-count').textContent = userReports.length;
  }

  // Modal & Reporting Handlers
  function setReportCoordinates(lat, lng) {
    reportTargetCoords = { lat, lng };
    document.getElementById('report-coords-text').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    if (reportTempMarker) {
      map.removeLayer(reportTempMarker);
    }
    reportTempMarker = L.marker([lat, lng]).addTo(map).bindPopup('Selected Incident Pin').openPopup();
  }

  function setupEventListeners() {
    // Filters Event Listeners
    document.getElementById('search-input').addEventListener('input', renderPlacesOnMap);
    document.getElementById('region-filter').addEventListener('change', renderPlacesOnMap);
    document.getElementById('category-filter').addEventListener('change', renderPlacesOnMap);
    document.getElementById('budget-filter').addEventListener('change', renderPlacesOnMap);
    
    const safetySlider = document.getElementById('safety-filter');
    safetySlider.addEventListener('input', (e) => {
      document.getElementById('safety-val').textContent = e.target.value;
      renderPlacesOnMap();
    });

    // Reset Filters Button Listener
    document.getElementById('btn-reset-filters').addEventListener('click', () => {
      document.getElementById('search-input').value = '';
      document.getElementById('region-filter').value = 'all';
      document.getElementById('category-filter').value = 'all';
      document.getElementById('budget-filter').value = 'all';
      document.getElementById('safety-filter').value = '0';
      document.getElementById('safety-val').textContent = '0';
      renderPlacesOnMap();
    });

    // Layer Toggle Controls (Accessible Toggle Buttons with aria-pressed)
    function setupLayerToggle(id, layer) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', () => {
        const isPressed = el.getAttribute('aria-pressed') === 'true';
        const newState = !isPressed;
        el.setAttribute('aria-pressed', String(newState));
        el.classList.toggle('active', newState);
        if (newState) {
          map.addLayer(layer);
        } else {
          map.removeLayer(layer);
        }
      });
    }

    setupLayerToggle('toggle-unsafe-chip', layers.unsafe);
    setupLayerToggle('toggle-traffic-chip', layers.traffic);
    setupLayerToggle('toggle-user-reports-chip', layers.userReports);

    // Insights Region & Sort Select
    document.getElementById('insights-region-filter').addEventListener('change', renderInsightsView);
    document.getElementById('sort-insights').addEventListener('change', renderInsightsView);

    // Open Report Modal with Focus Management
    let lastModalTrigger = null;
    const modal = document.getElementById('report-modal');

    document.getElementById('btn-open-report-mode').addEventListener('click', () => {
      lastModalTrigger = document.activeElement;
      const center = map.getCenter();
      setReportCoordinates(center.lat, center.lng);
      modal.classList.add('active');
      const firstInput = document.getElementById('report-type');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 50);
      }
    });

    // Interactive Map Pinpoint Location flow
    document.getElementById('btn-pick-location').addEventListener('click', () => {
      modal.classList.remove('active');
      isPickingMapLocation = true;
      document.getElementById('map-picker-banner').classList.add('active');
      const confirmBtn = document.getElementById('btn-confirm-map-pick');
      if (confirmBtn) confirmBtn.focus();
    });

    document.getElementById('btn-confirm-map-pick').addEventListener('click', () => {
      isPickingMapLocation = false;
      document.getElementById('map-picker-banner').classList.remove('active');
      modal.classList.add('active');
      const titleInput = document.getElementById('report-title');
      if (titleInput) titleInput.focus();
    });

    // Close Modal Buttons with Focus Restoration
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    function closeModal() {
      modal.classList.remove('active');
      isPickingMapLocation = false;
      document.getElementById('map-picker-banner').classList.remove('active');
      if (reportTempMarker) {
        map.removeLayer(reportTempMarker);
        reportTempMarker = null;
      }
      if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') {
        lastModalTrigger.focus();
        lastModalTrigger = null;
      }
    }

    // Global Escape Key Handler for Details Panel, Report Modal, and Filters Sheet
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        const reportModalEl = document.getElementById('report-modal');
        const detailsPanelEl = document.getElementById('place-details-panel');
        const filtersBarEl = document.querySelector('.filters-bar');
        
        if (reportModalEl && reportModalEl.classList.contains('active')) {
          closeModal();
        } else if (detailsPanelEl && !detailsPanelEl.classList.contains('closed')) {
          closeSidePanel();
        } else if (filtersBarEl && filtersBarEl.classList.contains('open')) {
          filtersBarEl.classList.remove('open');
          const toggleBtn = document.getElementById('mobile-filters-toggle');
          if (toggleBtn) toggleBtn.focus();
        }
      }
    });

    // Mobile Filters Sheet Logic
    const mobileFiltersToggle = document.getElementById('mobile-filters-toggle');
    const mobileFiltersClose = document.getElementById('mobile-filters-close');
    const filtersBar = document.querySelector('.filters-bar');

    if (mobileFiltersToggle && mobileFiltersClose && filtersBar) {
      mobileFiltersToggle.addEventListener('click', () => {
        filtersBar.classList.add('open');
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      });
      mobileFiltersClose.addEventListener('click', () => {
        filtersBar.classList.remove('open');
        mobileFiltersToggle.focus();
      });
      // Close on tap outside (if clicking map)
      map.on('click', () => {
        filtersBar.classList.remove('open');
      });
    }

    // Submit Report Form
    document.getElementById('report-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!reportTargetCoords) {
        alert('Please select incident coordinates on the map!');
        return;
      }

      const title = document.getElementById('report-title').value.trim();
      const type = document.getElementById('report-type').value;
      const desc = document.getElementById('report-desc').value.trim();
      const severity = document.getElementById('report-severity').value;

      const newReport = {
        id: 'ur_' + Date.now(),
        title,
        type,
        desc,
        severity,
        lat: reportTargetCoords.lat,
        lng: reportTargetCoords.lng,
        timestamp: new Date().toISOString()
      };

      userReports.unshift(newReport);
      localStorage.setItem('citypulse_user_reports', JSON.stringify(userReports));

      renderUserReportMarkers();
      renderUserReportsList();
      updateUserReportCount();
      closeModal();
      document.getElementById('report-form').reset();

      alert('🚨 Report successfully submitted and pinned to the map!');
    });
  }

  // Start App
  init();
});
