# FazerCards PUBG setup

Add these variables to the Render backend environment (never to frontend code):

```text
FAZER_API_KEY=your_private_fazercards_api_key
FAZER_WEBHOOK_SECRET=the_webhook_signing_secret
FAZER_API_BASE_URL=https://api.fzr.cards/api/v2
FAZER_PUBG_CATEGORY_ID=your_live_pubg_category_id
```

In Admin → Product Items, edit every PUBG package and set its **Provider offer ID** from the FazerCards live catalog. Set **Provider category ID** there when a package uses a category different from `FAZER_PUBG_CATEGORY_ID`. Use the exact live IDs returned by `GET /topups` and `GET /topups/offers?category_id=...`; do not guess IDs from the public price table.

Configure the FazerCards webhook URL as:

```text
https://kavro-api.onrender.com/api/webhooks/fazercards
```

Subscribe to order status events. A completed provider event changes the Kavro order to `Completed`; a failed/refunded provider event changes it to `Refund Required` and returns any debited Kavro Credits once.
