import { type ReactNode, useState } from "react";
import { type DashboardViewProps } from "components/apps/Dashboard/model";
import {
  ActionButton,
  Notice,
  SectionHeading,
  Toolbar,
} from "components/apps/Dashboard/shared";
import ActivityPanel from "components/apps/Dashboard/views/Personal/ActivityPanel";
import CheckupsPanel from "components/apps/Dashboard/views/Personal/CheckupsPanel";
import {
  type EditTarget,
  getPersonalTab,
  tabs,
} from "components/apps/Dashboard/views/Personal/common";
import Editor from "components/apps/Dashboard/views/Personal/Editor";
import HealthPanel from "components/apps/Dashboard/views/Personal/HealthPanel";
import LocationPanel from "components/apps/Dashboard/views/Personal/LocationPanel";
import PrivacyPreview from "components/apps/Dashboard/views/Personal/PrivacyPreview";
import { PersonalLayout } from "components/apps/Dashboard/views/Personal/styles";

const PersonalContent = (props: DashboardViewProps): ReactNode => {
  const { data, locale, onNavigate, previewMode, selectedId } = props;
  const [editing, setEditing] = useState<EditTarget>();
  const [notice, setNotice] = useState("");
  const tab = getPersonalTab(data.personal, selectedId);
  const found =
    !selectedId ||
    tabs.some(({ id }) => id === selectedId) ||
    [
      ...data.personal.activities,
      ...data.personal.schedule,
      ...data.personal.checkups,
      ...data.personal.health,
      ...data.personal.route,
    ].some(({ id }) => id === selectedId);
  const zh = locale === "zh";
  const onEdit = (target: EditTarget): void => {
    if (previewMode === "visitor") return;
    setNotice("");
    setEditing(target);
  };
  const panelProps = { ...props, onEdit };

  return (
    <PersonalLayout>
      <SectionHeading>
        <h2>{zh ? "个人状况" : "Personal status"}</h2>
      </SectionHeading>
      <Toolbar aria-label={zh ? "个人状况视图" : "Personal views"}>
        {tabs.map(({ id, label }) => (
          <ActionButton
            key={id}
            aria-pressed={tab === id}
            onClick={() => onNavigate("personal", id)}
            type="button"
          >
            {label[locale]}
          </ActionButton>
        ))}
      </Toolbar>
      {!found && (
        <Notice role="status">
          {zh
            ? "该记录不在当前预览中，可能已被隐藏或超出时间范围。"
            : "This record is not in the current preview; it may be hidden or outside its time window."}{" "}
          <ActionButton
            onClick={() => onNavigate("personal", tab)}
            type="button"
          >
            {zh ? "查看可见记录" : "View available records"}
          </ActionButton>
        </Notice>
      )}
      {notice && <Notice role="status">{notice}</Notice>}
      {editing && previewMode !== "visitor" ? (
        <Editor
          {...props}
          onClose={(saved) => {
            setEditing(undefined);
            setNotice(
              saved
                ? zh
                  ? "已保存本窗口示例，未同步或发布。"
                  : "Sample saved in this window; nothing synced or published."
                : zh
                  ? "已取消编辑，示例记录未改变。"
                  : "Edit cancelled; sample record unchanged."
            );
          }}
          target={editing}
        />
      ) : (
        <>
          {tab === "activity" && <ActivityPanel {...panelProps} />}
          {tab === "location" && <LocationPanel {...panelProps} />}
          {tab === "health" && <HealthPanel {...panelProps} />}
          {tab === "checkups" && <CheckupsPanel {...panelProps} />}
          <PrivacyPreview {...props} />
        </>
      )}
    </PersonalLayout>
  );
};

const Personal = (props: DashboardViewProps): ReactNode => (
  <PersonalContent
    key={`${props.previewMode || "all"}-${props.selectedId || "activity"}`}
    {...props}
  />
);

export default Personal;
