// lib/currency.ts
export const CURRENCY_CONFIG = {
  display: {
    code: "TND",
    symbol: "TND",
    decimals: 3,
    multiplier: 1000,
  },
  payment: {
    code: "eur",
    symbol: "€",
    decimals: 2,
    multiplier: 100,
    defaultRate: 3.3,
  },
};

let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 1000 * 60 * 60;

export async function getCurrentExchangeRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate.rate;
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/TND", {
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();

    if (data.result === "success" && data.rates?.EUR) {
      const rate = data.rates.EUR;
      cachedRate = { rate, timestamp: Date.now() };
      console.log(` Taux de change: 1 TND = ${rate.toFixed(4)} EUR`);
      return rate;
    } else {
      throw new Error("Invalid API response");
    }
  } catch (error) {
    console.warn(" Taux par défaut (1 TND = 0.303 EUR)");
    return 0.303; 
  }
}

//  CORRECTION : Convertir TND → EUR (multiplication)
export async function tndToStripeAmount(amountTND: number): Promise<number> {
  const rate = await getCurrentExchangeRate();
  const amountEUR = amountTND * rate; //  Multiplier, pas diviser !
  return Math.round(amountEUR * CURRENCY_CONFIG.payment.multiplier);
}

// Convertir Stripe (EUR) → TND
export async function stripeToTndAmount(amountStripe: number): Promise<number> {
  const rate = await getCurrentExchangeRate();
  const amountEUR = amountStripe / CURRENCY_CONFIG.payment.multiplier;
  return Math.round((amountEUR / rate) * 1000) / 1000; //  Diviser par rate
}

export function formatTND(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} ${CURRENCY_CONFIG.display.symbol}`;
}
