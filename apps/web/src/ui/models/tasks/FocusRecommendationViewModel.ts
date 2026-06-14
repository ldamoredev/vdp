export interface FocusRecommendationViewModel {
  title: string;
  items: FocusRecommendationItemVM[];
  emptyState: FocusRecommendationEmptyStateVM | null;
}

export interface FocusRecommendationItemVM {
  id: string;
  rank: string;
  title: string;
  priority: number;
  domain: string | null;
  carryOverCount: number;
  reason: string;
  selected: boolean;
  className: string;
}

export interface FocusRecommendationEmptyStateVM {
  title: string;
  description: string;
}
