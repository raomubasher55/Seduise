export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'engagement' | 'quality' | 'community' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: 'likes' | 'upvotes' | 'plays' | 'stories_created' | 'engagement_ratio' | 'community_impact';
    threshold: number;
    timeframe?: 'all_time' | 'monthly' | 'weekly';
    additional_conditions?: any;
  };
  rewards?: {
    credits?: number;
    premium_days?: number;
  };
}

// Badge definitions organized by category
export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  // ==================== ENGAGEMENT BADGES ====================
  'first_like': {
    id: 'first_like',
    name: 'First Heart',
    description: 'Received your first like on a story',
    icon: '💝',
    color: '#FFB6C1',
    category: 'engagement',
    rarity: 'common',
    criteria: {
      type: 'likes',
      threshold: 1,
      timeframe: 'all_time'
    },
    rewards: {
      credits: 5
    }
  },

  'popular_author': {
    id: 'popular_author',
    name: 'Popular Author',
    description: 'Received 50+ likes across all stories',
    icon: '⭐',
    color: '#FFD700',
    category: 'engagement',
    rarity: 'rare',
    criteria: {
      type: 'likes',
      threshold: 50,
      timeframe: 'all_time'
    },
    rewards: {
      credits: 25
    }
  },

  'viral_storyteller': {
    id: 'viral_storyteller',
    name: 'Viral Storyteller',
    description: 'Received 200+ likes across all stories',
    icon: '🔥',
    color: '#FF4500',
    category: 'engagement',
    rarity: 'epic',
    criteria: {
      type: 'likes',
      threshold: 200,
      timeframe: 'all_time'
    },
    rewards: {
      credits: 100,
      premium_days: 3
    }
  },

  'legend_author': {
    id: 'legend_author',
    name: 'Legend Author',
    description: 'Received 1000+ likes across all stories',
    icon: '👑',
    color: '#8A2BE2',
    category: 'engagement',
    rarity: 'legendary',
    criteria: {
      type: 'likes',
      threshold: 1000,
      timeframe: 'all_time'
    },
    rewards: {
      credits: 500,
      premium_days: 30
    }
  },

  // ==================== QUALITY BADGES ====================
  'quality_writer': {
    id: 'quality_writer',
    name: 'Quality Writer',
    description: 'High engagement ratio (likes/plays > 0.3)',
    icon: '✨',
    color: '#4169E1',
    category: 'quality',
    rarity: 'rare',
    criteria: {
      type: 'engagement_ratio',
      threshold: 0.3,
      timeframe: 'all_time',
      additional_conditions: {
        min_plays: 20 // Must have at least 20 plays to qualify
      }
    },
    rewards: {
      credits: 30
    }
  },

  'masterpiece_creator': {
    id: 'masterpiece_creator',
    name: 'Masterpiece Creator',
    description: 'Exceptional engagement ratio (likes/plays > 0.5)',
    icon: '🎨',
    color: '#9932CC',
    category: 'quality',
    rarity: 'epic',
    criteria: {
      type: 'engagement_ratio',
      threshold: 0.5,
      timeframe: 'all_time',
      additional_conditions: {
        min_plays: 50
      }
    },
    rewards: {
      credits: 75,
      premium_days: 7
    }
  },

  // ==================== COMMUNITY BADGES ====================
  'community_favorite': {
    id: 'community_favorite',
    name: 'Community Favorite',
    description: 'More upvotes than downvotes with 10+ total votes',
    icon: '🏆',
    color: '#32CD32',
    category: 'community',
    rarity: 'rare',
    criteria: {
      type: 'upvotes',
      threshold: 10,
      timeframe: 'all_time',
      additional_conditions: {
        upvote_ratio: 0.7 // 70% upvotes
      }
    },
    rewards: {
      credits: 40
    }
  },

  'peoples_choice': {
    id: 'peoples_choice',
    name: "People's Choice",
    description: 'Overwhelmingly positive community response (90%+ upvotes)',
    icon: '🎖️',
    color: '#FF6347',
    category: 'community',
    rarity: 'epic',
    criteria: {
      type: 'upvotes',
      threshold: 25,
      timeframe: 'all_time',
      additional_conditions: {
        upvote_ratio: 0.9,
        min_total_votes: 30
      }
    },
    rewards: {
      credits: 100,
      premium_days: 5
    }
  },

  // ==================== MILESTONE BADGES ====================
  'storyteller': {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Created your first story',
    icon: '📚',
    color: '#8B4513',
    category: 'milestone',
    rarity: 'common',
    criteria: {
      type: 'stories_created',
      threshold: 1,
      timeframe: 'all_time'
    },
    rewards: {
      credits: 0
    }
  },

  'prolific_writer': {
    id: 'prolific_writer',
    name: 'Prolific Writer',
    description: 'Created 10+ stories',
    icon: '📖',
    color: '#228B22',
    category: 'milestone',
    rarity: 'rare',
    criteria: {
      type: 'stories_created',
      threshold: 10,
      timeframe: 'all_time'
    },
    rewards: {
      credits: 50
    }
  },

  'story_master': {
    id: 'story_master',
    name: 'Story Master',
    description: 'Created 50+ stories',
    icon: '📝',
    color: '#B8860B',
    category: 'milestone',
    rarity: 'epic',
    criteria: {
      type: 'stories_created',
      threshold: 50,
      timeframe: 'all_time'
    },
    rewards: {
      credits: 200,
      premium_days: 14
    }
  },

  // ==================== MONTHLY ACHIEVEMENTS ====================
  'monthly_star': {
    id: 'monthly_star',
    name: 'Monthly Star',
    description: 'Top engagement this month',
    icon: '🌟',
    color: '#FFD700',
    category: 'community',
    rarity: 'epic',
    criteria: {
      type: 'likes',
      threshold: 20,
      timeframe: 'monthly'
    },
    rewards: {
      credits: 75,
      premium_days: 3
    }
  }
};

// Helper functions for badge management
export const getBadgesByCategory = (category: BadgeDefinition['category']): BadgeDefinition[] => {
  return Object.values(BADGE_DEFINITIONS).filter(badge => badge.category === category);
};

export const getBadgesByRarity = (rarity: BadgeDefinition['rarity']): BadgeDefinition[] => {
  return Object.values(BADGE_DEFINITIONS).filter(badge => badge.rarity === rarity);
};

export const getBadgeById = (id: string): BadgeDefinition | undefined => {
  return BADGE_DEFINITIONS[id];
};

// Badge awarding priority (legendary badges checked first)
export const BADGE_CHECK_ORDER = Object.values(BADGE_DEFINITIONS)
  .sort((a, b) => {
    const rarityOrder = { 'legendary': 0, 'epic': 1, 'rare': 2, 'common': 3 };
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  })
  .map(badge => badge.id);