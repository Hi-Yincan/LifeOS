/* eslint-disable unicorn/no-null -- 空值沿用看板模型的 null 语义。 */
import { type ReactNode, useEffect, useState } from "react";
import {
  type ActivityRecord,
  type DashboardDemoData,
  type DashboardLocale,
  type DashboardViewProps,
  type ScheduleEvent,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  Card,
  Field,
  Notice,
  SectionHeading,
  Stack,
  Toolbar,
} from "components/apps/Dashboard/shared";
import { type EditTarget } from "components/apps/Dashboard/views/Personal/common";

type Draft = {
  category: ActivityRecord["category"];
  date: string;
  end: string;
  note: string;
  start: string;
  status: ScheduleEvent["status"];
  title: string;
  values: string[];
};
const makeDraft = (
  data: DashboardDemoData,
  target: EditTarget,
  locale: DashboardLocale
): Draft => {
  const activity = data.personal.activities.find(
    ({ id }) => target.kind === "activity" && id === target.id
  );
  const event = data.personal.schedule.find(
    ({ id }) => target.kind === "schedule" && id === target.id
  );
  const health = data.personal.health.find(
    ({ id }) => target.kind === "health" && id === target.id
  );
  const checkup = data.personal.checkups.find(
    ({ id }) => target.kind === "checkup" && id === target.id
  );
  const title =
    activity?.title ||
    event?.title ||
    checkup?.title ||
    (target.kind === "location"
      ? data.personal.location?.label
      : health?.label);

  return {
    category: activity?.category || "focus",
    date: checkup?.date || "",
    end: (activity?.endedAt || event?.endsAt || "").slice(0, 16),
    note: checkup?.note[locale] || "",
    start: (activity?.startedAt || event?.startsAt || "").slice(0, 16),
    status: event?.status || "planned",
    title: title?.[locale] || "",
    values: checkup
      ? checkup.items.map(({ value }) => (value === null ? "" : String(value)))
      : [
          health?.value === null || health?.value === undefined
            ? ""
            : String(health.value),
        ],
  };
};

const Editor = ({
  data,
  locale,
  onClose,
  onDirtyChange,
  onUpdate,
  target,
}: DashboardViewProps & {
  onClose: (saved: boolean) => void;
  target: EditTarget;
}): ReactNode => {
  const [form, setForm] = useState(() => {
    const initial = makeDraft(data, target, locale);

    return { draft: initial, editingLocale: locale, initial };
  });
  const { draft, editingLocale, initial } = form;
  const [error, setError] = useState("");
  const zh = locale === "zh";
  const checkup = data.personal.checkups.find(({ id }) => id === target.id);
  const metric = data.personal.health.find(({ id }) => id === target.id);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const change = (patch: Partial<Draft>): void => {
    const next = { ...draft, ...patch };

    setForm((previous) => ({ ...previous, draft: next }));
    setError("");
    onDirtyChange?.(JSON.stringify(next) !== JSON.stringify(initial));
  };

  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const save = (): void => {
    const values = draft.values.map((value) =>
      value.trim() === "" ? null : Number(value)
    );
    const start = draft.start ? Date.parse(`${draft.start}:00Z`) : Number.NaN;
    const end = draft.end ? Date.parse(`${draft.end}:00Z`) : null;

    if (target.kind !== "health" && !draft.title.trim()) {
      setError(zh ? "请填写标题或位置。" : "Enter a title or location.");
      return;
    }
    if (
      (target.kind === "activity" || target.kind === "schedule") &&
      (!Number.isFinite(start) ||
        (end !== null && (!Number.isFinite(end) || end <= start)) ||
        (target.kind === "schedule" && end === null))
    ) {
      setError(
        zh
          ? "请填写有效时间，结束时间必须晚于开始。"
          : "Enter valid times; the end must follow the start."
      );
      return;
    }
    if (
      target.kind === "activity" &&
      (start > Date.parse(data.now) ||
        (end !== null && end > Date.parse(data.now)))
    ) {
      setError(
        zh
          ? "活动记录不能晚于示例时钟。"
          : "Recorded activity cannot be later than the demo clock."
      );
      return;
    }
    if (
      values.some(
        (value) =>
          value !== null &&
          (!Number.isFinite(value) || (target.kind === "health" && value < 0))
      )
    ) {
      setError(
        zh
          ? "请填写有效数值；健康示例数值不能为负。"
          : "Enter valid numbers; health sample values cannot be negative."
      );
      return;
    }
    if (
      target.kind === "checkup" &&
      (!draft.date || !Number.isFinite(Date.parse(draft.date)))
    ) {
      setError(zh ? "请填写有效的检查日期。" : "Enter a valid checkup date.");
      return;
    }
    onUpdate((previous) => {
      const personal = { ...previous.personal };

      if (target.kind === "activity") {
        personal.activities = personal.activities.map((item) =>
          item.id === target.id
            ? {
                ...item,
                category: draft.category,
                endedAt: end === null ? null : new Date(end).toISOString(),
                startedAt: new Date(start).toISOString(),
                title: { ...item.title, [editingLocale]: draft.title.trim() },
              }
            : item
        );
      }
      if (target.kind === "schedule") {
        personal.schedule = personal.schedule.map((item) =>
          item.id === target.id
            ? {
                ...item,
                endsAt: new Date(end as number).toISOString(),
                startsAt: new Date(start).toISOString(),
                status: draft.status,
                title: { ...item.title, [editingLocale]: draft.title.trim() },
              }
            : item
        );
      }
      if (target.kind === "location" && personal.location) {
        personal.location = {
          ...personal.location,
          label: {
            ...personal.location.label,
            [editingLocale]: draft.title.trim(),
          },
        };
      }
      if (target.kind === "health") {
        personal.health = personal.health.map((item) => {
          if (item.id !== target.id) return item;

          const at =
            item.observedAt ||
            new Date(Date.parse(previous.now) - 60_000).toISOString();
          const value = values[0];
          const points = [
            ...item.points.filter(
              (point) => Date.parse(point.at) !== Date.parse(at)
            ),
            { at, value },
          ].sort((first, second) => first.at.localeCompare(second.at));

          return {
            ...item,
            freshness: value === null ? "unknown" : "fresh",
            note: {
              en: "Manually edited synthetic sample.",
              zh: "手动修改的合成样本。",
            },
            observedAt: at,
            points,
            sourceId: "demo-manual",
            value,
          };
        });
      }
      if (target.kind === "checkup") {
        personal.checkups = personal.checkups.map((item) =>
          item.id === target.id
            ? {
                ...item,
                date: draft.date,
                items: item.items.map((entry, index) => ({
                  ...entry,
                  value: values[index],
                })),
                note: { ...item.note, [editingLocale]: draft.note },
                title: { ...item.title, [editingLocale]: draft.title.trim() },
              }
            : item
        );
      }
      return { ...previous, personal };
    });
    onDirtyChange?.(false);
    onClose(true);
  };

  return (
    <Card>
      <form
        aria-label={zh ? "编辑个人示例" : "Edit personal sample"}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Stack>
          <SectionHeading>
            <h3>
              {zh ? "编辑示例" : "Edit sample"} · {initial.title}
            </h3>
            <span>
              {dirty
                ? zh
                  ? "有未保存修改"
                  : "Unsaved changes"
                : zh
                  ? "尚未修改"
                  : "Unchanged"}
            </span>
          </SectionHeading>
          <Notice>
            {zh
              ? "只修改本窗口的合成记录，关闭应用后重置。当前编辑文字语言："
              : "Edits affect this window's synthetic records and reset when the app closes. Text language: "}
            {editingLocale === "zh"
              ? zh
                ? "中文"
                : "Chinese"
              : zh
                ? "英文"
                : "English"}
            {zh
              ? "。切换界面语言会保留草稿和编辑语言。"
              : ". Changing the interface language preserves the draft and its text language."}
          </Notice>
          {target.kind !== "health" && (
            <Field>
              {target.kind === "location"
                ? zh
                  ? "位置名称"
                  : "Location name"
                : zh
                  ? "标题"
                  : "Title"}
              <input
                maxLength={120}
                onChange={(event) => change({ title: event.target.value })}
                value={draft.title}
                required
              />
            </Field>
          )}
          {(target.kind === "activity" || target.kind === "schedule") && (
            <>
              <Field>
                {zh ? "开始时间（UTC）" : "Start (UTC)"}
                <input
                  onChange={(event) => change({ start: event.target.value })}
                  type="datetime-local"
                  value={draft.start}
                  required
                />
              </Field>
              <Field>
                {target.kind === "activity"
                  ? zh
                    ? "结束时间（UTC，留空表示进行中）"
                    : "End (UTC; blank means ongoing)"
                  : zh
                    ? "结束时间（UTC）"
                    : "End (UTC)"}
                <input
                  onChange={(event) => change({ end: event.target.value })}
                  required={target.kind === "schedule"}
                  type="datetime-local"
                  value={draft.end}
                />
              </Field>
            </>
          )}
          {target.kind === "activity" && (
            <Field>
              {zh ? "活动类别" : "Activity category"}
              <select
                onChange={(event) =>
                  change({
                    category: event.target.value as ActivityRecord["category"],
                  })
                }
                value={draft.category}
              >
                <option value="focus">{zh ? "专注" : "Focus"}</option>
                <option value="learning">{zh ? "学习" : "Learning"}</option>
                <option value="break">{zh ? "休息" : "Break"}</option>
                <option value="offline">{zh ? "离线" : "Offline"}</option>
              </select>
            </Field>
          )}
          {target.kind === "schedule" && (
            <Field>
              {zh ? "日程状态" : "Event status"}
              <select
                onChange={(event) =>
                  change({
                    status: event.target.value as ScheduleEvent["status"],
                  })
                }
                value={draft.status}
              >
                <option value="planned">{zh ? "计划中" : "Planned"}</option>
                <option value="done">{zh ? "已完成" : "Done"}</option>
                <option value="cancelled">{zh ? "已取消" : "Cancelled"}</option>
              </select>
            </Field>
          )}
          {target.kind === "health" && (
            <Field>
              {metric?.label[locale]} ({metric?.unit}) ·{" "}
              {zh ? "留空表示未提供" : "Leave blank for missing"}
              <input
                min="0"
                onChange={(event) => change({ values: [event.target.value] })}
                step="any"
                type="number"
                value={draft.values[0]}
              />
            </Field>
          )}
          {target.kind === "checkup" && (
            <>
              <Field>
                {zh ? "检查日期" : "Checkup date"}
                <input
                  onChange={(event) => change({ date: event.target.value })}
                  type="date"
                  value={draft.date}
                  required
                />
              </Field>
              {checkup?.items.map((item, index) => (
                <Field key={item.label.en}>
                  {item.label[locale]} {item.unit} ·{" "}
                  {zh ? "留空表示未提供" : "Leave blank for missing"}
                  <input
                    onChange={(event) =>
                      change({
                        values: draft.values.map((value, itemIndex) =>
                          itemIndex === index ? event.target.value : value
                        ),
                      })
                    }
                    step="any"
                    type="number"
                    value={draft.values[index]}
                  />
                </Field>
              ))}
              <Field>
                {zh ? "记录备注" : "Record note"}
                <textarea
                  maxLength={500}
                  onChange={(event) => change({ note: event.target.value })}
                  value={draft.note}
                />
              </Field>
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <Toolbar>
            <button disabled={!dirty} type="submit">
              {zh ? "保存示例" : "Save sample"}
            </button>
            <ActionButton
              onClick={() => {
                onDirtyChange?.(false);
                onClose(false);
              }}
              type="button"
            >
              {dirty
                ? zh
                  ? "放弃修改"
                  : "Discard changes"
                : zh
                  ? "取消"
                  : "Cancel"}
            </ActionButton>
          </Toolbar>
        </Stack>
      </form>
    </Card>
  );
};

export default Editor;
