export type DashboardAction = {
  id: string;
  priority: string;
  type: string;
  title: string;
  participant: string;
  time: string;
  href: string;
};

export type DashboardActivity = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: string;
};

const dashboardState = {
  kpis: {
    totalParticipants: 128,
    activeParticipants: 94,
    protocolDeviations: 0,
    safetySignals: 0,
    adverseEvents: 24,
    dataQualityIssues: 18,
    labIssues: 9,
    medicationConcerns: 6,
  },

  health: {
    participantRetention: 91,
    visitCompliance: 87,
    dataCompleteness: 82,
    protocolCompliance: 94,
  },

  actions: [] as DashboardAction[],

  activity: [] as DashboardActivity[],
};

export function getDashboardState() {
  return dashboardState;
}

export function addDashboardAction(
  action: DashboardAction
) {
  const exists = dashboardState.actions.some(
    (item) => item.id === action.id
  );

  if (!exists) {
    dashboardState.actions.unshift(action);
  }

  // Keep the action center manageable.
  dashboardState.actions =
    dashboardState.actions.slice(0, 10);
}

export function addDashboardActivity(
  activity: DashboardActivity
) {
  const exists = dashboardState.activity.some(
    (item) => item.id === activity.id
  );

  if (!exists) {
    dashboardState.activity.unshift(activity);
  }

  dashboardState.activity =
    dashboardState.activity.slice(0, 10);
}

export function setProtocolDeviations(
  count: number
) {
  dashboardState.kpis.protocolDeviations =
    Math.max(0, count);
}

export function setSafetySignals(
  count: number
) {
  dashboardState.kpis.safetySignals =
    Math.max(0, count);
}