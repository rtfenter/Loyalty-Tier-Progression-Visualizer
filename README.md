# Loyalty Tier Progression Visualizer  
[![Live Demo](https://img.shields.io/badge/Live%20Demo-000?style=for-the-badge)](https://rtfenter.github.io/Loyalty-Tier-Progression-Visualizer/)

### A small tool to visualize how spend, FX, and partner multipliers move a member through tiers over time.

This project is part of my **Loyalty Systems Series**, exploring how loyalty systems behave beneath the UI layer — from event flow to FX reconciliation to partner tiering.

The goal of this visualizer is to show, at a glance, how different variables affect tier progression and status:

- Region & FX normalization  
- Tier thresholds (Silver / Gold / Platinum)  
- Partner multipliers and boosts  
- Current annual spend or points  
- Distance to next tier  

The visualization is intentionally small and easy to extend.

---

## Features (MVP)

The prototype includes:

- Inputs for region, current tier, and current annual spend or points  
- Configurable tier thresholds (e.g., Silver, Gold, Platinum)  
- FX normalization layer to compare progress across regions  
- Partner multiplier input (e.g., 1.0x, 1.5x, 2.0x)  
- Visual progress bars that show:  
  - Where the member sits within their current tier  
  - How much is needed to reach the next tier  
  - How partner multipliers accelerate progression  

---

## Demo Screenshot

<img width="2804" height="2124" alt="Screenshot 2025-11-25 at 09-07-29 Loyalty Tier Progression Visualizer" src="https://github.com/user-attachments/assets/66882280-85a9-4faf-ba9e-3d577cce383c" />

---

## Tier Progression Flow Diagram

```
[Region + Current Spend/Points + Tier]
                  |
                  v
        FX Normalization Layer
     (convert to base program currency)
                  |
                  v
        Tier Thresholds Engine
     (Silver / Gold / Platinum cutoffs)
                  |
                  v
      Partner & Campaign Multipliers
          (1.5x partner, 2x promo)
                  |
                  v
     Effective Progress Calculation
   (normalized_progress = base + boosts)
                  |
                  v
       Tier Progress Visualization
  (bars for current tier + next tier)
```

---

## Purpose

Tiering is where loyalty programs feel simple to members but become complex in real systems:

- Regions and FX create uneven paths to status  
- Partners offer different earn rates and multipliers  
- Thresholds must stay fair and explainable across markets  
- Campaigns and boosts stack on top of existing rules  

This visualizer provides a small, understandable way to see how a member’s path to status changes as FX and partner rules shift — without needing a full production rules engine.

---

## How This Maps to Real Loyalty Systems

### Region & FX Normalization  
Real programs normalize spend or points to a base currency so tiers remain fair across markets. FX volatility can quietly make status easier or harder to reach.

### Tier Thresholds (Silver / Gold / Platinum)  
These thresholds are contractual. They must remain stable enough for members to trust them while still allowing regional or partner-specific adjustments behind the scenes.

### Partner Multipliers  
Partners often fund higher earn rates (1.5x, 2x) to drive traffic. In real systems, these multipliers vary by partner, category, or promotional rules.

### Effective Progress  
Production systems track qualifying spend or points, reset windows, and status expiration — and expose simplified progress through UI.

### Visualization Layer  
The UI has to explain complex rule stacks in one bar. This prototype focuses on that translation: **make tier math legible**.

---

## Part of the Loyalty Systems Series

Main repo:  
https://github.com/rtfenter/Loyalty-Systems-Series

---

## Status  

MVP is active and implemented.  
Frontend implementation in progress — this tool will stay lightweight, focused on explaining tier progression rather than building a full production rules engine.

---

## Local Use

Everything runs client-side.

1. Clone the repo  
2. Open `index.html` in your browser  
   
That’s it — no backend required.
