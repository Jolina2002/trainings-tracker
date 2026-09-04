import { FoodEntry } from './types';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export const entryMacros = (e: FoodEntry): Macros => ({
  kcal: e.kcal * e.amount,
  protein: e.protein * e.amount,
  carbs: e.carbs * e.amount,
  fat: e.fat * e.amount,
});

export const sumFood = (list: FoodEntry[]): Macros =>
  list.reduce<Macros>((acc, e) => {
    const m = entryMacros(e);
    return {
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    };
  }, { ...ZERO });
