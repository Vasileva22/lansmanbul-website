export const cityPoiPriorities = {
  istanbul: {
    priorities: ['transport', 'business', 'infrastructure', 'leisure'],
    maxWalkingTimeMinutes: 15,
  },
  antalya: {
    priorities: ['leisure', 'infrastructure', 'transport', 'business'],
    maxWalkingTimeMinutes: 20,
  },
  mugla: {
    priorities: ['leisure', 'infrastructure', 'transport', 'business'],
    maxWalkingTimeMinutes: 20,
  },
  ankara: {
    priorities: ['transport', 'infrastructure', 'business', 'leisure'],
    maxWalkingTimeMinutes: 15,
  },
  default: {
    priorities: ['infrastructure', 'transport', 'leisure', 'business'],
    maxWalkingTimeMinutes: 15,
  }
};
