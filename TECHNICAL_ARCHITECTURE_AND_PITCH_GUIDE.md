# AeroIndex India — Technical Architecture, Methodology & SIH 2026 Pitch Guide

> **Official Project Documentation & Technical Viva / Pitch Preparation Guide**  
> **Problem Statement:** SIH 2026 — [PS-SIH26056: Automated Airfare Data Collection, Validation, and Index Calculation](https://sih2026.vuce.in/ps/SIH26056?utm_source=chatgpt.com)  
> **Domain:** High-Frequency Aviation Market Intelligence, Official Price Statistics & Consumer Price Index (CPI) Compatibility

---

## Table of Contents

- [1. What is AeroIndex India?](#1-what-is-aeroindex-india)
- [2. The Problem Statement — Dynamic Airfare Pricing & CPI](#2-the-problem-statement--dynamic-airfare-pricing--cpi)
- [3. Web Scraping — Where does the data come from?](#3-web-scraping--where-does-the-data-come-from)
- [4. Raw Fare Data](#4-raw-fare-data)
- [5. Booking Window](#5-booking-window)
- [6. Data Validation](#6-data-validation)
- [7. Validation Rules (V-1 to V-5)](#7-validation-rules-v-1-to-v-5)
- [8. Pydantic Schema Validation](#8-pydantic-schema-validation)
- [9. Normalization](#9-normalization)
- [10. PostgreSQL Database](#10-postgresql-database)
- [11. Why PostgreSQL?](#11-why-postgresql)
- [12. Database Partitioning](#12-database-partitioning)
- [13. CPI Compatibility Score ⭐](#13-cpi-compatibility-score-)
- [14. What does CPI Compatibility actually measure?](#14-what-does-cpi-compatibility-actually-measure)
- [15. Jevons Index](#15-jevons-index)
- [16. Why not simply average fares?](#16-why-not-simply-average-fares)
- [17. Törnqvist Index](#17-törnqvist-index)
- [18. Why Jevons + Törnqvist?](#18-why-jevons--törnqvist)
- [19. Base Year / Index = 100](#19-base-year--index--100)
- [20. Inflation vs Index](#20-inflation-vs-index)
- [21. Isolation Forest — Anomaly Detection](#21-isolation-forest--anomaly-detection)
- [22. Why anomaly detection matters](#22-why-anomaly-detection-matters)
- [23. Backend — FastAPI](#23-backend--fastapi)
- [24. Why API?](#24-why-api)
- [25. Authentication / Authorization](#25-authentication--authorization)
- [26. Frontend — Next.js / React](#26-frontend--nextjs--react)
- [27. Recharts](#27-recharts)
- [28. Dashboard KPIs](#28-dashboard-kpis)
- [29. Route Analysis](#29-route-analysis)
- [30. Airline Analysis](#30-airline-analysis)
- [31. Airport / City Analysis](#31-airport--city-analysis)
- [32. Airfare Inflation Heatmap](#32-airfare-inflation-heatmap)
- [33. Data Lineage / Evidence](#33-data-lineage--evidence)
- [34. Why this matters for government/statistical use](#34-why-this-matters-for-governmentstatistical-use)
- [35. Monitoring — Prometheus + Grafana](#35-monitoring--prometheus--grafana)
- [36. Docker](#36-docker)
- [37. The entire system in one example](#37-the-entire-system-in-one-example)
- [38. The most important technologies and their jobs](#38-the-most-important-technologies-and-their-jobs)
- [39. Your strongest pitch explanation](#39-your-strongest-pitch-explanation)
- [One important thing for your SIH presentation](#one-important-thing-for-your-sih-presentation)
- [⚠️ One thing I'd fix before pitching](#️-one-thing-id-fix-before-pitching)

---

## 1. What is AeroIndex India?

**AeroIndex India** is an evidence-led airfare intelligence and price index pipeline designed for high-frequency market monitoring and official statistical scrutiny. It continuously captures domestic airfare observations across major Indian air corridors, validates and normalizes the data through rigorous quality gates, computes elementary route-level price movements and higher-level weighted price indices, detects pricing anomalies, and presents transparent, auditable market signals through an analyst signal desk and operations workspace.

---

## 2. The Problem Statement — Dynamic Airfare Pricing & CPI

Domestic airfare in India is algorithmic, highly dynamic, and route/time-dependent. Unlike standard consumer goods with sticky prices, airline tickets fluctuate significantly depending on:
- Advance booking window (days prior to departure)
- Departure time and day-of-week seasonality
- Route competition and seat inventory load factors
- Festive seasons, holidays, and sudden travel surges

Traditional Consumer Price Index (CPI) collection methods rely on infrequent, manual field surveys that cannot capture intra-month or high-frequency airfare volatility. The **Smart India Hackathon (SIH 2026)** Problem Statement ([SIH26056](https://sih2026.vuce.in/ps/SIH26056?utm_source=chatgpt.com)) calls for an automated system capable of collecting, cleaning, normalizing, and calculating airfare price indices across multiple frequencies. AeroIndex India solves this challenge by transforming volatile web-scraped airfare data into official-grade, CPI-compatible analytical indices.

---

## 3. Web Scraping — Where does the data come from?

Your system needs actual airfare observations.

For example:
```text
Delhi → Mumbai
Airline: IndiGo
Travel date: 20 Sept
Passengers: 1
Fare: ₹6,250
Booking date: 7 Sept
Source: Airline website
```

Another observation could be:
```text
Delhi → Mumbai
Airline: Air India
Travel date: 20 Sept
Passengers: 1
Fare: ₹7,100
Booking date: 7 Sept
Source: OTA
```

You collect many such observations.

### Technology: Playwright

**Playwright** is used for browser automation.

Instead of manually opening:
```text
airline website → enter Delhi → enter Mumbai → select date → search
```
your automated scraper performs those operations programmatically.

**Conceptually:**
```text
Open website
     ↓
Enter origin
     ↓
Enter destination
     ↓
Select travel date
     ↓
Search flights
     ↓
Read fare information
     ↓
Store observation
```

### Why not simply use an API?

1. **Problem Statement Alignment:** The SIH problem specifically discusses automated web scraping of airline and OTA portals ([SIH 2026 Problem Statements](https://sih2026.vuce.in/ps/SIH26056?utm_source=chatgpt.com)).
2. **Data Availability:** Many airline and OTA websites do not expose all required fare, cabin, and flight-segment information through a convenient, free, or publicly accessible API.

---

## 4. Raw Fare Data

The scraper shouldn't just save:
```text
₹6,250
```
That's almost useless by itself.

It should save something closer to:
```yaml
Origin: DEL
Destination: BOM
Airline: IndiGo
Flight: 6E-xxx
Travel Date: 20-09-2026
Search Date: 07-09-2026
Search Time: 10:30
Passengers: 1
Cabin: Economy
Fare: ₹6,250
Source: Airline
```

### Why?
Because ₹6,250 has meaning only when we know **what that ₹6,250 represents** (the flight, date, advance notice, cabin, and route context).

---

## 5. Booking Window

This is a very important concept for your project.

Suppose today is **7 September** and your flight is **20 September**.
```text
20 Sept - 7 Sept = 13 days
Booking window = 13 days
```

Now imagine another person searches the same flight one day before departure:
```text
Booking window = 1 day
```

The price might be completely different:

| Booking Window | Observed Fare |
|:---|:---|
| **30 days** | ₹4,500 |
| **15 days** | ₹5,200 |
| **7 days** | ₹6,800 |
| **1 day** | ₹10,500 |

Therefore, your system has to understand **when the fare was observed relative to the travel date**. This is one fundamental reason your airfare index needs much more information than a simple price tracker.

---

## 6. Data Validation

Now imagine your scraper collected:
```text
Delhi → Mumbai | Fare = ₹6,250
```
Is that automatically valid? **No.**

Your system needs to verify it before it enters any calculation pipeline. This is where your validation rules come in.

---

## 7. Validation Rules

You previously designed rules such as **V-1 to V-5**. Think of them as quality gates:

### V-1 — Required Fields
Check:
- Origin exists?
- Destination exists?
- Travel date exists?
- Fare exists?
- Airline exists?
- Source exists?

*If `Fare = NULL`, the observation cannot be accepted as a valid fare observation.*

### V-2 — Value Validation
Suppose scraper accidentally reads:
- `Fare = ₹-5,000` (Obviously invalid)
- `Fare = ₹6,250,000` (Indicates a scraping error or misplaced decimal)

So you apply reasonable, domain-bounded validation thresholds (e.g., ₹1,000 ≤ fare ≤ ₹150,000 for domestic economy).

### V-3 — Date Validation
Suppose:
- `Search date = 7 Sept`
- `Travel date = 5 Sept`

That's chronologically impossible for a future-booking fare. The record gets rejected or flagged immediately.

### V-4 — Duplicate Detection
Suppose your scraper accidentally captures:
```text
₹6,250   ₹6,250   ₹6,250   ₹6,250
```
four times for the exact same flight search within seconds. If you count all four as independent observations, you distort your statistics and weights. So the system identifies duplicates using cryptographic or canonical hash fingerprints.

### V-5 — Source / Consistency Validation
The system checks whether the source, airline, and fare structure are internally consistent (e.g., matching known flight numbers, recognized IATA codes, and authentic booking classes).

**The result is an automated funnel:**
```text
Raw data
   ↓
Validation
   ↓
Valid observation  OR  Rejected / flagged observation
```

---

## 8. Pydantic Schema Validation

**Pydantic** is used for data validation and structured data models in Python backend applications.

For example, conceptually your system defines:
```python
from pydantic import BaseModel, Field
from datetime import date, time

class FareObservationSchema(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3)
    destination: str = Field(..., min_length=3, max_length=3)
    airline: str
    flight_number: str
    fare: float = Field(..., gt=0, lt=200000)
    travel_date: date
    search_date: date
    search_time: time
    passengers: int = 1
    cabin_class: str = "Economy"
    source: str
```

If the scraper produces something completely unexpected (like a string where a float fare is required), Pydantic catches and logs it before it contaminates the database.

> **Pitch Explanation:** *"Pydantic provides schema-level validation so that scraped data strictly conforms to the structure expected by the backend before persistence."*

---

## 9. Normalization

Different websites describe the exact same airport or entity differently:
- `Delhi`, `New Delhi`, `DEL`, `Indira Gandhi International`
- `Mumbai`, `Bombay`, `BOM`, `Chhatrapati Shivaji Maharaj International`

Therefore, your system normalizes all variants into standard IATA codes:
```text
Delhi / New Delhi / Indira Gandhi → DEL
Mumbai / Bombay / CSMIA          → BOM
```

Now your database and analytics correctly understand:
```text
DEL → BOM
```
rather than treating different naming variations as separate routes.

---

## 10. PostgreSQL Database

After validation and normalization, the clean data needs somewhere robust to live. That's where **PostgreSQL** comes in.

You can think of PostgreSQL as the project's central analytical data warehouse. It stores:
- Airlines (`carriers`)
- Airports (`airports`)
- Cities (`cities`)
- Routes (`routes`)
- Fare observations (`fact_flight_fares` / `fare_observations`)
- Travel dates & Booking windows
- Data Sources (`data_sources`)
- Index values (`index_snapshots`)
- Anomalies (`anomaly_records`)
- Validation & audit logs (`audit_logs`)

---

## 11. Why PostgreSQL?

Because your data is **highly structured and relational**:
```text
airline_id | airport_id | route_id | fare | travel_date | booking_date | source
```

This is exactly what relational databases handle with maximum integrity. PostgreSQL provides:
- Structured SQL querying and indexing
- Foreign key relationships and integrity constraints
- Schema validation and uniqueness constraints (preventing duplicate observations)
- High-performance analytical aggregation functions
- ACID transactions ensuring data consistency
- Proven scalability for millions of time-series observations

---

## 12. Database Partitioning

We utilize **range partitioning** on `fact_flight_fares`.

Suppose you eventually store **100 million fare records**. Instead of querying one enormous, monolithic table, PostgreSQL partitions the table chronologically by date:

```text
fact_flight_fares
├── fact_flight_fares_2026_01
├── fact_flight_fares_2026_02
├── fact_flight_fares_2026_03
├── ...
└── fact_flight_fares_2026_12
```

When a query requests September 2026 data, PostgreSQL uses **partition pruning** to scan only the September partition without touching hundreds of millions of historical rows. This dramatically improves query performance and scalability.

---

## 13. CPI Compatibility Score ⭐

*This is one of the strongest and most innovative ideas in AeroIndex India.*

The fundamental challenge: **Not every scraped fare is equally suitable for official CPI-related statistical analysis.**

### Observation A:
- Route: DEL → BOM
- Fare: ₹6,250
- Passengers: 1
- Cabin: Economy
- Correct travel date & booking window
- Trusted source, verified timestamp, non-duplicate
- **CPI Compatibility = 96 / 100** *(Highly usable for official index computation)*

### Observation B:
- Missing passenger count
- Unclear fare type (basic vs flexi-fare bundle)
- Questionable timestamp or potential duplicate
- **CPI Compatibility = 61 / 100** *(Flagged; excluded from baseline CPI index)*

---

## 14. What does CPI Compatibility actually measure?

Your score evaluates the statistical purity of each observation across key dimensions:

1. **Route Consistency:** Are origin and destination airports unambiguously defined with standard IATA codes?
2. **Travel-Date Consistency:** Are we comparing equivalent travel dates, seasons, or days of the week?
3. **Booking-Window Consistency:** Are we comparing fares observed at comparable advance periods before departure (e.g., T-14 days vs T-14 days)?
4. **Passenger Configuration:** Is this a single passenger baseline without bundled addons?
5. **Source Reliability:** Does the observation originate from a verified, high-trust portal?
6. **Duplicate Detection:** Has the observation passed uniqueness and idempotency checks?
7. **Completeness:** Are all mandatory fields (flight number, cabin class, taxes, departure time) present?

> **Summary:** CPI Compatibility answers: *"How suitable is this individual airfare observation for rigorous statistical and economic analysis?"* That is far more sophisticated than a simple price tracker.

---

## 15. Jevons Index

Now we get into the statistical mathematics.

The **Jevons Index** is an unweighted geometric mean of price relatives ([Wikipedia Reference](https://en.wikipedia.org/wiki/Price_index?utm_source=chatgpt.com)).

Suppose a flight route had:
- **Yesterday's Price ($p_0$):** ₹5,000
- **Today's Price ($p_t$):** ₹5,500

The price relative is:
$$\frac{p_t}{p_0} = \frac{5500}{5000} = 1.10 \quad (+10\%)$$

Across $n$ matched flight observations on a route, the Jevons Index formula is:

$$I_{\text{Jevons}} = \left( \prod_{i=1}^{n} \frac{p_{i,t}}{p_{i,0}} \right)^{\frac{1}{n}} = \exp\left( \frac{1}{n} \sum_{i=1}^{n} \ln\left(\frac{p_{i,t}}{p_{i,0}}\right) \right)$$

This is the standard methodology for **elementary, route-level price movement**.

> **Statistical Precedent:** Official statistical agencies use geometric/Jevons methods for airfare CPI measurement. For example, the **U.S. Bureau of Labor Statistics (BLS)** discusses weighted and unweighted Jevons approaches in airfare CPI measurement ([BLS Airfare Index Methodology](https://www.bls.gov/opub/mlr/2005/06/art2full.pdf?utm_source=chatgpt.com)).

---

## 16. Why not simply average fares?

Consider two flights on different carriers:
- **Flight A:** ₹5,000 → ₹6,000 (Increase = ₹1,000, Percentage = **+20%**)
- **Flight B:** ₹10,000 → ₹11,000 (Increase = ₹1,000, Percentage = **+10%**)

If you merely look at raw arithmetic averages, both increased by ₹1,000. But economically, Flight A experienced double the relative price inflation of Flight B. 

Price index formulas capture **relative price movements** rather than arbitrary rupee differences, preventing expensive long-haul flights from completely skewing the index.

---

## 17. Törnqvist Index

While Jevons handles route-level elementary aggregations, the **Törnqvist Index** is used for higher-level national aggregation because it incorporates **economic weights and expenditure/passenger shares** ([Wikipedia Reference](https://en.wikipedia.org/wiki/T%C3%B6rnqvist_index?utm_source=chatgpt.com)).

Consider three routes:
- **Delhi – Mumbai (DEL-BOM):** Very high passenger traffic (~50% traffic share)
- **Delhi – Kochi (DEL-COK):** Medium passenger traffic (~30% traffic share)
- **Delhi – Jaipur (DEL-JAI):** Low passenger traffic (~20% traffic share)

If all three routes increase by 10%, DEL-BOM should have vastly greater influence on the National Airfare Index than DEL-JAI.

The Törnqvist Index calculates price change using the average value share ($s_{i}$) between base period 0 and current period $t$:

$$\ln I_{\text{Törnqvist}} = \sum_{i=1}^{K} \frac{s_{i,0} + s_{i,t}}{2} \ln\left( \frac{p_{i,t}}{p_{i,0}} \right)$$

**Conceptually:**
```text
Route-level price relatives + Economic passenger weights
                         ↓
               Törnqvist Aggregation
                         ↓
               National Airfare Index
```

---

## 18. Why Jevons + Törnqvist?

This gives you a clear and authoritative explanation for judges:

> **"We use Jevons at the elementary route level to measure relative fare movement across matched flights without needing micro-level transaction weights, and we use Törnqvist for higher-level national aggregation where route traffic and economic expenditure shares can be accurately incorporated."**

The international statistical literature recognizes Törnqvist as a superlative, weighted geometric price index and Jevons as an axiomatic unweighted geometric mean ([Price Index Literature](https://en.wikipedia.org/wiki/Price_index?utm_source=chatgpt.com)).

---

## 19. Base Year / Index = 100

In price index theory:
- **Base Period = 100**
- **Index = 100:** Prices are identical to the base reference period.
- **Index = 110:** Prices are approximately 10% higher than the base period.
- **Index = 95:** Prices are approximately 5% lower than the base period.

India's new CPI series uses **2024 = 100** as its base reference year ([Press Information Bureau (PIB) CPI Release](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2227012&lang=1&reg=6&utm_source=chatgpt.com)). In AeroIndex, all indices clearly display their baseline date and reference period.

---

## 20. Inflation vs Index

It is vital not to confuse the **Index Level** with the **Inflation Rate**:

- **Index Level:** The absolute reference value (e.g., Jan = 100, Feb = 105, Mar = 108).
- **Inflation Rate:** The percentage change in the index between two periods:

$$\text{Period Inflation} = \frac{\text{Index}_t - \text{Index}_{t-1}}{\text{Index}_{t-1}} \times 100$$

For **Year-over-Year (YoY) Inflation**:
$$\text{YoY Inflation} = \frac{\text{Index}_t - \text{Index}_{t-12}}{\text{Index}_{t-12}} \times 100$$

The Indian Ministry of Statistics and Programme Implementation (MoSPI) uses this exact percentage-change formulation ([PIB Official Release](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2227012&lang=1&reg=6&utm_source=chatgpt.com)).

---

## 21. Isolation Forest — Anomaly Detection

Suppose your system routinely records domestic fares:
```text
₹4,800   ₹5,100   ₹5,200   ₹5,350   ₹5,400
```
Then suddenly, an observation arrives:
```text
₹85,000
```
This is an extreme outlier. Possible causes:
- A genuine festival or emergency capacity surge
- A web scraping extraction error
- Business class mislabeled as Economy
- A cancellation or special package bundle

Your system should neither blindly accept it into CPI calculations nor silently discard it.

**Isolation Forest** is an unsupervised machine learning algorithm specifically designed for anomaly detection. It works on the principle that anomalies are few and structurally different, making them significantly easier to isolate through random recursive partitioning trees.

---

## 22. Why Anomaly Detection Matters

When processing **millions of fare observations**, human operators cannot manually audit every record. Machine learning flags candidate outliers in real-time:

```text
Scrape → Validate → Isolation Forest Anomaly Detection → Analyst Alert / Quarantine
```

> **Key Pitch Point:** *"Anomaly detection does NOT automatically mean a fare is wrong. It means the fare deviates significantly from expected market distributions and warrants analyst investigation before inclusion in official indices."*

---

## 23. Backend — FastAPI

Your frontend needs a fast, typed, and scalable API gateway. That is the role of your backend.

```text
Frontend (Next.js / React)
         ↓  GET /api/routes
FastAPI Backend Gateway
         ↓  SQLAlchemy / Async Queries
PostgreSQL Data Warehouse
         ↓  Aggregated / Validated Data
FastAPI Response JSON
         ↓
Dashboard UI
```

For example, `GET /api/fare-index` returns:
```json
{
  "route": "DEL-BOM",
  "index": 108.4,
  "weekly_change_pct": 4.2,
  "cpi_compatibility": 94.2,
  "data_mode": "historical",
  "anomaly_flag": false
}
```

---

## 24. Why an API?

The frontend must never connect directly to the database. An API architecture provides:
1. **Security:** Database credentials stay isolated on the server.
2. **Business Logic & Validation:** Schema checks, index math, and sanitization execute on the server.
3. **Role-Based Access Control:** Protects administrative tasks from unauthorized viewers.
4. **Reusability:** The same API can serve web dashboards, mobile apps, scheduled worker jobs, and government data pipelines.

---

## 25. Authentication / Authorization (OAuth2 + JWT)

Security is divided into two distinct concepts:

- **Authentication ("Who are you?"):** Validates user identity using OAuth2 and signed JSON Web Tokens (JWT).
- **Authorization ("What are you allowed to do?"):** Enforces role-based permissions:

| User Role | Permissions | Typical Functions |
|:---|:---|:---|
| **Analyst** | Read-only analytics | View national index, inspect routes, explore heatmaps, review anomalies |
| **Ingestion Worker** | Write-only ingestion | Push scraped batches, submit validation reports |
| **System Admin** | Full administrative control | Trigger index recomputations, manage data sources, review audit logs |

---

## 26. Frontend — Next.js / React

The frontend is the interactive command center seen by analysts and decision-makers.

- **React:** Powers modular, declarative UI state, real-time filters, and interactive tables.
- **Next.js:** Provides server-side rendering (SSR), optimized asset bundling, and clean routing.

The frontend delivers:
- Executive KPI cards
- Interactive trend and volatility charts
- Geographic airfare inflation heatmaps
- Anomaly monitors and audit logs

---

## 27. Recharts

For data visualization, the frontend utilizes **Recharts**.

```text
Backend Data:   Jan → 100   Feb → 103   Mar → 108   Apr → 111
                     ↓
Frontend Chart: ● ─────── ● ─────── ● ─────── ●
               Jan       Feb       Mar       Apr
```

> **Crucial Distinction:** Recharts does **not** calculate the airfare index. It is purely the visualization layer rendering the precomputed, verified index data provided by the backend.

---

## 28. Dashboard KPIs

Key Performance Indicators (KPIs) give executives instant visibility without having to sift through raw datasets:

```text
┌─────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┐
│     AIRFARE INDEX       │     ROUTES TRACKED      │     ACTIVE AIRLINES     │    FLIGHT ANOMALIES     │
│  108.4  (▲ +4.2% MoM)   │          1,240          │            5            │       27 Flagged        │
└─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 29. Route Analysis

Answers: **"Which specific routes are experiencing inflation or deflation?"**

```text
DEL → BOM:  +12.0%  (High demand, metro trunk)
DEL → BLR:   +7.2%  (Moderate increase)
BOM → DEL:   -3.1%  (Capacity adjustment)
DEL → HYD:  +15.4%  (Festival seasonal surge)
```

---

## 30. Airline Analysis

Answers: **"How are fare dynamics shifting across individual carriers?"**

```text
IndiGo:    +6.2%
Air India: +4.1%
Akasa Air: +9.0%
SpiceJet:  +2.0%
```

---

## 31. Airport / City Geographic Analysis

Fares are aggregated geographically across metropolitan airport clusters (Delhi, Mumbai, Bengaluru, Hyderabad, Ahmedabad, Kolkata). Analysts can compare:
- Average route fare
- Regional Jevons Index
- Local rate of inflation
- Data quality and observation density

---

## 32. Airfare Inflation Heatmap

The **Geographic Inflation Heatmap** translates complex matrix fare changes into intuitive spatial intelligence:

- 🔴 **Red:** High Inflation (> +10%)
- 🟡 **Yellow:** Moderate Inflation (+3% to +10%)
- 🟢 **Green:** Stable or Decreasing Fares (< +3%)

Analysts instantly spot high-pressure geographic corridors without manually reading thousands of raw flight records.

---

## 33. Data Lineage / Evidence & Auditability

For any published index value (e.g., `DEL → BOM Index = 108.4`), an auditor or statistician can trace every step backwards:

```text
National / Route Index (108.4)
          ↓
Mathematical Calculation (Jevons / Törnqvist Formula)
          ↓
Underlying Filtered Observations (N = 340 observations)
          ↓
Validation & CPI Compatibility Gate (Score: 94.2)
          ↓
Raw Web-Scraped Fare Record (₹6,250 on IndiGo 6E-204)
          ↓
Source, Capture Timestamp & Scraping Worker Trace
```

This end-to-end provenance is essential for high-trust government applications.

---

## 34. Why this matters for Government / Statistical Use (MoSPI / DGCA)

In official policy making, black-box statements like *"AI says flight prices rose"* are unacceptable. A government-grade system must prove:
- Exactly where every number came from
- Which flights were included and which were excluded
- Why an anomaly was quarantined
- How weights were applied

AeroIndex India provides the exact institutional transparency and auditability required by bodies such as **MoSPI** and the **Ministry of Civil Aviation (MoCA/DGCA)**.

---

## 35. Monitoring — Prometheus + Grafana

Do not confuse business analytics with infrastructure monitoring:
- **AeroIndex Dashboard:** Tracks airfares, indices, inflation rates, and routes.
- **Prometheus + Grafana:** Tracks system health—scraper success rates, API latency, HTTP 500 errors, database connection pool utilization, memory, and CPU usage.

---

## 36. Docker Containerization

**Docker** packages the frontend, backend, background workers, and scrapers into portable, isolated containers. This guarantees:
- Consistency across local development, testing, and production servers
- Rapid deployment on cloud environments (Render, AWS, GCP, Azure)
- Elimination of *"it works on my machine"* deployment failures

---

## 37. The Entire System in One Concrete Example

Let's walk through an actual flight fare from start to finish:

1. **Step 1 (Scraper Trigger):** Playwright automated scraper initiates a search for `DEL → BOM` on `20 September` for `1 passenger, Economy`.
2. **Step 2 (Extraction):** Scraper extracts IndiGo flight `6E-204` at `₹6,250`.
3. **Step 3 (Ingestion):** System records: Search time: 10:30, Travel date: 20-09-2026, Booking window: 13 days, Airline: IndiGo, Route: DEL-BOM, Fare: ₹6,250.
4. **Step 4 (Validation):** Rules V-1 to V-5 execute: Required fields ✓, Fare bounded ✓, Date logical ✓, Deduplication ✓, Source verified ✓.
5. **Step 5 (CPI Compatibility):** Observation receives a CPI Compatibility Score of **94 / 100**.
6. **Step 6 (Persistence):** Validated observation is saved to PostgreSQL in the appropriate partitioned table.
7. **Step 7 (Elementary Movement):** Analytics engine matches this with base fare (`₹5,800`): Price Relative = $6250 / 5800 \approx 1.078$ (+7.8%).
8. **Step 8 (Jevons Calculation):** Route-level Jevons index updates for `DEL → BOM`.
9. **Step 9 (Anomaly Check):** Isolation Forest evaluates the fare against recent distribution; marks record as `NORMAL`.
10. **Step 10 (National Aggregation):** Törnqvist algorithm incorporates route weights into the National Airfare Index.
11. **Step 11 (API Distribution):** FastAPI exposes updated index snapshots via `/api/routes/DEL-BOM/analytics`.
12. **Step 12 (Visualization):** The analyst dashboard displays `DEL → BOM Index: 107.8 (▲ +7.8%)` with full evidence lineage.

---

## 38. The Most Important Technologies and Their Roles

| Technology | Architectural Responsibility |
|:---|:---|
| **Playwright** | Automates browser-based airfare extraction from airline and OTA portals |
| **Pydantic** | Validates structured data models and enforces strict schema contracts |
| **Python** | Powers data pipelines, web scrapers, and statistical algorithms |
| **FastAPI** | High-performance asynchronous backend API gateway |
| **PostgreSQL** | Central relational data warehouse with range partitioning |
| **SQLAlchemy** | Connects application logic with database models and relational queries |
| **Jevons Index** | Calculates elementary route-level geometric relative price movements |
| **Törnqvist Index** | Computes weighted national price aggregations using economic traffic shares |
| **Isolation Forest** | Unsupervised machine learning for detecting flight pricing anomalies |
| **Next.js / React** | Modern frontend application framework and interactive UI |
| **Recharts** | Renders dynamic SVG/canvas charts for trend and volatility data |
| **OAuth2 / JWT** | Implements secure authentication and role-based access control |
| **Docker** | Containerizes services for consistent and reproducible deployment |
| **Prometheus** | Collects technical infrastructure and pipeline metrics |
| **Grafana** | Visualizes system uptime, scraper throughput, and API latency |

---

## 39. Your Strongest Pitch Explanation

If a judge or panel asks:  
**"Explain your project technically in 30 seconds."**

Say:
> *"AeroIndex India is an end-to-end airfare intelligence pipeline. We automatically collect fare observations from airline and OTA portals using browser automation, normalize and validate those observations using rule-based quality gates and Pydantic schema checks, and store them in a partitioned PostgreSQL data warehouse. We then calculate route-level price movements using the Jevons geometric mean methodology, aggregate them into a national airfare index using weighted Törnqvist methodology, and use Isolation Forest to identify unusual pricing anomalies. Our FastAPI backend exposes these results to a Next.js command dashboard, where analysts can monitor airfare trends, routes, airlines, anomalies, and CPI compatibility with complete evidence lineage."*

---

## One Important Thing for Your SIH Presentation

Your project directly addresses the core requirements of **SIH 2026 Problem Statement [SIH26056](https://sih2026.vuce.in/ps/SIH26056?utm_source=chatgpt.com)**:
- Airfare pricing is dynamic, algorithmic, and route/time dependent.
- The problem specifically calls for an automated system to collect, clean, normalize, and calculate airfare indices across multiple frequencies.
- Real-world alignment: India's official CPI framework has incorporated online price collection methods and specifically includes online airfare data ([PIB Press Release](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2227012&lang=1&reg=6&utm_source=chatgpt.com)).

---

## ⚠️ One Thing I'd Fix Before Pitching

**Do NOT say:**
> *"Our AI predicts airfare inflation."*  
*(Unless you have specifically trained and deployed a dedicated time-series forecasting model).*

**Your strongest, most defensible story is:**
```text
Automated Collection → Validation (V1-V5) → CPI Compatibility Scoring → Statistical Index Calculation (Jevons + Törnqvist) → ML Anomaly Detection (Isolation Forest) → Interactive Visualization & Data Lineage
```
This demonstrates rigorous statistical integrity and software engineering that judges and domain experts respect.
