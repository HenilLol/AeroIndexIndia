# No-Key Live Data Assessment

## Conclusion

AeroIndex should **not** integrate OpenSky’s public REST API as a no-key replacement for licensed live tracking. OpenSky states that commercial use requires written permission and a license, and that operational REST API use in a live product, service, or automated system requires prior written agreement regardless of organizational status.[1]

OpenSky can be suitable for approved non-profit research or educational work after observing its terms, but it is not a lawful no-key production feed for AeroIndex. The reviewed FAQ also states that OpenSky does not provide commercial schedule, cancellation, delay, or passenger data in its public data model.[2]

The other reviewed public ADS-B sources do not create a production-grade no-key alternative. ADSB.lol describes its API as available to everyone and labels it ODbL 1.0, but its own notice says the data is provided as-is with no guarantee of accuracy, timeliness, completeness, reliability, or availability.[3] ADS-B Exchange explicitly labels its Community API as non-commercial and directs production or commercial users to enterprise options; it also requires API-key access through RapidAPI.[4]

| Requirement | No-key OpenSky result | AeroIndex decision |
| --- | --- | --- |
| Live ticket fares | Not provided. | Keep validated historical fares until a licensed pricing provider is activated. |
| Live airline routes and operational status in a public product | Written license required for operational use. | Do not integrate without approved access. |
| Commercial airline schedules, delays, or cancellations | Not provided as commercial schedule/status data in the reviewed FAQ. | Use a licensed route/status provider such as Aviation Edge, OAG, or Cirium. |
| Historical or research analysis | May be appropriate only under the provider’s approved terms. | Keep separate from the public production product unless an explicit license is secured. |

| Reviewed source | Permitted / access model | India-coverage evidence | Production viability for AeroIndex |
| --- | --- | --- | --- |
| OpenSky | Written license required for commercial or operational product use. | FAQ says coverage is strongest in Europe and the United States; no India-specific suitability evidence was found. | Not viable without a written license; not a price source. |
| ADSB.lol | Public endpoint listed as available to everyone; ODbL labelling; as-is availability notice. | No India-specific availability or service-level evidence was found. | Not suitable as a dependable commercial price or route-status source without further legal and operational due diligence. |
| ADS-B Exchange Community API | Explicitly non-commercial; API-key access required. | Claims global coverage but no target-route confirmation was found. | Not a no-key option and not suitable for commercial production without enterprise licensing. |

## Operational Policy

The public dashboard must remain in **historical data mode** until a source is both technically validated and contractually permitted. It must never present seed observations, public ADS-B results, or delayed data as a live ticket price feed.

## References

[1] [OpenSky General Terms of Use & Data License Agreement](https://opensky-network.org/about/terms-of-use)

[2] [OpenSky FAQ](https://opensky-network.org/about/faq)

[3] [ADSB.lol Open Data API](https://www.adsb.lol/docs/open-data/api/) and [Privacy and License](https://www.adsb.lol/privacy-license/)

[4] [ADS-B Exchange Developer Hub](https://www.adsbexchange.com/community/developer-hub/)
