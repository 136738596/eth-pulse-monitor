# NodePilot Ops Commercial Setup

## Business model

Sell a productized recurring service, not raw device time.

Core offer:
- 24/7 AI monitoring and execution desk for founders, agencies, and small SaaS teams.

What clients pay for:
- Competitor change alerts
- Lead discovery and enrichment prep
- Daily or weekly market summaries
- Content brief generation
- Overnight monitoring and escalation

## Initial pricing

- Pilot: `$199` for 7 days
- Retainer: `$799/month`
- Dedicated: `$1,999/month`

## Device roles

- `MacBook Neo`: sales, client support, manual intervention, proposal writing
- `Mac mini M4 #1`: crawlers, monitors, scheduled tasks
- `Mac mini M4 #2`: report generation, failover, backlog processing

## Payment platform

Use Lemon Squeezy as the first payment layer.

Why:
- Hosted checkout links
- Works well with static websites
- Fastest path to public payment collection without building a custom billing backend

## What to configure

Edit [app.js](/Users/liziruiwanzhao/Documents/Playground/app.js) and fill:

```js
checkoutLinks: {
  pilot: "https://your-store.lemonsqueezy.com/buy/...",
  retainer: "https://your-store.lemonsqueezy.com/buy/...",
  dedicated: "https://your-store.lemonsqueezy.com/buy/...",
}
```

## Customer acquisition

Start with one niche and one promise.

Recommended starting niche:
- Agencies that need competitor monitoring and content inputs
- Crypto or finance creators who need daily watchlists
- Small SaaS founders who want async market intelligence

Recommended promise:
- Setup in 24 hours
- First report in 48 hours
- One clear daily or weekly deliverable

## Fulfillment workflow

1. Customer buys a plan.
2. Intake arrives by email.
3. You create the watchlist and report template.
4. Mac mini nodes run collection and processing.
5. MacBook handles delivery and edge cases.
6. Upgrade customers from pilot to retainer after day 5.

## Stability rule

Do not chase passive-income narratives.

The stable version of this business is:
- recurring subscriptions
- narrow use case
- clear report format
- low-touch asynchronous delivery
- manual intervention only when needed
