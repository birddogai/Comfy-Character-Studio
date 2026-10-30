import type { ReactNode } from "react";

// Small line icons for the Create tiles, drawn in code so nothing has to
// download. Colors (skin, hair, eyes) are real swatches; bodies, faces, hair
// and outfits are simple drawings on a 48×48 grid. Anything without a drawing
// falls back to its first letter.

const skin: Record<string, string> = {
  "very-fair": "#f6e0d2", "fair-pink": "#f1c9b8", "light-olive": "#d9b48f", "medium-tan": "#c08a5b",
  "golden-brown": "#9a6438", "deep-brown": "#6a4126", "very-deep": "#3e2416",
};
const hair: Record<string, string> = {
  "jet-black": "#141414", "dark-brown": "#3b2416", chestnut: "#7a3f1d", "honey-blonde": "#d6a85a", platinum: "#ece6d6",
  copper: "#b5532a", cherry: "#c4182f", silver: "#a9adb3", white: "#f7f7f7", "pastel-pink": "#f4b6c8", lilac: "#c6a6e8",
  "electric-blue": "#1f6bff", mint: "#9fe3c5",
};
const iris: Record<string, string> = { "dark-brown": "#4a2a17", hazel: "#8a6a2f", green: "#3f8a4f", blue: "#3d7fd6", grey: "#8f99a3", amber: "#c98a1b" };

const head = <circle cx="24" cy="20" r="9" />;
const shoulders = <path d="M10 44c1-8 7-12 14-12s13 4 14 12" />;
const person = <>{head}{shoulders}</>;

// A standing figure: shoulder and hip half-widths, leg length, head size.
function figure({ shoulder = 7, hip = 5, legs = 14, headR = 4, neck = 2, waist }: { shoulder?: number; hip?: number; legs?: number; headR?: number; neck?: number; waist?: number }) {
  const top = 46 - legs - 16 - neck - headR * 2;
  const shoulderY = top + headR * 2 + neck;
  const hipY = shoulderY + 16;
  const w = waist ?? hip;
  return (
    <>
      <circle cx="24" cy={top + headR} r={headR} fill="currentColor" fillOpacity=".18" />
      <path d={`M24 ${top + headR * 2} V${shoulderY}`} />
      <path d={`M${24 - shoulder} ${shoulderY + 2} L${21 - shoulder} ${hipY - 2} M${24 + shoulder} ${shoulderY + 2} L${27 + shoulder} ${hipY - 2}`} strokeWidth={3} />
      <path d={`M${24 - shoulder} ${shoulderY} L${24 + shoulder} ${shoulderY} L${24 + w} ${shoulderY + 9} L${24 + hip} ${hipY} L${24 - hip} ${hipY} L${24 - w} ${shoulderY + 9} Z`} fill="currentColor" fillOpacity=".12" />
      <path d={`M${24 - hip + 2} ${hipY} L${24 - hip + 1} 46 M${24 + hip - 2} ${hipY} L${24 + hip - 1} 46`} />
    </>
  );
}

const averageLine = <path d="M4 8h40" strokeDasharray="2 3" strokeWidth={1} />;

const drawings: Record<string, Record<string, ReactNode>> = {
  kind: {
    "true-to-life": person,
    striking: <>{head}{shoulders}<path d="M20 18l1.5 1.5M28 18l-1.5 1.5M22 24h4" /></>,
    stylized: <><circle cx="24" cy="19" r="11" /><circle cx="20" cy="19" r="2.5" /><circle cx="28" cy="19" r="2.5" /><path d="M14 45c2-7 6-10 10-10s8 3 10 10" /></>,
    fox: <><path d="M8 6l14 10h4L40 6l-3 23-13 13-13-13Z" fill="currentColor" fillOpacity=".12"/><path d="m12 12 4 11-5 6 13 9 13-9-5-6 4-11M16 26l5 3m11-3-5 3"/><path d="m21 34 3 3 3-3Z" fill="currentColor"/></>,
    dog: <><path d="M14 14q-8 0-8 10 0 6 4 6l4-8M34 14q8 0 8 10 0 6-4 6l-4-8" /><path d="M14 14q10-6 20 0l2 14q-2 12-12 12T12 28Z" fill="currentColor" fillOpacity=".12" /><circle cx="19" cy="24" r="1.5" /><circle cx="29" cy="24" r="1.5" /><path d="M21 31h6l-3 3Z" fill="currentColor" /></>,
    cat: <><path d="M10 6l6 10h16l6-10 2 22q-2 14-16 14T8 28Z" fill="currentColor" fillOpacity=".12" /><path d="M10 6l6 10h16l6-10 2 22q-2 14-16 14T8 28Z" /><path d="M17 25q2-2 4 0M27 25q2-2 4 0M24 30l-2 2h4ZM8 31l10-1M8 35l10-2M40 31l-10-1M40 35l-10-2" /></>,
    owl: <><circle cx="24" cy="24" r="14" /><circle cx="18.5" cy="22" r="4" /><circle cx="29.5" cy="22" r="4" /><path d="M24 26l-2 3h4z" /><path d="M14 12l3 4M34 12l-3 4" /></>,
    axolotl: <><ellipse cx="24" cy="27" rx="12" ry="10" fill="currentColor" fillOpacity=".12"/><path d="m13 22-6-8m5 13H3m10 5-6 7m28-17 6-8m-5 13h9m-10 5 6 7M7 14v6m-4 7 4-3m0 15 1-6m33-19v6m4 7-4-3m0 15-1-6M20 31q4 3 8 0"/><circle cx="19" cy="25" r="1.5" fill="currentColor"/><circle cx="29" cy="25" r="1.5" fill="currentColor"/></>,
    chameleon: <><path d="M12 28q3-12 16-12l4-6 4 8 7 8H17"/><circle cx="33" cy="21" r="3"/><path d="M17 28l-3 8h6m9-8-2 8h6M12 28C0 25 0 44 13 42c10-2 5-12-1-8"/></>,
    "red-panda": <><path d="M12 19Q5 4 17 10l7 3 7-3q12-6 5 9c10 16-2 24-12 24S2 35 12 19Z"/><path d="m10 25 10-5-3 12Zm28 0-10-5 3 12Z" fill="currentColor" fillOpacity=".3"/><circle cx="17" cy="26" r="1.5" fill="currentColor"/><circle cx="31" cy="26" r="1.5" fill="currentColor"/><path d="m21 33 3 3 3-3Zm3 3v3m-5-1q5 4 10 0"/></>,
    moth: <><path d="M24 14v22" /><path d="M24 18q-16-12-18 4 0 10 18 6M24 18q16-12 18 4 0 10-18 6" /><path d="M24 28q-12 2-10 12 6 2 10-8M24 28q12 2 10 12-6 2-10-8" /><path d="M22 14q-4-6-8-6M26 14q4-6 8-6" /></>,
    opossum: <><path d="M7 28 22 16q16-4 18 14l-6 6H16Z"/><circle cx="22" cy="16" r="5"/><path d="M38 29c12-2 10 16-1 14-6-1-4-7 0-5M17 35l-3 5m15-5 3 5"/><circle cx="15" cy="25" r="1.5" fill="currentColor"/><circle cx="7" cy="28" r="2" fill="currentColor"/><path d="m7 29 8 2"/></>,
    shark: <><path d="m4 15 9 9C20 16 34 17 44 25 33 34 20 34 13 28L4 36l2-11Z" fill="currentColor" fillOpacity=".12"/><path d="m22 19 6-11 3 12m-9 12 5 7 2-7m2-8-1 5m-4-5-1 5m12-1h5"/><circle cx="36" cy="24" r="1.3" fill="currentColor"/></>,
    robot: <><rect x="13" y="12" width="22" height="18" rx="4" /><circle cx="20" cy="21" r="2.5" /><circle cx="28" cy="21" r="2.5" /><path d="M24 12V7M22 6h4M17 36h14v8H17z" /></>,
    "retro-bot": <><rect x="12" y="10" width="24" height="16" /><circle cx="19" cy="18" r="3" /><circle cx="29" cy="18" r="3" /><rect x="14" y="28" width="20" height="16" /><circle cx="24" cy="36" r="3" /></>,
    // A toaster with two slices popping up (the old one read as a robot face).
    toaster: <><rect x="7" y="20" width="32" height="20" rx="5" /><path d="M12 20v-9q0-3 3-3h5q3 0 3 3v9M24 20v-9q0-3 3-3h5q3 0 3 3v9" /><path d="M39 26h4M12 40v3M34 40v3" /><circle cx="18" cy="30" r="1" /><circle cx="28" cy="30" r="1" /></>,
    "coffee-cup": <><path d="M12 16h20l-2 26H14z" /><path d="M32 22q8 0 6 8-2 4-7 3" /><path d="M18 10q2-3 0-6M24 10q2-3 0-6" /><circle cx="19" cy="26" r="1" /><circle cx="25" cy="26" r="1" /></>,
    sneaker: <><path d="M6 34V24l10-6 4 4 8-2 14 10v6z" /><path d="M6 38h36" /><path d="M18 22l2 4M22 21l2 4M26 20l2 4" /></>,
    houseplant: <><path d="M16 32h16l-3 12H19z" /><path d="M24 32V18M24 22q-10-2-12-10 10 0 12 10M24 20q8-6 14-4-4 8-14 4" /></>,
    strawberry: <><path d="M24 44q-14-8-14-20 0-8 14-8t14 8q0 12-14 20z" /><path d="M16 14l8 4 8-4M24 18V9" /><path d="M19 26h.1M28 24h.1M24 31h.1M18 33h.1M30 31h.1" /></>,
    avocado: <><path d="M24 6q-14 14-12 26 2 10 12 10t12-10Q38 20 24 6z" /><circle cx="24" cy="30" r="6" /></>,
    banana: <><path d="M12 10q-6 20 8 30 10 6 20 2-14-2-20-12-6-10-8-20z" /><path d="M10 10l3-3" /></>,
    donut: <><circle cx="24" cy="24" r="16" /><circle cx="24" cy="24" r="5" /><path d="M14 18l2 1M30 14l2-1M33 26l1 2M18 32l-1 2M26 34l2 0" /></>,
  },
  gender: {
    woman: <><circle cx="24" cy="18" r="9" /><path d="M24 27v14M18 35h12" /></>,
    man: <><circle cx="20" cy="28" r="9" /><path d="M27 21l11-11M30 10h8v8" /></>,
    "trans-woman": <><circle cx="24" cy="22" r="8" /><path d="M24 30v12M19 37h10M30 16l7-7M33 9h4v4" /></>,
    "trans-man": <><circle cx="22" cy="26" r="8" /><path d="M28 20l10-10M31 10h7v7M15 20l-7-7M8 18v-5h5" /></>,
    "non-binary": <><circle cx="24" cy="30" r="9" /><path d="M24 21V6M19 9l10 6M29 9l-10 6" /></>,
  },
  face: {
    oval: <ellipse cx="24" cy="24" rx="12" ry="16" />,
    heart: <><path d="M24 7C9 7 9 17 12 26L24 41 36 26C39 17 39 7 24 7Z" /><path d="M15 18h5m8 0h5m-12 13h6" /></>,
    square: <path d="M11 9h26v27q0 6-6 6H17q-6 0-6-6z" />,
    egg: <path d="M24 4q15 0 15 17 0 9-6 15-4 6-9 6t-9-6q-6-6-6-15 0-17 15-17z" />,
    caveman: <><path d="M12 22q0-14 12-14t12 14v8q0 12-12 12T12 30z" /><path d="M10 21h28" strokeWidth={4} /></>,
    chiseled: <path d="M13 8h22l2 16-13 18-13-18z" />,
    pear: <path d="M18 6h12q4 8 7 20 3 16-13 16T11 26q3-12 7-20z" />,
    tiny: <><circle cx="24" cy="14" r="5" /><path d="M10 44q2-18 14-18t14 18" /></>,
    round: <circle cx="24" cy="24" r="15" />,
    long: <path d="M15 8h18l2 16q0 18-11 18T13 24z" />,
  },
  facialHair: {
    none: <><circle cx="24" cy="22" r="14" /><path d="M19 28q5 4 10 0" /></>,
    stubble: <><circle cx="24" cy="22" r="14" /><path d="M14 28h.1M17 32h.1M21 34h.1M27 34h.1M31 32h.1M34 28h.1M24 35h.1" /></>,
    "full-beard": <><path d="M10 18q0 26 14 26t14-26" /><path d="M19 28q5 3 10 0" /></>,
    goatee: <><circle cx="24" cy="20" r="13" /><path d="M20 30q4 12 8 0z" /></>,
    mustache: <><circle cx="24" cy="22" r="14" /><path d="M16 27q4-4 8 0 4-4 8 0-4 2-8 0-4 2-8 0z" /></>,
    pencil: <><circle cx="24" cy="22" r="14" /><path d="M17 27h14" /></>,
    handlebar: <><circle cx="24" cy="22" r="14" /><path d="M14 24q2 4 6 2 4-2 4 0 0-2 4 0 4 2 6-2" /></>,
    "braided-beard": <><circle cx="24" cy="18" r="12" /><path d="M20 28l4 4-4 4 4 4-4 4M28 28l-4 4" /></>,
  },
  build: {
    slim: figure({ shoulder: 5, hip: 4 }),
    average: figure({}),
    athletic: figure({ shoulder: 9, hip: 5, waist: 4 }),
    curvy: figure({ shoulder: 7, hip: 8, waist: 4 }),
    muscular: figure({ shoulder: 11, hip: 6, waist: 5 }),
    "plus-size": figure({ shoulder: 9, hip: 10, waist: 10 }),
    bodybuilder: figure({ shoulder: 14, hip: 6, waist: 5 }),
  },
  // A dashed line marks average height, so the four sizes read at a glance.
  height: {
    petite: <>{averageLine}{figure({ legs: 6, headR: 3.5 })}</>,
    average: <>{averageLine}{figure({ legs: 12 })}</>,
    tall: <>{averageLine}{figure({ legs: 16 })}</>,
    "very-tall": <>{averageLine}{figure({ legs: 20, headR: 3 })}</>,
  },
  proportions: {
    "long-legs": figure({ legs: 18, headR: 3 }),
    "short-legs": figure({ legs: 8 }),
    "broad-shoulders": figure({ shoulder: 13, hip: 5 }),
    "narrow-waist": figure({ shoulder: 9, hip: 7, waist: 3 }),
    "long-neck": figure({ neck: 6, legs: 11 }),
    "big-head": figure({ headR: 7, legs: 9 }),
    "feathered-wings": <>{person}<path d="M18 30Q4 26 3 12q7 4 9 2-3 6 6 8M30 30q14-4 15-18-7 4-9 2 3 6-6 8" /></>,
    "bat-wings": <>{person}<path d="M18 30 3 14l4 10 3-4 2 6 3-3M30 30l15-16-4 10-3-4-2 6-3-3" /></>,
    "butterfly-wings": <>{person}<path d="M18 28Q4 10 6 26q2 8 12 4M30 28q14-18 12-2-2 8-12 4" /></>,
  },
  hairStyle: {
    "long-straight": <>{head}<path d="M15 20q0-12 9-12t9 12v20M15 20v20" /></>,
    "long-wavy": <>{head}<path d="M15 18q0-10 9-10t9 10q2 6-1 10t1 10M15 18q-2 6 1 10t-1 10" /></>,
    curls: <><circle cx="24" cy="24" r="8" /><path d="M14 18a4 4 0 1 1 6-6 4 4 0 1 1 8 0 4 4 0 1 1 6 6 4 4 0 1 1 0 8M14 18a4 4 0 1 0 0 8" /></>,
    afro: <><circle cx="24" cy="20" r="15" /><circle cx="24" cy="26" r="7" /></>,
    braids: <>{head}<path d="M17 24l-2 4 2 4-2 4 2 4M31 24l2 4-2 4 2 4-2 4" /></>,
    locs: <>{head}<path d="M16 18v18M19 14v22M29 14v22M32 18v18" /></>,
    bob: <>{head}<path d="M14 26q-1-17 10-17t10 17z" /></>,
    pixie: <>{head}<path d="M15 18q2-8 9-8t9 6l-6-1-4 3-3-2z" /></>,
    "wolf-cut": <>{head}<path d="M14 26l2-4-2-4q2-9 10-9t10 9l-2 4 2 4M16 30l-2 4M32 30l2 4" /></>,
    mullet: <>{head}<path d="M15 18q1-8 9-8t9 8M31 24l3 12M17 24l-3 12" /></>,
    bowl: <>{head}<path d="M14 20q0-11 10-11t10 11z" /></>,
    buzz: <>{head}<path d="M15.5 17q1-8 8.5-8t8.5 8M17 14q2-3 7-3t7 3" strokeDasharray="0.5 2" /></>,
    mohawk: <>{head}<path d="M24 11V3M21 12l-2-7M27 12l2-7" /></>,
    ponytail: <>{head}<path d="M16 16q2-7 8-7t8 7M30 10q8-4 8 6t-4 14" /></>,
    pigtails: <>{head}<path d="M15 18q-8 2-6 12M33 18q8 2 6 12" /></>,
    "space-buns": <>{head}<circle cx="15" cy="10" r="5" /><circle cx="33" cy="10" r="5" /></>,
    bald: <>{head}<path d="M18 16q2-4 6-5M20 18q1-2 2-3" strokeWidth={1.5} /></>,
    "comet-ponytail": <>{head}<path d="M16 14q8-10 20-4t8 4q-6-2-12 2" /></>,
    "ribbon-loops": <>{head}<path d="M24 11q-12-10-12-2t12 2q12-10 12-2t-12 2z" /></>,
    "lantern-bun": <>{head}<circle cx="24" cy="6" r="6" /><path d="M18 6h12M19 3h10M19 9h10" /></>,
    "wave-crest": <>{head}<path d="M14 16q2-12 14-10 8 2 6 8-4 2-6-2" /></>,
    pagoda: <>{head}<circle cx="24" cy="9" r="3.5" /><circle cx="24" cy="4" r="2.5" /><circle cx="24" cy="0.5" r="1.5" /></>,
    crescent: <>{head}<path d="M15 16q9-8 18 0-9-3-18 0z" /></>,
  },
  makeup: {
    bare: <><circle cx="24" cy="22" r="14" /><path d="M19 28q5 4 10 0" /></>,
    soft: <><path d="M12 24q12-10 24 0-12 10-24 0z" /><circle cx="24" cy="24" r="3" /></>,
    glam: <><path d="M12 26q12-10 24 0-12 10-24 0z" /><path d="M14 20l-2-4M20 17l-1-4M28 17l1-4M34 20l2-4" /></>,
    graphic: <><path d="M10 26q12-10 24 0l8-6" /><path d="M10 26q12 8 24 0" /></>,
    goth: <path d="M12 24q6-6 12-2 6-4 12 2-6 8-12 6-6 2-12-6z" fill="currentColor" />,
  },
  style: {
    // Streetwear: an oversized tee with a graphic; Basics: a plain long-sleeve sweater.
    streetwear: <><path d="M14 8l-8 6 4 6 4-2v24h20V18l4 2 4-6-8-6q-2 4-10 4T14 8z" /><path d="M20 26l4-4 4 4-4 4z" /></>,
    athleisure: <><path d="M16 8h16l2 12-4 2v20H18V22l-4-2z" /><path d="M24 8v34" /></>,
    basics: <><path d="M16 8l-8 6v24h5V18l3-2v26h16V16l3 2v20h5V14l-8-6q-1 4-8 4t-8-4z" /><path d="M16 38h16" /></>,
    y2k: <><path d="M16 8l-6 4 2 6 4-2v8h16v-8l4 2 2-6-6-4" /><path d="M14 26l-4 16h28l-4-16" /></>,
    tailoring: <><path d="M16 8l8 14 8-14M16 8l-6 4v30h28V12l-6-4" /><path d="M24 22v20M22 28h.1M22 34h.1" /></>,
    boho: <><path d="M18 8q6 4 12 0l4 10-3 24H17l-3-24z" /><path d="M17 28h14M18 36l-2 6M30 36l2 6" /></>,
    techwear: <><path d="M16 6l-8 6v30h32V12l-8-6q-2 4-8 4t-8-4z" /><path d="M8 24h32M16 30h6v6h-6zM26 30h6v6h-6z" /></>,
    goth: <><path d="M18 6h12l2 8-4 4 6 24H14l6-24-4-4z" /><path d="M20 22l8 8M28 22l-8 8" /></>,
    disco: <><path d="M16 8l8 8 8-8 6 6-4 4v24H14V18l-4-4z" /><circle cx="24" cy="30" r="5" /></>,
    preppy: <><path d="M16 8l-8 6 3 6 5-2v24h16V18l5 2 3-6-8-6-8 6z" /><path d="M16 26l16 8M16 34l16-8" /></>,
    runway: <><path d="M10 14q14-12 28 0l-4 6v22H14V20z" /><path d="M10 14l4 6M38 14l-4 6" /></>,
    // Western: a cowboy hat over a plaid shirt collar.
    western: <><path d="M8 20q4 4 16 4t16-4q-4 6-16 6T8 20z" /><path d="M16 21q0-11 8-11t8 11" /><path d="M16 30l8 6 8-6v12H16z" /><path d="M20 34v8M28 34v8" /></>,
    stage: <><path d="M16 8l8 10 8-10 4 4v18l-4 12h-4l-4-12-4 12h-4l-4-12V12z" /><path d="M14 22h20" /></>,
  },
  accessories: {
    glasses: <><circle cx="15" cy="24" r="7" /><circle cx="33" cy="24" r="7" /><path d="M22 24h4M8 22l-4-2M40 22l4-2" /></>,
    sunglasses: <><path d="M6 20h16l-2 10h-12zM26 20h16l-2 10H28z" fill="currentColor" /><path d="M22 22h4" /></>,
    headphones: <><path d="M10 30v-6a14 14 0 0 1 28 0v6" /><rect x="7" y="28" width="7" height="12" rx="3" /><rect x="34" y="28" width="7" height="12" rx="3" /></>,
    jewelry: <><path d="M10 10q14 24 28 0" /><path d="M14 14q10 22 20 0" /><circle cx="24" cy="30" r="3" /></>,
    cap: <><path d="M8 28q0-16 16-16t16 16z" /><path d="M24 28h20" /></>,
    beanie: <><path d="M10 32q0-20 14-20t14 20z" /><path d="M8 32h32v6H8z" /><circle cx="24" cy="9" r="3" /></>,
    bag: <><rect x="10" y="20" width="28" height="20" rx="3" /><path d="M14 20L26 6M34 20L26 6" /></>,
  },
  features: {
    freckles: <><circle cx="24" cy="24" r="15" /><path d="M16 24h.1M19 27h.1M17 30h.1M32 24h.1M29 27h.1M31 30h.1" /></>,
    "beauty-mark": <><circle cx="24" cy="24" r="15" /><circle cx="31" cy="28" r="1.5" fill="currentColor" /></>,
    dimples: <><circle cx="24" cy="24" r="15" /><path d="M18 30q6 4 12 0M15 28q0 2 1 3M33 28q0 2-1 3" /></>,
    "face-tattoo": <><circle cx="24" cy="24" r="15" /><path d="M16 27l1 2 1-2M31 26l2 2-2 2" /></>,
    "nose-ring": <><path d="M24 10v18q-6 2-6 6t6 2q6 2 6-2t-6-6" /><circle cx="24" cy="35" r="3" /></>,
    "ear-piercings": <><path d="M18 8q14 0 14 14 0 10-8 16-4 2-4-4" /><circle cx="30" cy="14" r="1.5" /><circle cx="32" cy="20" r="1.5" /><circle cx="24" cy="38" r="2" /></>,
    // A clear gap cut through the right brow.
    "brow-slit": <><path d="M8 20q6-6 12-4M26 16q3-1 5-0.5M35 17q2 1 3 3" /><path d="M14 26q4-3 8 0M28 26q4-3 8 0" /></>,
    "bleached-brows": <><path d="M8 20q8-6 14-3M26 17q6-3 14 3" strokeDasharray="0.5 2.5" strokeWidth={1.5} /><path d="M14 26q4-3 8 0M28 26q4-3 8 0" /></>,
    "brow-scar": <><path d="M8 20q8-6 14-3M26 17q6-3 14 3" /><path d="M32 13l-2 10" /></>,
    "gold-grill": <><path d="M10 22q14 14 28 0-14 6-28 0z" /><path d="M16 25v4M21 26v5M27 26v5M32 25v4" /></>,
    braces: <><path d="M10 20q14 16 28 0" /><path d="M10 24h28" /><path d="M15 22v4M20 22v4M25 22v4M30 22v4M35 22v4" /></>,
    "face-gems": <><circle cx="24" cy="24" r="15" /><path d="M14 22l2-2 2 2-2 2zM30 22l2-2 2 2-2 2zM18 28l1.5-1.5L21 28l-1.5 1.5z" /></>,
    "pointed-ears": <><circle cx="24" cy="26" r="10" /><path d="M14 24l-8-14 10 8M34 24l8-14-10 8" /></>,
    lashes: <><path d="M10 26q14-12 28 0" /><path d="M14 22l-3-4M19 19l-2-4M24 18v-4M29 19l2-4M34 22l3-4" /></>,
    "glitter-freckles": <><circle cx="24" cy="24" r="15" /><path d="M16 26l1-2 1 2-1 2zM30 26l1-2 1 2-1 2zM20 30l1-1 1 1-1 1zM27 30l1-1 1 1-1 1z" fill="currentColor" /></>,
    "big-forehead": <><path d="M12 30q0-26 12-26t12 26q0 12-12 12T12 30z" /><path d="M18 30h.1M30 30h.1M21 37q3 2 6 0" /></>,
    "gap-teeth": <><path d="M10 20q14 18 28 0z" /><path d="M14 21h8v6M26 21h8v6M22 21v5M26 21v5" /></>,
    "pointy-nose": <><circle cx="24" cy="24" r="15" /><path d="M24 18l12 10-12 2" /></>,
    jowls: <><path d="M12 18q0-12 12-12t12 12v10q4 6-2 10-4 4-10 4t-10-4q-6-4-2-10z" /><path d="M14 36q10 6 20 0" /></>,
    unibrow: <><path d="M8 20q8-6 16-2 8-4 16 2" strokeWidth={3} /><path d="M14 27q4-3 8 0M26 27q4-3 8 0" /></>,
    "big-ears": <><circle cx="24" cy="24" r="11" /><path d="M13 20q-10-8-10 4t10 6M35 20q10-8 10 4t-10 6" /></>,
  },
};

const ageLabel: Record<string, string> = { "early-20s": "20", "late-20s": "28", "30s": "30", "40s": "40", "50s": "50", "60s": "60+" };

export function OptionIcon({ field, id }: { field: string; id: string }) {
  let body: ReactNode = drawings[field]?.[id];
  let filled = false;
  if (field === "skin") {
    filled = true;
    body = id === "natural"
      ? <path d="M24 6q16 10 10 28-4 8-10 8T14 34Q8 16 24 6zM24 14v26" fill="none" />
      : id === "vitiligo"
        ? <><circle cx="24" cy="24" r="17" fill={skin["golden-brown"]} /><path d="M14 16q6-4 8 2-2 6-8 4zM28 28q6-2 6 4-4 4-8 0z" fill="#f3dccb" /></>
        : <circle cx="24" cy="24" r="17" fill={skin[id] ?? "#999"} />;
  } else if (field === "hairColor") {
    filled = true;
    body = id === "sunset"
      ? <><defs><linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff8a3d" /><stop offset="1" stopColor="#ff5fa2" /></linearGradient></defs><path d="M12 40V20q0-14 12-14t12 14v20q-6-4-12 0-6-4-12 0z" fill="url(#sunset)" /></>
      : <path d="M12 40V20q0-14 12-14t12 14v20q-6-4-12 0-6-4-12 0z" fill={hair[id] ?? "#999"} />;
  } else if (field === "eyes") {
    const two = id === "two-tone";
    body = two
      ? <><path d="M4 24q8-10 18 0-10 10-18 0zM26 24q8-10 18 0-10 10-18 0z" /><circle cx="13" cy="24" r="4" fill={iris["dark-brown"]} /><circle cx="35" cy="24" r="4" fill={iris.blue} /></>
      : <><path d="M6 24q18-18 36 0-18 18-36 0z" /><circle cx="24" cy="24" r="7" fill={iris[id] ?? "#666"} /><circle cx="24" cy="24" r="2.5" fill="#000" /></>;
  } else if (field === "decade") {
    body = <><rect x="6" y="12" width="36" height="24" rx="6" /><text x="24" y="29" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor" stroke="none">{id === "today" ? "Now" : `'${id.slice(2)}`}</text></>;
  } else if (field === "age") {
    body = <><rect x="6" y="12" width="36" height="24" rx="12" /><text x="24" y="29" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor" stroke="none">{ageLabel[id] ?? "?"}</text></>;
  }
  if (!body) return <span className="tile-letter" aria-hidden>{id[0]?.toUpperCase()}</span>;
  return (
    <svg className={`tile-icon${filled ? " filled" : ""}`} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {body}
    </svg>
  );
}
