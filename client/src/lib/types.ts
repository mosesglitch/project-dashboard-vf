export interface DashboardFilters {
  status: string;
  division: string;
  dateFrom: string;
  dateTo: string;
}

export interface KPIData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalBudget: number;
  actualSpend: number;
  amountReceived: number;
}

export interface SpendingData {
  underBudget: number;
  withinBudget: number;
  overspent: number;
  criticalOverspent: number;
}

export interface StatusData {
  aheadOfSchedule: number;
  onTrack: number;
  slightlyBehind: number;
  criticalDelay: number;
}

export interface DivisionData {
  mechanical: number;
  electrical: number;
  instrumentation: number;
}
