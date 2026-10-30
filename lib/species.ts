// Real-world variants for creatures, objects and food. The Build, Height and
// Proportions tiles pick which one: a muscular shark is a great white, a big
// head makes it a hammerhead, a slim mug is a travel mug. Each variant is
// described concretely, because the models drift back to a person (or a
// generic shape) as soon as the words get vague.

/** Which tile picks a variant, checked in this order: big head, build, height. */
export type VariantKey = "big-head" | "slim" | "average" | "athletic" | "curvy" | "muscular" | "plus-size" | "bodybuilder" | "petite" | "tall" | "very-tall";

type Picks = Record<string, string[] | undefined>;

export function pickVariant<V>(variants: { default: V } & Partial<Record<VariantKey, V>>, picks: Picks): V {
  if (picks.proportions?.includes("big-head") && variants["big-head"]) return variants["big-head"];
  return variants[picks.build?.[0] as VariantKey] ?? variants[picks.height?.[0] as VariantKey] ?? variants.default;
}

// Creatures stand upright like people but are the real animal: its head, its
// skin over the whole body and hands, its tail or fins.
export type Species = { name: string; look: string };
export type Creature = {
  variants: { default: Species } & Partial<Record<VariantKey, Species>>;
  head: string;
  skin: string;
  extras: string;
  back: string;
};

export const creatures: Record<string, Creature> = {
  shark: {
    variants: {
      default: { name: "bull shark", look: "a stocky grey bull shark with a short blunt snout" },
      slim: { name: "blacktip reef shark", look: "a sleek, slender blacktip reef shark with black-tipped fins" },
      athletic: { name: "mako shark", look: "a streamlined metallic-blue mako shark with a sharp pointed snout" },
      curvy: { name: "tiger shark", look: "a tiger shark with dark vertical stripes along its sides" },
      muscular: { name: "great white shark", look: "a massive great white shark with a thick conical snout and a white belly" },
      bodybuilder: { name: "great white shark", look: "a huge, heavily muscled great white shark with a thick conical snout and a white belly" },
      "plus-size": { name: "whale shark", look: "a broad whale shark with a wide flat mouth and white spots on dark blue-grey skin" },
      "big-head": { name: "hammerhead shark", look: "a hammerhead shark with a wide flat hammer-shaped head and an eye at each end" },
      petite: { name: "bamboo shark", look: "a small banded bamboo shark with barbels under its snout" },
    },
    head: "the head is the real shark's head: a long snout, a wide mouth with rows of serrated teeth, the eyes set on the sides of the head (on a hammerhead, at the two ends of the hammer) and five gill slits on each side of the neck",
    skin: "rough sandpaper-like shark skin covers the whole body, arms and hands, with a pale belly and webbed, clawed hands",
    extras: "exactly one tall triangular dorsal fin on the upper back and exactly one crescent tail fin behind",
    back: "the dorsal fin and the tail fin",
  },
  fox: {
    // Always a fox (people expect a red one); the build sets its shape and the
    // age sets its fur, from bright red to mostly grey (owner, Oct 29).
    variants: {
      default: { name: "fox", look: "a fox with {fur}, a white chest and black legs" },
      petite: { name: "fox", look: "a small, dainty fox with {fur}, a white chest and black legs" },
      slim: { name: "fox", look: "a lean, slender fox with {fur}, a white chest and black legs" },
      muscular: { name: "fox", look: "a big, strong fox with thick {fur} and a full ruff" },
      bodybuilder: { name: "fox", look: "a huge, heavily muscled fox with thick {fur}" },
      "plus-size": { name: "fox", look: "a round, fluffy fox with a thick winter coat of {fur}" },
    },
    head: "the head is the real fox's head: a long narrow muzzle, a black nose, whiskers, the eyes and tall pointed ears",
    skin: "fur covers the whole body, arms and hands, which end in furry fingers with small claws",
    extras: "exactly one long bushy tail with a white tip",
    back: "the back of the pointed ears and the long bushy tail",
  },
  opossum: {
    variants: {
      default: { name: "Virginia opossum", look: "a Virginia opossum with coarse grey-and-white fur and a pale white face" },
      petite: { name: "mouse opossum", look: "a tiny big-eyed mouse opossum with soft cinnamon fur and dark eye rings" },
      slim: { name: "Virginia opossum", look: "a lean, scruffy Virginia opossum with thin grizzled grey fur" },
      muscular: { name: "Virginia opossum", look: "a big, burly Virginia opossum with thick grizzled grey fur" },
      bodybuilder: { name: "Virginia opossum", look: "a huge, heavily muscled Virginia opossum with thick grizzled grey fur" },
      "plus-size": { name: "Virginia opossum", look: "a round, chunky Virginia opossum with fluffy grey-and-white fur" },
    },
    head: "the head is the real opossum's head: a long pointed pale-white snout, a pink nose, long whiskers, small round shiny black eyes, a mouth with many small sharp teeth, and thin rounded hairless black ears with pink tips",
    skin: "coarse grizzled fur covers the whole body and arms, and the hands are the opossum's pink, nearly hairless hands with five long slender clawed fingers",
    extras: "exactly one long, bare, pink-and-grey scaly rat-like tail",
    back: "the back of the round hairless ears and the long bare scaly tail",
  },
  owl: {
    variants: {
      default: { name: "great horned owl", look: "a great horned owl with mottled brown feathers and tall ear tufts" },
      slim: { name: "barn owl", look: "a slender barn owl with a white heart-shaped face and golden back feathers" },
      petite: { name: "burrowing owl", look: "a small long-legged burrowing owl with spotted brown feathers" },
      muscular: { name: "Eurasian eagle-owl", look: "a huge Eurasian eagle-owl with orange eyes and big ear tufts" },
      bodybuilder: { name: "Eurasian eagle-owl", look: "a massive, powerful Eurasian eagle-owl with orange eyes and big ear tufts" },
      "plus-size": { name: "snowy owl", look: "a round, fluffy snowy owl with white feathers flecked with black" },
    },
    head: "the head is the real owl's head: a flat round facial disc, huge round forward-facing eyes and a short hooked beak",
    skin: "feathers cover its skin, and the hands have long talon-like nails",
    extras: "short tail feathers and feathered legs",
    back: "the patterned back feathers and the back of the round head",
  },
  axolotl: {
    variants: {
      default: { name: "pink axolotl", look: "a pale pink leucistic axolotl with deep pink gills" },
      slim: { name: "golden axolotl", look: "a slender golden albino axolotl with pale gold skin" },
      muscular: { name: "wild axolotl", look: "a big dark olive wild-type axolotl with speckled skin" },
      bodybuilder: { name: "wild axolotl", look: "a huge, muscular dark olive wild-type axolotl" },
      "plus-size": { name: "pink axolotl", look: "a plump, round pale pink axolotl" },
    },
    head: "the head is the real axolotl's head: wide and flat, with small round eyes, a wide permanent smile and three feathery gill stalks on each side",
    skin: "smooth, wet, glossy skin covers the whole body, arms and four-fingered hands",
    extras: "exactly one long flat tail with a soft fin along it",
    back: "the gill stalks from behind and the long finned tail",
  },
  chameleon: {
    variants: {
      default: { name: "veiled chameleon", look: "a green veiled chameleon with a tall helmet-like casque" },
      slim: { name: "panther chameleon", look: "a slim panther chameleon striped in bright turquoise, red and yellow" },
      muscular: { name: "Jackson's chameleon", look: "a big Jackson's chameleon with three horns on its face" },
      bodybuilder: { name: "Jackson's chameleon", look: "a huge, muscular Jackson's chameleon with three horns on its face" },
      "plus-size": { name: "Meller's chameleon", look: "a large round Meller's chameleon with a short horn" },
    },
    head: "the head is the real chameleon's head: cone-shaped turret eyes that look in different directions and a long curved mouth",
    skin: "fine, bumpy scales cover its skin, and its hands have fingers fused into grasping pincers",
    extras: "a spiny ridge down the back and exactly one long tail curled into a spiral",
    back: "the spiny ridge down the back and the curled tail",
  },
  "red-panda": {
    variants: {
      default: { name: "red panda", look: "a red panda with rust-red fur and black legs" },
      "plus-size": { name: "red panda", look: "an extra fluffy, round red panda with a thick winter coat" },
      muscular: { name: "red panda", look: "a big, strong red panda with a thick coat" },
      slim: { name: "red panda", look: "a lean red panda with a sleek summer coat" },
    },
    head: "the head is the real red panda's head: a round face with white markings, reddish tear stripes under the eyes, a black nose and rounded white-edged ears",
    skin: "thick rust-red fur covers the whole body, with dark brown-black arms and legs and furry hands",
    extras: "exactly one long bushy tail with red and cream rings",
    back: "the long ringed tail and the rounded ears from behind",
  },
  // Added Oct 30 (owner: "my name is birddog, I need dogs with wings"; everyone loves cats).
  dog: {
    variants: {
      default: { name: "golden retriever", look: "a golden retriever with a soft golden coat and floppy ears" },
      slim: { name: "greyhound", look: "a sleek, slender greyhound with a narrow head and a short smooth grey coat" },
      athletic: { name: "Belgian Malinois", look: "a lean, alert Belgian Malinois with a fawn coat, a black mask and upright ears" },
      curvy: { name: "beagle", look: "a rounded tricolor beagle with long floppy ears" },
      muscular: { name: "pit bull", look: "a stocky, muscular pit bull with a broad head and a short brindle coat" },
      bodybuilder: { name: "Rottweiler", look: "a massive, heavily muscled black-and-tan Rottweiler" },
      "plus-size": { name: "English bulldog", look: "a wide, chunky English bulldog with a wrinkled face and an underbite" },
      petite: { name: "Chihuahua", look: "a tiny Chihuahua with huge upright ears and big round eyes" },
      tall: { name: "Great Dane", look: "a tall, long-legged Great Dane with a short black coat" },
      "very-tall": { name: "Great Dane", look: "a giant, towering Great Dane with a short harlequin coat" },
      "big-head": { name: "Saint Bernard", look: "a Saint Bernard with a huge heavy head, jowls and a white-and-brown coat" },
    },
    head: "the head is the real dog's head: a muzzle with a wet black nose, whiskers, the eyes and its own dog ears",
    skin: "fur covers the whole body, arms and hands, which end in furry fingers with short blunt claws",
    extras: "exactly one tail",
    back: "the back of the ears and the tail",
  },
  cat: {
    variants: {
      default: { name: "tabby cat", look: "an orange tabby cat with striped fur" },
      slim: { name: "Siamese cat", look: "a slender Siamese cat with a cream coat, dark points and blue eyes" },
      athletic: { name: "Bengal cat", look: "a lean, athletic Bengal cat with a spotted golden coat" },
      curvy: { name: "ragdoll cat", look: "a fluffy, soft ragdoll cat with a cream-and-brown coat" },
      muscular: { name: "Maine Coon", look: "a big, strong Maine Coon with a shaggy brown tabby coat and tufted ears" },
      bodybuilder: { name: "Maine Coon", look: "a huge, heavily muscled Maine Coon with a thick shaggy coat and tufted ears" },
      "plus-size": { name: "British Shorthair", look: "a round, chubby British Shorthair with dense blue-grey fur and copper eyes" },
      petite: { name: "Singapura cat", look: "a tiny Singapura cat with a ticked sepia coat and huge eyes" },
      tall: { name: "Savannah cat", look: "a tall, long-legged Savannah cat with a spotted coat and big ears" },
      "very-tall": { name: "Savannah cat", look: "a very tall, leggy Savannah cat with a spotted coat and big ears" },
      "big-head": { name: "Persian cat", look: "a Persian cat with a huge round fluffy head and a flat face" },
    },
    head: "the head is the real cat's head: a short muzzle with a small pink nose, long whiskers, the eyes with slit pupils and pointed triangular ears",
    skin: "fur covers the whole body, arms and hands, which end in furry fingers with small retractable claws",
    extras: "exactly one long tail",
    back: "the back of the pointed ears and the long tail",
  },
  moth: {
    variants: {
      default: { name: "luna moth", look: "a luna moth with pale green wings, long trailing tails and eye spots" },
      muscular: { name: "atlas moth", look: "a big atlas moth with huge rust-red patterned wings" },
      bodybuilder: { name: "atlas moth", look: "a massive atlas moth with huge rust-red patterned wings" },
      "plus-size": { name: "rosy maple moth", look: "a fluffy rosy maple moth in pink and yellow fuzz" },
      slim: { name: "hawk moth", look: "a slim hawk moth with narrow brown streamlined wings" },
    },
    head: "the head is a fuzzy moth head with large round eyes and two big feathery antennae",
    skin: "soft moth fuzz covers the whole body, arms and hands",
    extras: "two pairs of large wings growing from the shoulder blades",
    back: "the wings spread from the shoulder blades",
  },
};

// Objects and food: the whole head and torso is the thing itself.
export type Thing = { name: string; shape: string; back: string };
export type ObjectKind = {
  variants: { default: Thing } & Partial<Record<VariantKey, Thing>>;
  /** What its "hair" is made of; the hair tiles shape and tint it. */
  hair: string;
  /** Per hair tile, a different "hair" that has that shape (a toaster's pigtails are two croissants). */
  hairBy?: Record<string, string>;
  /** What hairBy shapes are made of, for the short mention in each panel ("the pink whipped cream on top"). */
  hairNoun?: string;
  /** Wears the hairstyle as a wig: its own "hair" (avocado leaves) lost the hairstyle (Oct 30). */
  wig?: boolean;
};

export const objects: Record<string, ObjectKind> = {
  toaster: {
    hair: "two slices of golden toast popping up out of the slots",
    hairNoun: "bread",
    // "Two slices… gathered into two bunches" didn't read as pigtails (Oct 30):
    // each hairstyle is a bread that already has that shape (owner's idea).
    hairBy: {
      pigtails: "two croissants popping out of the slots and curving out to each side like pigtails",
      "space-buns": "two round dinner rolls popping out of the slots like two buns",
      afro: "one big round fluffy brioche loaf puffing out of the slots",
      curls: "a pile of small curly pretzels popping out of the slots",
      braids: "two long braided challah loaves hanging down the sides from the slots",
      "long-straight": "two long thin baguettes hanging straight down the sides from the slots",
      "long-wavy": "two long wavy ribbons of flatbread hanging down the sides from the slots",
      mohawk: "a row of toast slices standing up in one tall ridge down the middle",
      buzz: "thin crispy crackers just barely poking out of the slots",
      ponytail: "one long baguette arcing up out of a slot and falling back like a ponytail",
      "lantern-bun": "one big round panettone with paper bands, sitting on top like a bun",
      mullet: "short toast slices at the front and a long baguette hanging down the back",
      locs: "a bundle of long thin breadsticks hanging down from the slots like locs",
      bob: "one wide slice of toast cut level at the bottom, draped over the top and sides like a bob",
      pixie: "short, ragged torn pieces of toast poking up out of the slots, flicking forward at the front",
      "wolf-cut": "shaggy, uneven torn chunks of crusty bread sticking out of the slots in layers",
      bowl: "one round loaf of bread sitting on top like a bowl cut, with a straight edge across the front",
      "comet-ponytail": "one long baguette shooting up out of a slot and sweeping back in a long arc",
      "ribbon-loops": "two soft pretzels standing up on top like the loops of a tied ribbon",
      "wave-crest": "one big curled slice of toast curving over the top like a breaking wave",
      pagoda: "three bread rolls of shrinking size stacked on top like a pagoda",
      crescent: "one big croissant lying across the front of the top like a crescent",
    },
    variants: {
      default: { name: "toaster", shape: "one large boxy chrome two-slot toaster is the entire head and torso, with two bread slots on top, a push-down lever on the side and rounded corners", back: "the plain chrome back of the toaster with its coiled power cord" },
      slim: { name: "toaster", shape: "one tall, slim retro pastel-blue enamel toaster with rounded edges is the entire head and torso, with two slots on top and a chrome lever", back: "the rounded enamel back and its cloth-covered cord" },
      "plus-size": { name: "toaster", shape: "one wide four-slot brushed-steel toaster is the entire head and torso, with four slots on top and two levers", back: "the wide steel back with its power cord" },
    },
  },
  "coffee-cup": {
    hair: "a swirl of whipped cream piled on top",
    hairNoun: "whipped cream",
    // An afro came back as the plain swirl (Oct 30): each hairstyle is a cream shape.
    hairBy: {
      afro: "a huge round cloud of whipped cream puffed up on top like an afro, much wider than the cup",
      pigtails: "two swirls of whipped cream sticking out on each side of the top like pigtails",
      "space-buns": "two round scoops of whipped cream on top like two buns",
      curls: "a pile of small piped whipped-cream rosettes on top like tight curls",
      mohawk: "a tall ridge of whipped cream standing up down the middle of the top like a mohawk",
      "long-straight": "whipped cream piled on top and dripping straight down the sides like long hair",
      "long-wavy": "whipped cream piled on top and flowing down the sides in long waves",
      ponytail: "one tall curl of whipped cream sweeping up and back like a ponytail",
      buzz: "a thin, flat layer of foam just covering the top",
      bob: "a smooth dome of whipped cream cut level all around, like a bob",
      braids: "two long piped braids of whipped cream hanging down the sides",
      locs: "long thin ropes of piped whipped cream hanging down the sides like locs",
      pixie: "short, tousled peaks of whipped cream flicking forward at the front",
      "wolf-cut": "shaggy, uneven layers of whipped cream peaks piled on top",
      mullet: "short whipped cream at the front and a long drip of cream down the back",
      bowl: "a smooth round cap of whipped cream with a straight edge across the front, like a bowl cut",
      "lantern-bun": "one big round ball of whipped cream with chocolate bands around it like a paper lantern",
      "comet-ponytail": "one long tail of whipped cream sweeping up and back in a long arc",
      "ribbon-loops": "two loops of piped whipped cream standing up on top like a tied ribbon",
      "wave-crest": "one big curl of whipped cream curving over the top like a breaking wave",
      pagoda: "three scoops of whipped cream of shrinking size stacked on top like a pagoda",
      crescent: "one curved crescent of whipped cream across the front of the top",
    },
    variants: {
      default: { name: "mug", shape: "one giant white ceramic coffee mug is the entire head and torso: a wide cylinder with the open round rim on top showing dark coffee and a curl of steam inside, and a big C-shaped handle sticking out from one side", back: "the back of the mug with the handle on the side and the open rim on top" },
      slim: { name: "travel mug", shape: "one tall slim stainless-steel travel mug is the entire head and torso, with a black sip lid on top, a rubber grip band around the middle and a small handle", back: "the brushed-steel back of the travel mug and the lid" },
      "very-tall": { name: "travel mug", shape: "one tall slim stainless-steel travel mug is the entire head and torso, with a black sip lid on top and a rubber grip band around the middle", back: "the brushed-steel back of the travel mug and the lid" },
      petite: { name: "espresso cup", shape: "one small thick white espresso cup is the entire head and torso, with crema-topped espresso inside and a tiny handle, standing on a saucer like a skirt", back: "the back of the little cup and its saucer" },
      curvy: { name: "latte cup", shape: "one wide round latte bowl cup is the entire head and torso, with foamy latte art on top and a small handle", back: "the rounded back of the bowl cup" },
      "plus-size": { name: "latte cup", shape: "one huge round latte bowl cup is the entire head and torso, with foamy latte art on top and a small handle", back: "the rounded back of the bowl cup" },
      muscular: { name: "diner mug", shape: "one chunky heavy diner mug with very thick walls is the entire head and torso, with black coffee inside and a thick handle", back: "the back of the heavy mug and its thick handle" },
      bodybuilder: { name: "diner mug", shape: "one huge chunky diner mug with very thick walls is the entire head and torso, with black coffee inside and a thick handle", back: "the back of the heavy mug and its thick handle" },
    },
  },
  sneaker: {
    // The basketball high-top came back as a human face in a leather hood (Oct 30):
    // the shoe stands on its heel and the face is on the toe cap, in the shoe's own leather.
    hair: "its long shoelaces",
    variants: {
      default: { name: "sneaker", shape: "one giant canvas high-top sneaker is the entire head and torso: the toe cap at the front, a padded tongue and crossed laces rising up the front, and a thick white rubber sole at the bottom; the character has no human head at all: its head and upper body are in the shape of one real shoe standing upright on its heel, toe cap pointing up, so the whole shoe is clearly visible as a shoe (sole, tongue, laces and toe cap), and the face is printed into the shoe's own material and color on the toe cap, never skin", back: "the heel of the sneaker with its pull tab and stitched heel counter" },
      slim: { name: "running shoe", shape: "one giant slim mesh running shoe is the entire head and torso, with a curved foam sole and reflective details; the character has no human head at all: its head and upper body are in the shape of one real shoe standing upright on its heel, toe cap pointing up, so the whole shoe is clearly visible as a shoe (sole, tongue, laces and toe cap), and the face is printed into the shoe's own material and color on the toe cap, never skin", back: "the heel of the running shoe and its pull tab" },
      athletic: { name: "running shoe", shape: "one giant mesh running shoe is the entire head and torso, with a springy foam sole; the character has no human head at all: its head and upper body are in the shape of one real shoe standing upright on its heel, toe cap pointing up, so the whole shoe is clearly visible as a shoe (sole, tongue, laces and toe cap), and the face is printed into the shoe's own material and color on the toe cap, never skin", back: "the heel of the running shoe and its pull tab" },
      muscular: { name: "basketball sneaker", shape: "one giant chunky leather basketball high-top is the entire head and torso, with a padded collar and a strap across the laces; the character has no human head at all: its head and upper body are in the shape of one real shoe standing upright on its heel, toe cap pointing up, so the whole shoe is clearly visible as a shoe (sole, tongue, laces and toe cap), and the face is printed into the shoe's own material and color on the toe cap, never skin", back: "the padded heel of the basketball sneaker" },
      bodybuilder: { name: "basketball sneaker", shape: "one huge chunky leather basketball high-top is the entire head and torso, with a padded collar and a strap across the laces; the character has no human head at all: its head and upper body are in the shape of one real shoe standing upright on its heel, toe cap pointing up, so the whole shoe is clearly visible as a shoe (sole, tongue, laces and toe cap), and the face is printed into the shoe's own material and color on the toe cap, never skin", back: "the padded heel of the basketball sneaker" },
      "plus-size": { name: "chunky sneaker", shape: "one giant chunky dad sneaker with a thick layered sole is the entire head and torso; the character has no human head at all: its head and upper body are in the shape of one real shoe standing upright on its heel, toe cap pointing up, so the whole shoe is clearly visible as a shoe (sole, tongue, laces and toe cap), and the face is printed into the shoe's own material and color on the toe cap, never skin", back: "the thick layered heel of the sneaker" },
    },
  },
  houseplant: {
    hair: "its leaves",
    hairNoun: "leaves",
    // A buzz-cut succulent's "short even fuzz" became human hair (Oct 30): plant hairstyles are leaf shapes.
    hairBy: {
      buzz: "a low crown of short, stubby leaf tips poking up all over the top, like a buzz cut",
      pixie: "short leaves flicking forward at the front, like a pixie cut",
      bob: "leaves hanging down level all around the sides, like a bob",
      bowl: "a rounded cap of leaves with a straight fringe of leaf tips across the front, like a bowl cut",
      mohawk: "one tall ridge of upright pointed leaves down the middle of the top, like a mohawk",
      afro: "a big round bushy ball of small leaves, much wider than the head, like an afro",
      curls: "curling tendrils and coiled leaves all over the top, like curls",
      "long-straight": "long trailing vines hanging straight down both sides, like long straight hair",
      "long-wavy": "long trailing vines hanging down both sides in waves, like long wavy hair",
      braids: "two long braided vines hanging down the sides, like braids",
      locs: "long thick hanging vines, like locs",
      mullet: "short leaves at the front and long trailing vines down the back, like a mullet",
      "wolf-cut": "shaggy, uneven layers of leaves, like a wolf cut",
      ponytail: "a bunch of long leaves gathered high and falling back, like a ponytail",
      pigtails: "two bunches of leaves sticking out at the sides, like pigtails",
      "space-buns": "two small round rosettes on top, like space buns",
    },
    variants: {
      default: { name: "plant", shape: "a round terracotta pot is the torso and a large leafy monstera plant grows out of the top of the pot as the head and hair, with big split leaves fanning out", back: "the back of the terracotta pot and the leaves fanning out above it" },
      slim: { name: "snake plant", shape: "a tall narrow white pot is the torso and a snake plant with tall upright striped sword leaves grows out of the top", back: "the back of the tall pot and the upright leaves" },
      "very-tall": { name: "snake plant", shape: "a tall narrow white pot is the torso and a snake plant with tall upright striped sword leaves grows out of the top", back: "the back of the tall pot and the upright leaves" },
      "plus-size": { name: "cactus", shape: "a wide clay pot is the torso and a round barrel cactus covered in spines grows out of the top as the head", back: "the back of the pot and the spiny cactus" },
      // A buzz-cut succulent came out a human doll with no plant or pot (Oct 30): the rosette and pot are spelled out.
      // The pot as the torso hid under the top (Oct 30); the owner's idea: the pot is the waist.
      petite: { name: "succulent", shape: "a big chubby green echeveria succulent rosette is the head and chest: thick, fleshy, pointed leaves layered in a tight spiral, with the face set into the flat center of the rosette; it grows out of a small glazed ceramic plant pot that is its waist and hips, the pot clearly visible between the cropped top and the trousers like a wide belt, with the legs growing out below it", back: "the back of the small glazed pot and the layered rosette leaves" },
    },
  },
  strawberry: {
    hair: "its leafy green crown",
    variants: {
      default: { name: "strawberry", shape: "one giant strawberry is the entire head and torso: a cone shape, wide and rounded at the top and narrowing to a rounded point at the bottom, glossy deep-red skin dotted all over with tiny yellow seeds, and a crown of green leaves with a short stem on top", back: "the seeded red back of the strawberry and its green leafy crown" },
      slim: { name: "strawberry", shape: "one giant long, narrow, pointed strawberry is the entire head and torso, glossy red with tiny yellow seeds and a green leafy crown", back: "the seeded red back and the leafy crown" },
      "plus-size": { name: "strawberry", shape: "one huge wide, lumpy strawberry is the entire head and torso, glossy red with tiny yellow seeds and a big green leafy crown", back: "the seeded red back and the leafy crown" },
      petite: { name: "wild strawberry", shape: "one small round wild strawberry is the entire head and torso, deep red with tiny seeds and a little leafy crown", back: "the seeded back and the little crown" },
    },
  },
  avocado: {
    hair: "fresh avocado leaves sprouting from the top",
    wig: true,
    variants: {
      default: { name: "avocado", shape: "one giant pear-shaped Hass avocado is the entire head and torso, cut in half lengthwise so the front shows smooth pale-green flesh with a large round brown pit as the belly, framed by bumpy dark-green skin", back: "the bumpy dark-green skin covering the rounded pear-shaped back" },
      // The smooth plus-size one read as a squash or a pear (Oct 30): every variant names the bumpy peel and the pit.
      slim: { name: "avocado", shape: "one giant long, slim Hass avocado is the entire head and torso, cut in half lengthwise: the front is pale yellow-green flesh with a large round brown pit as the belly, framed all around by a thick rim of bumpy, pebbly dark-green avocado peel", back: "the bumpy dark-green peel covering the long back" },
      "plus-size": { name: "avocado", shape: "one huge, wide, round Hass avocado is the entire head and torso, cut in half lengthwise: the front is pale yellow-green flesh with a big round brown pit as the belly, framed all around by a thick rim of bumpy, pebbly dark-green avocado peel", back: "the bumpy dark-green peel covering the wide rounded back" },
    },
  },
  banana: {
    hair: "strips of banana peel curling down from the top",
    variants: {
      default: { name: "banana", shape: "one giant whole unpeeled banana is the entire head and torso, bent in a strong crescent curve like the letter C, with thick bright-yellow peel, long lengthwise ridges, brown ripeness speckles, a dark-brown stem pointing up at the top and a small dark tip at the bottom", back: "the curved back of the banana peel, with the stem at the top and the tip at the bottom, still bent in its crescent curve" },
      petite: { name: "baby banana", shape: "one small, stubby, sweet baby banana is the entire head and torso, gently curved, with thin bright-yellow peel, a short stem on top and a dark tip at the bottom", back: "the curved back of the little banana" },
      "plus-size": { name: "plantain", shape: "one huge, thick green-and-yellow plantain is the entire head and torso, long and gently curved, with thick blotchy peel, a stem on top and a dark tip at the bottom", back: "the thick curved back of the plantain" },
      muscular: { name: "plantain", shape: "one huge, thick green-and-yellow plantain is the entire head and torso, long and gently curved, with thick blotchy peel", back: "the thick curved back of the plantain" },
      bodybuilder: { name: "plantain", shape: "one massive, thick green-and-yellow plantain is the entire head and torso, long and gently curved, with thick blotchy peel", back: "the thick curved back of the plantain" },
      curvy: { name: "red banana", shape: "one giant red banana with deep maroon-red peel is the entire head and torso, plump and curved, with a stem on top", back: "the curved maroon back of the red banana" },
    },
  },
  donut: {
    hair: "swirled frosting piled on top, covered in sprinkles",
    hairNoun: "frosting",
    // Hairstyles as frosting shapes, like the toaster's breads and the cup's cream (Oct 30).
    hairBy: {
      afro: "a huge round puff of frosting covered in sprinkles, much wider than the donut, like an afro",
      curls: "a pile of small piped frosting curls covered in sprinkles",
      mohawk: "a tall ridge of frosting standing up down the middle, covered in sprinkles, like a mohawk",
      pigtails: "two swirls of frosting sticking out on each side of the top like pigtails, covered in sprinkles",
      "space-buns": "two round mini donuts stuck on top like two buns",
      "long-straight": "frosting dripping straight down both sides like long hair, covered in sprinkles",
      "long-wavy": "frosting flowing down both sides in long waves, covered in sprinkles",
      braids: "two long braided twists of frosting hanging down the sides",
      ponytail: "one tall curl of frosting sweeping up and back like a ponytail",
      buzz: "a thin, smooth glaze with a few sprinkles",
      bob: "a smooth shell of frosting cut level all around, like a bob",
    },
    variants: {
      default: { name: "donut", shape: "one giant ring donut stands upright as the entire head and torso: a thick round ring with a hole through the middle, glossy pink icing with rainbow sprinkles on the front and golden-brown dough around the edge", back: "the plain golden-brown dough back of the donut ring with its hole" },
      slim: { name: "long john donut", shape: "one giant long rectangular long john bar donut stands upright as the entire head and torso, with glossy chocolate icing down the front and golden-brown dough edges", back: "the plain golden-brown back of the bar donut" },
      "very-tall": { name: "long john donut", shape: "one giant long rectangular long john bar donut stands upright as the entire head and torso, with glossy chocolate icing down the front", back: "the plain golden-brown back of the bar donut" },
      curvy: { name: "cruller", shape: "one giant twisted French cruller with deep ridges and a shiny honey glaze stands upright as the entire head and torso", back: "the ridged glazed back of the cruller" },
      // The jelly donut read as a chubby man with jam (Oct 30): the fried-dough texture is named, and the dough is the whole body.
      "plus-size": { name: "jelly donut", shape: "one giant round filled Berliner donut with no hole is the entire head and torso, made of puffy golden-brown fried bread dough with a pale cream-colored ring around its middle, its surface soft, airy and porous like real fried bread, heavily dusted with powdered sugar, red jam oozing from a split in the side; the arms, legs and belly are the same golden fried dough, with no human skin anywhere", back: "the sugar-dusted golden fried-dough round back of the jelly donut" },
      muscular: { name: "old-fashioned donut", shape: "one giant thick old-fashioned cake donut with a cracked, craggy glaze stands upright as the entire head and torso, with a hole through the middle", back: "the craggy glazed back of the old-fashioned donut" },
      bodybuilder: { name: "old-fashioned donut", shape: "one massive thick old-fashioned cake donut with a cracked, craggy glaze stands upright as the entire head and torso", back: "the craggy glazed back of the old-fashioned donut" },
      petite: { name: "donut hole", shape: "one small round glazed donut hole is the entire head and torso, made of golden-brown fried bread dough with a soft, airy, porous bready texture, shiny with sugar glaze; the arms and legs are the same golden fried dough", back: "the round glazed golden-dough back" },
    },
  },
};

/** Fox fur by age: red when young, greying from the 40s. */
export const foxFur: Record<string, string> = {
  "early-20s": "bright russet-red fur", "late-20s": "bright russet-red fur", "30s": "rich russet-red fur",
  "40s": "russet-red fur with a little grey around the muzzle",
  "50s": "reddish fur turning grey, with a grey muzzle",
  "60s": "mostly grey fur with faded red patches and a white-grey muzzle",
};
