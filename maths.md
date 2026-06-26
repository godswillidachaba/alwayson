# AlwaysON — Financial & Energy Math

## 1. Appliance Load Calculation

```
Total Load (W) = Σ(appliance.watts × quantity)
```

Each appliance has a fixed wattage depending on the building type (Residential / Commercial / Industrial).

**Residential examples:**

| Appliance | Watts |
|---|---|
| Fridge / Freezer | 150 |
| Air conditioner | 1,500 |
| TV / Home theatre | 150 |
| Ceiling fan | 75 |
| Light bulbs (per 10) | 100 |
| Washing machine | 500 |
| Microwave | 1,000 |
| Electric iron | 1,000 |
| Water pump | 750 |
| Other devices | 200 |

**Example:** A home with 2 ACs, 3 TVs, 10 lights, 1 fridge, 2 fans:

```
Total Load = (2 × 1500) + (3 × 150) + (1 × 100) + (1 × 150) + (2 × 75)
           = 3000 + 450 + 100 + 150 + 150
           = 3,850 W
```

---

## 2. Daily Consumption Estimate

```
Daily Consumption (kWh) = (Total Load (W) × 8) / 1000
```

Assumes **8 hours** of daily appliance runtime.

**Example:** 3,850 W load:

```
Daily Consumption = (3850 × 8) / 1000 = 30.8 kWh/day
```

---

## 3. System Sizing

```
If Total Load < 2,000 W     → Starter
If 2,000 W ≤ Total Load < 6,000 W → Masstige
If Total Load ≥ 6,000 W     → Premium
```

| Plan | Max Daily Load | Monthly Lease | Deposit |
|---|---|---|---|
| Starter | 0–6 kWh/day | ₦35,000/mo | 20% (₦7,000 stored; marketed "from ₦75,000") |
| Masstige | 6–12 kWh/day | ₦68,000/mo | 20% (₦13,600 stored; marketed "from ₦150,000") |
| Premium | 12–25 kWh/day | ₦110,000/mo | 20% (₦22,000 stored; marketed "from ₦250,000") |

**Example:** 3,850 W load → Masstige → ₦68,000/month.

**Deposit calculation:**

```
deposit_amount = round(planPrice × 0.2)
```

Stored in kobo.

**Example (Masstige):**
```
deposit_amount = round(68_000_00 × 0.2) = 1_360_000 kobo = ₦13,600
```

---

## 4. Kobo Storage

All financial values are stored as integers × 100 (Naira → kobo) in the database.

```
stored_value = naira_value × 100
```

| Input | Stored as |
|---|---|
| Monthly salary / revenue | `monthly_income = value × 100` |
| Monthly electricity bill | `monthly_bill = value × 100` |
| Monthly generator spend | `monthly_generator = value × 100` |

Display reverses this:

```
display_value = stored_value / 100
```

**Example:** User enters monthly bill of ₦45,000:
```
monthly_bill = 45000 × 100 = 4_500_000 kobo
Dashboard displays: 4_500_000 / 100 = "45,000"
```

---

## 5. Current Monthly Spend

```
currentMonthlySpend = monthlyBill (₦) + monthlyGenerator (₦)
```

**Example:** ₦50,000 bill + ₦30,000 generator:
```
currentMonthlySpend = 50000 + 30000 = ₦80,000
```

---

## 6. Monthly Savings (Dashboard)

```
monthlySavings = max(0, currentMonthlySpend - planCost)
```

Where `planCost` is:
| Plan | Cost (₦) |
|---|---|
| Starter | 35,000 |
| Masstige | 68,000 |
| Premium | 110,000 |

**Example:** Current spend ₦80,000, Masstige ₦68,000:
```
monthlySavings = max(0, 80000 - 68000) = ₦12,000
```

If current spend is ₦50,000 and plan is Masstige ₦68,000:
```
monthlySavings = max(0, 50000 - 68000) = ₦0
```
(No savings — the plan costs more than current spend.)

---

## 7. Model Accessor (Backend)

```
estimatedMonthlySavings = monthly_bill (kobo) + monthly_generator (kobo)
```

This is a simple sum of current costs. It does **not** subtract the plan cost — the frontend does that separately.

**Example:** monthly_bill = 5_000_000 kobo (₦50,000), monthly_generator = 3_000_000 kobo (₦30,000):
```
estimatedMonthlySavings = 5_000_000 + 3_000_000 = 8_000_000 kobo (₦80,000)
```

---

## 8. Full Worked Example

**Residential customer inputs:**
- 2 ACs, 3 TVs, 10 lights, 1 fridge, 2 fans
- Monthly salary: ₦200,000
- Monthly bill: ₦50,000
- Monthly generator: ₦30,000

**Step 1 — Total Load:**
```
Total Load = (2 × 1,500) + (3 × 150) + (1 × 100) + (1 × 150) + (2 × 75)
           = 3,000 + 450 + 100 + 150 + 150
           = 3,850 W
```

**Step 2 — Daily Consumption:**
```
Daily kWh = (3,850 × 8) / 1,000 = 30.8 kWh
```

**Step 3 — Plan:**
```
3,850 W ≥ 2,000 W and < 6,000 W → Masstige → ₦68,000/mo
Deposit = round(6,800,000 × 0.2) = 1,360,000 kobo = ₦13,600
```

**Step 4 — Storage:**
```
monthly_bill      = 50,000 × 100 = 5,000,000 kobo
monthly_generator = 30,000 × 100 = 3,000,000 kobo
```

**Step 5 — Savings:**
```
currentMonthlySpend = 50,000 + 30,000 = ₦80,000
monthlySavings      = max(0, 80,000 - 68,000) = ₦12,000/month
```

**Result:** The customer saves **₦12,000/month** by switching from grid + generator to Masstige solar.
