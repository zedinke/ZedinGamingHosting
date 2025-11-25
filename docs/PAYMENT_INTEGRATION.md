# Fizetési Integrációk Dokumentáció

Ez a dokumentum leírja a Stripe, Revolut és PayPal fizetési integrációk használatát.

## Áttekintés

A rendszer három fizetési szolgáltatót támogat:
- **Stripe** - Kártyás fizetés, előfizetések
- **Revolut** - Kártyás fizetés, előfizetések
- **PayPal** - PayPal fizetés, előfizetések

## Környezeti Változók

### Stripe

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Revolut

```env
REVOLUT_API_URL=https://b2b.revolut.com/api/1.0
REVOLUT_API_KEY=your-api-key
REVOLUT_WEBHOOK_SECRET=your-webhook-secret
```

### PayPal

```env
PAYPAL_API_URL=https://api-m.sandbox.paypal.com  # Sandbox
# vagy
PAYPAL_API_URL=https://api-m.paypal.com  # Production
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
```

## API Endpointok

### Checkout Session Létrehozása

```http
POST /api/payments/checkout
Content-Type: application/json

{
  "provider": "STRIPE" | "REVOLUT" | "PAYPAL",
  "serverId": "server-id",
  "planId": "price-id",  // Stripe/PayPal esetén
  "amount": 10000,  // Revolut esetén (centben)
  "currency": "HUF",
  "planName": "Game Server Subscription"
}
```

**Válasz:**
```json
{
  "success": true,
  "provider": "STRIPE",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_...",
  "orderId": "...",  // Revolut esetén
  "subscriptionId": "..."  // PayPal esetén
}
```

### Webhook Endpointok

#### Stripe Webhook

```http
POST /api/webhooks/stripe
Stripe-Signature: t=...,v1=...
```

#### Revolut Webhook

```http
POST /api/webhooks/revolut
Revolut-Signature: ...
```

#### PayPal Webhook

```http
POST /api/webhooks/paypal
Content-Type: application/json
```

## Használat

### 1. Stripe Checkout

```typescript
import { createStripeCheckoutSession } from '@/lib/payments/stripe';

const { sessionId, url } = await createStripeCheckoutSession(
  userId,
  serverId,
  priceId,
  successUrl,
  cancelUrl
);

// Redirect a felhasználót a url-re
```

### 2. Revolut Order

```typescript
import { createRevolutOrder } from '@/lib/payments/revolut';

const { orderId, checkoutUrl } = await createRevolutOrder(
  userId,
  serverId,
  amount,
  currency,
  description
);

// Redirect a felhasználót a checkoutUrl-re
```

### 3. PayPal Subscription

```typescript
import { createPayPalSubscription } from '@/lib/payments/paypal';

const { subscriptionId, approvalUrl } = await createPayPalSubscription(
  userId,
  serverId,
  planId,
  successUrl,
  cancelUrl
);

// Redirect a felhasználót az approvalUrl-re
```

## Webhook Beállítás

### Stripe

1. Menj a [Stripe Dashboard](https://dashboard.stripe.com/webhooks)-ra
2. Add hozzá a webhook endpoint-ot: `https://your-domain.com/api/webhooks/stripe`
3. Válaszd ki az eseményeket:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Másold a webhook secret-et a `.env` fájlba

### Revolut

1. Menj a [Revolut Business Dashboard](https://business.revolut.com/)-ra
2. Add hozzá a webhook endpoint-ot: `https://your-domain.com/api/webhooks/revolut`
3. Válaszd ki az eseményeket:
   - `ORDER_COMPLETED`
   - `ORDER_AUTHORISED`
   - `ORDER_PAYMENT_FAILED`
4. Állítsd be a webhook secret-et

### PayPal

1. Menj a [PayPal Developer Dashboard](https://developer.paypal.com/)-ra
2. Add hozzá a webhook endpoint-ot: `https://your-domain.com/api/webhooks/paypal`
3. Válaszd ki az eseményeket:
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.UPDATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `PAYMENT.SALE.COMPLETED`
   - `PAYMENT.SALE.DENIED`

## Adatbázis Modell

### Subscription

```prisma
model Subscription {
  id                String            @id @default(cuid())
  userId            String
  serverId          String?           @unique
  paymentProvider   PaymentProvider   @default(STRIPE)
  
  // Stripe
  stripeCustomerId  String?
  stripeSubscriptionId String?        @unique
  stripePriceId     String?
  
  // Revolut
  revolutCustomerId String?
  revolutOrderId    String?          @unique
  revolutPaymentId  String?
  
  // PayPal
  paypalSubscriptionId String?        @unique
  paypalPlanId      String?
  paypalBillingToken String?
  
  status            SubscriptionStatus @default(ACTIVE)
  // ...
}
```

### Invoice

```prisma
model Invoice {
  id                String        @id @default(cuid())
  userId            String
  subscriptionId    String?
  paymentProvider   PaymentProvider @default(STRIPE)
  
  // Stripe
  stripeInvoiceId   String?       @unique
  
  // Revolut
  revolutOrderId    String?       @unique
  revolutPaymentId  String?
  
  // PayPal
  paypalInvoiceId   String?       @unique
  paypalTransactionId String?
  
  amount            Float
  currency          String        @default("HUF")
  status            InvoiceStatus @default(PENDING)
  // ...
}
```

## Tesztelés

### Stripe Test Mode

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Revolut Sandbox

```env
REVOLUT_API_URL=https://sandbox-b2b.revolut.com/api/1.0
```

### PayPal Sandbox

```env
PAYPAL_API_URL=https://api-m.sandbox.paypal.com
```

## Hibaelhárítás

### Webhook nem érkezik meg

1. Ellenőrizd a webhook URL-t
2. Ellenőrizd a webhook secret-et
3. Nézd meg a szerver logokat
4. Használd a Stripe CLI-t webhook teszteléshez: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Fizetés sikertelen

1. Ellenőrizd a provider API kulcsokat
2. Ellenőrizd a számla státuszát az adatbázisban
3. Nézd meg a provider dashboard-ot

## Biztonság

- Minden webhook validálva van signature alapján
- API kulcsok soha nem kerülnek a frontend-re
- HTTPS kötelező éles környezetben
- Webhook secret-ek biztonságosan tárolva

