// FX configuration (rough illustrative rates)
const fxConfig = {
  US: { label: "United States (USD)", rate: 1, currency: "USD" },
  EU: { label: "Europe (EUR)", rate: 1.1, currency: "EUR" },
  UK: { label: "United Kingdom (GBP)", rate: 1.27, currency: "GBP" },
  JP: { label: "Japan (JPY)", rate: 0.007, currency: "JPY" }
};

// Tier thresholds in base currency (e.g., normalized USD)
const tiers = [
  { name: "Member", threshold: 0 },
  { name: "Silver", threshold: 1000 },
  { name: "Gold", threshold: 2500 },
  { name: "Platinum", threshold: 5000 }
];

const regionEl = document.getElementById("region");
const currentSpendEl = document.getElementById("current-spend");
const partnerMultiplierEl = document.getElementById("partner-multiplier");
const extraSpendEl = document.getElementById("extra-spend");

const visualizeBtn = document.getElementById("visualizeBtn");
const loadExampleBtn = document.getElementById("load-example");
const calcStatusEl = document.getElementById("calc-status");

const summaryBadgeEl = document.getElementById("summary-badge");
const summaryTextEl = document.getElementById("summary-text");

const normalizedLineEl = document.getElementById("normalized-line");
const gapLineEl = document.getElementById("gap-line");
const multiplierLineEl = document.getElementById("multiplier-line");

const barMemberEl = document.getElementById("bar-member");
const barSilverEl = document.getElementById("bar-silver");
const barGoldEl = document.getElementById("bar-gold");
const barPlatinumEl = document.getElementById("bar-platinum");

const rawOutputEl = document.getElementById("raw-output");
const tierRows = document.querySelectorAll(".tier-row");

// Helpers

function formatCurrency(amount, currencyCode) {
  if (isNaN(amount)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatNumber(amount, fractionDigits) {
  if (isNaN(amount)) return "-";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits ?? 0
  }).format(amount);
}

function findCurrentTierIndex(normalizedSpend) {
  let index = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (normalizedSpend >= tiers[i].threshold) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}

function updateSummaryBadge(status, text) {
  summaryBadgeEl.classList.remove(
    "summary-badge-idle",
    "summary-badge-ok",
    "summary-badge-warn",
    "summary-badge-fail"
  );

  if (status === "ok") {
    summaryBadgeEl.classList.add("summary-badge-ok");
  } else if (status === "warn") {
    summaryBadgeEl.classList.add("summary-badge-warn");
  } else if (status === "fail") {
    summaryBadgeEl.classList.add("summary-badge-fail");
  } else {
    summaryBadgeEl.classList.add("summary-badge-idle");
  }

  summaryBadgeEl.textContent = text;
}

function resetBars() {
  [barMemberEl, barSilverEl, barGoldEl, barPlatinumEl].forEach((bar) => {
    bar.style.transform = "scaleX(0)";
  });
  tierRows.forEach((row) => row.classList.remove("current"));
}

function updateLadder(normalizedSpendForScenario) {
  resetBars();

  const maxIndex = tiers.length - 1;
  const tierBars = [barMemberEl, barSilverEl, barGoldEl, barPlatinumEl];

  tiers.forEach((tier, index) => {
    const barEl = tierBars[index];
    const start = tier.threshold;
    const end = index === maxIndex ? tier.threshold * 1.5 : tiers[index + 1].threshold;

    let progress = 0;
    if (normalizedSpendForScenario <= start) {
      progress = 0;
    } else if (normalizedSpendForScenario >= end) {
      progress = 1;
    } else {
      progress = (normalizedSpendForScenario - start) / (end - start);
    }

    const clamped = Math.max(0, Math.min(1, progress));
    barEl.style.transform = `scaleX(${clamped})`;
  });

  const currentIndex = findCurrentTierIndex(normalizedSpendForScenario);
  tierRows.forEach((row) => {
    const idx = parseInt(row.getAttribute("data-tier-index"), 10);
    if (idx === currentIndex) {
      row.classList.add("current");
    }
  });
}

function visualizeScenario() {
  const region = regionEl.value;
  const fx = fxConfig[region];

  const currentSpendLocal = parseFloat(currentSpendEl.value);
  const partnerMultiplier = parseFloat(partnerMultiplierEl.value || "1.0");
  const extraSpendLocal = parseFloat(extraSpendEl.value || "0");

  if (isNaN(currentSpendLocal) || currentSpendLocal < 0) {
    updateSummaryBadge("fail", "Enter a valid qualifying spend amount.");
    summaryTextEl.textContent =
      "Qualifying spend must be a non-negative number. Add a value and try again.";
    calcStatusEl.textContent = "Unable to calculate — invalid spend.";
    rawOutputEl.textContent = "No calculation — current spend is missing or invalid.";
    resetBars();
    normalizedLineEl.textContent = "Normalized spend will appear here after you run a scenario.";
    gapLineEl.textContent = "We'll show how much more is needed to reach the next tier.";
    multiplierLineEl.textContent = "Partner boosts will be translated into effective status progress.";
    return;
  }

  calcStatusEl.textContent = "";

  // Baseline: current spend only
  const baselineNormalized = currentSpendLocal * fx.rate;

  // Scenario: include extra spend * multiplier
  const normalizedExtra = extraSpendLocal > 0 ? extraSpendLocal * fx.rate : 0;
  const effectiveExtra = normalizedExtra * partnerMultiplier;
  const scenarioNormalized = baselineNormalized + effectiveExtra;

  const hasSimulatedSpend = extraSpendLocal > 0 && effectiveExtra > 0;

  // Which value should drive messaging + ladder?
  const normalizedForMessaging = hasSimulatedSpend ? scenarioNormalized : baselineNormalized;

  // Tier indices for both states
  const baselineTierIndex = findCurrentTierIndex(baselineNormalized);
  const scenarioTierIndex = findCurrentTierIndex(scenarioNormalized);
  const messagingTierIndex = hasSimulatedSpend ? scenarioTierIndex : baselineTierIndex;

  const messagingTier = tiers[messagingTierIndex];

  const nextTierIndex =
    messagingTierIndex === tiers.length - 1
      ? tiers.length - 1
      : Math.min(messagingTierIndex + 1, tiers.length - 1);
  const nextTier = tiers[nextTierIndex];

  let gapToNext = 0;
  if (messagingTierIndex === tiers.length - 1) {
    gapToNext = 0;
  } else {
    gapToNext = nextTier.threshold - normalizedForMessaging;
    if (gapToNext < 0) gapToNext = 0;
  }

  const gapLocal =
    fx.rate > 0 && gapToNext > 0 ? gapToNext / fx.rate : gapToNext <= 0 ? 0 : NaN;
  const gapLocalWithMultiplier =
    partnerMultiplier > 0 && gapToNext > 0
      ? gapToNext / (fx.rate * partnerMultiplier)
      : gapLocal;

  // Summary badge + text (now based on scenario if simulated, otherwise baseline)
  if (messagingTierIndex === tiers.length - 1) {
    if (hasSimulatedSpend) {
      updateSummaryBadge("ok", "Scenario: member reaches top-tier status.");
      summaryTextEl.textContent = `Under this scenario, normalized qualifying spend is ${formatCurrency(
        normalizedForMessaging,
        "USD"
      )}, which sits in the ${messagingTier.name} band. Additional spend is not required to reach a higher tier in this model.`;
    } else {
      updateSummaryBadge("ok", "Member is already at top-tier status.");
      summaryTextEl.textContent = `Normalized qualifying spend is ${formatCurrency(
        normalizedForMessaging,
        "USD"
      )}, which sits in the ${messagingTier.name} band. Additional spend is not required to reach a higher tier in this model.`;
    }
  } else if (gapToNext === 0) {
    updateSummaryBadge("ok", "Member is eligible for the next tier based on spend.");
    summaryTextEl.textContent = `Normalized qualifying spend is ${formatCurrency(
      normalizedForMessaging,
      "USD"
    )}, which meets the ${nextTier.name} threshold in this simplified ladder.`;
  } else {
    if (hasSimulatedSpend) {
      updateSummaryBadge("ok", `Scenario: sitting in ${messagingTier.name} — ${nextTier.name} in reach.`);
      summaryTextEl.textContent = `Under this scenario, normalized qualifying spend is ${formatCurrency(
        normalizedForMessaging,
        "USD"
      )}, which sits in the ${messagingTier.name} band. The member needs about ${formatCurrency(
        gapToNext,
        "USD"
      )} more normalized spend to reach ${nextTier.name}.`;
    } else {
      updateSummaryBadge("ok", `Sitting in ${messagingTier.name} — ${nextTier.name} in reach.`);
      summaryTextEl.textContent = `Normalized qualifying spend is ${formatCurrency(
        normalizedForMessaging,
        "USD"
      )}, which sits in the ${messagingTier.name} band. The member needs about ${formatCurrency(
        gapToNext,
        "USD"
      )} more normalized spend to reach ${nextTier.name}.`;
    }
  }

  // Normalized line — show baseline + scenario if applicable
  if (hasSimulatedSpend) {
    normalizedLineEl.innerHTML = `Region <strong>${fx.label}</strong> (${fx.currency}) normalizes baseline spend of <strong>${formatCurrency(
      currentSpendLocal,
      fx.currency
    )}</strong> into approximately <strong>${formatCurrency(
      baselineNormalized,
      "USD"
    )}</strong>. With the simulated partner spend, total effective progress is about <strong>${formatCurrency(
      scenarioNormalized,
      "USD"
    )}</strong> in base program currency.`;
  } else {
    normalizedLineEl.innerHTML = `Region <strong>${fx.label}</strong> (${fx.currency}) normalizes <strong>${formatCurrency(
      currentSpendLocal,
      fx.currency
    )}</strong> into approximately <strong>${formatCurrency(
      baselineNormalized,
      "USD"
    )}</strong> of base program spend.`;
  }

  // Gap line — now also based on messaging state (baseline vs scenario)
  if (messagingTierIndex === tiers.length - 1) {
    gapLineEl.innerHTML = `This member sits in <strong>${messagingTier.name}</strong>, the top tier in this simplified ladder. There is no higher threshold in this model.`;
  } else {
    if (hasSimulatedSpend) {
      gapLineEl.innerHTML = `In this scenario, the next tier is <strong>${nextTier.name}</strong> at ${formatCurrency(
        nextTier.threshold,
        "USD"
      )}. Remaining gap after simulated spend: about <strong>${formatCurrency(
        gapToNext,
        "USD"
      )}</strong> base, or roughly <strong>${formatCurrency(
        gapLocalWithMultiplier,
        fx.currency
      )}</strong> in local currency when the same multiplier applies.`;
    } else {
      gapLineEl.innerHTML = `Next tier: <strong>${nextTier.name}</strong> at ${formatCurrency(
        nextTier.threshold,
        "USD"
      )}. Remaining gap: about <strong>${formatCurrency(
        gapToNext,
        "USD"
      )}</strong> base, or roughly <strong>${formatCurrency(
        gapLocal,
        fx.currency
      )}</strong> in local currency without any multiplier.`;
    }
  }

  // Multiplier line
  if (hasSimulatedSpend && gapToNext > 0) {
    const closesGapPercent =
      gapToNext > 0 ? Math.min(1, effectiveExtra / gapToNext) * 100 : 0;
    multiplierLineEl.innerHTML = `A single partner transaction of <strong>${formatCurrency(
      extraSpendLocal,
      fx.currency
    )}</strong> at <strong>${partnerMultiplier.toFixed(
      2
    )}x</strong> acts like ${formatCurrency(
      effectiveExtra,
      "USD"
    )} of status progress and closes about <strong>${formatNumber(
      closesGapPercent,
      0
    )}%</strong> of the remaining gap to the next tier in this scenario.`;
  } else if (hasSimulatedSpend && gapToNext === 0) {
    multiplierLineEl.innerHTML = `The simulated partner transaction of <strong>${formatCurrency(
      extraSpendLocal,
      fx.currency
    )}</strong> at <strong>${partnerMultiplier.toFixed(
      2
    )}x</strong> is enough to remove the gap to <strong>${nextTier.name}</strong> in this simplified ladder.`;
  } else if (!hasSimulatedSpend && gapToNext > 0) {
    multiplierLineEl.innerHTML = `At <strong>${partnerMultiplier.toFixed(
      2
    )}x</strong>, each unit of partner spend accelerates status progress. Add a simulated amount to see the effect on the gap to the next tier.`;
  } else {
    multiplierLineEl.innerHTML = `Partner multipliers still matter here — they can help maintain higher-tier status or offset FX disadvantages across markets.`;
  }

  // Ladder visualization — use messaging scenario (baseline or scenario)
  updateLadder(normalizedForMessaging);

  // Raw output: show both baseline and scenario clearly
  const detailsLines = [
    `Region: ${fx.label} (${fx.currency})`,
    `FX rate to base: ${fx.rate}`,
    "",
    `Baseline qualifying spend (local): ${formatCurrency(currentSpendLocal, fx.currency)}`,
    `Baseline normalized spend (base): ${formatCurrency(baselineNormalized, "USD")}`,
    `Baseline tier band: ${tiers[baselineTierIndex].name}`,
    "",
    `Simulated additional spend (local): ${
      isNaN(extraSpendLocal) || extraSpendLocal <= 0
        ? "none"
        : formatCurrency(extraSpendLocal, fx.currency)
    }`,
    `Effective status progress from simulated spend (base): ${
      isNaN(effectiveExtra) || effectiveExtra <= 0
        ? "none"
        : formatCurrency(effectiveExtra, "USD")
    }`,
    "",
    `Scenario normalized total (baseline + simulated * multiplier): ${
      hasSimulatedSpend ? formatCurrency(scenarioNormalized, "USD") : "same as baseline"
    }`,
    `Scenario tier band: ${tiers[scenarioTierIndex].name}`,
    "",
    `Tier used for messaging in this view: ${messagingTier.name}`,
    messagingTierIndex === tiers.length - 1
      ? "Next tier: none (top tier in this model)."
      : `Next tier in this view: ${nextTier.name} at ${formatCurrency(
          nextTier.threshold,
          "USD"
        )}`,
    gapToNext > 0
      ? `Remaining gap to next tier (base, in this view): ${formatCurrency(
          gapToNext,
          "USD"
        )}`
      : "Remaining gap to next tier (base, in this view): none in this simplified ladder."
  ];

  rawOutputEl.textContent = detailsLines.join("\n");
}

function loadExample() {
  regionEl.value = "EU";
  currentSpendEl.value = "1800";
  partnerMultiplierEl.value = "1.5";
  extraSpendEl.value = "400";
  calcStatusEl.textContent = "Example scenario loaded. Click “Visualize Progress”.";
}

// Wire up events
visualizeBtn.addEventListener("click", visualizeScenario);
loadExampleBtn.addEventListener("click", loadExample);

// Optional: run once with example on first load
loadExample();
visualizeScenario();
