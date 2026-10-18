import { type ReactNode } from "react";
import {
  ActionButton,
  Card,
  EmptyState,
  formatDateTime,
  Muted,
  Section,
  SectionHeading,
  Split,
  Stack,
} from "components/apps/Dashboard/shared";
import {
  type PanelProps,
  SourceLine,
} from "components/apps/Dashboard/views/Personal/common";
import {
  RecordList,
  RouteDiagram,
} from "components/apps/Dashboard/views/Personal/styles";

const LocationPanel = ({
  data,
  locale,
  onEdit,
  onNavigate,
  previewMode,
  selectedId,
}: PanelProps): ReactNode => {
  const zh = locale === "zh";
  const { location, route } = data.personal;
  const selected = route.find(({ id }) => id === selectedId);

  return (
    <Section aria-label={zh ? "位置与轨迹" : "Location and route"}>
      <Card>
        <Stack>
          <SectionHeading>
            <h3>{zh ? "示例位置" : "Sample location"}</h3>
            {location && previewMode !== "visitor" && (
              <ActionButton
                onClick={() => onEdit({ id: "location", kind: "location" })}
                type="button"
              >
                {zh ? "编辑位置示例" : "Edit sample location"}
              </ActionButton>
            )}
          </SectionHeading>
          {location ? (
            <>
              <p>{location.label[locale]}</p>
              <Muted>
                {formatDateTime(location.observedAt, locale, data.timeZone)} ·{" "}
                {data.timeZone}
              </Muted>
              <SourceLine
                data={data}
                locale={locale}
                sourceId={location.sourceId}
              />
            </>
          ) : (
            <EmptyState title={zh ? "暂无位置记录" : "No location records"} />
          )}
        </Stack>
      </Card>
      {route.length > 0 ? (
        <Split>
          <Card>
            <Stack>
              <h3>{zh ? "路线示意" : "Route sketch"}</h3>
              <RouteDiagram
                aria-label={
                  zh ? "合成地点序列示意图" : "Synthetic location sequence"
                }
                role="img"
                viewBox="0 0 300 200"
              >
                <title>
                  {zh
                    ? "示意坐标，不是地理位置"
                    : "Schematic coordinates, not geographic locations"}
                </title>
                <path
                  d="M0 50H300M0 100H300M0 150H300M60 0V200M120 0V200M180 0V200M240 0V200"
                  fill="none"
                  stroke="var(--hyc-line)"
                  strokeOpacity="0.4"
                />
                <polyline
                  fill="none"
                  points={route
                    .map(({ x, y }) => `${x * 3},${y * 2}`)
                    .join(" ")}
                  stroke="var(--hyc-muted)"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                {route.map((point, index) => (
                  <g key={point.id}>
                    <circle
                      cx={point.x * 3}
                      cy={point.y * 2}
                      fill={
                        selectedId === point.id
                          ? "var(--hyc-accent)"
                          : "var(--hyc-muted)"
                      }
                      r="5"
                    />
                    <text
                      fill="var(--hyc-text)"
                      fontSize="11"
                      x={point.x * 3 + 8}
                      y={point.y * 2 - 7}
                    >
                      {index + 1}
                    </text>
                  </g>
                ))}
              </RouteDiagram>
              <Muted>
                {zh
                  ? "只表示虚构地点顺序，没有地理坐标、地图或定位请求。"
                  : "Only a fictional sequence; no coordinates, map service or location request."}
              </Muted>
            </Stack>
          </Card>
          <Card>
            <Stack>
              <h3>{zh ? "地点记录" : "Location records"}</h3>
              <RecordList>
                {route.map((point, index) => (
                  <li key={point.id}>
                    <ActionButton
                      aria-pressed={selectedId === point.id}
                      onClick={() => onNavigate("personal", point.id)}
                      type="button"
                    >
                      {index + 1}. {point.label[locale]}
                    </ActionButton>
                    <Muted>
                      {formatDateTime(point.at, locale, data.timeZone)}
                    </Muted>
                  </li>
                ))}
              </RecordList>
              {selected && (
                <p role="status">
                  {zh ? "所选地点：" : "Selected location: "}
                  {selected.label[locale]} ·{" "}
                  {formatDateTime(selected.at, locale, data.timeZone)}
                </p>
              )}
            </Stack>
          </Card>
        </Split>
      ) : (
        <EmptyState title={zh ? "暂无轨迹点" : "No route points"} />
      )}
    </Section>
  );
};

export default LocationPanel;
