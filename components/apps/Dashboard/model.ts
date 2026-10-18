export type DashboardLocale = "en" | "zh";
export type LocalizedText = Record<DashboardLocale, string>;
export type DashboardModule =
  "memberships" | "overview" | "personal" | "servers" | "services";
export type Freshness = "fresh" | "stale" | "unavailable" | "unknown";
export type HealthStatus =
  "degraded" | "down" | "maintenance" | "pending" | "unknown" | "up";
export type Visibility = "private" | "public";
export type Currency = "CNY" | "EUR" | "JPY" | "USD";
export type Money = { currency: Currency; minor: number };
export type ChartPoint = { at: string; value: null | number };
export type DemoSource = {
  fetchedAt: null | string;
  freshness: Freshness;
  id: string;
  kind: "agent" | "calendar" | "manual" | "monitor" | "wearable";
  name: LocalizedText;
  note: LocalizedText;
  observedAt: null | string;
  sourceUpdatedAt: null | string;
};

export type ActivityRecord = {
  category: "break" | "focus" | "learning" | "offline";
  endedAt: null | string;
  id: string;
  sourceId: string;
  startedAt: string;
  title: LocalizedText;
};
export type ScheduleEvent = {
  endsAt: string;
  id: string;
  location: LocalizedText | null;
  startsAt: string;
  status: "cancelled" | "done" | "planned";
  title: LocalizedText;
};
export type DemoLocation = {
  label: LocalizedText;
  observedAt: string;
  sourceId: string;
};
// x/y 为演示示意图上的百分比位置，不是地理坐标。
export type RoutePoint = {
  at: string;
  id: string;
  label: LocalizedText;
  x: number;
  y: number;
};
export type PersonalMetricId =
  | "activity"
  | "checkups"
  | "heartRate"
  | "location"
  | "schedule"
  | "sleep"
  | "steps"
  | "weight";
export type DemoPrivacyPolicy = {
  delayDays: 0 | 1 | 7;
  history: "all" | "day" | "month" | "threeDays";
  mode: "calendar";
  visibility: Visibility;
};
export type HealthMetric = {
  freshness: Freshness;
  goal: null | number;
  id: "heartRate" | "sleep" | "steps" | "weight";
  label: LocalizedText;
  note: LocalizedText;
  observedAt: null | string;
  points: ChartPoint[];
  sourceId: string;
  unit: string;
  value: null | number;
};
export type CheckupRecord = {
  date: string;
  id: string;
  items: {
    label: LocalizedText;
    reference: LocalizedText;
    unit: string;
    value: null | number;
  }[];
  note: LocalizedText;
  title: LocalizedText;
  type: "blood" | "general" | "vision";
};
export type PersonalData = {
  activities: ActivityRecord[];
  checkups: CheckupRecord[];
  health: HealthMetric[];
  location: DemoLocation | null;
  policies: Record<PersonalMetricId, DemoPrivacyPolicy>;
  route: RoutePoint[];
  schedule: ScheduleEvent[];
};

export type PaymentRecord = {
  amount: Money;
  id: string;
  note: LocalizedText;
  paidAt: string;
};
export type Membership = {
  amount: Money | null;
  category: "cloud" | "learning" | "media" | "tools";
  cycle: "monthly" | "oneTime" | "yearly";
  entitlement: {
    endsAt: null | string;
    startsAt: null | string;
    status: "active" | "expired" | "paused" | "trial" | "unknown";
  };
  id: string;
  managementUrl: null | string;
  name: LocalizedText;
  note: LocalizedText;
  payments: PaymentRecord[];
  planName: LocalizedText;
  renewal: {
    autoRenew: "off" | "on" | "unknown";
    cancelBy: null | string;
    nextAt: null | string;
    status: "active" | "cancelled" | "paused" | "unknown";
  };
  serviceId: null | string;
  visibility: Visibility;
};

export type ServiceEvent = {
  endedAt: null | string;
  id: string;
  kind: "incident" | "maintenance" | "recovery";
  startedAt: string;
  summary: LocalizedText;
  title: LocalizedText;
};
export type ServiceHealthDay = {
  date: string;
  degraded: number;
  down: number;
  up: number;
};
export type ServiceHealthHistory = {
  days: ServiceHealthDay[];
  expectedSamplesPerDay: number;
};
export type Service = {
  category: "development" | "media" | "productivity" | "storage";
  description: LocalizedText;
  events: ServiceEvent[];
  fetchedAt: null | string;
  freshness: Freshness;
  health: HealthStatus;
  healthHistory: null | ServiceHealthHistory;
  // 响应时间样本，单位毫秒；与每日健康检查结果分开。
  history: ChartPoint[];
  id: string;
  latencyMs: null | number;
  monitor: {
    intervalSeconds: number;
    location: LocalizedText;
    method: "HTTP" | "manual" | "TCP";
  } | null;
  name: LocalizedText;
  observedAt: null | string;
  serverId: null | string;
  sourceId: string;
  sourceUpdatedAt: null | string;
  url: null | string;
  visibility: Visibility;
};
export type ServerMetrics = {
  // 整机全部逻辑核心的使用比例，取值为 0–100%。
  cpuPercent: null | number;
  diskTotalBytes: null | number;
  diskUsedBytes: null | number;
  memoryTotalBytes: null | number;
  memoryUsedBytes: null | number;
  networkInBytesPerSecond: null | number;
  networkOutBytesPerSecond: null | number;
  uptimeSeconds: null | number;
};
export type Server = {
  cpuLabel: string;
  cpuLogicalCores: null | number;
  expiresAt: null | string;
  freshness: Freshness;
  health: HealthStatus;
  history: {
    cpu: ChartPoint[];
    memory: ChartPoint[];
    // 入站速率，单位 bytes/s；磁盘不生成虚构历史。
    network: ChartPoint[];
  };
  id: string;
  lastSeenAt: null | string;
  metrics: ServerMetrics;
  name: LocalizedText;
  note: LocalizedText;
  os: string;
  provider: LocalizedText;
  region: LocalizedText;
  renewalCost: Money | null;
  sampleWindowSeconds: null | number;
  sourceId: string;
  tags: string[];
  visibility: Visibility;
};

export type DashboardDemoData = {
  memberships: Membership[];
  now: string;
  personal: PersonalData;
  servers: Server[];
  services: Service[];
  sources: DemoSource[];
  timeZone: string;
};
export type DashboardViewProps = {
  // 由外壳统一选择可见数据，视图不能再次筛选整份数据集。
  data: DashboardDemoData;
  locale: DashboardLocale;
  onDirtyChange?: (dirty: boolean) => void;
  onNavigate: (module: DashboardModule, id?: string) => void;
  onUpdate: (
    update: (previous: DashboardDemoData) => DashboardDemoData
  ) => void;
  // visitor 仅为演示预览并禁止编辑；onUpdate 始终更新外壳的原始内存数据。
  previewMode?: "all" | "visitor";
  selectedId?: string;
};
