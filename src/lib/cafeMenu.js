// The nook café menu. Every item has its own watercolour artwork, a real recipe
// with measurements, nutrition and a note on what it does for you.
// Prices are in study coins (1 minute studied = 8 coins).
const ART = 'https://media.base44.com/images/public/6ad5f65588c4a5dd9c9935d0/';

export const OPTIONS = {
  ice: { label: 'ice', choices: ['0%', '25%', '50%', '100%'], default: '50%' },
  sugar: { label: 'sugar', choices: ['0%', '25%', '50%', '100%'], default: '50%' },
  milk: { label: 'milk', choices: ['dairy', 'oat', 'soya', 'none'], default: 'oat' },
  tea: { label: 'tea', choices: ['jasmine', 'oolong', 'black', 'rooibos'], default: 'oolong' },
  toppings: {
    label: 'toppings',
    choices: ['tapioca pearls', 'taro balls', 'grass jelly', 'red bean', 'pudding'],
    default: [],
    multi: true,
  },
};

export const CATEGORIES = [
  { id: 'coffee', label: 'coffee' },
  { id: 'tea', label: 'tea & culture' },
  { id: 'cold', label: 'cold & fizzy' },
  { id: 'bake', label: 'pastries' },
  { id: 'cake', label: 'cakes & cookies' },
];

const drinks = [
  {
    id: 'espresso',
    name: 'espresso',
    kind: 'drink',
    cat: 'coffee',
    price: 8,
    art: ART + 'f19a2fe56_generated_image.png',
    note: 'a single, short and serious',
    blurb:
      'one 30 ml shot pulled from 18 g of finely ground beans — 92 °C water at 9 bar for 27 seconds. thick hazelnut crema, no milk, no fuss.',
    recipe: ['18 g ground coffee, fine (espresso grind)', '30 ml water at 92 °C, 9 bar', 'extract 27 s → 36 g liquid espresso', 'serve straight up, add a biscotti if you like'],
    nutrition: { kcal: 3, protein: '0.2 g', carbs: '0.5 g', fat: '0 g', caffeine: '64 mg' },
    benefits: 'almost no calories, and the caffeine sharpens focus for around 90 minutes.',
    options: [],
  },
  {
    id: 'flat-white',
    name: 'flat white',
    kind: 'drink',
    cat: 'coffee',
    price: 16,
    art: ART + 'b5098119f_generated_image.png',
    note: 'soft, milky, quietly bold',
    blurb:
      'a double ristretto under 120 ml of texturised milk poured to a 5 mm microfoam cap — velvet in a cup.',
    recipe: ['36 g espresso from 18 g coffee', '120 ml milk steamed to 62 °C, fine microfoam', 'pour from height, then lower to fold the foam in', 'finish with a soft swirl, no cocoa'],
    nutrition: { kcal: 120, protein: '6 g', carbs: '9 g', fat: '6 g', caffeine: '130 mg' },
    benefits: 'milk protein and calcium to slow the caffeine curve into a steady two-hour lift.',
    options: ['milk'],
  },
  {
    id: 'cappuccino',
    name: 'cappuccino',
    kind: 'drink',
    cat: 'coffee',
    price: 15,
    art: ART + '79f2a5850_generated_image.png',
    note: 'a small cup that feels like a break',
    blurb:
      'equal parts espresso, steamed milk and airy foam, dusted with dark cocoa — the classic italian ratio of 1:1:1.',
    recipe: ['30 ml espresso from 16 g coffee', '60 ml milk steamed to 60 °C with a thick foam', '60 ml foam dolloped on top', 'dust with 1 pinch of cocoa'],
    nutrition: { kcal: 110, protein: '6 g', carbs: '9 g', fat: '5 g', caffeine: '75 mg' },
    benefits: 'lighter than a latte, so it warms you up without any heaviness.',
    options: ['milk'],
  },
  {
    id: 'iced-latte',
    name: 'iced latte',
    kind: 'drink',
    cat: 'cold',
    price: 18,
    art: ART + '498734639_generated_image.png',
    note: 'layers of milk into coffee',
    blurb:
      'cold oat milk over ice with a double shot poured slowly on top, so you get the cascade before you stir it.',
    recipe: ['60 ml espresso from 18 g coffee, cooled', '150 ml oat milk', 'fill a tall glass with ice', 'pour the milk, then the espresso over the back of a spoon'],
    nutrition: { kcal: 130, protein: '4 g', carbs: '18 g', fat: '5 g', caffeine: '120 mg' },
    benefits: 'oat milk brings slow-release carbs and fibre that keep a study hour steadier.',
    options: ['ice', 'sugar', 'milk'],
  },
  {
    id: 'chai-latte',
    name: 'masala chai latte',
    kind: 'drink',
    cat: 'tea',
    price: 18,
    art: ART + '198baa844_generated_image.png',
    note: 'simmered spice, warm afternoon',
    blurb:
      'the indian street classic: black tea simmered with ginger, cardamom, cinnamon and clove, then softened with steamed milk.',
    recipe: ['200 ml water + 2 tsp assam black tea', '2 cm fresh ginger, 3 cardamom pods, 1 cinnamon stick, 2 cloves', 'simmer 5 min, then add 120 ml milk and simmer 3 min', 'strain, sweeten to taste'],
    nutrition: { kcal: 150, protein: '6 g', carbs: '24 g', fat: '4 g', caffeine: '50 mg' },
    benefits: 'ginger and cinnamon settle the stomach; the milk makes it a gentle, long-lasting warm-up.',
    options: ['sugar', 'milk'],
    culture: 'chai means “tea” in hindi — masala chai is the spiced version sold on almost every indian street corner.',
  },
  {
    id: 'matcha-latte',
    name: 'iced matcha latte',
    kind: 'drink',
    cat: 'tea',
    price: 22,
    art: ART + '453b89615_generated_image.png',
    note: 'green, grassy, alert',
    blurb:
      'stone-ground ceremonial matcha whisked with 60 ml hot water, poured over cold milk and ice.',
    recipe: ['2 g (1 heaped tsp) ceremonial matcha', '60 ml water at 80 °C, whisk in a zigzag until frothy', '150 ml cold milk over ice', 'pour the matcha on top'],
    nutrition: { kcal: 140, protein: '5 g', carbs: '20 g', fat: '5 g', caffeine: '70 mg' },
    benefits: 'l-theanine and caffeine together give a calmer, longer focus than coffee alone.',
    options: ['ice', 'sugar', 'milk'],
    culture: 'matcha has been whisked in japanese tea rooms since the 12th century.',
  },
  {
    id: 'jasmine-tea',
    name: 'jasmine green tea',
    kind: 'drink',
    cat: 'tea',
    price: 12,
    art: ART + 'b74efced2_generated_image.png',
    note: 'floral and feather-light',
    blurb:
      'green tea leaves laid over fresh jasmine blossoms at night so they drink in the scent. brewed light and clear.',
    recipe: ['3 g jasmine green tea per 250 ml water', 'water at 80 °C, never boiling', 'steep 2–3 min only, or it turns bitter', 'refill once — the second steep is softer'],
    nutrition: { kcal: 2, protein: '0 g', carbs: '0 g', fat: '0 g', caffeine: '30 mg' },
    benefits: 'catechins from green tea, and enough caffeine to lift without a crash.',
    options: ['sugar'],
  },
  {
    id: 'oolong-milk-tea',
    name: 'oolong milk tea',
    kind: 'drink',
    cat: 'tea',
    price: 20,
    art: ART + '96bc86b84_generated_image.png',
    note: 'toasty, creamy, clean',
    blurb:
      'roasted oolong brewed strong, shaken with milk until it turns silky and crowned with a light foam.',
    recipe: ['5 g roasted oolong steeped in 200 ml water at 90 °C for 4 min', '120 ml milk', 'shake with ice for 15 s, or stir and pour over ice', 'optionally 10 ml honey'],
    nutrition: { kcal: 180, protein: '4 g', carbs: '32 g', fat: '5 g', caffeine: '60 mg' },
    benefits: 'oolong sits between green and black tea — smooth caffeine and a toasty flavour that does not need sugar.',
    options: ['ice', 'sugar', 'milk'],
  },
  {
    id: 'mango-sago',
    name: 'mango sago',
    kind: 'drink',
    cat: 'cold',
    price: 28,
    art: ART + '92b6ba88d_generated_image.png',
    note: 'golden, cold, and spoonable',
    blurb:
      'the hong kong dessert drink: ripe mango blended with coconut milk, little tapioca pearls and juicy mango cubes.',
    recipe: ['2 ripe mangoes (about 500 g), 350 g blended', '200 ml coconut milk', '60 g small sago pearls, boiled 12 min then rinsed cold', '150 ml milk, mango cubes and 1 tsp lime to finish'],
    nutrition: { kcal: 260, protein: '3 g', carbs: '58 g', fat: '3 g', caffeine: '0 mg' },
    benefits: 'mango brings vitamin c and a, coconut milk carries fat that slows the sugar hit.',
    options: ['ice', 'sugar'],
    culture: 'a cantonese dessert classic, eaten cold in summer and endlessly adapted across south-east asia.',
  },
  {
    id: 'boba-milk-tea',
    name: 'boba milk tea',
    kind: 'drink',
    cat: 'tea',
    price: 30,
    art: ART + 'fbb07f458_generated_image.png',
    note: 'chewy pearls, milky tea',
    blurb:
      'the taiwanese original — strong tea shaken with milk and sugar, then loaded with freshly cooked tapioca pearls. build it exactly how you like it.',
    recipe: ['5 g black tea steeped in 200 ml water at 95 °C for 5 min', '120 ml milk + 20 ml sugar syrup', '60 g tapioca pearls simmered 25 min, rested in syrup', 'shake tea, milk and ice, then spoon the pearls in last'],
    nutrition: { kcal: 300, protein: '5 g', carbs: '60 g', fat: '6 g', caffeine: '60 mg' },
    benefits: 'the tapioca makes it a genuine snack, so it holds your energy through a long session.',
    options: ['ice', 'sugar', 'milk', 'tea', 'toppings'],
    culture: 'boba arrived in taichung in the late 1980s and is now a global ritual — every shop has its own pearl recipe.',
  },
  {
    id: 'peach-iced-tea',
    name: 'peach iced tea',
    kind: 'drink',
    cat: 'cold',
    price: 17,
    art: ART + 'b49fa27e9_generated_image.png',
    note: 'fuzzy peach and cold glass',
    blurb: 'black tea brewed light, cooled, then poured over peaches stewed in their own juice.',
    recipe: ['4 g black tea in 300 ml water at 90 °C, steep 3 min, cool', '1 ripe peach: 4 slices stewed with 1 tsp sugar for 5 min', 'pour tea over ice and the peaches', 'add 2 mint leaves'],
    nutrition: { kcal: 90, protein: '0.5 g', carbs: '22 g', fat: '0 g', caffeine: '25 mg' },
    benefits: 'peach gives vitamin c and a little fibre, with far less sugar than fizzy drinks.',
    options: ['ice', 'sugar'],
  },
  {
    id: 'lychee-rose-cooler',
    name: 'lychee rose cooler',
    kind: 'drink',
    cat: 'cold',
    price: 24,
    art: ART + '4c7bd7601_generated_image.png',
    note: 'perfumed, delicate, pretty',
    blurb: 'whole lychees, rose water and soda over crushed ice — sweet, floral and very cold.',
    recipe: ['8 lychees (fresh or tinned) + 60 ml of their syrup', '1 tsp rose water', '150 ml soda water', 'crushed ice, 2 rose petals'],
    nutrition: { kcal: 110, protein: '0.5 g', carbs: '27 g', fat: '0 g', caffeine: '0 mg' },
    benefits: 'lychee is high in vitamin c; the soda adds volume, not sugar.',
    options: ['ice', 'sugar'],
  },
  {
    id: 'hot-chocolate',
    name: 'hot chocolate',
    kind: 'drink',
    cat: 'coffee',
    price: 19,
    art: ART + '1de0c24d6_generated_image.png',
    note: 'deep cocoa comfort',
    blurb: 'real 70% chocolate melted into hot milk with a pinch of salt, topped with whipped cream.',
    recipe: ['40 g 70% dark chocolate, chopped', '200 ml milk heated to 70 °C', 'whisk the chocolate in off the heat + 1 pinch sea salt', 'top with 30 ml lightly whipped cream'],
    nutrition: { kcal: 220, protein: '8 g', carbs: '28 g', fat: '9 g', caffeine: '20 mg' },
    benefits: 'cocoa flavanols, magnesium and calcium — a warm, slow comfort rather than a jolt.',
    options: ['sugar', 'milk'],
  },
];

const bakes = [
  {
    id: 'butter-croissant',
    name: 'butter croissant',
    kind: 'pastry',
    cat: 'bake',
    price: 12,
    art: ART + '60617fb24_generated_image.png',
    note: 'shatteringly flaky',
    blurb: 'laminated with 27 layers of french butter, proofed slowly and baked until it crackles.',
    recipe: ['500 g strong flour, 10 g salt, 12 g fresh yeast, 300 ml milk', '250 g cold butter laminated in 3 double folds', 'rest 1 h between folds, proof 2 h at 26 °C', 'bake 15 min at 210 °C, then 8 min at 180 °C'],
    nutrition: { kcal: 270, protein: '5 g', carbs: '27 g', fat: '16 g', sugar: '3 g' },
    benefits: 'a fast source of energy and fat for a long morning of reading.',
  },
  {
    id: 'almond-croissant',
    name: 'almond croissant',
    kind: 'pastry',
    cat: 'bake',
    price: 17,
    art: ART + '3fe58607d_generated_image.png',
    note: 'frangipane and toasted almonds',
    blurb: 'yesterday’s croissant split, filled with almond cream, topped with flakes and baked again.',
    recipe: ['1 day-old croissant', '60 g almond cream (50 g butter, 50 g sugar, 1 egg, 60 g ground almonds, 10 g flour)', 'brush with syrup, scatter 15 g flaked almonds', 'bake 12 min at 180 °C, dust with icing sugar'],
    nutrition: { kcal: 420, protein: '8 g', carbs: '40 g', fat: '26 g', sugar: '22 g' },
    benefits: 'almonds add vitamin e, magnesium and protein to a very buttery pastry.',
  },
  {
    id: 'pain-au-chocolat',
    name: 'pain au chocolat',
    kind: 'pastry',
    cat: 'bake',
    price: 15,
    art: ART + 'f4825765b_generated_image.png',
    note: 'two batons of dark chocolate',
    blurb: 'the same laminated dough rolled around two sticks of 60% chocolate.',
    recipe: ['1 portion laminated croissant dough (about 700 g)', '2 batons of 60% chocolate per pastry', 'proof 90 min at 26 °C', 'bake 16 min at 200 °C'],
    nutrition: { kcal: 330, protein: '6 g', carbs: '34 g', fat: '19 g', sugar: '11 g' },
    benefits: 'dark chocolate brings magnesium and a little caffeine-free cocoa comfort.',
  },
  {
    id: 'cinnamon-bun',
    name: 'cinnamon bun',
    kind: 'pastry',
    cat: 'bake',
    price: 16,
    art: ART + 'b55a3b435_generated_image.png',
    note: 'iced spiral, warm middle',
    blurb: 'enriched dough rolled with cinnamon butter sugar, baked soft and finished with vanilla icing.',
    recipe: ['500 g flour, 250 ml warm milk, 60 g butter, 7 g yeast', '80 g soft butter + 100 g brown sugar + 2 tsp cinnamon', 'roll, slice, proof 1 h', 'bake 22 min at 180 °C and ice while warm'],
    nutrition: { kcal: 350, protein: '6 g', carbs: '52 g', fat: '13 g', sugar: '24 g' },
    benefits: 'cinnamon helps steady blood sugar when eaten with a protein-rich drink.',
  },
  {
    id: 'blueberry-muffin',
    name: 'blueberry muffin',
    kind: 'pastry',
    cat: 'bake',
    price: 14,
    art: ART + 'e78d97ad1_generated_image.png',
    note: 'bursting purple berries',
    blurb: 'a tall, domed muffin loaded with wild blueberries and a sugared crumb top.',
    recipe: ['250 g flour, 2 tsp baking powder, 150 g sugar', '2 eggs, 120 ml milk, 100 g melted butter', '150 g blueberries folded in last', 'bake 22 min at 190 °C'],
    nutrition: { kcal: 320, protein: '5 g', carbs: '48 g', fat: '12 g', sugar: '25 g' },
    benefits: 'blueberries are high in antioxidants — one of the better snack fruits for study days.',
  },
  {
    id: 'lemon-drizzle',
    name: 'lemon drizzle slice',
    kind: 'pastry',
    cat: 'cake',
    price: 18,
    art: ART + '886476b98_generated_image.png',
    note: 'sharp, sunny, glazed',
    blurb: 'a light lemon sponge soaked in lemon syrup while hot, so the glaze turns crunchy.',
    recipe: ['200 g butter, 200 g sugar, 3 eggs, 200 g self-raising flour', 'zest of 2 lemons + 2 tbsp juice in the batter', 'syrup: 80 g sugar + 4 tbsp lemon juice, poured hot', 'bake 45 min at 180 °C'],
    nutrition: { kcal: 380, protein: '4 g', carbs: '52 g', fat: '17 g', sugar: '34 g' },
    benefits: 'citrus scent is a known mood lifter — and lemon adds a little vitamin c.',
  },
  {
    id: 'basque-cheesecake',
    name: 'basque cheesecake',
    kind: 'pastry',
    cat: 'cake',
    price: 24,
    art: ART + '7cf58a5dc_generated_image.png',
    note: 'burnt top, molten middle',
    blurb: 'baked hot and fast at 230 °C until the top caramelises while the centre stays barely set.',
    recipe: ['600 g cream cheese, 180 g sugar, 4 eggs', '250 ml double cream, 20 g flour, 1 tsp vanilla', 'bake in a lined tin 30 min at 230 °C', 'cool completely — the centre falls and stays soft'],
    nutrition: { kcal: 430, protein: '7 g', carbs: '28 g', fat: '32 g', sugar: '24 g' },
    benefits: 'rich in calcium and protein from the cheese; a small slice is very satisfying.',
  },
  {
    id: 'choc-chip-cookie',
    name: 'brown butter choc chip cookie',
    kind: 'pastry',
    cat: 'cake',
    price: 11,
    art: ART + '5251d9259_generated_image.png',
    note: 'crisp edge, chewy centre',
    blurb: 'butter browned until nutty, then chocolate chunks folded through and the dough rested overnight.',
    recipe: ['115 g butter browned and cooled', '100 g brown sugar, 50 g caster sugar, 1 egg', '160 g flour, 1/2 tsp soda, 1 pinch salt', '120 g chocolate chunks, rest 12 h, bake 11 min at 180 °C'],
    nutrition: { kcal: 220, protein: '3 g', carbs: '29 g', fat: '11 g', sugar: '18 g' },
    benefits: 'the cheapest treat on the menu, and the overnight rest makes it taste like a bakery one.',
  },
  {
    id: 'pistachio-macaron',
    name: 'pistachio macarons (2)',
    kind: 'pastry',
    cat: 'cake',
    price: 13,
    art: ART + '19832c1ff_generated_image.png',
    note: 'crackly shell, soft middle',
    blurb: 'almond shells rested until they form a foot, filled with pistachio ganache.',
    recipe: ['100 g almond flour + 100 g icing sugar, sifted twice', '2 egg whites (75 g) + 75 g caster sugar, italian meringue at 118 °C', 'pipe, tap, rest 30 min until a skin forms', 'bake 14 min at 150 °C, fill with 60 g pistachio ganache'],
    nutrition: { kcal: 200, protein: '4 g', carbs: '24 g', fat: '10 g', sugar: '20 g' },
    benefits: 'almond and pistachio bring vitamin e and healthy fats in a small package.',
  },
  {
    id: 'berry-tart',
    name: 'berry almond tart',
    kind: 'pastry',
    cat: 'cake',
    price: 21,
    art: ART + 'c4308ad3b_generated_image.png',
    note: 'buttery crust, tart berries',
    blurb: 'sweet shortcrust, a layer of almond cream and a pile of raspberries and blackberries.',
    recipe: ['250 g flour, 150 g butter, 60 g icing sugar, 1 egg (shortcrust)', '80 g almond cream spread on the blind-baked base', '120 g raspberries + 80 g blackberries on top', 'bake 35 min at 170 °C, dust with icing sugar'],
    nutrition: { kcal: 340, protein: '4 g', carbs: '38 g', fat: '19 g', sugar: '20 g' },
    benefits: 'berries are low in sugar and rich in antioxidants — the best-value fruit topping.',
  },
  {
    id: 'chocolate-fudge-cake',
    name: 'chocolate fudge slice',
    kind: 'pastry',
    cat: 'cake',
    price: 23,
    art: ART + '17d6b0930_generated_image.png',
    note: 'dense and dark',
    blurb: 'a flourless-style fudgy base under a glossy ganache — one slice goes a long way.',
    recipe: ['200 g 70% chocolate + 175 g butter, melted', '150 g sugar, 3 eggs, 60 g flour, 1 pinch salt', 'bake 30 min at 170 °C — centre still soft', 'pour 100 ml warm cream over 120 g chocolate for the ganache'],
    nutrition: { kcal: 450, protein: '6 g', carbs: '48 g', fat: '26 g', sugar: '36 g' },
    benefits: 'dark chocolate has magnesium and iron; a half slice is plenty for an afternoon lift.',
  },
];

export const MENU = [...drinks, ...bakes];
export const DRINKS = drinks;
export const PASTRIES = bakes;

export function menuItem(id) {
  return MENU.find((m) => m.id === id);
}

// Human-readable summary of a chosen configuration.
export function optionsText(item, chosen = {}) {
  if (!item?.options?.length) return '';
  return item.options
    .map((key) => {
      const spec = OPTIONS[key];
      const value = chosen[key];
      if (Array.isArray(value)) return value.length ? `${spec.label}: ${value.join(', ')}` : '';
      return value ? `${spec.label} ${value}` : '';
    })
    .filter(Boolean)
    .join(' · ');
}

export function defaultOptions(item) {
  const chosen = {};
  (item?.options || []).forEach((key) => {
    const spec = OPTIONS[key];
    chosen[key] = Array.isArray(spec.default) ? [...spec.default] : spec.default;
  });
  return chosen;
}

// What each choice actually does to the cup. Milk figures are per 150 ml, sugar
// per 25% step away from the recipe as written (which is the 50% cup), toppings
// per spoon, and ice only changes how much of the drink fits in the glass.
const MILK = {
  dairy: { kcal: 96, protein: 5, carbs: 7.5, fat: 5.2 },
  oat: { kcal: 70, protein: 1.5, carbs: 8, fat: 3 },
  soya: { kcal: 54, protein: 5, carbs: 2, fat: 3 },
  none: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
};
const SUGAR_STEP = { kcal: 28, carbs: 7 };
const TOPPING = { kcal: 105, carbs: 25, sugar: 8 };
const ICE = { '0%': 1.15, '25%': 1.08, '50%': 1, '100%': 0.85 };

const num = (value) => parseFloat(String(value)) || 0;
const g = (value) => `${Math.round(Math.max(0, value) * 10) / 10} g`;

// The contents of one cup, once the ice, sugar, milk and toppings are chosen.
export function nutritionFor(item, chosen = {}) {
  const base = item?.nutrition || {};
  const keys = item?.options || [];
  const value = (key) => (keys.includes(key) ? chosen[key] ?? OPTIONS[key].default : undefined);

  let kcal = num(base.kcal);
  let protein = num(base.protein);
  let carbs = num(base.carbs);
  let fat = num(base.fat);
  let sugar = num(base.sugar) || num(base.carbs) * 0.45;
  let caffeine = num(base.caffeine);

  const sugarSteps = (num(value('sugar')) - 50) / 25;
  if (keys.includes('sugar')) {
    kcal += sugarSteps * SUGAR_STEP.kcal;
    carbs += sugarSteps * SUGAR_STEP.carbs;
    sugar += sugarSteps * SUGAR_STEP.carbs;
  }

  const milk = value('milk');
  if (milk && MILK[milk]) {
    const house = MILK[OPTIONS.milk.default];
    kcal += MILK[milk].kcal - house.kcal;
    protein += MILK[milk].protein - house.protein;
    carbs += MILK[milk].carbs - house.carbs;
    fat += MILK[milk].fat - house.fat;
  }

  const toppings = value('toppings');
  if (Array.isArray(toppings)) {
    kcal += toppings.length * TOPPING.kcal;
    carbs += toppings.length * TOPPING.carbs;
    sugar += toppings.length * TOPPING.sugar;
  }

  // more ice means less drink in the same glass, so everything scales with it
  const served = ICE[value('ice')] ?? 1;

  return {
    kcal: `${Math.round(Math.max(0, kcal) * served)} kcal`,
    protein: g(protein * served),
    carbs: g(carbs * served),
    fat: g(fat * served),
    sugar: sugar > 0 ? g(sugar * served) : null,
    caffeine: caffeine > 0 ? `${Math.round(caffeine * served)} mg` : null,
  };
}