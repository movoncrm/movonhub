import type { Product, ProductCategory, RentalPlan } from "@/lib/types";

/**
 * Phase 5 product preparation.
 *
 * Source documents:
 *  - CKI  = "OCT 2026 CKI CUSTOMER PROMOTION (as at 02102026, V7)" (1–31 Oct 2026)
 *  - MOVON = "Q4 2026 MOVON PROMOTION (as at 03102026)" (1 Oct – 31 Dec 2026)
 *
 * All products here are created as **draft** so they are prepared for the
 * catalogue without being exposed publicly (the public catalogue only lists
 * `active` products). Prices are transcribed from the source "Outright price"
 * (normal) columns; the current promotional price is recorded in
 * `specifications["Promotion (source)"]`. Nothing is invented: where a value is
 * not documented it is omitted and listed in docs/phase-5/PRODUCT_INVENTORY.md.
 */

const NOW = new Date("2026-10-01T00:00:00.000Z").toISOString();
const CKI = "OCT 2026 CKI CUSTOMER PROMOTION (V7)";
const MOVON = "Q4 2026 MOVON PROMOTION";

/** New categories introduced by the Phase 5 source material. */
export const PHASE5_CATEGORIES: ProductCategory[] = [
  {
    id: "cat_choice",
    slug: "movon-choice",
    name: "MOVON Choice (CUCKOO)",
    description: "CUCKOO water purifiers, filters, air purifiers and lifestyle appliances.",
    icon: "sparkles",
    sortOrder: 4,
  },
  {
    id: "cat_samsung",
    slug: "samsung-series",
    name: "Samsung Series",
    description: "Samsung home appliances offered through MOVON promotions.",
    icon: "layout-grid",
    sortOrder: 5,
  },
];

interface DraftInput {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  series?: string;
  model?: string;
  shortDescription: string;
  fullDescription?: string;
  features?: string[];
  specifications?: Record<string, string>;
  rentalPlans?: RentalPlan[];
  outrightPrice?: number;
  warranty?: string;
  installation?: string;
  sourceRef: string;
  sourceUrl?: string;
  sortOrder: number;
}

function draft(input: DraftInput): Product {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    categoryId: input.categoryId,
    series: input.series,
    model: input.model,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    features: input.features ?? [],
    specifications: {
      ...(input.specifications ?? {}),
      "Source document": input.sourceRef,
    },
    rentalPlans: input.rentalPlans ?? [],
    outrightPrice: input.outrightPrice,
    warranty: input.warranty,
    installation: input.installation,
    status: "draft",
    sourceUrl: input.sourceUrl,
    sourceRef: input.sourceRef,
    sortOrder: input.sortOrder,
    updatedAt: NOW,
  };
}

/** Build a simple outright + rental plan list from documented monthly figures. */
function rental(label: string, monthlyPrice: number, tenureMonths: number, note?: string): RentalPlan {
  return { label, monthlyPrice, tenureMonths, note };
}

export const PHASE5_PRODUCTS: Product[] = [
  /* ---------------------------------------------------- CKI water purifiers */
  draft({
    id: "p5_flo",
    slug: "cuckoo-flo",
    name: "CUCKOO FLO Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO FLO water purifier with outright and rent-to-own plans.",
    specifications: {
      "Outright price": "RM 4,450",
      "Promotion (source)": "RM 4,150 (save RM 300)",
      "Service plan": "CCSP 2 years / 2+1 years",
    },
    rentalPlans: [
      rental("3+2yr rental (Mth1–36)", 121, 60, "Obligation 3yrs; RM1 + 50% off 3 months"),
      rental("3+2yr rental (Mth37–60)", 121, 60),
      rental("5+2yr rental (Mth1–60)", 92, 60, "Obligation 5yrs"),
    ],
    outrightPrice: 4450,
    sourceRef: `${CKI} — Water Purifier (outright/rental)`,
    sortOrder: 1,
  }),
  draft({
    id: "p5_grande",
    slug: "cuckoo-grande",
    name: "CUCKOO GRANDE Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO GRANDE water purifier with outright and rent-to-own plans.",
    specifications: {
      "Outright price": "RM 4,750",
      "Promotion (source)": "RM 4,450 (save RM 300)",
      "Service plan": "CCSP 2 years / 2+1 years",
    },
    rentalPlans: [
      rental("3+2yr rental (Mth1–36)", 121, 60, "Obligation 3yrs"),
      rental("5+2yr rental (Mth1–60)", 110, 60, "Obligation 5yrs"),
    ],
    outrightPrice: 4750,
    sourceRef: `${CKI} — Water Purifier (outright/rental)`,
    sortOrder: 2,
  }),
  draft({
    id: "p5_titan",
    slug: "cuckoo-titan",
    name: "CUCKOO TITAN Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO TITAN water purifier with outright, rental and self-service plans.",
    specifications: {
      "Outright price": "RM 4,550",
      "Promotion (source)": "RM 4,250 (save RM 300)",
    },
    rentalPlans: [
      rental("3+2yr rental (Mth1–36)", 119, 60, "Obligation 3yrs"),
      rental("5+2yr rental (Mth1–60)", 109, 60, "Obligation 5yrs"),
      rental("Self-service rental (Mth1–36)", 111, 60, "Obligation 3yrs"),
    ],
    outrightPrice: 4550,
    sourceRef: `${CKI} — Water Purifier (outright/rental)`,
    sortOrder: 3,
  }),
  draft({
    id: "p5_glamour",
    slug: "cuckoo-glamour",
    name: "CUCKOO GLAMOUR Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO GLAMOUR water purifier with outright and rent-to-own plans.",
    specifications: {
      "Outright price": "RM 4,350",
      "Promotion (source)": "RM 4,050 (save RM 300)",
      "Self-service rental (source)": "Save RM 200",
    },
    rentalPlans: [
      rental("3+2yr rental (Mth1–36)", 110, 60, "Obligation 3yrs"),
      rental("5+2yr rental (Mth1–60)", 100, 60, "Obligation 5yrs"),
    ],
    outrightPrice: 4350,
    sourceRef: `${CKI} — Water Purifier (outright/rental)`,
    sortOrder: 4,
  }),
  draft({
    id: "p5_xcel2",
    slug: "cuckoo-xcel-2",
    name: "CUCKOO XCEL 2 Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO XCEL 2 water purifier (white/black), outright and rental.",
    specifications: {
      "Outright price": "RM 4,200",
      "Promotion (source)": "RM 3,900 (save RM 300)",
      Colours: "White / Black",
    },
    rentalPlans: [
      rental("3+2yr rental (Mth1–36)", 100, 60, "Obligation 3yrs"),
      rental("5+2yr rental (Mth1–60)", 83, 60, "Obligation 5yrs"),
    ],
    outrightPrice: 4200,
    sourceRef: `${CKI} — Water Purifier (outright/rental)`,
    sortOrder: 5,
  }),
  draft({
    id: "p5_kiut",
    slug: "cuckoo-kiut",
    name: "CUCKOO KIUT Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO KIUT compact water purifier, outright and rental.",
    specifications: {
      "Outright price": "RM 3,050",
      "Promotion (source)": "RM 2,750 (save RM 300)",
    },
    rentalPlans: [
      rental("3+2yr rental (Mth1–36)", 72, 60, "Obligation 3yrs"),
      rental("5+2yr rental (Mth1–60)", 62, 60, "Obligation 5yrs"),
      rental("Self-service rental (Mth1–36)", 64, 60, "Obligation 3yrs"),
    ],
    outrightPrice: 3050,
    sourceRef: `${CKI} — Water Purifier (outright/rental)`,
    sortOrder: 6,
  }),
  draft({
    id: "p5_warrior",
    slug: "cuckoo-warrior",
    name: "CUCKOO WARRIOR Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO WARRIOR water purifier with outright and rental plans.",
    specifications: {
      "Outright price": "RM 3,400",
      "Promotion (source)": "RM 3,100 (save RM 300)",
      "Self-service rental (source)": "RM 2,850 (save RM 200)",
    },
    rentalPlans: [
      rental("3+2yr rental (Mth1–36)", 105, 60, "Obligation 3yrs"),
      rental("5+2yr rental (Mth1–60)", 95, 60, "Obligation 5yrs"),
    ],
    outrightPrice: 3400,
    sourceRef: `${CKI} — Water Purifier (outright/rental)`,
    sortOrder: 7,
  }),
  draft({
    id: "p5_kingtop2",
    slug: "cuckoo-king-top-2",
    name: "CUCKOO KING TOP 2 Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO KING TOP 2 water purifier with an RM12 rental promotion.",
    specifications: {
      "Outright price": "RM 3,850",
      "Promotion (source)": "RM 3,550 (save RM 300)",
      "Rental promotion": "RM12 for 12 months (on-time payment required)",
    },
    rentalPlans: [
      rental("3+2yr rental (Mth1–36)", 86, 60, "Obligation 3yrs"),
      rental("GOOOD PLAN 7+0yr (Mth1–84)", 61, 84, "RM12 for months 1–11, RM61 thereafter"),
    ],
    outrightPrice: 3850,
    sourceRef: `${CKI} — Water Purifier (outright/rental)`,
    sortOrder: 8,
  }),
  draft({
    id: "p5_vividtop",
    slug: "cuckoo-vivid-top",
    name: "CUCKOO VIVID TOP Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO VIVID TOP water purifier, outright and rental.",
    specifications: {
      "Outright price": "RM 3,360",
      "Promotion (source)": "RM 3,060 (save RM 300)",
    },
    rentalPlans: [
      rental("3+2yr rental (Mth1–36)", 77, 60, "Obligation 3yrs"),
      rental("5+2yr rental (Mth1–60)", 66, 60, "Obligation 5yrs"),
    ],
    outrightPrice: 3360,
    sourceRef: `${CKI} — Water Purifier (outright/rental)`,
    sortOrder: 9,
  }),
  draft({
    id: "p5_granite",
    slug: "cuckoo-granite",
    name: "CUCKOO GRANITE Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO GRANITE premium water purifier (no discount in source).",
    specifications: {
      "Outright price": "RM 7,200 (no discount in source)",
    },
    rentalPlans: [rental("3+2yr rental (Mth1–36)", 155, 60, "Obligation 3yrs")],
    outrightPrice: 7200,
    sourceRef: `${CKI} — Water Purifier (outright/rental)`,
    sortOrder: 10,
  }),
  draft({
    id: "p5_ace",
    slug: "cuckoo-ace",
    name: "CUCKOO ACE Water Purifier",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO ACE water purifier with outright pricing.",
    specifications: {
      "Outright price": "RM 6,850",
      "Promotion (source)": "RM 6,350 (save RM 500)",
      "Service plan": "CCSP 2+1 years",
    },
    outrightPrice: 6850,
    sourceRef: `${CKI} — Water Purifier (outright)`,
    sortOrder: 11,
  }),

  /* ------------------------------------------------------ CKI outdoor filter */
  draft({
    id: "p5_primex3",
    slug: "cuckoo-prime-x3",
    name: "CUCKOO PRIME X3 Outdoor Filter (POE)",
    categoryId: "cat_choice",
    shortDescription: "Point-of-entry outdoor filter with free timer.",
    specifications: {
      "Original price": "RM 2,600",
      "Promotion (source)": "RM 2,100 (save RM 500, includes FREE timer)",
      "Service plan": "CCSP 1 year",
    },
    rentalPlans: [rental("5yr rental (Mth1–60)", 88, 60, "50% off for 3 months")],
    outrightPrice: 2600,
    sourceRef: `${CKI} — Outdoor Filter`,
    sortOrder: 12,
  }),

  /* ------------------------------------------------------- CKI air purifiers */
  draft({
    id: "p5_airpurifier",
    slug: "cuckoo-air-purifier-models",
    name: "CUCKOO Air Purifier (D/K/U/C+/L/R Models)",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO air purifier range with multiple models and rental plans.",
    specifications: {
      "Models": "D, K, U, C+, L, R",
      "Rental promotion": "50% off for 3 months",
      "Service plan": "CCSP 1+1 years",
    },
    rentalPlans: [
      rental("D Model (3+2yr Mth1–36)", 127, 60, "Obligation 3yrs"),
      rental("K Model (3+2yr Mth1–36)", 94, 60, "Obligation 3yrs"),
      rental("U Model (3+2yr Mth1–36)", 143, 60, "Obligation 3yrs"),
      rental("C+ Model (3+2yr Mth1–36)", 121, 60, "Obligation 3yrs"),
      rental("L Model (3+2yr Mth1–36)", 105, 60, "Obligation 3yrs"),
      rental("R Model (3+2yr Mth1–36)", 77, 60, "Obligation 3yrs"),
    ],
    sourceRef: `${CKI} — Air Purifier (outright/rental)`,
    sortOrder: 13,
  }),
  draft({
    id: "p5_airpurifier_i",
    slug: "cuckoo-air-purifier-i-model",
    name: "CUCKOO Air Purifier i Model",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO i Model air purifier with outright pricing.",
    specifications: {
      "Outright price": "RM 2,000",
      "Promotion (source)": "RM 1,400 (save RM 600)",
      "Service plan": "CCSP 1 year / 1+1 years",
    },
    outrightPrice: 2000,
    sourceRef: `${CKI} — Air Purifier (outright)`,
    sortOrder: 14,
  }),

  /* -------------------------------------------------------- CKI massage chairs */
  draft({
    id: "p5_lounger",
    slug: "cuckoo-bespoke-massage-lounger",
    name: "CUCKOO Bespoke Massage Lounger",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO Bespoke massage lounger with rental plan.",
    specifications: {
      "Original price": "RM 6,500",
      "Promotion (source)": "RM 4,612 (save RM 1,888)",
      "Service plan": "CCSP 1+1 years",
    },
    rentalPlans: [rental("5yr rental (Mth1–60)", 99, 60, "50% off for 3 months")],
    outrightPrice: 6500,
    sourceRef: `${CKI} — Massage Chair`,
    sortOrder: 15,
  }),
  draft({
    id: "p5_bespoke20",
    slug: "cuckoo-bespoke-2-0-massage-chair",
    name: "CUCKOO Bespoke 2.0 Massage Chair",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO Bespoke 2.0 massage chair with free gift.",
    specifications: {
      "Original price": "RM 8,250",
      "Promotion (source)": "RM 7,750 (save RM 500)",
      "Free gift": "Massage Gun worth RM599 / OGAWA Comfy Eyemask (while stocks last)",
      "Service plan": "CCSP 1+2 years",
    },
    rentalPlans: [rental("5yr rental (Mth1–60)", 148, 60, "50% off for 3 months")],
    outrightPrice: 8250,
    sourceRef: `${CKI} — Massage Chair`,
    sortOrder: 16,
  }),

  /* ------------------------------------------------------------- CKI mattresses */
  draft({
    id: "p5_aluxe",
    slug: "cuckoo-a-luxe-mattress",
    name: "CUCKOO A LUXE Mattress",
    categoryId: "cat_choice",
    shortDescription: "A LUXE mattress (king/queen, with optional bed frame).",
    specifications: {
      "King mattress only": "RM 5,650 → RM 5,362 (discount RM 288)",
      "King with bed frame": "RM 6,900 → RM 6,612",
      "Queen mattress only": "RM 5,350 → RM 5,062",
      "Queen with bed frame": "RM 6,600 → RM 6,312",
      Remarks: "2 waterproof mattress protectors",
      "Service plan": "CCSP 1 year",
    },
    rentalPlans: [
      rental("3yr rental (Mth1–36)", 185, 36, "King, mattress only"),
      rental("5yr rental (Mth1–60)", 153, 60, "King, mattress only"),
      rental("7yr rental (Mth1–84)", 129, 84, "King, mattress only"),
    ],
    sourceRef: `${CKI} — Mattress`,
    sortOrder: 17,
  }),
  draft({
    id: "p5_alite",
    slug: "cuckoo-a-lite-mattress",
    name: "CUCKOO A LITE Mattress",
    categoryId: "cat_choice",
    shortDescription: "A LITE mattress (king/queen, with optional bed frame).",
    specifications: {
      "King mattress only": "RM 4,150 → RM 3,862 (discount RM 288)",
      "King with bed frame": "RM 5,400 → RM 5,112",
      "Queen mattress only": "RM 3,850 → RM 3,562",
      "Queen with bed frame": "RM 5,100 → RM 4,812",
      Remarks: "2 waterproof mattress protectors",
      "Service plan": "CCSP 1 year",
    },
    rentalPlans: [
      rental("A LITE King (mattress only)", 125, 60),
      rental("A LITE Queen (mattress only)", 105, 60),
    ],
    sourceRef: `${CKI} — Mattress`,
    sortOrder: 18,
  }),
  draft({
    id: "p5_hugz",
    slug: "cuckoo-hugz-mattress",
    name: "CUCKOO Hugz Mattress",
    categoryId: "cat_choice",
    shortDescription: "Hugz mattress with outright promotion.",
    specifications: {
      "Original price": "RM 2,999",
      "Promotion (source)": "RM 2,499 (save RM 500)",
      "Service plan": "CCSP 1 year",
    },
    outrightPrice: 2999,
    sourceRef: `${CKI} — Mattress`,
    sortOrder: 19,
  }),
  draft({
    id: "p5_flexdaybed",
    slug: "cuckoo-flex-daybed",
    name: "CUCKOO Flex Daybed",
    categoryId: "cat_choice",
    shortDescription: "Flex Daybed with waived PRF and free bed covers.",
    specifications: {
      "Outright price": "RM 3,900",
      Remarks: "Waive PRF & FREE bed covers (1st upon installation, 2nd during month 24)",
      "Service plan": "CCSP 1 year",
    },
    rentalPlans: [rental("3yr rental (Mth1–36)", 140, 36, "50% off for 3 months")],
    outrightPrice: 3900,
    sourceRef: `${CKI} — Mattress`,
    sortOrder: 20,
  }),

  /* ------------------------------------------------------------- CKI others */
  draft({
    id: "p5_bfit",
    slug: "cuckoo-b-fit-treadmill",
    name: "CUCKOO B-FIT Treadmill",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO B-FIT treadmill with rental plan.",
    specifications: {
      "Original price": "RM 3,399",
      "Promotion (source)": "RM 2,711 (save RM 688)",
      "Service plan": "CCSP 1+1 years",
    },
    rentalPlans: [rental("3yr rental (Mth1–36)", 102, 36, "50% off for 3 months")],
    outrightPrice: 3399,
    sourceRef: `${CKI} — Treadmill`,
    sortOrder: 21,
  }),
  draft({
    id: "p5_qube",
    slug: "cuckoo-qube-table-top-dishwasher",
    name: "CUCKOO QUBE Table Top Dishwasher",
    categoryId: "cat_choice",
    shortDescription: "CUCKOO QUBE table top dishwasher with rental plan.",
    specifications: {
      "Original price": "RM 4,000",
      "Promotion (source)": "RM 3,500 (save RM 500)",
      "Service plan": "CCSP 1 year",
    },
    rentalPlans: [rental("5yr rental (Mth1–36)", 109, 60, "Obligation 5yrs")],
    outrightPrice: 4000,
    sourceRef: `${CKI} — Dishwasher`,
    sortOrder: 22,
  }),
  draft({
    id: "p5_inductwo",
    slug: "cuckoo-inductwo",
    name: "CUCKOO INDUCTWO Kitchen Hob",
    categoryId: "cat_choice",
    shortDescription: "INDUCTWO induction hob (with/without casing), rental plan.",
    specifications: {
      "Without casing": "RM 91.00 / month",
      "With casing": "RM 101.00 / month",
      "Rental promotion": "50% off for 3 months",
    },
    rentalPlans: [rental("5yr rental", 91, 60, "Without casing"), rental("5yr rental", 101, 60, "With casing")],
    sourceRef: `${CKI} — Kitchen Appliances`,
    sortOrder: 23,
  }),
  draft({
    id: "p5_inductrio",
    slug: "cuckoo-inductrio",
    name: "CUCKOO INDUCTRIO Kitchen Hob",
    categoryId: "cat_choice",
    shortDescription: "INDUCTRIO induction hob (with/without casing), rental plan.",
    specifications: {
      "Without casing": "RM 103.00 / month",
      "With casing": "RM 113.00 / month",
      "Rental promotion": "50% off for 3 months",
    },
    rentalPlans: [rental("5yr rental", 103, 60, "Without casing"), rental("5yr rental", 113, 60, "With casing")],
    sourceRef: `${CKI} — Kitchen Appliances`,
    sortOrder: 24,
  }),
  draft({
    id: "p5_vita5tar",
    slug: "cuckoo-vita-5tar-aircond",
    name: "CUCKOO VITA 5TAR Inverter Air Conditioner",
    categoryId: "cat_choice",
    shortDescription: "VITA 5TAR inverter air conditioner in 1.0HP and 1.5HP, rental plan.",
    specifications: {
      "1.0HP": "RM 103.00 / month (5yr)",
      "1.5HP": "RM 113.00 / month (5yr)",
      "Rental promotion": "RM38/RM48 for 3 months",
    },
    rentalPlans: [rental("1.0HP (5yr)", 103, 60), rental("1.5HP (5yr)", 113, 60)],
    sourceRef: `${CKI} — Air Conditioners`,
    sortOrder: 25,
  }),

  /* ---------------------------------------------------------- Samsung Series */
  draft({
    id: "p5_samsung_laundry",
    slug: "samsung-bespoke-ai-laundry-combo",
    name: "Samsung Bespoke AI Laundry Combo AI Ecobubble 12/7kg",
    categoryId: "cat_samsung",
    shortDescription: "Samsung Bespoke AI Laundry Combo (outright and rental).",
    specifications: {
      "Outright price": "RM 5,299",
      "Rental promotion": "RM20 for 6 months (7yr plan)",
    },
    rentalPlans: [rental("7yr rental (Mth6–83)", 90, 84, "RM20 for months 1–5")],
    outrightPrice: 5299,
    sourceRef: `${CKI} — Samsung Series`,
    sortOrder: 1,
  }),
  draft({
    id: "p5_samsung_tv",
    slug: "samsung-65-mini-led-4k-tv",
    name: 'Samsung 65" Mini LED 4K Vision AI Smart TV',
    categoryId: "cat_samsung",
    shortDescription: "Samsung 65-inch Mini LED 4K Vision AI Smart TV (outright).",
    specifications: { "Outright price": "RM 4,599" },
    outrightPrice: 4599,
    sourceRef: `${CKI} — Samsung Series`,
    sortOrder: 2,
  }),
  draft({
    id: "p5_samsung_fridge",
    slug: "samsung-583l-sbs-refrigerator",
    name: "Samsung 583L Side-by-Side Refrigerator (SmartThings AI)",
    categoryId: "cat_samsung",
    shortDescription: "Samsung 583L side-by-side refrigerator, Energy Gentle Silver Matt.",
    specifications: { "Outright price": "RM 4,099", Colour: "Energy Gentle Silver Matt" },
    outrightPrice: 4099,
    sourceRef: `${CKI} — Samsung Series`,
    sortOrder: 3,
  }),

  /* ------------------------------------------------------------- MOVON Baby */
  draft({
    id: "p5_foldmate",
    slug: "movon-foldmate",
    name: "MOVON FoldMate Stroller",
    categoryId: "cat_baby",
    shortDescription: "FoldMate compact stroller with cash rebate and rental plan.",
    specifications: {
      "Outright price": "RM 2,000",
      "Cash rebate": "RM 500",
      "After rebate": "RM 1,500",
      "Product warranty": "3 years",
    },
    rentalPlans: [rental("48 months", 45, 48), rental("60 months", 40, 60)],
    outrightPrice: 2000,
    warranty: "3 years",
    sourceRef: `${MOVON} — MOVON Baby`,
    sortOrder: 4,
  }),
  draft({
    id: "p5_strollmate",
    slug: "movon-strollmate",
    name: "MOVON StrollMate Stroller",
    categoryId: "cat_baby",
    shortDescription: "StrollMate stroller with cash rebate and rental plan.",
    specifications: {
      "Outright price": "RM 2,300",
      "Cash rebate": "RM 500",
      "After rebate": "RM 1,800",
      "Product warranty": "3 years",
    },
    rentalPlans: [rental("48 months", 65, 48), rental("60 months", 55, 60)],
    outrightPrice: 2300,
    warranty: "3 years",
    sourceRef: `${MOVON} — MOVON Baby`,
    sortOrder: 5,
  }),
];
