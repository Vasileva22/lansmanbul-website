export interface CityPriorityConfig {
  priorities: Array<'transport' | 'leisure' | 'infrastructure' | 'business'>;
  maxWalkingTimeMinutes: number; // Максимальное время пешком, которое считается "близким"
}

export const cityPoiPriorities: Record<string, CityPriorityConfig> = {
  // Для Стамбула транспорт и бизнес-центры в приоритете
  istanbul: {
    priorities: ['transport', 'business', 'infrastructure', 'leisure'],
    maxWalkingTimeMinutes: 15,
  },
  // Для Антальи, Аланьи и Бодрума пляжи и парки (leisure) - абсолютный приоритет
  antalya: {
    priorities: ['leisure', 'infrastructure', 'transport', 'business'],
    maxWalkingTimeMinutes: 20,
  },
  mugla: {
    priorities: ['leisure', 'infrastructure', 'transport', 'business'],
    maxWalkingTimeMinutes: 20,
  },
  // Для Анкары важны транспорт и инфраструктура (школы/университеты)
  ankara: {
    priorities: ['transport', 'infrastructure', 'business', 'leisure'],
    maxWalkingTimeMinutes: 15,
  },
  // Стандартные настройки для любого другого города Турции
  default: {
    priorities: ['infrastructure', 'transport', 'leisure', 'business'],
    maxWalkingTimeMinutes: 15,
  }
};
