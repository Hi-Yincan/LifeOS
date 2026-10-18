import { type ReactNode } from "react";
import { type DashboardViewProps } from "components/apps/Dashboard/model";
import {
  ActionButton,
  Muted,
  Notice,
  SectionHeading,
} from "components/apps/Dashboard/shared";
import ActivityPanel from "components/apps/Dashboard/views/Personal/ActivityPanel";
import CheckupsPanel from "components/apps/Dashboard/views/Personal/CheckupsPanel";
import {
  getPersonalTab,
  tabs,
} from "components/apps/Dashboard/views/Personal/common";
import HealthPanel from "components/apps/Dashboard/views/Personal/HealthPanel";
import LocationPanel from "components/apps/Dashboard/views/Personal/LocationPanel";
import { PersonalLayout } from "components/apps/Dashboard/views/Personal/styles";

const PersonalContent = (props: DashboardViewProps): ReactNode => {
  const { data, locale, onNavigate, selectedId } = props;
  const tab = getPersonalTab(data.personal, selectedId);
  const tabLabel = tabs.find(({ id }) => id === tab)?.label[locale];
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

  return (
    <PersonalLayout>
      <SectionHeading>
        <h2>{tabLabel}</h2>
        <Muted>{zh ? "个人状况" : "Personal status"}</Muted>
      </SectionHeading>
      {!found && (
        <Notice role="status">
          {zh ? "找不到这条示例记录。" : "This sample record does not exist."}{" "}
          <ActionButton
            onClick={() => onNavigate("personal", tab)}
            type="button"
          >
            {zh ? "查看记录" : "View records"}
          </ActionButton>
        </Notice>
      )}
      {tab === "activity" && <ActivityPanel {...props} />}
      {tab === "location" && <LocationPanel {...props} />}
      {tab === "health" && <HealthPanel {...props} />}
      {tab === "checkups" && <CheckupsPanel {...props} />}
    </PersonalLayout>
  );
};

const Personal = (props: DashboardViewProps): ReactNode => (
  <PersonalContent key={props.selectedId || "activity"} {...props} />
);

export default Personal;
