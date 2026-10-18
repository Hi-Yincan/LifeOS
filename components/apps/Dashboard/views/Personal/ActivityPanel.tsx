import { type ReactNode, useState } from "react";
import {
  ActionButton,
  Card,
  EmptyState,
  Field,
  formatDateTime,
  formatDuration,
  Muted,
  Section,
  SectionHeading,
  Split,
  Stack,
  StatusBadge,
  Toolbar,
} from "components/apps/Dashboard/shared";
import {
  type PanelProps,
  SourceLine,
} from "components/apps/Dashboard/views/Personal/common";
import {
  DetailsGrid,
  RecordList,
} from "components/apps/Dashboard/views/Personal/styles";

const ActivityPanel = ({
  data,
  locale,
  onEdit,
  onNavigate,
  previewMode,
  selectedId,
}: PanelProps): ReactNode => {
  const [range, setRange] = useState("all");
  const zh = locale === "zh";
  const today = data.now.slice(0, 10);
  const activities = data.personal.activities.filter(
    ({ startedAt }) => range === "all" || startedAt.startsWith(today)
  );
  const schedule = data.personal.schedule.filter(
    ({ startsAt }) => range === "all" || startsAt.startsWith(today)
  );
  const selectedActivity = data.personal.activities.find(
    ({ id }) => id === selectedId
  );
  const selectedSchedule = data.personal.schedule.find(
    ({ id }) => id === selectedId
  );
  const format = (at: string): string =>
    formatDateTime(at, locale, data.timeZone);
  const categories = zh
    ? { break: "休息", focus: "专注", learning: "学习", offline: "离线" }
    : {
        break: "Break",
        focus: "Focus",
        learning: "Learning",
        offline: "Offline",
      };
  const statuses = zh
    ? { cancelled: "已取消", done: "已完成", planned: "计划中" }
    : { cancelled: "Cancelled", done: "Done", planned: "Planned" };

  return (
    <Section aria-label={zh ? "活动与日程" : "Activity and schedule"}>
      <Toolbar>
        <Field>
          {zh ? "显示范围" : "Show"}
          <select
            onChange={(event) => setRange(event.target.value)}
            value={range}
          >
            <option value="all">{zh ? "全部示例" : "All samples"}</option>
            <option value="today">{zh ? "示例今日" : "Demo today"}</option>
          </select>
        </Field>
        <Muted>
          {zh ? "按示例时钟显示，时间使用 " : "Using the demo clock, in "}
          {data.timeZone}
        </Muted>
      </Toolbar>
      <Split>
        <Card>
          <Stack>
            <h3>{zh ? "活动记录" : "Activity log"}</h3>
            {activities.length === 0 ? (
              <EmptyState
                title={zh ? "此范围暂无活动" : "No activity in this range"}
              />
            ) : (
              <RecordList>
                {activities.map((item) => (
                  <li key={item.id}>
                    <Toolbar>
                      <ActionButton
                        aria-pressed={selectedId === item.id}
                        onClick={() => onNavigate("personal", item.id)}
                        type="button"
                      >
                        {item.title[locale]}
                      </ActionButton>
                      <StatusBadge label={categories[item.category]} />
                    </Toolbar>
                    <Muted>
                      {format(item.startedAt)} –{" "}
                      {item.endedAt
                        ? format(item.endedAt)
                        : zh
                          ? "示例进行中"
                          : "Ongoing in demo"}
                    </Muted>
                  </li>
                ))}
              </RecordList>
            )}
          </Stack>
        </Card>
        <Card>
          <Stack>
            <h3>{zh ? "日程安排" : "Schedule"}</h3>
            <Muted>
              {zh
                ? "合成日历计划；未来安排不代表已经发生。"
                : "Synthetic calendar plans; future events have not happened."}
            </Muted>
            {schedule.length === 0 ? (
              <EmptyState
                title={zh ? "此范围暂无日程" : "No events in this range"}
              />
            ) : (
              <RecordList>
                {schedule.map((item) => (
                  <li key={item.id}>
                    <Toolbar>
                      <ActionButton
                        aria-pressed={selectedId === item.id}
                        onClick={() => onNavigate("personal", item.id)}
                        type="button"
                      >
                        {item.title[locale]}
                      </ActionButton>
                      <StatusBadge label={statuses[item.status]} />
                    </Toolbar>
                    <Muted>
                      {format(item.startsAt)} – {format(item.endsAt)}
                    </Muted>
                  </li>
                ))}
              </RecordList>
            )}
          </Stack>
        </Card>
      </Split>
      {selectedActivity && (
        <Card>
          <Stack>
            <SectionHeading>
              <h3>{selectedActivity.title[locale]}</h3>
              {previewMode !== "visitor" && (
                <ActionButton
                  onClick={() =>
                    onEdit({ id: selectedActivity.id, kind: "activity" })
                  }
                  type="button"
                >
                  {zh ? "编辑活动示例" : "Edit sample activity"}
                </ActionButton>
              )}
            </SectionHeading>
            <DetailsGrid>
              <dt>{zh ? "类别" : "Category"}</dt>
              <dd>{categories[selectedActivity.category]}</dd>
              <dt>{zh ? "时长" : "Duration"}</dt>
              <dd>
                {formatDuration(
                  (Date.parse(selectedActivity.endedAt || data.now) -
                    Date.parse(selectedActivity.startedAt)) /
                    1000,
                  locale
                )}
              </dd>
              <dt>{zh ? "开始" : "Start"}</dt>
              <dd>{format(selectedActivity.startedAt)}</dd>
              <dt>{zh ? "结束" : "End"}</dt>
              <dd>
                {selectedActivity.endedAt
                  ? format(selectedActivity.endedAt)
                  : zh
                    ? "截至示例时钟仍在进行"
                    : "Ongoing at the demo clock"}
              </dd>
            </DetailsGrid>
            <SourceLine
              data={data}
              locale={locale}
              sourceId={selectedActivity.sourceId}
            />
          </Stack>
        </Card>
      )}
      {selectedSchedule && (
        <Card>
          <Stack>
            <SectionHeading>
              <h3>{selectedSchedule.title[locale]}</h3>
              {previewMode !== "visitor" && (
                <ActionButton
                  onClick={() =>
                    onEdit({ id: selectedSchedule.id, kind: "schedule" })
                  }
                  type="button"
                >
                  {zh ? "编辑日程示例" : "Edit sample event"}
                </ActionButton>
              )}
            </SectionHeading>
            <DetailsGrid>
              <dt>{zh ? "状态" : "Status"}</dt>
              <dd>{statuses[selectedSchedule.status]}</dd>
              <dt>{zh ? "开始" : "Start"}</dt>
              <dd>{format(selectedSchedule.startsAt)}</dd>
              <dt>{zh ? "结束" : "End"}</dt>
              <dd>{format(selectedSchedule.endsAt)}</dd>
              <dt>{zh ? "地点" : "Location"}</dt>
              <dd>
                {selectedSchedule.location?.[locale] ||
                  (zh ? "未填写" : "Not specified")}
              </dd>
            </DetailsGrid>
            <Muted>
              {zh
                ? "来源：合成日历记录，未连接日历服务。"
                : "Source: synthetic calendar record; no calendar connected."}
            </Muted>
          </Stack>
        </Card>
      )}
    </Section>
  );
};

export default ActivityPanel;
