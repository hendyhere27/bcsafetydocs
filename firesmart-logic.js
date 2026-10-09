// BC Safety Docs — FireSmart self-check logic.
// Shared by the website (blog/bc-firesmart-assessment-tool.html loads this as an
// ES module) and by free-docs-worker (which imports it to build the emailed
// report). Pure functions, no DOM, no network. The worker re-computes the result
// from the raw answers, so the emailed report never trusts client-supplied text.
//
// Sources for the recommendations (checked 2026-10-09): FireSmart BC "Begins at
// Home" guide and Home Ignition Zone pages (firesmartbc.ca), BC Wildfire Service
// rebate notes, and a regional-district wildfire-sprinkler factsheet. This is a
// SELF-CHECK, not an official FireSmart Home Ignition Zone Assessment.

export const ZONES = [
  { id: "home", label: "Your home & the Immediate Zone (0–1.5 m)" },
  { id: "intermediate", label: "Intermediate Zone (1.5–10 m)" },
  { id: "extended", label: "Extended Zone (10–30 m)" },
  { id: "water", label: "Water, access & fuel storage" },
  { id: "next", label: "Next steps" },
];

export const OPTIONS = {
  roof: ["metal", "tile", "rubber", "asphalt", "wood_untreated", "unsure"],
  roofDebris: ["clear", "sometimes", "buildup"],
  siding: ["noncombustible", "vinyl", "wood", "unsure"],
  vents: ["screened", "unscreened", "unsure"],
  outbuildings: ["0", "1", "2", "3_4", "5_plus"],
  outbuildingDistance: ["none", "within10", "10to30", "over30"],
  water: ["hydrant", "source_pump", "tank_pump", "hose_only", "none"],
  fuels: [
    "conifer_10m",
    "dense_forest",
    "heavy_timber",
    "dry_grass",
    "hay_storage",
    "deadfall",
    "firewood_near",
    "mulch_near",
    "fuel_storage_near",
  ],
  land: ["lt_quarter", "quarter_2", "2_10", "10_40", "40_plus"],
};

const BC_FSA = /^V\d[A-Z]$/;

export function normalizeFsa(postal) {
  const s = String(postal || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length >= 3 ? s.slice(0, 3) : "";
}

export function isBcPostal(postal) {
  const s = String(postal || "").toUpperCase().replace(/\s+/g, "");
  return /^V\d[A-Z]\d[A-Z]\d$/.test(s);
}

// Returns { ok:true, answers } with a cleaned copy, or { ok:false, error }.
export function validateAnswers(a) {
  if (!a || typeof a !== "object") return { ok: false, error: "Missing answers." };
  const out = {};
  const fsa = normalizeFsa(a.fsa || a.postal);
  if (!BC_FSA.test(fsa)) return { ok: false, error: "A BC postal code is required." };
  out.fsa = fsa;
  for (const key of ["roof", "roofDebris", "siding", "vents", "outbuildings", "outbuildingDistance", "water", "land"]) {
    if (!OPTIONS[key].includes(a[key])) return { ok: false, error: "Please answer every question (" + key + ")." };
    out[key] = a[key];
  }
  if (out.outbuildings === "0") out.outbuildingDistance = "none";
  if (out.outbuildings !== "0" && out.outbuildingDistance === "none") {
    return { ok: false, error: "Please say how close your nearest outbuilding is." };
  }
  const fuels = Array.isArray(a.fuels) ? a.fuels : [];
  out.fuels = [...new Set(fuels.filter((f) => OPTIONS.fuels.includes(f)))];
  return { ok: true, answers: out };
}

const OUTBUILDING_COUNT = { "0": 0, "1": 1, "2": 2, "3_4": 3, "5_plus": 4 };
const OUTBUILDING_DIST = { none: 0, within10: 3, "10to30": 1, over30: 0 };
const FUEL_POINTS = {
  conifer_10m: 10,
  dense_forest: 6,
  heavy_timber: 6,
  dry_grass: 6,
  hay_storage: 5,
  deadfall: 4,
  firewood_near: 5,
  mulch_near: 3,
  fuel_storage_near: 3,
};
const FUEL_CAP = 32;
const MAX_RISK = 36 + 12 + 8 + FUEL_CAP + 6; // roof(16)+debris(6)+siding(8)+vents(6) | outbuildings | water | fuels | land

// Each rule: when(answers) -> bool; points = risk points it carries.
function rules(a) {
  const R = [];
  const add = (id, zone, points, title, body) => R.push({ id, zone, points, title, body });

  // --- Home & Immediate Zone
  if (a.roof === "wood_untreated") add("roof", "home", 16, "Upgrade an untreated wood-shake or wood-shingle roof",
    "FireSmart BC advises avoiding untreated wood shakes. Fire-rated roofing (Class A, B or C) such as metal, asphalt, clay or composite rubber tile is recommended, and a Class A assembly offers the best protection. A roof replacement is a big job: until then, keep it spotless of needles and leaves.");
  if (a.roof === "unsure") add("roof_unsure", "home", 6, "Find out what your roof is made of and its fire rating",
    "Check your home documents, ask the roofer who installed it, or look at the product marking. FireSmart BC recommends fire-rated roofing (Class A, B or C) such as metal, asphalt, clay or composite rubber tile.");
  if (a.roof === "asphalt") add("roof_asphalt", "home", 2, "Confirm your asphalt shingles carry a fire rating",
    "Asphalt shingles are on FireSmart BC's list of recommended roofing materials. Check the packaging or ask your roofer that yours are fire-rated.");
  if (a.roofDebris !== "clear") add("debris", "home", a.roofDebris === "buildup" ? 6 : 3, "Clear needles and leaves from the roof and gutters regularly",
    "Embers can easily ignite dry debris on roofs and in gutters. Clear them in spring and fall, and consider metal mesh gutter screening to reduce what collects. Also clean out corners and crevices where debris builds up.");
  if (a.siding === "vinyl" || a.siding === "wood") add("siding", "home", a.siding === "wood" ? 8 : 5, "Plan for fire-resistant siding",
    "FireSmart BC lists stucco, metal, brick or concrete and fibre cement as the better choices and advises avoiding untreated wood and vinyl. Replacement is a long-term project. In the meantime, keep a non-combustible strip (gravel, brick or concrete) around the base of the house and keep the area clear of debris.");
  if (a.siding === "unsure") add("siding_unsure", "home", 3, "Identify your siding material",
    "Know whether it is non-combustible (stucco, metal, brick or concrete, fibre cement) or combustible (untreated wood, vinyl). FireSmart BC recommends the non-combustible options.");
  if (a.vents === "unscreened") add("vents", "home", 6, "Cover vents with 3 mm metal mesh",
    "With the exception of dryer vents, FireSmart BC recommends non-combustible vents covered with 3 mm metal screening, so embers cannot get into the attic or crawlspace.");
  if (a.vents === "unsure") add("vents_unsure", "home", 3, "Check whether your vents are screened",
    "Look at your attic, soffit and crawlspace vents. FireSmart BC recommends 3 mm non-combustible metal mesh on all vents except dryer vents.");
  add("immediate", "home", 0, "Keep the first 1.5 m around the house non-combustible",
    "Clear vegetation and combustible material down to mineral soil and cover with gravel, brick or concrete. Avoid woody shrubs in this strip, and keep fencing at least 1.5 m from the house. Sheath the base of decks and remove anything that collects underneath them.");

  // --- Intermediate Zone
  if (a.fuels.includes("conifer_10m")) add("conifer10", "intermediate", 10, "Remove evergreen trees within 10 m of the house",
    "FireSmart BC recommends removing coniferous trees within 10 m of your home and favouring deciduous species such as aspen, birch, maple or alder. Avoid cedar, juniper, pine and spruce close to the house.");
  if (a.fuels.includes("firewood_near")) add("firewood", "intermediate", 5, "Move firewood out of the first 10 m",
    "Firewood piles, construction materials, patio furniture and similar items should come out of the Intermediate Zone. A woodpile against the house is one of the most common ember targets.");
  if (a.fuels.includes("mulch_near")) add("mulch", "intermediate", 3, "Replace bark or pine-needle mulch near the house",
    "FireSmart BC advises against bark or pine-needle mulch within 10 m of the home. Use gravel or crushed rock instead.");
  if (a.fuels.includes("dry_grass")) add("grass", "intermediate", 6, "Keep grass short and hydrated near the house",
    "FireSmart BC recommends keeping grass shorter than 10 cm near the home and well hydrated where possible. Dry, cured grass carries fire quickly.");
  if (a.outbuildings !== "0" && a.outbuildingDistance === "within10") add("outbuild10", "intermediate", 3 * Math.max(1, OUTBUILDING_COUNT[a.outbuildings]), "Treat outbuildings within 10 m like part of the house, or move them",
    "FireSmart BC says to treat outbuildings to the same standards as the home, or relocate storage sheds, trailers and similar combustible structures into the Extended Zone (10–30 m). Apply the same roof, vent and debris measures to anything within 10 m.");

  // --- Extended Zone
  if (a.fuels.includes("dense_forest") || a.fuels.includes("heavy_timber")) add("thin", "extended", a.fuels.includes("dense_forest") && a.fuels.includes("heavy_timber") ? 12 : 6, "Thin and prune the trees out to 30 m",
    "FireSmart BC suggests selectively removing evergreens so there are at least 3 m between tree crowns, pruning branches to a height of 2 m (late winter, and never more than one-third of the canopy), and removing small conifers that act as ladders. For dense forest or heavy timber, ask your Local FireSmart Representative or a qualified forestry professional what is practical on your property.");
  if (a.fuels.includes("deadfall")) add("deadfall", "extended", 4, "Clean up fallen branches, dry grass and needles",
    "Regularly clear accumulations of woody debris, dry grass and needles in the 10–30 m zone. Add debris clean-up to your spring and fall yard work.");
  if (a.outbuildings !== "0" && a.outbuildingDistance === "10to30") add("outbuild30", "extended", 1 * Math.max(1, OUTBUILDING_COUNT[a.outbuildings]), "Keep the ground around outbuildings clear",
    "Outbuildings in the Extended Zone are where FireSmart BC suggests combustible structures sit. Keep conifers, dry grass and woody debris cleared around them, and keep their roofs and vents in the same condition as your home's.");
  if (a.fuels.includes("hay_storage")) add("hay", "extended", 5, "Keep hay, straw and feed storage well away from buildings",
    "Bales and feed are very combustible. Store them away from the house and other buildings, outside the first 10 m, and keep the ground around the stack mowed and cleared.");

  // --- Water, access & fuel storage
  if (a.water === "none" || a.water === "hose_only") add("water", "water", a.water === "none" ? 8 : 6, "Plan your water supply and keep fire tools ready",
    "FireSmart BC recommends keeping shovels, rakes, hoses, sprinklers and ladders where you can grab them. Ask your local fire department what water supply is realistic for your property. Wildfire sprinklers are not a substitute for FireSmart actions, can strain local water supplies, and should not be connected to a municipal water system unless your local government says it is allowed.");
  if (a.water === "source_pump" || a.water === "tank_pump") add("water_ok", "water", 2, "Test your pump and hoses each season",
    "A pump and hoses only help if they start. Test them each spring, keep fuel fresh, and make sure your fire department knows where the water source is and how to reach it.");
  if (a.fuels.includes("fuel_storage_near")) add("fuelstore", "water", 3, "Check clearances around propane, gasoline and diesel storage",
    "Ask your fuel supplier and local fire department about the clearances that apply to your tanks and containers, and keep vegetation, debris and combustible storage away from them.");
  if (a.land === "2_10" || a.land === "10_40" || a.land === "40_plus") add("access", "water", 0, "Keep driveways and access clear and add a turnaround",
    "On larger properties, focus on the 30 m around each building first. FireSmart BC also recommends clearing vegetation from driveways and access routes and, where possible, providing a driveway turnaround so emergency vehicles can get in and out.");
  if (a.land === "lt_quarter" || a.land === "quarter_2") add("neighbours", "water", 0, "Talk to your neighbours",
    "On a smaller lot, your neighbours' fuels matter as much as yours. FireSmart BC encourages neighbours to coordinate and work through the zones together.");

  // --- Next steps (always)
  add("assess", "next", 0, "Book an official FireSmart Home Ignition Zone Assessment",
    "This self-check is not an official assessment. Many BC local governments offer free assessments by a qualified Local FireSmart Representative, and rebate programs generally require one. Rebate availability, amounts and rules differ by community and funding is limited, so contact your municipality, regional district or First Nation.");
  add("habit", "next", 0, "Make it a spring and fall habit",
    "Debris clean-up on the roof, in the gutters and in the first 10 m is the cheapest FireSmart action and the one that most often gets skipped.");

  return R;
}

function strengths(a) {
  const S = [];
  if (["metal", "tile", "rubber"].includes(a.roof)) S.push("Your roof material is on FireSmart BC's recommended list.");
  if (a.roof === "asphalt") S.push("Asphalt shingles are on FireSmart BC's recommended roofing list (confirm the fire rating).");
  if (a.roofDebris === "clear") S.push("You keep your roof and gutters clear of debris.");
  if (a.siding === "noncombustible") S.push("Your siding is a non-combustible type.");
  if (a.vents === "screened") S.push("Your vents are screened with fine metal mesh.");
  if (!a.fuels.includes("conifer_10m")) S.push("No evergreen trees within 10 m of the house.");
  if (!a.fuels.includes("firewood_near")) S.push("Firewood is not stacked close to the house.");
  if (a.outbuildings === "0" || a.outbuildingDistance === "over30") S.push("Outbuildings are not close to the house.");
  if (a.water === "hydrant" || a.water === "source_pump" || a.water === "tank_pump") S.push("You have a water source to work with.");
  return S;
}

export function assess(rawAnswers) {
  const v = validateAnswers(rawAnswers);
  if (!v.ok) return { ok: false, error: v.error };
  const a = v.answers;

  let risk = 0;
  risk += { metal: 0, tile: 0, rubber: 0, asphalt: 2, wood_untreated: 16, unsure: 6 }[a.roof];
  risk += { clear: 0, sometimes: 3, buildup: 6 }[a.roofDebris];
  risk += { noncombustible: 0, vinyl: 5, wood: 8, unsure: 3 }[a.siding];
  risk += { screened: 0, unscreened: 6, unsure: 3 }[a.vents];
  risk += Math.min(12, OUTBUILDING_COUNT[a.outbuildings] * OUTBUILDING_DIST[a.outbuildingDistance]);
  risk += { hydrant: 0, source_pump: 1, tank_pump: 1, hose_only: 6, none: 8 }[a.water];
  risk += Math.min(FUEL_CAP, a.fuels.reduce((s, f) => s + FUEL_POINTS[f], 0));
  risk += { lt_quarter: 0, quarter_2: 1, "2_10": 3, "10_40": 5, "40_plus": 6 }[a.land];

  // Scale to 5–95 so nobody is told they are at 0 or 100 on a self-check.
  const score = Math.max(5, Math.min(95, Math.round(5 + 90 * (1 - risk / MAX_RISK))));
  const level =
    score >= 80 ? { id: "strong", label: "Strong", blurb: "Most of the high-impact FireSmart basics look covered." }
    : score >= 60 ? { id: "good", label: "Good start", blurb: "A few specific fixes would make a real difference." }
    : score >= 40 ? { id: "work", label: "Needs work", blurb: "Several FireSmart actions are worth doing, starting closest to the house." }
    : { id: "priority", label: "Priority attention", blurb: "Your answers point to multiple ember and fuel concerns. Start with the first items below." };

  const zoneOrder = Object.fromEntries(ZONES.map((z, i) => [z.id, i]));
  const items = rules(a).sort((x, y) => (zoneOrder[x.zone] - zoneOrder[y.zone]) || (y.points - x.points));
  const top = items.filter((i) => i.points > 0).sort((x, y) => y.points - x.points).slice(0, 3);

  return { ok: true, answers: a, score, level, items, top, strengths: strengths(a) };
}
