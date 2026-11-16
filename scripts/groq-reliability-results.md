# groq reliability & latency benchmark results

- **date:** november 15, 2026
- **endpoint:** `https://sillage-flax-kappa.vercel.app/api/recommend`
- **test script:** [`scripts/groq-reliability-test.mjs`](./groq-reliability-test.mjs)
- **test scope:** 50 global cities against an 18-fragrance collection spanning aquatic, citrus, woody, floral, oriental, leather, and gourmand profiles.

### summary

| metric | result |
| :--- | :--- |
| **valid json on first try** | 50 / 50 (100%) |
| **matched expected schema** | 50 / 50 (100%) |
| **retries or fallbacks triggered** | 0 / 50 (0%) |
| **429 rate limits encountered** | 0 / 50 (0%) |
| **temperature range tested** | -34 °C (Yakutsk) to 32.6 °C (Jakarta) |
| **conditions tested** | clear, cloudy, rainy, foggy, snowy |

### latency breakdown

| pipeline stage | median | p95 | max |
| :--- | :--- | :--- | :--- |
| **full end-to-end request** | 1059.7 ms | 1358.9 ms | 2882.1 ms |
| **groq api inference (`/api/recommend`)** | 988.0 ms | 1283.5 ms | 1710.2 ms |
| **open-meteo weather fetch** | 70.0 ms | 118.5 ms | 1171.9 ms |

*(note: the 2882.1 ms max occurred on request `[01/50]` due to cold-start connection setup).*

### raw test log

```text
Testing 50 cities against [https://sillage-flax-kappa.vercel.app/api/recommend](https://sillage-flax-kappa.vercel.app/api/recommend)
Fragrance wardrobe size: 18
---
[01/50] New York        |   5.2°C  64% clear   | weather=1172ms groq=1710ms full=2882ms | OK
[02/50] London          |   7.4°C  84% cloudy  | weather=70ms groq=957ms full=1027ms | OK
[03/50] Tokyo           |  17.7°C  55% clear   | weather=68ms groq=1189ms full=1257ms | OK
[04/50] Reykjavik       |  -4.4°C  64% clear   | weather=72ms groq=1112ms full=1184ms | OK
[05/50] Dubai           |  24.3°C  75% clear   | weather=71ms groq=817ms full=888ms | OK
[06/50] Singapore       |  26.9°C  89% cloudy  | weather=67ms groq=914ms full=980ms | OK
[07/50] Sydney          |  15.8°C  86% rainy   | weather=54ms groq=1101ms full=1155ms | OK
[08/50] Cairo           |  16.7°C  96% cloudy  | weather=185ms groq=924ms full=1109ms | OK
[09/50] Moscow          |   1.5°C  85% cloudy  | weather=54ms groq=946ms full=1000ms | OK
[10/50] Rio de Janeiro  |  23.2°C  91% cloudy  | weather=60ms groq=988ms full=1048ms | OK
[11/50] Seattle         |   7.8°C  86% cloudy  | weather=82ms groq=1175ms full=1257ms | OK
[12/50] Mumbai          |  23.9°C  63% clear   | weather=64ms groq=1603ms full=1667ms | OK
[13/50] Paris           |  11.4°C  81% cloudy  | weather=74ms groq=979ms full=1053ms | OK
[14/50] Toronto         |   2.8°C  84% clear   | weather=76ms groq=1180ms full=1256ms | OK
[15/50] Mexico City     |    17°C  57% clear   | weather=66ms groq=1087ms full=1153ms | OK
[16/50] Nairobi         |  16.6°C  97% cloudy  | weather=67ms groq=891ms full=957ms | OK
[17/50] Bangkok         |  30.5°C  64% cloudy  | weather=62ms groq=1196ms full=1258ms | OK
[18/50] Oslo            |   5.3°C  91% rainy   | weather=76ms groq=720ms full=795ms | OK
[19/50] Phoenix         |  19.3°C  42% clear   | weather=73ms groq=922ms full=995ms | OK
[20/50] Buenos Aires    |  21.2°C  80% cloudy  | weather=73ms groq=989ms full=1062ms | OK
[21/50] Cape Town       |  16.7°C  75% clear   | weather=80ms groq=964ms full=1044ms | OK
[22/50] Seoul           |  12.2°C  74% cloudy  | weather=75ms groq=1284ms full=1359ms | OK
[23/50] Fairbanks       |  -5.7°C  92% cloudy  | weather=89ms groq=968ms full=1057ms | OK
[24/50] Marrakech       |    12°C  98% foggy   | weather=70ms groq=1082ms full=1152ms | OK
[25/50] Bergen          |   2.9°C  92% cloudy  | weather=66ms groq=1095ms full=1161ms | OK
[26/50] Lima            |  24.7°C  80% cloudy  | weather=118ms groq=826ms full=944ms | OK
[27/50] Jakarta         |  32.6°C  55% cloudy  | weather=61ms groq=888ms full=949ms | OK
[28/50] Helsinki        |   6.4°C  76% cloudy  | weather=71ms groq=1185ms full=1255ms | OK
[29/50] Riyadh          |  13.1°C  58% clear   | weather=71ms groq=983ms full=1053ms | OK
[30/50] Bogota          |  13.1°C  89% cloudy  | weather=64ms groq=988ms full=1052ms | OK
[31/50] Anchorage       |  -3.6°C  88% snowy   | weather=69ms groq=1082ms full=1151ms | OK
[32/50] Honolulu        |  24.1°C  81% rainy   | weather=69ms groq=1217ms full=1285ms | OK
[33/50] Istanbul        |    11°C  83% cloudy  | weather=75ms groq=948ms full=1023ms | OK
[34/50] Denver          |   7.2°C  68% clear   | weather=69ms groq=984ms full=1053ms | OK
[35/50] Kathmandu       |  12.8°C  81% clear   | weather=76ms groq=978ms full=1054ms | OK
[36/50] Ushuaia         |   8.7°C  96% cloudy  | weather=67ms groq=883ms full=950ms | OK
[37/50] Tromso          |  -0.1°C  95% cloudy  | weather=73ms groq=1082ms full=1155ms | OK
[38/50] Manaus          |  29.6°C  78% cloudy  | weather=66ms groq=884ms full=950ms | OK
[39/50] Athens          |  13.8°C  88% cloudy  | weather=66ms groq=1197ms full=1263ms | OK
[40/50] Dublin          |   2.3°C  74% clear   | weather=70ms groq=1182ms full=1251ms | OK
[41/50] Lagos           |  27.3°C  91% clear   | weather=72ms groq=985ms full=1058ms | OK
[42/50] Yakutsk         |   -34°C  71% clear   | weather=77ms groq=969ms full=1045ms | OK
[43/50] Doha            |  19.6°C  75% clear   | weather=65ms groq=988ms full=1053ms | OK
[44/50] Zurich          |   9.9°C  80% rainy   | weather=64ms groq=1091ms full=1155ms | OK
[45/50] Havana          |  22.4°C  76% clear   | weather=67ms groq=1035ms full=1102ms | OK
[46/50] Wellington      |  16.5°C  84% cloudy  | weather=89ms groq=1144ms full=1233ms | OK
[47/50] San Francisco   |  12.5°C  93% rainy   | weather=95ms groq=1027ms full=1122ms | OK
[48/50] Harbin          |  -3.9°C  48% cloudy  | weather=64ms groq=987ms full=1052ms | OK
[49/50] Lisbon          |  16.8°C  95% cloudy  | weather=70ms groq=882ms full=952ms | OK
[50/50] Ulaanbaatar     |  -8.2°C  76% cloudy  | weather=66ms groq=1093ms full=1160ms | OK

=== SUMMARY ===
Weather variety: min=-34°C, max=32.6°C, conditions=clear, cloudy, rainy, foggy, snowy
Valid JSON on first try: 50 out of 50
Matched expected schema: 50 out of 50
Needed retry or fallback: 0 out of 50
Breakdown -> 429 rate limits: 0 out of 50 | server fallbacks: 0 out of 50 | final valid after retries: 50 out of 50

=== LATENCY (ms) ===
Full request  -> median: 1059.7 ms | p95: 1358.9 ms | max: 2882.1 ms
Weather fetch -> median: 70.0 ms | p95: 118.5 ms | max: 1171.9 ms
Groq API call -> median: 988.0 ms | p95: 1283.5 ms | max: 1710.2 ms