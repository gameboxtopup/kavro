# Free Fire UID verification setup

Kavro now supports a **Verify UID** button for Bangladesh-server Free Fire accounts. It displays the player name and sends a signed, short-lived verification token with the order.

Until the lookup service is configured, the order page automatically keeps the existing manual UID-check workflow. Customers will not be blocked.

## Enable the verifier on Render

1. Create an API key for the Games Kinbo Free Fire Info API.
2. Open the Kavro backend service in Render.
3. Add these environment variables:

   ```text
   FF_LOOKUP_API_KEY=your_private_key
   FF_LOOKUP_API_URL=https://api.gameskinbo.com/ff-info/get
   FF_LOOKUP_REGION=BD
   ```

4. Confirm that `JWT_SECRET` is already configured with a long random value.
5. Redeploy the backend.

Do not put `FF_LOOKUP_API_KEY` in frontend JavaScript or commit it to GitHub. The frontend checks the backend configuration automatically and enables the button after the key is available.

## Quick production check

1. Open a Free Fire package and press **Buy Now**.
2. Enter a known Bangladesh-server UID and press **Verify UID**.
3. Confirm the correct in-game name and `BD Server` appear.
4. Change one digit of the UID and confirm the verified result disappears.
5. Submit a test order and confirm the Player and Server fields appear in the admin order details.

This integration verifies account identity only. Payment approval and diamond delivery remain manual until separate authorized payment and top-up integrations are added.
