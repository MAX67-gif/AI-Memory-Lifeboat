# Security model｜威脅模型與權限

**Trust boundary:** uploaded JSON/ZIP is fully untrusted. The app must never run embedded scripts, navigate archive URLs, or inject user text as HTML. Parsed text is rendered with `textContent`; exported HTML escapes input and adds a restrictive CSP.

**ZIP checks:** EOCD and central-directory bounds, maximum archive size and entry count, safe paths, explicit supported compression, maximum target expansion, target CRC32 and UTF-8 JSON parse. This is not a malware scanner. Unsupported ZIP64/encryption and unknown formats return a reason, rather than pretend to pass.

**Privacy:** local browser processing; no external code, API, telemetry or account login. Downloaded single-conversation HTML contains user content; audit JSON deliberately contains only counts, status codes and record indices. The raw source export remains necessary.

**Availability:** huge JSON and many branches are intentionally bounded; inaccessible or malformed exports fail closed. Future work may use Web Workers and streaming processing after independent benchmarks.

**Proof boundary:** synthetic fixtures and CI prove only tested behavior, not compatibility with all current vendor exports or safe restoration. Real export smoke tests require the user's explicit consent and remain local; never upload private exports to public CI.
