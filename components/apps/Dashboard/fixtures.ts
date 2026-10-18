/* eslint-disable unicorn/no-null -- null 明确表示未知值或样本缺口，不能用 0 或省略字段代替。 */
import {
  type ChartPoint,
  type DashboardDemoData,
  type LocalizedText,
  type ServiceHealthDay,
  type ServiceHealthHistory,
} from "components/apps/Dashboard/model";

export const DEMO_NOW = "2026-10-18T12:00:00.000Z";
export const DEMO_TIME_ZONE = "UTC";
// 每项为一个完整 UTC 日的合成检查计数；不从响应延迟推断健康。
const healthHistory = (
  overrides: Record<number, Partial<Omit<ServiceHealthDay, "date">>> = {},
  expectedSamplesPerDay = 1440
): ServiceHealthHistory => ({
  days: Array.from({ length: 90 }, (_, index) => {
    const override = overrides[index] || {};
    const degraded = override.degraded || 0;
    const down = override.down || 0;

    return {
      date: new Date(
        Date.parse(`${DEMO_NOW.slice(0, 10)}T00:00:00Z`) -
          (90 - index) * 86_400_000
      )
        .toISOString()
        .slice(0, 10),
      degraded,
      down,
      up: override.up ?? expectedSamplesPerDay - degraded - down,
    };
  }),
  expectedSamplesPerDay,
});
const text = (zh: string, en: string): LocalizedText => ({ en, zh });
const points = (
  values: (null | number)[],
  hours = 1,
  endAt = "2026-10-18T11:59:00Z"
): ChartPoint[] =>
  values.map((value, index) => ({
    at: new Date(
      Date.parse(endAt) - (values.length - 1 - index) * hours * 3_600_000
    ).toISOString(),
    value,
  }));

// 每次返回独立数据；所有人名、服务、位置和记录均为合成示例。
export const makeDemoData = (): DashboardDemoData => ({
  memberships: [
    {
      amount: { currency: "CNY", minor: 2500 },
      category: "media",
      cycle: "monthly",
      entitlement: {
        endsAt: "2026-10-21T00:00:00Z",
        startsAt: "2026-09-21T00:00:00Z",
        status: "active",
      },
      id: "demo-cinema",
      managementUrl: null,
      name: text("演示影音", "Demo Cinema"),
      note: text(
        "合成月付示例，没有连接真实账号。",
        "Synthetic monthly plan; no account connected."
      ),
      payments: [
        {
          amount: { currency: "CNY", minor: 2500 },
          id: "demo-cinema-payment-1",
          note: text("示例确认记录", "Sample confirmed payment"),
          paidAt: "2026-09-21T00:00:00Z",
        },
      ],
      planName: text("标准月付", "Standard monthly"),
      renewal: {
        autoRenew: "on",
        cancelBy: "2026-10-20T00:00:00Z",
        nextAt: "2026-10-21T00:00:00Z",
        status: "active",
      },
      serviceId: null,
    },
    {
      amount: { currency: "USD", minor: 12000 },
      category: "cloud",
      cycle: "yearly",
      entitlement: {
        endsAt: "2026-11-03T00:00:00Z",
        startsAt: "2025-11-03T00:00:00Z",
        status: "active",
      },
      id: "demo-cloud",
      managementUrl: null,
      name: text("演示云盘", "Demo Cloud"),
      note: text(
        "原始记录为美元年付，换算展示不修改付款记录。",
        "Recorded as an annual USD payment; display conversion preserves the source."
      ),
      payments: [
        {
          amount: { currency: "USD", minor: 12000 },
          id: "demo-cloud-payment-1",
          note: text("示例年付记录", "Sample annual payment"),
          paidAt: "2025-11-03T00:00:00Z",
        },
      ],
      planName: text("年度存储", "Annual storage"),
      renewal: {
        autoRenew: "off",
        cancelBy: null,
        nextAt: "2026-11-03T00:00:00Z",
        status: "active",
      },
      serviceId: "demo-drive",
    },
    {
      amount: { currency: "CNY", minor: 3900 },
      category: "learning",
      cycle: "monthly",
      entitlement: {
        endsAt: "2026-10-20T00:00:00Z",
        startsAt: "2026-10-06T00:00:00Z",
        status: "trial",
      },
      id: "demo-study",
      managementUrl: null,
      name: text("演示学习", "Demo Learning"),
      note: text(
        "39 元为转正后计划费用；试用尚无付款。",
        "CNY 39 is the planned post-trial price; no payment yet."
      ),
      payments: [],
      planName: text("十四天试用", "14-day trial"),
      renewal: {
        autoRenew: "unknown",
        cancelBy: "2026-10-19T00:00:00Z",
        nextAt: "2026-10-20T00:00:00Z",
        status: "active",
      },
      serviceId: null,
    },
    {
      amount: { currency: "CNY", minor: 6800 },
      category: "tools",
      cycle: "monthly",
      entitlement: {
        endsAt: "2026-10-28T00:00:00Z",
        startsAt: "2026-09-28T00:00:00Z",
        status: "active",
      },
      id: "demo-design",
      managementUrl: null,
      name: text("演示设计", "Demo Design"),
      note: text(
        "续费计划已取消，当前权益仍然有效。",
        "Renewal cancelled; current access remains active."
      ),
      payments: [
        {
          amount: { currency: "CNY", minor: 6800 },
          id: "demo-design-payment-1",
          note: text("示例确认记录", "Sample confirmed payment"),
          paidAt: "2026-09-28T00:00:00Z",
        },
      ],
      planName: text("创作套餐", "Creative plan"),
      renewal: {
        autoRenew: "off",
        cancelBy: null,
        nextAt: null,
        status: "cancelled",
      },
      serviceId: null,
    },
    {
      amount: null,
      category: "tools",
      cycle: "yearly",
      entitlement: { endsAt: null, startsAt: null, status: "unknown" },
      id: "demo-archive",
      managementUrl: null,
      name: text("演示资料库", "Demo Archive"),
      note: text(
        "金额与权益日期待确认，不以 0 代替。",
        "Price and access dates are unknown, not zero."
      ),
      payments: [],
      planName: text("待核对", "Needs review"),
      renewal: {
        autoRenew: "unknown",
        cancelBy: null,
        nextAt: null,
        status: "unknown",
      },
      serviceId: null,
    },
    {
      amount: { currency: "CNY", minor: 0 },
      category: "tools",
      cycle: "oneTime",
      entitlement: {
        endsAt: null,
        startsAt: "2026-10-01T00:00:00Z",
        status: "active",
      },
      id: "demo-notes",
      managementUrl: null,
      name: text("演示笔记", "Demo Notes"),
      note: text(
        "确定免费的示例权益，不产生续费计划。",
        "A confirmed free entitlement with no renewal plan."
      ),
      payments: [],
      planName: text("社区版", "Community edition"),
      renewal: {
        autoRenew: "off",
        cancelBy: null,
        nextAt: null,
        status: "cancelled",
      },
      serviceId: "demo-notebook",
    },
  ],
  now: DEMO_NOW,
  personal: {
    activities: [
      {
        category: "focus",
        endedAt: null,
        id: "demo-focus",
        sourceId: "demo-manual",
        startedAt: "2026-10-18T11:00:00Z",
        title: text("整理项目笔记", "Organizing project notes"),
      },
      {
        category: "break",
        endedAt: "2026-10-18T11:00:00Z",
        id: "demo-break",
        sourceId: "demo-manual",
        startedAt: "2026-10-18T10:30:00Z",
        title: text("休息与散步", "Break and walk"),
      },
      {
        category: "learning",
        endedAt: "2026-10-18T10:30:00Z",
        id: "demo-reading",
        sourceId: "demo-manual",
        startedAt: "2026-10-18T09:00:00Z",
        title: text("阅读与学习", "Reading and learning"),
      },
      {
        category: "focus",
        endedAt: "2026-10-17T16:00:00Z",
        id: "demo-yesterday",
        sourceId: "demo-manual",
        startedAt: "2026-10-17T14:00:00Z",
        title: text("完成示例任务", "Completing a sample task"),
      },
    ],
    checkups: [
      {
        date: "2026-09-10",
        id: "demo-checkup-blood",
        items: [
          {
            label: text("项目 A", "Item A"),
            reference: text(
              "演示记录，不提供诊断",
              "Demo record, no diagnosis"
            ),
            unit: "g/L",
            value: 145,
          },
          {
            label: text("项目 B", "Item B"),
            reference: text("结果待补充", "Result not entered"),
            unit: "",
            value: null,
          },
        ],
        note: text(
          "合成检查记录，无附件或真实医疗资料。",
          "Synthetic checkup; no attachment or real medical data."
        ),
        title: text("血常规示例", "Sample blood test"),
        type: "blood",
      },
      {
        date: "2026-08-21",
        id: "demo-checkup-vision",
        items: [
          {
            label: text("左眼记录", "Left-eye record"),
            reference: text("演示数值", "Sample value"),
            unit: "",
            value: 1,
          },
          {
            label: text("右眼记录", "Right-eye record"),
            reference: text("演示数值", "Sample value"),
            unit: "",
            value: 1,
          },
        ],
        note: text(
          "只演示结构化记录，不作健康评估。",
          "Demonstrates structured records, not a health assessment."
        ),
        title: text("视力检查示例", "Sample vision check"),
        type: "vision",
      },
    ],
    health: [
      {
        freshness: "fresh",
        goal: 8000,
        id: "steps",
        label: text("步数", "Steps"),
        note: text("固定示例日内累计", "Fixed sample daily total"),
        observedAt: "2026-10-18T11:59:00Z",
        points: points([
          0,
          0,
          320,
          810,
          1400,
          2200,
          null,
          3500,
          4210,
          5100,
          5800,
          6420,
        ]),
        sourceId: "demo-wearable",
        unit: "steps",
        value: 6420,
      },
      {
        freshness: "fresh",
        goal: null,
        id: "heartRate",
        label: text("心率", "Heart rate"),
        note: text(
          "断线处表示缺少样本，不是 0",
          "Gaps mean missing samples, not zero"
        ),
        observedAt: "2026-10-18T11:59:00Z",
        points: points([
          62,
          61,
          60,
          62,
          65,
          68,
          72,
          70,
          null,
          null,
          76,
          72,
          68,
          73,
          75,
          78,
          72,
          70,
          71,
          73,
          72,
          70,
          69,
          72,
        ]),
        sourceId: "demo-wearable",
        unit: "bpm",
        value: 72,
      },
      {
        freshness: "fresh",
        goal: 8,
        id: "sleep",
        label: text("睡眠时长", "Sleep duration"),
        note: text(
          "示例：23:10 入睡，06:34 起床",
          "Sample: asleep 23:10, awake 06:34"
        ),
        observedAt: "2026-10-18T06:34:00Z",
        points: points(
          [7.2, 6.8, 7.6, null, 7.1, 8, 7.4],
          24,
          "2026-10-18T06:34:00Z"
        ),
        sourceId: "demo-wearable",
        unit: "h",
        value: 7.4,
      },
      {
        freshness: "unknown",
        goal: null,
        id: "weight",
        label: text("体重", "Weight"),
        note: text("没有提供样本", "No sample provided"),
        observedAt: null,
        points: [],
        sourceId: "demo-manual",
        unit: "kg",
        value: null,
      },
    ],
    location: {
      label: text("演示空间 B", "Demo space B"),
      observedAt: "2026-10-18T11:00:00Z",
      sourceId: "demo-manual",
    },
    route: [
      {
        at: "2026-10-18T08:00:00Z",
        id: "demo-route-a",
        label: text("演示空间 A", "Demo space A"),
        x: 15,
        y: 70,
      },
      {
        at: "2026-10-18T09:00:00Z",
        id: "demo-route-b",
        label: text("演示通道", "Demo passage"),
        x: 38,
        y: 55,
      },
      {
        at: "2026-10-18T10:30:00Z",
        id: "demo-route-c",
        label: text("演示休息区", "Demo rest area"),
        x: 62,
        y: 66,
      },
      {
        at: "2026-10-18T11:00:00Z",
        id: "demo-route-d",
        label: text("演示空间 B", "Demo space B"),
        x: 82,
        y: 28,
      },
    ],
    schedule: [
      {
        endsAt: "2026-10-18T10:30:00Z",
        id: "demo-schedule-reading",
        location: null,
        startsAt: "2026-10-18T09:00:00Z",
        status: "done",
        title: text("阅读时间", "Reading time"),
      },
      {
        endsAt: "2026-10-18T13:00:00Z",
        id: "demo-schedule-project",
        location: text("演示空间 B", "Demo space B"),
        startsAt: "2026-10-18T11:00:00Z",
        status: "planned",
        title: text("项目整理", "Project organization"),
      },
      {
        endsAt: "2026-10-18T15:00:00Z",
        id: "demo-schedule-walk",
        location: null,
        startsAt: "2026-10-18T14:00:00Z",
        status: "planned",
        title: text("散步与休息", "Walk and break"),
      },
      {
        endsAt: "2026-10-19T10:00:00Z",
        id: "demo-schedule-review",
        location: null,
        startsAt: "2026-10-19T09:00:00Z",
        status: "planned",
        title: text("每周回顾", "Weekly review"),
      },
    ],
  },
  servers: [
    {
      cpuLabel: "2 vCPU",
      cpuLogicalCores: 2,
      expiresAt: null,
      freshness: "fresh",
      health: "down",
      history: { cpu: [], memory: [], network: [] },
      id: "demo-node-down",
      lastSeenAt: "2026-10-18T10:00:00Z",
      metrics: {
        cpuPercent: null,
        diskTotalBytes: null,
        diskUsedBytes: null,
        memoryTotalBytes: null,
        memoryUsedBytes: null,
        networkInBytesPerSecond: null,
        networkOutBytesPerSecond: null,
        uptimeSeconds: null,
      },
      name: text("演示离线主机", "Demo offline node"),
      note: text(
        "来源有效且报告不可用；没有将断流值补成 0。",
        "A current source reports it down; missing metrics are not zero."
      ),
      os: "Demo Linux",
      provider: text("演示供应商", "Demo provider"),
      region: text("演示区域 C", "Demo region C"),
      renewalCost: null,
      sampleWindowSeconds: 60,
      sourceId: "demo-agent",
      tags: ["demo", "offline"],
    },
    {
      cpuLabel: "2 vCPU",
      cpuLogicalCores: 2,
      expiresAt: "2026-11-03T00:00:00Z",
      freshness: "fresh",
      health: "up",
      history: {
        cpu: points([22, 18, 25, 29, 26, 34, null, 28, 32, 24, 27, 31]),
        memory: points([42, 43, 45, 44, 47, 48, null, 50, 49, 51, 50, 52]),
        network: points([
          1024,
          3400,
          2800,
          6400,
          2100,
          5400,
          null,
          3000,
          4100,
          5000,
          4400,
          3200,
        ]),
      },
      id: "demo-node-a",
      lastSeenAt: "2026-10-18T11:59:00Z",
      metrics: {
        cpuPercent: 31,
        diskTotalBytes: 85_899_345_920,
        diskUsedBytes: 30_064_771_072,
        memoryTotalBytes: 4_294_967_296,
        memoryUsedBytes: 2_233_382_994,
        networkInBytesPerSecond: 3200,
        networkOutBytesPerSecond: 1800,
        uptimeSeconds: 1_245_600,
      },
      name: text("演示主机 A", "Demo node A"),
      note: text(
        "合成资源曲线，没有连接真实服务器。",
        "Synthetic resource charts; no server connected."
      ),
      os: "Demo Linux",
      provider: text("演示供应商", "Demo provider"),
      region: text("演示区域 A", "Demo region A"),
      renewalCost: { currency: "USD", minor: 6000 },
      sampleWindowSeconds: 60,
      sourceId: "demo-agent",
      tags: ["demo", "web"],
    },
    {
      cpuLabel: "4 vCPU",
      cpuLogicalCores: 4,
      expiresAt: "2026-10-24T00:00:00Z",
      freshness: "stale",
      health: "up",
      history: {
        cpu: points([45, 47, 49, 51, 55, 52, 56, 62, null, null, null, null]),
        memory: points([
          62,
          63,
          62,
          64,
          66,
          65,
          67,
          68,
          null,
          null,
          null,
          null,
        ]),
        network: points([
          4200,
          5100,
          3800,
          6100,
          5600,
          6800,
          5400,
          5200,
          null,
          null,
          null,
          null,
        ]),
      },
      id: "demo-node-b",
      lastSeenAt: "2026-10-18T08:00:00Z",
      metrics: {
        cpuPercent: 62,
        diskTotalBytes: 171_798_691_840,
        diskUsedBytes: 115_105_123_533,
        memoryTotalBytes: 8_589_934_592,
        memoryUsedBytes: 5_841_155_523,
        networkInBytesPerSecond: null,
        networkOutBytesPerSecond: null,
        uptimeSeconds: null,
      },
      name: text("演示主机 B", "Demo node B"),
      note: text(
        "上次状态正常，数据已过期；不推断现在离线。",
        "Last known status was healthy; stale data does not prove it is offline."
      ),
      os: "Demo Linux",
      provider: text("演示供应商", "Demo provider"),
      region: text("演示区域 B", "Demo region B"),
      renewalCost: { currency: "CNY", minor: 9900 },
      sampleWindowSeconds: 60,
      sourceId: "demo-agent-stale",
      tags: ["demo", "archive"],
    },
    {
      cpuLabel: "—",
      cpuLogicalCores: null,
      expiresAt: null,
      freshness: "unavailable",
      health: "unknown",
      history: { cpu: [], memory: [], network: [] },
      id: "demo-node-private",
      lastSeenAt: null,
      metrics: {
        cpuPercent: null,
        diskTotalBytes: null,
        diskUsedBytes: null,
        memoryTotalBytes: null,
        memoryUsedBytes: null,
        networkInBytesPerSecond: null,
        networkOutBytesPerSecond: null,
        uptimeSeconds: null,
      },
      name: text("演示主机 C", "Demo node C"),
      note: text(
        "演示已配置来源不可用，不能据此断言主机离线。",
        "A configured source is unavailable; this does not prove the node is down."
      ),
      os: "—",
      provider: text("待配置", "Not configured"),
      region: text("未设置", "Not set"),
      renewalCost: null,
      sampleWindowSeconds: null,
      sourceId: "demo-agent-missing",
      tags: ["demo"],
    },
  ],
  services: [
    {
      category: "development",
      description: text(
        "等待探测结果确认的合成示例。",
        "A synthetic check awaiting confirmation."
      ),
      events: [],
      fetchedAt: DEMO_NOW,
      freshness: "unknown",
      health: "pending",
      healthHistory: { days: [], expectedSamplesPerDay: 1440 },
      history: [],
      id: "demo-pending-service",
      latencyMs: null,
      monitor: {
        intervalSeconds: 60,
        location: text("演示观测点 A", "Demo observation point A"),
        method: "HTTP",
      },
      name: text("演示检索服务", "Demo search service"),
      observedAt: null,
      serverId: "demo-node-a",
      sourceId: "demo-monitor",
      sourceUpdatedAt: null,
      url: null,
    },
    {
      category: "productivity",
      description: text(
        "用于演示健康状态与延迟历史的笔记服务。",
        "A sample notes service with status and latency history."
      ),
      events: [
        {
          endedAt: "2026-10-17T04:20:00Z",
          id: "demo-notebook-recovery",
          kind: "recovery",
          startedAt: "2026-10-17T04:20:00Z",
          summary: text("演示恢复事件", "Sample recovery event"),
          title: text("服务恢复", "Service recovered"),
        },
      ],
      fetchedAt: DEMO_NOW,
      freshness: "fresh",
      health: "up",
      healthHistory: healthHistory({ 12: { up: 720 }, 89: { down: 10 } }),
      history: points([85, 92, 80, 96, 88, 84, 91, 89, 95, 87, 90, 86]),
      id: "demo-notebook",
      latencyMs: 86,
      monitor: {
        intervalSeconds: 60,
        location: text("演示观测点 A", "Demo observation point A"),
        method: "HTTP",
      },
      name: text("演示笔记服务", "Demo notebook"),
      observedAt: "2026-10-18T11:59:00Z",
      serverId: "demo-node-a",
      sourceId: "demo-monitor",
      sourceUpdatedAt: "2026-10-18T11:59:00Z",
      url: null,
    },
    {
      category: "storage",
      description: text(
        "演示响应变慢，保留服务状态与采集时效的区别。",
        "Demonstrates slow responses while keeping status separate from freshness."
      ),
      events: [
        {
          endedAt: null,
          id: "demo-drive-incident",
          kind: "incident",
          startedAt: "2026-10-18T11:00:00Z",
          summary: text(
            "示例延迟超过预期，等待人工确认。",
            "Sample latency is above expectations; awaiting review."
          ),
          title: text("响应变慢", "Slow responses"),
        },
      ],
      fetchedAt: DEMO_NOW,
      freshness: "fresh",
      health: "degraded",
      healthHistory: healthHistory({
        12: { degraded: 144 },
        30: { down: 216 },
        45: { degraded: 144 },
        78: { degraded: 144 },
      }),
      history: points([
        180, 190, 205, 220, 210, 260, 310, 430, 610, 740, 820, 860,
      ]),
      id: "demo-drive",
      latencyMs: 860,
      monitor: {
        intervalSeconds: 60,
        location: text("演示观测点 A", "Demo observation point A"),
        method: "HTTP",
      },
      name: text("演示文件服务", "Demo drive"),
      observedAt: "2026-10-18T11:59:00Z",
      serverId: "demo-node-a",
      sourceId: "demo-monitor",
      sourceUpdatedAt: "2026-10-18T11:59:00Z",
      url: null,
    },
    {
      category: "development",
      description: text(
        "演示维护窗口，不把计划维护当作采集失败。",
        "A sample maintenance window, separate from collection failures."
      ),
      events: [
        {
          endedAt: "2026-10-18T13:00:00Z",
          id: "demo-code-maintenance",
          kind: "maintenance",
          startedAt: "2026-10-18T11:30:00Z",
          summary: text(
            "固定示例维护时间，未执行真实操作。",
            "Fixed sample window; no real operation performed."
          ),
          title: text("计划维护", "Planned maintenance"),
        },
      ],
      fetchedAt: DEMO_NOW,
      freshness: "fresh",
      health: "maintenance",
      healthHistory: healthHistory({
        20: { degraded: 60 },
        40: { degraded: 60 },
      }),
      history: points([
        120,
        125,
        118,
        121,
        130,
        126,
        124,
        128,
        122,
        125,
        null,
        null,
      ]),
      id: "demo-code",
      latencyMs: null,
      monitor: {
        intervalSeconds: 60,
        location: text("演示观测点 A", "Demo observation point A"),
        method: "HTTP",
      },
      name: text("演示代码服务", "Demo code service"),
      observedAt: "2026-10-18T11:30:00Z",
      serverId: "demo-node-a",
      sourceId: "demo-monitor",
      sourceUpdatedAt: "2026-10-18T11:30:00Z",
      url: null,
    },
    {
      category: "media",
      description: text(
        "上次探测正常，但来源已停止更新。",
        "Last check was healthy, but its source stopped updating."
      ),
      events: [],
      fetchedAt: DEMO_NOW,
      freshness: "stale",
      health: "up",
      healthHistory: healthHistory(
        {
          16: { degraded: 24 },
          42: { down: 48 },
          83: { up: 0 },
          84: { up: 0 },
          85: { up: 0 },
          86: { up: 0 },
          87: { up: 0 },
          88: { up: 0 },
          89: { up: 0 },
        },
        480
      ),
      history: points([
        140,
        146,
        142,
        150,
        148,
        151,
        null,
        null,
        null,
        null,
        null,
        null,
      ]),
      id: "demo-gallery",
      latencyMs: 151,
      monitor: {
        intervalSeconds: 180,
        location: text("演示观测点 B", "Demo observation point B"),
        method: "HTTP",
      },
      name: text("演示相册", "Demo gallery"),
      observedAt: "2026-10-18T06:00:00Z",
      serverId: "demo-node-b",
      sourceId: "demo-monitor-stale",
      sourceUpdatedAt: "2026-10-18T06:00:00Z",
      url: null,
    },
    {
      category: "development",
      description: text(
        "尚未配置监控的服务示例，当前没有观测数据。",
        "A service sample without configured monitoring or observations."
      ),
      events: [],
      fetchedAt: null,
      freshness: "unknown",
      health: "unknown",
      healthHistory: null,
      history: [],
      id: "demo-private-service",
      latencyMs: null,
      monitor: null,
      name: text("演示内部服务", "Demo internal service"),
      observedAt: null,
      serverId: "demo-node-private",
      sourceId: "demo-agent-missing",
      sourceUpdatedAt: null,
      url: null,
    },
  ],
  sources: [
    {
      fetchedAt: DEMO_NOW,
      freshness: "fresh",
      id: "demo-manual",
      kind: "manual",
      name: text("演示手工记录", "Demo manual entries"),
      note: text(
        "合成手工记录，仅用于展示。",
        "Synthetic manual records for display only."
      ),
      observedAt: "2026-10-18T11:00:00Z",
      sourceUpdatedAt: "2026-10-18T11:00:00Z",
    },
    {
      fetchedAt: DEMO_NOW,
      freshness: "fresh",
      id: "demo-wearable",
      kind: "wearable",
      name: text("演示可穿戴数据", "Demo wearable data"),
      note: text(
        "未连接设备或健康平台。",
        "No device or health platform connected."
      ),
      observedAt: DEMO_NOW,
      sourceUpdatedAt: DEMO_NOW,
    },
    {
      fetchedAt: DEMO_NOW,
      freshness: "fresh",
      id: "demo-monitor",
      kind: "monitor",
      name: text("演示服务监测", "Demo service monitor"),
      note: text(
        "固定响应样本，不发起网络探测。",
        "Fixed samples; no network probes."
      ),
      observedAt: "2026-10-18T11:59:00Z",
      sourceUpdatedAt: "2026-10-18T11:59:00Z",
    },
    {
      fetchedAt: DEMO_NOW,
      freshness: "stale",
      id: "demo-monitor-stale",
      kind: "monitor",
      name: text("演示过期监测", "Demo stale monitor"),
      note: text(
        "抓取时间与测量时间不同。",
        "Fetch time differs from observation time."
      ),
      observedAt: "2026-10-18T06:00:00Z",
      sourceUpdatedAt: "2026-10-18T06:00:00Z",
    },
    {
      fetchedAt: DEMO_NOW,
      freshness: "fresh",
      id: "demo-agent",
      kind: "agent",
      name: text("演示主机探针", "Demo host agent"),
      note: text(
        "没有安装或连接实际探针。",
        "No real agent installed or connected."
      ),
      observedAt: "2026-10-18T11:59:00Z",
      sourceUpdatedAt: "2026-10-18T11:59:00Z",
    },
    {
      fetchedAt: DEMO_NOW,
      freshness: "stale",
      id: "demo-agent-stale",
      kind: "agent",
      name: text("演示过期探针", "Demo stale agent"),
      note: text("仅显示上次已知值。", "Showing last known values only."),
      observedAt: "2026-10-18T08:00:00Z",
      sourceUpdatedAt: "2026-10-18T08:00:00Z",
    },
    {
      fetchedAt: null,
      freshness: "unavailable",
      id: "demo-agent-missing",
      kind: "agent",
      name: text("演示未连接来源", "Demo unconnected source"),
      note: text(
        "未配置真实地址或凭证。",
        "No real endpoint or credentials configured."
      ),
      observedAt: null,
      sourceUpdatedAt: null,
    },
  ],
  timeZone: DEMO_TIME_ZONE,
});
