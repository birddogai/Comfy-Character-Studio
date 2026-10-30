// The old Photo shoot's picks. The tab was merged into Scenes (lib/scene.ts);
// this stays so photos saved by it still show their details.
export const shoot = {
  scene: ["Rooftop terrace at sunset", "Café window seat on a rainy day", "Gym with a large mirror", "Seaside boardwalk in the morning", "Neon-lit city street at night", "Cozy bedroom with fairy lights", "Airport lounge with big windows", "White photo studio"],
  outfit: ["Same outfit as the reference", "Oversized hoodie and cargo pants", "Matching athleisure set", "Elegant evening wear", "Linen summer outfit", "Chunky knit sweater", "Smart business casual"],
  pose: ["Candid laugh, looking away", "Mirror selfie holding a phone", "Walking toward the camera", "Seated and relaxed", "Looking back over the shoulder", "Close-up holding a coffee cup"],
  expression: ["Natural, as in the pose", "Big open laugh", "Soft closed-mouth smile", "Smug smirk", "Shocked, jaw dropped", "Furious scowl", "Sulky pout", "Crying, tears running", "Deadpan stare", "Wide-eyed fear", "Dreamy, eyes half closed", "Mischievous wink", "Tongue out, goofy"],
  camera: ["Front-camera selfie", "Casual phone photo taken by a friend", "35mm film snapshot with flash", "Editorial 85mm portrait"],
  ratio: ["9:16", "4:5", "1:1", "16:9"],
} as const;

export type Shot = { [K in keyof typeof shoot]: (typeof shoot)[K][number] };
