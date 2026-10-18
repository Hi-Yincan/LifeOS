import { type ReactNode, useState } from "react";
import {
  ActionButton,
  Card,
  DataTable,
  EmptyState,
  Field,
  formatDate,
  formatNumber,
  Muted,
  Section,
  SectionHeading,
  Stack,
  Toolbar,
} from "components/apps/Dashboard/shared";
import { type PanelProps } from "components/apps/Dashboard/views/Personal/common";
import { TableScroll } from "components/apps/Dashboard/views/Personal/styles";

const CheckupsPanel = ({
  data,
  locale,
  onEdit,
  onNavigate,
  previewMode,
  selectedId,
}: PanelProps): ReactNode => {
  const [filter, setFilter] = useState("all");
  const zh = locale === "zh";
  const records = data.personal.checkups.filter(
    ({ type }) => filter === "all" || type === filter
  );
  const selected = records.find(({ id }) => id === selectedId) || records[0];

  return (
    <Section aria-label={zh ? "检查记录" : "Checkup records"}>
      <Toolbar>
        <Field>
          {zh ? "检查类型" : "Checkup type"}
          <select
            onChange={(event) => setFilter(event.target.value)}
            value={filter}
          >
            <option value="all">{zh ? "全部" : "All"}</option>
            <option value="blood">{zh ? "血液检查" : "Blood test"}</option>
            <option value="vision">{zh ? "视力检查" : "Vision check"}</option>
            <option value="general">
              {zh ? "综合检查" : "General checkup"}
            </option>
          </select>
        </Field>
      </Toolbar>
      <Toolbar>
        {records.map((record) => (
          <ActionButton
            key={record.id}
            aria-pressed={selected?.id === record.id}
            onClick={() => onNavigate("personal", record.id)}
            type="button"
          >
            {record.title[locale]} ·{" "}
            {formatDate(record.date, locale, data.timeZone)}
          </ActionButton>
        ))}
      </Toolbar>
      {selected ? (
        <Card>
          <Stack>
            <SectionHeading>
              <h3>{selected.title[locale]}</h3>
              {previewMode !== "visitor" && (
                <ActionButton
                  onClick={() => onEdit({ id: selected.id, kind: "checkup" })}
                  type="button"
                >
                  {zh ? "编辑检查示例" : "Edit sample checkup"}
                </ActionButton>
              )}
            </SectionHeading>
            <Muted>
              {formatDate(selected.date, locale, data.timeZone)} ·{" "}
              {zh ? "来源：合成手工记录" : "Source: synthetic manual record"}
            </Muted>
            <TableScroll>
              <DataTable>
                <caption>
                  {zh
                    ? "记录项目与来源说明"
                    : "Recorded items and source notes"}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{zh ? "项目" : "Item"}</th>
                    <th scope="col">{zh ? "结果" : "Value"}</th>
                    <th scope="col">
                      {zh ? "来源原文（示例）" : "Source wording (sample)"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item) => (
                    <tr key={item.label.en}>
                      <td>{item.label[locale]}</td>
                      <td>
                        {item.value === null
                          ? zh
                            ? "未提供"
                            : "Not provided"
                          : `${formatNumber(item.value, locale)} ${item.unit}`}
                      </td>
                      <td>{item.reference[locale]}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </TableScroll>
            <p>{selected.note[locale]}</p>
            <Muted>
              {zh
                ? "没有真实报告附件；数值与原文仅用于展示，不生成健康评估。"
                : "No real report attachment; values and wording demonstrate records without a health assessment."}
            </Muted>
          </Stack>
        </Card>
      ) : (
        <EmptyState
          description={
            zh
              ? "请选择其他检查类型，或返回全部示例调整公开范围。"
              : "Choose another checkup type, or return to all samples to change preview rules."
          }
          title={zh ? "没有符合条件的检查记录" : "No matching checkup records"}
        />
      )}
    </Section>
  );
};

export default CheckupsPanel;
