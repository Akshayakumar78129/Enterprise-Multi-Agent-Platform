// Shared journey generation utility for Next Purchase dashboard
// Produces a synthetic purchase sequence for a customer

// Deterministic hash helper to eliminate true randomness while varying per customer
function hashSeed(str) {
  let h = 0; for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
  return h >>> 0; // unsigned
}

function pseudoRandom(seed) {
  // xorshift32
  let x = seed || 123456789;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    // scale to 0..1
    return (x >>> 0) / 4294967295;
  };
}

export function generateCustomerJourney(customerId, predictedProduct, options = {}) {
  const {
    maxHistorical = 10,
    minHistorical = 6,
    horizonDays = 60,
    products = ['M-3003','M-2001','R-4003','M-3004','M-3005']
  } = options;

  const prng = pseudoRandom(hashSeed(String(customerId)));
  const len = minHistorical + Math.floor(prng() * (maxHistorical - minHistorical + 1));
  return Array.from({ length: len }).map((_, j) => {
    const willUsePrediction = j === len - 1 && prng() > 0.6 && predictedProduct;
    const amount = 50 + prng() * 450;
    return {
      customerId,
      date: new Date(Date.now() - (horizonDays - j * 5) * 86400000).toISOString().slice(0, 10),
      category: willUsePrediction ? predictedProduct : products[j % products.length],
      amount: +amount.toFixed(2),
      sequenceOrder: j + 1,
      daysSinceLast: j === 0 ? 0 : 5
    };
  });
}
