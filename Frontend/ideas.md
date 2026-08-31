# AeroIndex India — Design Direction

## Three Initial Approaches

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| **Monsoon Atlas** | A tactile editorial approach pairing pale weather charts with indigo mapping, designed to feel like a policy research journal. | 0.041 |
| **Aviation Operations Room** | A premium dark analytical environment where precision data emerges from atmospheric flight-path visuals and layered command-center surfaces. | 0.083 |
| **Civic Signal Desk** | A structured public-infrastructure aesthetic using warm paper, technical blue, and archival labels for high-trust statistical storytelling. | 0.026 |

## Chosen Direction — Aviation Operations Room

### Design Movement

**Atmospheric operational modernism**, combining the composure of an aviation control room with the visual rigor of a national statistical observatory. The public landing experience opens into a dark, high-altitude sky; authenticated screens become restrained analytical workspaces rather than consumer booking interfaces.

### Core Principles

1. Make data feel **observable and auditable**, with legible hierarchy, visible source state, and deliberate micro-labels.
2. Use **atmospheric depth rather than decorative gradients**: charcoal-navy surfaces, faint route arcs, cloud layers, and chart glow are used as information-bearing ambience.
3. Treat every primary interaction as an **analyst command**, using compact action labels, unambiguous status color, and clear transitions between public, login, and workspace contexts.
4. Maintain **government-grade restraint**: color encodes status and change, while generous negative space prevents the interface from becoming a consumer-travel dashboard.

### Color Philosophy

The signature color is **Aero Teal (#5FE0CF)**, a cool aviation-instrument hue that conveys verified signal without the urgency of saturated blue. Near-black navy, graphite, and cloud-gray establish spatial depth. Persimmon is reserved for anomalies; a muted wheat tone marks statistical reference data. Light mode uses mineral white and blue-gray surfaces rather than a simple inversion.

### Layout Paradigm

The landing page uses a **flight-path composition** rather than a centered marketing stack: a left-aligned narrative occupies the takeoff corridor while a right-side aircraft visual and floating instrument tiles create altitude. The platform uses a persistent command sidebar and a broad analysis canvas; module headers align to a slim telemetry rail rather than a uniform card grid.

### Signature Elements

1. **Flight-path arcs** with waypoint dots and route labels appear as subtle connective tissue in hero and data visualizations.
2. **Instrument tiles** use clipped corner marks, translucent surfaces, and small uppercase labels resembling reliable cockpit readouts.
3. **Atmospheric cloud strata** ground the landing and auth screens in aviation imagery while leaving safe, high-contrast text zones.

### Interaction Philosophy

Interactions should feel intentional and measured. Cards gain a controlled surface lift, charts reveal contextual tooltips, and drill-down actions preserve analytical continuity by carrying the chosen route into the detail workspace. Authentication pages make it easy to move back to the public product narrative.

### Animation

At page entry, cloud layers drift slowly and route dashes travel across the hero at low contrast. Floating data icons bob independently by a few pixels. Panels enter with 180–260ms opacity and translate transitions using `cubic-bezier(0.23, 1, 0.32, 1)`. No perpetual motion appears in the application workspace except discreet live-signal indicators. All nonessential animation respects reduced-motion preferences.

### Typography System

**Space Grotesk** serves navigation, labels, and body information because its compact geometry supports dense data. **Sora** provides high-impact display headings and numeric KPI emphasis. Headlines use Sora 600–700 with tracked uppercase overlines; tabular numbers use Space Grotesk with lining numerals.

### Brand Essence

**AeroIndex India is the evidence-led airfare intelligence workspace for analysts who need high-frequency market signals that stand up to statistical scrutiny.**

Personality: **precise, elevated, accountable**.

### Brand Voice

Headlines are concise, declarative, and evidence-oriented. CTAs use an analyst’s vocabulary instead of generic marketing phrases. Example lines: **“See price pressure before it becomes a headline.”** and **“Open the national signal desk.”**

### Wordmark & Logo

The mark is a **teal aircraft-vector clipped by a circular index ring**, suggesting a monitored flight path and an index dial. The wordmark sets `AERO` in spaced Sora caps and `INDEX INDIA` in a lighter, tightly tracked companion line; it is never a browser-default word treatment.

### Signature Brand Color

**Aero Teal — #5FE0CF**

## Style Decisions

- The landing, login, and signup routes remain visually distinct from the authenticated analyst platform while sharing the Aero Teal, flight-path, and cloud-strata visual vocabulary.
- Illustrative aircraft and cloud artwork is a low-key, dark-key atmospheric visual, so hero typography must remain pale, with a dark overlay or a reserved text-safe area.
- User-generated claims, customer reviews, ratings, and testimonials are not used anywhere in the product.
- Authenticated screens must read as an analyst command workspace: a visible command sidebar and telemetry rail anchor navigation and route context, and modules align to that operational frame rather than a generic card grid.
- Aero Teal `#5FE0CF` is the only luminous command color. Wheat marks reference data, persimmon marks anomalies, and muted slate is used only for named analytical states.
- Application modules repeat cockpit-instrument cues: clipped frame marks, uppercase source labels, route IDs, telemetry rails, and faint flight-path connective lines.

### Professional Color-System Refinement

The product now uses an **institutional airspace palette** rather than a luminous teal treatment. Deep navy and graphite carry the operational surfaces; restrained steel blue signals primary navigation and verified analysis; muted sage denotes success; antique bronze denotes reference or caution; and brick red is reserved for anomalies. Saturation remains deliberately low so the interface reads as a professional statistical platform rather than a consumer-technology dashboard.

The branded live-signal accent is retained as **muted verification teal (#6A9893)**. It appears only on selected analytical states, current series, live status dots, and the AeroIndex identity—never as a broad glow, gradient, or generic button color.
