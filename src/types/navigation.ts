export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Attendance: undefined;
  Harvest: { subTab?: 'picking' | 'curing' } | undefined;
  Activity: undefined;
  Expenses: { subTab?: 'expenses' | 'income' | 'pnl' | 'inventory' | 'equipment' } | undefined;
  Curing: undefined;
  PnL: undefined;
  Settings: undefined;
};
