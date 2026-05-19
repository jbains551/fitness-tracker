export const QUICK_FOODS = [
  { id: 'chicken-rice-teriyaki', name: 'Chicken & Rice Bowl (Teriyaki)', cal: 480, p: 48, c: 52, f: 8 },
  { id: 'chicken-rice-sweet-sour', name: 'Chicken & Rice Bowl (Sweet & Sour)', cal: 490, p: 48, c: 55, f: 7 },
  { id: 'whey', name: 'Whey Protein Shake', cal: 150, p: 40, c: 5, f: 2 },
  { id: 'casein', name: 'Casein Protein Shake', cal: 140, p: 35, c: 6, f: 2 },
  { id: 'eggs-3', name: 'Eggs (3 whole)', cal: 210, p: 18, c: 0, f: 15 },
  { id: 'oatmeal', name: 'Oatmeal (1 cup dry)', cal: 300, p: 10, c: 54, f: 5 },
  { id: 'salmon-6', name: 'Salmon (6oz)', cal: 350, p: 40, c: 0, f: 20 },
  { id: 'greek-yogurt', name: 'Greek Yogurt (1 cup)', cal: 130, p: 22, c: 9, f: 0 },
  { id: 'banana', name: 'Banana', cal: 105, p: 1, c: 27, f: 0 },
];

export const MEALS = ['breakfast', 'pre-workout', 'post-workout', 'lunch', 'dinner', 'snack'];

export const SUPPLEMENTS = {
  morning: [
    { id: 'vit_d3', name: 'Vitamin D3', dose: '5000 IU' },
    { id: 'k2', name: 'Vitamin K2', dose: '100 mcg' },
    { id: 'fish_oil', name: 'Fish Oil', dose: '2 g' },
    { id: 'zinc', name: 'Zinc', dose: '15 mg' },
  ],
  preworkout: [
    { id: 'creatine', name: 'Creatine', dose: '5 g' },
    { id: 'caffeine', name: 'Caffeine', dose: '' },
  ],
  afternoon: [
    { id: 'berberine', name: 'Berberine', dose: '500 mg' },
    { id: 'gte', name: 'Green Tea Extract', dose: '400 mg' },
    { id: 'l_carnitine', name: 'L-Carnitine', dose: '1 g' },
  ],
  bedtime: [
    { id: 'magnesium', name: 'Magnesium Glycinate', dose: '400 mg' },
    { id: 'ashwagandha', name: 'Ashwagandha', dose: '600 mg' },
  ],
};

export const WORKOUT_TYPES = ['HIIT', 'Zone 2', 'Strength', 'Rest'];
