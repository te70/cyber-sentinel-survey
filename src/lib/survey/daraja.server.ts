// Safaricom Daraja B2C helpers. Server-only.

function getEnv() {
  const env = (process.env.DARAJA_ENV ?? "sandbox").toLowerCase();
  const base =
    env === "production" || env === "live"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
  return { env, base };
}

async function getAccessToken(): Promise<string> {
  const key = process.env.DARAJA_CONSUMER_KEY;
  const secret = process.env.DARAJA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("Daraja consumer credentials missing");
  const { base } = getEnv();
  const basic = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) throw new Error(`Daraja token failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export interface B2CParams {
  msisdn: string; // 2547XXXXXXXX
  amount: number;
  responseId: string;
  resultUrl: string;
  remarks?: string;
}

export interface B2CResponse {
  ConversationID?: string;
  OriginatorConversationID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  errorCode?: string;
  errorMessage?: string;
  [k: string]: unknown;
}

export async function sendB2C(p: B2CParams): Promise<{ ok: boolean; data: B2CResponse }> {
  const { base } = getEnv();
  const initiator = process.env.DARAJA_B2C_INITIATOR_NAME;
  const credential = process.env.DARAJA_B2C_SECURITY_CREDENTIAL;
  const shortcode = process.env.DARAJA_B2C_SHORTCODE;
  if (!initiator || !credential || !shortcode) {
    throw new Error("Daraja B2C credentials missing");
  }
  const token = await getAccessToken();
  const body = {
    InitiatorName: initiator,
    SecurityCredential: credential,
    CommandID: "BusinessPayment",
    Amount: p.amount,
    PartyA: shortcode,
    PartyB: p.msisdn,
    Remarks: p.remarks ?? "Survey reward",
    QueueTimeOutURL: p.resultUrl,
    ResultURL: p.resultUrl,
    Occasion: p.responseId.slice(0, 12),
  };
  const res = await fetch(`${base}/mpesa/b2c/v1/paymentrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as B2CResponse;
  return { ok: res.ok && data.ResponseCode === "0", data };
}
