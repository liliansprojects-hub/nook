// Real photographs for every menu item, shot on white — the desk drops the
// white away with multiply blending, so a drink stands on the wood like a real
// glass. Anything missing here falls back to the drawn artwork in cafeMenu.
const IMG = 'https://media.base44.com/images/public/6ad5f65588c4a5dd9c9935d0/';

export const PHOTOS = {
  espresso: IMG + 'b6d0bcfbf_generated_image.png',
  'flat-white': IMG + '6c5c689ee_generated_image.png',
  cappuccino: IMG + 'f60146029_generated_image.png',
  'iced-latte': IMG + '8861a45fe_generated_image.png',
  'chai-latte': IMG + '708971542_generated_image.png',
  'matcha-latte': IMG + 'e60192186_generated_image.png',
  'jasmine-tea': IMG + 'a4e7f12d0_generated_image.png',
  'oolong-milk-tea': IMG + '578fd4074_generated_image.png',
  'mango-sago': IMG + '8b749828a_generated_image.png',
  'boba-milk-tea': IMG + '3a4b4799e_generated_image.png',
  'peach-iced-tea': IMG + '6ef3552ed_generated_image.png',
  'lychee-rose-cooler': IMG + 'cc41068da_generated_image.png',
  'hot-chocolate': IMG + '7fe902708_generated_image.png',
  'butter-croissant': IMG + 'a2609f29e_generated_image.png',
  'almond-croissant': IMG + '9026067d9_generated_image.png',
  'pain-au-chocolat': IMG + 'ea77f70c2_generated_image.png',
  'cinnamon-bun': IMG + '705a8b4c4_generated_image.png',
  'blueberry-muffin': IMG + '0c7c1dd72_generated_image.png',
  'lemon-drizzle': IMG + '49f3ee5ae_generated_image.png',
  'basque-cheesecake': IMG + '3428e37cc_generated_image.png',
  'choc-chip-cookie': IMG + '973647658_generated_image.png',
  'pistachio-macaron': IMG + 'c9f87e7c9_generated_image.png',
  'berry-tart': IMG + 'd9190cfd4_generated_image.png',
  'chocolate-fudge-cake': IMG + 'ed5abda5e_generated_image.png',
};

export function photoFor(id) {
  return PHOTOS[id] || null;
}