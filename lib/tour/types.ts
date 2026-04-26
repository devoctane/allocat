export type TourPage =
  | "dashboard"
  | "budget"
  | "goals"
  | "debt"
  | "net-worth"
  | "activity";

export interface TourState {
  enabled: boolean;
  seenPages: TourPage[];
}

export interface TourContextValue extends TourState {
  isPageTourActive: (page: TourPage) => boolean;
  markSeen: (page: TourPage) => void;
  setEnabled: (enabled: boolean) => void;
  resetTour: () => void;
}
