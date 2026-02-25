# CloudFront Setup for K-12 LMS Web

## Distribution Overview
- Origin: Next.js web origin (`https://web.example.org`)
- Viewer protocol policy: Redirect HTTP to HTTPS
- Price class: Select by district footprint (`PriceClass_100` or `PriceClass_All`)

## Cache Behaviors
- `/_next/static/*`
  - Cache policy: 1 year TTL (`max-age=31536000`), immutable
  - Cookies: none forwarded
  - Query strings: none
- `/_next/image/*`
  - Cache policy: 1 day TTL
  - Cookies: none forwarded
  - Query strings: all (required by Next image optimizer)
- `/*`
  - Cache policy: no edge cache (or very short TTL)
  - Cookies: forward all
  - Query strings: all

## Origin Request Policy
- Static paths (`/_next/static/*`, `/icons/*`): do not forward cookies or auth headers
- App/API paths (`/*`): forward cookies and auth headers as needed for session-backed routes

## Error Handling
- 404: custom response page mapped to `/404`
- 503: custom response page mapped to `/503`
- Optional stale-if-error behavior can be enabled for static content

## TLS and Security
- TLS minimum protocol: 1.2
- Attach WAF ACL for geo/IP filtering and bot mitigation
- Restrict origin with CloudFront origin access controls when fronting storage origins
