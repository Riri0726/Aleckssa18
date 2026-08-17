# Vanta.js FOG Background

> **File**: `src/pages/Home.jsx`  
> **Version**: 1.0  
> **Dependencies**: Three.js r134 (CDN), Vanta.js FOG (CDN)

## Overview

Animated fog background effect on the guest-facing landing page. Uses Vanta.js FOG powered by Three.js to create a subtle, moody dark mist animation that matches the gothic aesthetic.

## Configuration

```javascript
VANTA.FOG({
  el: rootElement,
  mouseControls: true,       // Fog responds to mouse movement
  touchControls: true,       // Fog responds to touch on mobile
  gyroControls: false,       // No gyroscope control
  minHeight: 200.00,
  minWidth: 200.00,
  highlightColor: 0xc0c0c0,  // Silver highlights
  midtoneColor: 0x5c1a1a,    // Deep maroon midtone
  lowlightColor: 0x1a0a0a,   // Very dark red lowlight
  baseColor: 0x0a0a0a,       // Near-black base
  blurFactor: 0.65,          // Slightly less blur for moodier look
  speed: 1.50,               // Slower for atmospheric effect
  zoom: 0.80,                // Slightly wider view
});
```

## CDN Dependencies

Loaded dynamically in the component:

```
Three.js r134: https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js
Vanta FOG:     https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js
```

## Accessibility

- Respects `prefers-reduced-motion` — if the user has reduced motion enabled, the effect is not loaded
- The fog is purely decorative (`aria-hidden` on the container)
- Content is layered above the fog with `z-index`

## Performance

- Three.js and Vanta are loaded asynchronously after page render
- The effect is destroyed on component unmount to prevent memory leaks
- Single instance check prevents duplicate initialization

## Customization

To change the fog colors, modify the hex values in the `VANTA.FOG()` call in `Home.jsx`:

| Parameter | Current | Description |
|---|---|---|
| `highlightColor` | `0xc0c0c0` (Silver) | Brightest fog areas |
| `midtoneColor` | `0x5c1a1a` (Deep Maroon) | Mid-range fog color |
| `lowlightColor` | `0x1a0a0a` (Dark Red) | Darkest fog areas |
| `baseColor` | `0x0a0a0a` (Near Black) | Background base |
| `speed` | `1.50` | Animation speed |
| `blurFactor` | `0.65` | Fog blur amount |
