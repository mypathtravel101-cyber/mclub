# Mobile App Brainstorm: Japan Property Investment Risk Model

## Vision

Transform the ML V2 risk model into a client-facing mobile tool that enables instant, data-driven investment risk assessment for Japanese properties — replacing hours of manual analysis with a 60-second interactive experience.

---

## Target Users

### Primary: Individual Investors (like Andy)
- Input a property they're considering, get instant risk assessment
- Understand worst-case / best-case / most-likely outcomes
- Share professional PDF reports with advisors or partners

### Secondary: MCLUB Property Advisors
- Pre-screen properties before client meetings
- Generate client-ready reports on-the-spot
- Compare multiple properties side-by-side
- Use as a sales enablement tool during consultations

### Tertiary: Internal Risk Team
- Batch-analyze property portfolios
- Monitor model predictions against actual market movements
- Update model parameters and re-run analysis

---

## Core Features

### A. Input Wizard (3-4 screens)
- **Screen 1 — Property Basics:** Price (JPY), location type (Tokyo/Osaka/Other), building age
- **Screen 2 — Financial Terms:** Entry FX rate (HKD/JPY), LTV %, mortgage rate %, rental yield %
- **Screen 3 — Holding Parameters:** Holding period (5/7/10/custom years), management cost rate, transaction costs
- **Screen 4 — Optional Advanced:** Custom FX scenarios, override ML predictions, compare mode (add 2nd property)

### B. Results Dashboard (Home Screen)
- **Three-Layer Summary Card** — Visual "traffic light" system:
  - Layer 1 (Blue): Historical validation status ✓/✗
  - Layer 2 (Amber): Worst-case scenario ROI
  - Layer 3 (Purple): ML weighted expected ROI
- **Key Metrics at a Glance:**
  - ML weighted ROI & expected net gain (HKD)
  - Worst-case ROI (safety floor)
  - Best-case ROI (upside potential)
  - Probability of positive return (%)
- **Confidence Gauge** — Visual probability meter showing P5/P25/P50/P75/P95

### C. Interactive Visualizations
- **Probability Heatmap** — Pinch-to-zoom, tap any of 84 scenarios for detail popup
- **Distribution Curves** — FX and property price 10-year change distributions
- **Live Slider Mode** — Drag FX/price sliders and watch ROI update in real-time
- **Property Comparison** — Side-by-side bar charts for 2-3 properties
- **Holding Period Toggle** — Swipe between 5yr/7yr/10yr results

### D. Scenario Explorer
- Scrollable list of all 84 scenarios, sortable by:
  - Probability (highest first)
  - ROI (best first)
  - Net gain (HKD)
- Tap any scenario for detailed breakdown:
  - Property end value, remaining loan, total rent collected, total costs
  - Net HKD gain, ROI %
  - This scenario's ML probability
- **"What If" Mode:** Custom FX and price inputs outside the 84 grid

### E. Report Generator
- **Quick Summary Card** — One-tap generate, shareable to WeChat as image
- **Full PDF Report** — 6-chapter professional report (same quality as current output)
- **Custom Branding** — MCLUB logo, advisor name, client name
- **History** — All past analyses saved, searchable by date/property/ROI

---

## Technical Architecture Options

### Option 1: Progressive Web App (PWA) via Next.js
| Pros | Cons |
|------|------|
| One codebase, instant deployment | Limited native hardware access |
| No App Store review needed | Limited offline capability |
| Works in WeChat / any mobile browser | No push notifications |
| Instant updates, no versioning issues | |
| Fastest path to MVP | |

**Recommended for MVP** — fastest to build, easiest to iterate.

### Option 2: WeChat Mini Program
| Pros | Cons |
|------|------|
| Direct WeChat ecosystem integration | Locked to WeChat platform |
| Huge China/HK user base | Limited chart library support |
| Easy sharing within WeChat | Review process for publishing |
| No separate app installation | Limited to 2MB main package |

**Recommended if primary distribution is via WeChat.**

### Option 3: React Native (iOS + Android)
| Pros | Cons |
|------|------|
| Native feel and performance | More complex deployment |
| Full hardware access (camera, etc.) | App Store / Play Store review |
| Rich animation support | Longer development cycle |
| Offline capability | Separate iOS/Android testing |

**Recommended for V2 when product is validated.**

### Option 4: Flutter
| Pros | Cons |
|------|------|
| High performance, beautiful UI | Smaller developer pool |
| Cross-platform single codebase | Less mature ecosystem than RN |
| Good chart library support | |

---

## Proposed Tech Stack (PWA MVP)

```
Frontend:     Next.js 16 + TypeScript + Tailwind CSS 4
Charts:       ECharts (Apache) — excellent for heatmap, distribution, sliders
UI Library:   shadcn/ui components
Backend API:  Next.js API Routes (Python model via subprocess or FastAPI microservice)
ML Engine:    Python (scikit-learn, xgboost, lightgbm, scipy)
Data:         FRED API for live FX/rate data, BIS for property indices
Deployment:   Vercel (frontend) + Docker (Python ML service)
Auth:         Simple token-based for advisors, open access for investors
```

---

## MVP Scope (Phase 1)

**Week 1-2: Core Model API**
- Port ML V2 model to FastAPI endpoint
- Input: property params → Output: 84 scenarios + ML probabilities + weighted ROI
- FRED data auto-refresh pipeline

**Week 3-4: Mobile Frontend**
- Input wizard (3 screens)
- Results dashboard with 3-layer summary
- Interactive heatmap (ECharts)
- PDF report generation endpoint

**Week 5: Polish & Deploy**
- WeChat sharing integration
- Responsive mobile optimization
- Basic auth (advisor accounts)
- Deploy to production

---

## Future Features (Phase 2+)

- **Live FX Feed** — Real-time HKD/JPY rate from FRED API
- **Portfolio Mode** — Analyze multiple properties as a portfolio
- **Historical Backtest** — "What if I bought in 2015?" using actual historical data
- **Push Notifications** — FX rate alerts, model re-run triggers
- **Multi-Currency** — Support TWD, CNY, USD, SGD denominated analysis
- **AI Chat** — Natural language Q&A about the analysis results
- **AR Property Tour** — Overlay risk data on property photos
- **Offline Mode** — Cache model for use without internet

---

## Revenue Model Ideas

1. **Freemium** — Basic 84-scenario stress test free, ML weighted analysis premium
2. **Per-Report** — Advisors pay per PDF report generated
3. **Subscription** — Monthly fee for unlimited analyses + live data
4. **White Label** — License the model to other property agencies
5. **Embedded** — API licensing for integration into existing property platforms

---

## Competitive Advantages

1. **Rigor** — 3-layer analysis (historical + stress test + ML) is more thorough than any existing tool
2. **Transparency** — Full 84-scenario disclosure, not a black box
3. **ML-Backed** — Probability weighting from real FRED/BIS data, not gut feeling
4. **HKD-Native** — Specifically designed for HK investors in JP property
5. **Report Quality** — Professional PDF output suitable for client presentations

---

## Open Questions

- [ ] Primary platform: PWA vs WeChat Mini Program vs React Native?
- [ ] Should FX rates update live or use static ML model predictions?
- [ ] Multi-property comparison in MVP or Phase 2?
- [ ] Branding: MCLUB white-label or standalone product?
- [ ] Regulatory considerations for financial advice tool?
- [ ] Data privacy: where are client property analyses stored?