# Chaos2Calm - Testing Guide & Manual Checklist

This document provides instructions for automated testing and a manual testing checklist covering all features across desktop and mobile.

---

## 🤖 Automated Testing

### Validate Dataset (`data.json`)
Chaos2Calm includes a zero-dependency Node.js test script to validate all place entities, coordinate bounding boxes, category assignments, budgets, and score ranges.

Run the test suite from the repository root:

```bash
node tests/data.test.js
```

**Checks Performed:**
1. File integrity: `data.json` exists and parses cleanly.
2. Place names: Every place has a non-empty name string.
3. Categories: Valid PMR categories (`Food`, `History`, `Hospitality`, `Parks/Attractions`).
4. Budgets: Valid budget tiers (`low`, `medium`, `high`).
5. Geographic coordinates: Every place falls within the Pune Metropolitan Region bounding box (`lat 18.3–18.9`, `lng 73.3–74.1`).
6. Metric scores: Every place includes `safetyScore`, `cleanlinessScore`, and `affordabilityScore`.
7. Score ranges: All scores are valid numbers between `0` and `10`.
8. Completeness: Core schema fields are present without nulls or undefined values.

---

## 📋 Manual Testing Checklist

Follow this checklist to manually test and verify all functionality.

### 1. Map Load & Initial State
- [ ] Open the application locally or via live URL.
- [ ] Verify the Leaflet map loads with dark base map tiles and OpenStreetMap attribution.
- [ ] Confirm the initial viewport automatically fits all PMR markers (Pune City, PCMC, Talegaon, and Lonavala).
- [ ] Test map zoom in (`+`) and zoom out (`-`) buttons and mouse-wheel scrolling.
- [ ] Verify zoom buttons have accessible labels (`aria-label="Zoom in"` and `aria-label="Zoom out"`).

### 2. Search & Multi-Dimensional Filters
- [ ] **Search Box:** Type a keyword (e.g. `Fort`, `Misal`, `Hinjewadi`) and confirm the pins filter in real time.
- [ ] **Live Results Counter:** Verify the results counter (e.g. `12 places found`) updates dynamically and has `aria-live="polite"`.
- [ ] **Region Filter:** Select `Pune City`, `Pimpri-Chinchwad`, and `Talegaon & Outskirts`; verify only matching pins remain.
- [ ] **Category Filter:** Filter by `Local Food`, `History & Culture`, `Hospitality & Hotels`, and `Parks & Attractions`.
- [ ] **Budget Filter:** Test `Budget Friendly (Low)`, `Moderate (Medium)`, and `Premium (High)`.
- [ ] **Min Safety Slider:** Drag slider up to `8.0` or higher; verify lower-rated locations are hidden and the display updates.
- [ ] **Reset Filters:** Click `🔄 Reset Filters`; verify all filters reset to defaults and all 59 places reappear.

### 3. Place Pin Details Side Panel
- [ ] Click any category marker pin on the map.
- [ ] Verify the map smoothly flies to the pin (`map.flyTo`) and the side panel slides into view.
- [ ] Check place details: name, region, category tag, rating, address, description, localized safety tip, and progress bars.
- [ ] Verify the "Get Directions on Map" button points to Google Maps with accurate latitude/longitude.
- [ ] Press the `Escape` key and verify the side panel closes, returning focus to the previous element.
- [ ] Click the close (`&times;`) button and verify it has an accessible label (`aria-label="Close place details panel"`).

### 4. Layer Overlays (Chaos vs. Calm)
- [ ] **Unsafe Zones Toggle:** Click `Unsafe Zones` chip to hide/show red hazard circles. Verify `aria-pressed` updates.
- [ ] Click an unsafe zone circle on the map and check the popup (name, severity, and reason).
- [ ] **Traffic Jams Toggle:** Click `Traffic Jams` chip to hide/show orange dashed circles. Verify `aria-pressed` updates.
- [ ] Click a traffic jam circle on the map and check the popup (congestion area, estimated delay, and local detour tip).
- [ ] **Citizen Reports Toggle:** Click `Citizen Reports` chip to hide/show community incident pins. Verify `aria-pressed` updates.

### 5. Citizen Incident Reporting
- [ ] Click the floating `🚨 Report Issue` button.
- [ ] Verify the modal dialog opens and focus moves into the dialog.
- [ ] Verify the modal dialog has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- [ ] Click `🎯 Pinpoint Location on Map`; verify the top picker banner appears and allows placing a pin by tapping the map.
- [ ] Click `Confirm Spot` to return to the modal with the captured coordinates.
- [ ] Fill out the form (Issue Type, Title, Description, Severity) and click `Submit Report`.
- [ ] Confirm alert feedback, verify the report pin appears on the map, and check the badge count in the top navigation tab increments.
- [ ] Verify the report persists in browser `localStorage`.
- [ ] Test closing the modal with the `Cancel` button, the `&times;` close button, and the `Escape` key, verifying focus returns to the report trigger button.

### 6. City Insights Dashboard
- [ ] Click the `City Insights` tab in the header navigation.
- [ ] Verify the tab switches views smoothly.
- [ ] Check the top three highlight cards: **Safest PMR Zone**, **Cleanest Area**, and **Most Affordable**.
- [ ] Test the **Region** dropdown filter (`All PMR Regions`, `Pune City`, `Pimpri-Chinchwad`, `Talegaon & Outskirts`).
- [ ] Test the **Sort By** dropdown (`Safety Score`, `Cleanliness Score`, `Affordability Score`); confirm neighborhood cards re-order correctly.
- [ ] Verify rankings, scores, and progress bars reflect the dataset.

### 7. Citizen Reports View
- [ ] Click the `Citizen Reports` navigation tab.
- [ ] Verify recently submitted incident reports are listed with title, category, date, coordinates, and severity badges.
- [ ] Verify empty state messaging displays when no reports have been filed.

### 8. Live Weather & Dynamic Alerts
- [ ] Verify the header weather widget loads live Open-Meteo temperature and condition for Pune Metropolitan Region.
- [ ] Confirm the dynamic alert banner displays temperature-based or condition-based exploration tips.
- [ ] Verify the weather banner has `aria-live="polite"` for screen readers.
- [ ] Simulate offline state (e.g. disconnect network or mock API error) and verify graceful fallback weather display.

### 9. Mobile Responsive Layout (Viewport &le; 768px)
- [ ] Open browser DevTools in responsive mobile mode (e.g. 375x667px or 412x915px).
- [ ] Verify the navigation tabs move to a fixed, ergonomic bottom navigation bar.
- [ ] Check the floating `Filters` toggle button opens a slide-up bottom sheet with all filter controls.
- [ ] Verify touching map or close button dismisses the mobile filters sheet.
- [ ] Click a map pin and verify the Place Details panel opens as an accessible bottom sheet.
- [ ] Confirm all touch targets (buttons, inputs, select controls, tabs, toggle chips, close buttons, zoom controls) are at least 44x44px.

### 10. Accessibility & Keyboard Navigation
- [ ] **Skip Link:** Press `Tab` upon initial page load; confirm "Skip to main content" link becomes visible and jumps focus to `<main>`.
- [ ] **Landmarks:** Verify semantic structure: `<header>`, `<nav role="tablist">`, `<main id="main-content">`, and `<footer>`.
- [ ] **Tab Keyboard Navigation:** Use `ArrowLeft`, `ArrowRight`, `Home`, and `End` keys to navigate between tabs; verify `aria-selected` and focus move appropriately.
- [ ] **Focus Outlines:** Tab through all buttons, inputs, links, and chips; verify clear high-contrast `:focus-visible` outlines.
- [ ] **Color Contrast:** Verify all label, body, badge, placeholder, and footer texts meet WCAG AA contrast (&ge; 4.5:1).
- [ ] **Reduced Motion:** Enable "Prefers Reduced Motion" in OS/browser; verify all animations and transitions are disabled.
