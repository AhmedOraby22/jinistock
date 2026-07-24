const axios = require("axios");
const crypto = require("crypto");

const BASE_URL = "https://accept.paymob.com/api";

// Step 1: authenticate and get a short-lived auth token
async function getAuthToken() {
  const { data } = await axios.post(`${BASE_URL}/auth/tokens`, {
    api_key: process.env.PAYMOB_API_KEY,
  });
  return data.token;
}

// Step 2: register an order against the amount to be paid
async function registerOrder(authToken, amountCents, merchantOrderId) {
  const { data } = await axios.post(`${BASE_URL}/ecommerce/orders`, {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: "EGP",
    merchant_order_id: merchantOrderId,
    items: [],
  });
  return data.id; // Paymob order id
}

// Step 3: request a payment key for a specific integration (card or mobile wallet)
async function requestPaymentKey({ authToken, orderId, amountCents, billingData, integrationId }) {
  const { data } = await axios.post(`${BASE_URL}/acceptance/payment_keys`, {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: orderId,
    billing_data: billingData,
    currency: "EGP",
    integration_id: integrationId,
  });
  return data.token; // payment_token used to open the iframe / wallet redirect
}

/**
 * High level helper used by the routes layer.
 * method: "card" | "wallet"
 */
async function createPayment({ amountCents, merchantOrderId, billingData, method = "card" }) {
  const authToken = await getAuthToken();
  const orderId = await registerOrder(authToken, amountCents, merchantOrderId);
  const integrationId =
    method === "wallet"
      ? process.env.PAYMOB_INTEGRATION_ID_WALLET
      : process.env.PAYMOB_INTEGRATION_ID_CARD;

  const paymentToken = await requestPaymentKey({
    authToken,
    orderId,
    amountCents,
    billingData,
    integrationId,
  });

  if (method === "wallet") {
    // Mobile wallet (Vodafone Cash, etc) pay endpoint returns a redirect url directly
    const { data } = await axios.post(`${BASE_URL}/acceptance/payments/pay`, {
      source: { identifier: billingData.phone_number, subtype: "WALLET" },
      payment_token: paymentToken,
    });
    return { orderId, redirectUrl: data.redirect_url };
  }

  // Card payment: send the customer to the hosted iframe
  const iframeUrl = `${BASE_URL}/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
  return { orderId, redirectUrl: iframeUrl };
}

// Verify the HMAC Paymob sends on the transaction callback, so we know the
// webhook really came from Paymob and wasn't spoofed.
function verifyHmac(query) {
  const {
    hmac,
    amount_cents,
    created_at,
    currency,
    error_occured,
    has_parent_transaction,
    id,
    integration_id,
    is_3d_secure,
    is_auth,
    is_capture,
    is_refunded,
    is_standalone_payment,
    is_voided,
    order,
    owner,
    pending,
    source_data_pan,
    source_data_sub_type,
    source_data_type,
    success,
  } = query;

  const orderedString = [
    amount_cents,
    created_at,
    currency,
    error_occured,
    has_parent_transaction,
    id,
    integration_id,
    is_3d_secure,
    is_auth,
    is_capture,
    is_refunded,
    is_standalone_payment,
    is_voided,
    order,
    owner,
    pending,
    source_data_pan,
    source_data_sub_type,
    source_data_type,
    success,
  ].join("");

  const computedHmac = crypto
    .createHmac("sha512", process.env.PAYMOB_HMAC_SECRET)
    .update(orderedString)
    .digest("hex");

  return computedHmac === hmac;
}

module.exports = { createPayment, verifyHmac };
