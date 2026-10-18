import { useEffect, useState } from "react";
import {
  type DashboardViewProps,
  type Membership,
  type Money,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  Card,
  CardGrid,
  DataTable,
  EmptyState,
  Field,
  formatDate,
  formatMoney,
  Metric,
  MetricGrid,
  Muted,
  Notice,
  safeExternalUrl,
  Section,
  SectionHeading,
  Split,
  Stack,
  StatusBadge,
  summarizeMemberships,
  sumMoneyByCurrency,
  Toolbar,
} from "components/apps/Dashboard/shared";
import Editor from "components/apps/Dashboard/views/Memberships/Editor";
import {
  confirmPayment,
  decideRenewal,
  filterMemberships,
  type MembershipSort,
} from "components/apps/Dashboard/views/Memberships/functions";
import {
  autopay,
  categories,
  cycles,
  entitlements,
  messages,
  renewals,
} from "components/apps/Dashboard/views/Memberships/messages";
import PaymentEditor from "components/apps/Dashboard/views/Memberships/PaymentEditor";
import {
  Facts,
  MemberCard,
  MoneyList,
} from "components/apps/Dashboard/views/Memberships/styles";

const Memberships = ({
  data,
  locale,
  onDirtyChange,
  onNavigate,
  onUpdate,
  previewMode = "all",
  selectedId,
}: DashboardViewProps): React.ReactNode => {
  const t = messages[locale];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"" | Membership["category"]>("");
  const [sort, setSort] = useState<MembershipSort>("date");
  const [editingId, setEditingId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [decision, setDecision] = useState<{
    id: string;
    status: "active" | "cancelled" | "paused";
  }>();
  const [notice, setNotice] = useState<"" | keyof typeof messages.en>("");
  const activeDecision =
    decision?.id === selectedId ? decision?.status : undefined;
  const selected = data.memberships.find(({ id }) => id === selectedId);
  const edited = data.memberships.find(({ id }) => id === editingId);
  const payer = data.memberships.find(({ id }) => id === paymentId);
  const readonly = previewMode === "visitor";
  const summary = summarizeMemberships(data.memberships, data.now);
  const visible = filterMemberships(
    data.memberships,
    search,
    category,
    sort,
    locale
  );
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  const totals = (amounts: Money[], empty?: string): React.ReactNode =>
    amounts.length > 0 ? (
      <MoneyList>
        {amounts.map((amount) => (
          <span key={amount.currency}>{formatMoney(amount, locale)}</span>
        ))}
      </MoneyList>
    ) : (
      empty || t.notSet
    );
  const updateItem = (item: Membership): boolean => {
    const next = data.memberships.some(({ id }) => id === item.id)
      ? data.memberships.map((value) => (value.id === item.id ? item : value))
      : [...data.memberships, item];
    try {
      summarizeMemberships(next, data.now);
    } catch {
      return false;
    }
    onUpdate((previous) => ({
      ...previous,
      memberships: previous.memberships.some(({ id }) => id === item.id)
        ? previous.memberships.map((value) =>
            value.id === item.id ? item : value
          )
        : [...previous.memberships, item],
    }));
    return true;
  };
  const closeEditor = (): void => {
    setEditingId("");
    onDirtyChange?.(false);
  };
  const closePayment = (): void => {
    setPaymentId("");
    onDirtyChange?.(false);
  };
  const clear = (): void => {
    setCategory("");
    setSearch("");
  };
  const back = (): void => {
    setNotice("");
    setDecision(undefined);
    onNavigate("memberships");
  };
  const viewDate = (value: null | string): string =>
    value ? formatDate(value, locale, "UTC") : t.unknown;
  if (editingId && !readonly) {
    return (
      <Editor
        key={editingId}
        item={edited}
        itemId={editingId}
        locale={locale}
        onClose={closeEditor}
        onDirtyChange={onDirtyChange}
        onSave={(item) => {
          if (!updateItem(item)) return false;
          closeEditor();
          setNotice("saved");
          return true;
        }}
      />
    );
  }
  if (payer && !readonly) {
    return (
      <PaymentEditor
        key={payer.id}
        item={payer}
        locale={locale}
        now={data.now}
        onClose={closePayment}
        onConfirm={(payment) => {
          if (!updateItem(confirmPayment(payer, payment, data.now))) {
            return false;
          }
          closePayment();
          setNotice("paymentRecorded");
          return true;
        }}
        onDirtyChange={onDirtyChange}
      />
    );
  }
  if (selectedId && !selected) {
    return (
      <Section>
        <ActionButton onClick={back} type="button">
          {t.back}
        </ActionButton>
        <EmptyState description={t.missingHint} title={t.missing} />
      </Section>
    );
  }
  if (selected) {
    const url = safeExternalUrl(selected.managementUrl);
    const paid = sumMoneyByCurrency(
      selected.payments.map(({ amount }) => amount)
    );
    return (
      <Section aria-label={`${t.details}: ${selected.name[locale]}`}>
        <SectionHeading>
          <Toolbar>
            <ActionButton onClick={back} type="button">
              {t.back}
            </ActionButton>
            <h2>{selected.name[locale]}</h2>
          </Toolbar>
          {!readonly && (
            <ActionButton
              onClick={() => {
                setEditingId(selected.id);
                setNotice("");
              }}
              type="button"
            >
              {t.edit}
            </ActionButton>
          )}
        </SectionHeading>
        {notice && <Notice role="status">{t[notice]}</Notice>}
        {readonly && <Notice>{t.readOnly}</Notice>}
        <p>
          {selected.planName[locale]} · {categories[selected.category][locale]}
        </p>
        <Toolbar>
          <StatusBadge
            label={entitlements[selected.entitlement.status][locale]}
            tone={
              selected.entitlement.status === "active" ? "success" : "neutral"
            }
          />
          <StatusBadge
            label={
              selected.cycle === "oneTime"
                ? t.noRenewal
                : renewals[selected.renewal.status][locale]
            }
          />
        </Toolbar>
        <Split>
          <Card>
            <h3>{t.entitlement}</h3>
            <Facts>
              <dt>{t.start}</dt>
              <dd>{viewDate(selected.entitlement.startsAt)}</dd>
              <dt>{t.end}</dt>
              <dd>{viewDate(selected.entitlement.endsAt)}</dd>
              <dt>{t.visibility}</dt>
              <dd>{selected.visibility === "public" ? t.public : t.private}</dd>
            </Facts>
            <Muted>{t.publicHint}</Muted>
          </Card>
          <Card>
            <h3>{t.plan}</h3>
            <Facts>
              <dt>{t.editAmount}</dt>
              <dd>
                {selected.amount
                  ? formatMoney(selected.amount, locale)
                  : t.unknown}{" "}
                · {cycles[selected.cycle][locale]}
              </dd>
              <dt>{t.next}</dt>
              <dd>
                {selected.cycle === "oneTime"
                  ? t.noRenewal
                  : viewDate(selected.renewal.nextAt)}
              </dd>
              <dt>{t.cancelBy}</dt>
              <dd>{viewDate(selected.renewal.cancelBy)}</dd>
              <dt>{t.autoRenew}</dt>
              <dd>{autopay[selected.renewal.autoRenew][locale]}</dd>
            </Facts>
            <Muted>{t.futureHint}</Muted>
          </Card>
        </Split>
        {summary.overdue.some(({ id }) => id === selected.id) && (
          <Notice>{t.overdue}</Notice>
        )}
        <p>{selected.note[locale]}</p>
        <Toolbar>
          {selected.serviceId && (
            <ActionButton
              onClick={() =>
                onNavigate("services", selected.serviceId || undefined)
              }
              type="button"
            >
              {t.service}
            </ActionButton>
          )}
          {url ? (
            <a href={url} rel="noopener noreferrer" target="_blank">
              {t.management}
            </a>
          ) : (
            <Muted>{t.noManagement}</Muted>
          )}
        </Toolbar>
        {url && <Muted>{t.managementHint}</Muted>}
        {!readonly && selected.cycle !== "oneTime" && (
          <Card>
            <Stack>
              <h3>{t.decision}</h3>
              <Muted>{t.decisionHint}</Muted>
              <Toolbar>
                <ActionButton
                  disabled={selected.renewal.status === "active"}
                  onClick={() =>
                    setDecision({ id: selected.id, status: "active" })
                  }
                  type="button"
                >
                  {t.keep}
                </ActionButton>
                <ActionButton
                  disabled={selected.renewal.status === "paused"}
                  onClick={() =>
                    setDecision({ id: selected.id, status: "paused" })
                  }
                  type="button"
                >
                  {t.pause}
                </ActionButton>
                <ActionButton
                  disabled={selected.renewal.status === "cancelled"}
                  onClick={() =>
                    setDecision({ id: selected.id, status: "cancelled" })
                  }
                  type="button"
                >
                  {t.cancelDecision}
                </ActionButton>
              </Toolbar>
              {activeDecision && (
                <div role="alert">
                  <p>
                    {renewals[activeDecision][locale]} · {t.decisionHint}
                  </p>
                  <Toolbar>
                    <ActionButton
                      onClick={() => {
                        if (
                          updateItem(decideRenewal(selected, activeDecision))
                        ) {
                          setDecision(undefined);
                          setNotice("renewalSaved");
                        } else setNotice("invalidTotal");
                      }}
                      type="button"
                    >
                      {t.confirm}
                    </ActionButton>
                    <ActionButton
                      onClick={() => setDecision(undefined)}
                      type="button"
                    >
                      {t.cancel}
                    </ActionButton>
                  </Toolbar>
                </div>
              )}
            </Stack>
          </Card>
        )}
        <SectionHeading>
          <h3>{t.paymentsTitle}</h3>
          {!readonly && (
            <ActionButton
              onClick={() => {
                setPaymentId(selected.id);
                setNotice("");
                setDecision(undefined);
              }}
              type="button"
            >
              {t.payment}
            </ActionButton>
          )}
        </SectionHeading>
        <Muted>{t.paidHint}</Muted>
        {selected.payments.length > 0 ? (
          <>
            <p>{totals(paid)}</p>
            <DataTable>
              <caption>{t.paid}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.paidOn}</th>
                  <th scope="col">{t.amount}</th>
                </tr>
              </thead>
              <tbody>
                {[...selected.payments]
                  .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
                  .map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        {viewDate(payment.paidAt)}
                        <br />
                        <Muted>{payment.note[locale]}</Muted>
                      </td>
                      <td>{formatMoney(payment.amount, locale)}</td>
                    </tr>
                  ))}
              </tbody>
            </DataTable>
          </>
        ) : (
          <EmptyState title={t.noPayments} />
        )}
      </Section>
    );
  }
  return (
    <Section aria-label={t.title}>
      <SectionHeading>
        <h2>{t.title}</h2>
        {!readonly && (
          <ActionButton
            onClick={() => {
              setEditingId(`demo-membership-${crypto.randomUUID()}`);
              setNotice("");
            }}
            type="button"
          >
            {t.add}
          </ActionButton>
        )}
      </SectionHeading>
      {notice && <Notice role="status">{t[notice]}</Notice>}
      {readonly && <Notice>{t.readOnly}</Notice>}
      <MetricGrid>
        <Metric
          detail={`${data.memberships.length} ${t.total}`}
          label={t.remaining}
          value={summary.activeCount}
        />
        <Metric
          detail={t.estimateHint}
          label={t.estimate}
          value={totals(summary.estimatedMonthly, t.noPlan)}
        />
        <Metric
          detail={t.paidHint}
          label={t.paid}
          value={totals(summary.confirmedPayments, t.noPayments)}
        />
      </MetricGrid>
      {summary.unknownAmountCount > 0 && (
        <Notice>
          {summary.unknownAmountCount} {t.unknownAmounts}
        </Notice>
      )}
      <Toolbar>
        <Field>
          {t.search}
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.search}
            type="search"
            value={search}
          />
        </Field>
        <Field>
          {t.category}
          <select
            onChange={(event) =>
              setCategory(event.target.value as typeof category)
            }
            value={category}
          >
            <option value="">{t.all}</option>
            {Object.entries(categories).map(([key, label]) => (
              <option key={key} value={key}>
                {label[locale]}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          {t.sort}
          <select
            onChange={(event) => setSort(event.target.value as MembershipSort)}
            value={sort}
          >
            <option value="date">{t.sortDate}</option>
            <option value="name">{t.sortName}</option>
            <option value="price">{t.priceSort}</option>
          </select>
        </Field>
      </Toolbar>
      {visible.length > 0 ? (
        <CardGrid>
          {visible.map((item) => (
            <MemberCard key={item.id}>
              <SectionHeading>
                <h3>{item.name[locale]}</h3>
                <Muted>{categories[item.category][locale]}</Muted>
              </SectionHeading>
              <p>{item.planName[locale]}</p>
              <Toolbar>
                <StatusBadge
                  label={entitlements[item.entitlement.status][locale]}
                  tone={
                    item.entitlement.status === "active" ? "success" : "neutral"
                  }
                />
                <StatusBadge
                  label={
                    item.cycle === "oneTime"
                      ? t.noRenewal
                      : renewals[item.renewal.status][locale]
                  }
                />
              </Toolbar>
              <Facts>
                <dt>{t.editAmount}</dt>
                <dd>
                  {item.amount ? formatMoney(item.amount, locale) : t.unknown} ·{" "}
                  {cycles[item.cycle][locale]}
                </dd>
                <dt>{t.next}</dt>
                <dd>
                  {item.renewal.status === "cancelled" ||
                  item.cycle === "oneTime"
                    ? t.noRenewal
                    : viewDate(item.renewal.nextAt)}
                </dd>
                <dt>{t.end}</dt>
                <dd>{viewDate(item.entitlement.endsAt)}</dd>
              </Facts>
              {summary.overdue.some(({ id }) => id === item.id) && (
                <p>
                  <StatusBadge label={t.overdue} tone="warning" />
                </p>
              )}
              <ActionButton
                aria-label={`${t.details}: ${item.name[locale]}`}
                onClick={() => {
                  setNotice("");
                  onNavigate("memberships", item.id);
                }}
                type="button"
              >
                {t.details}
              </ActionButton>
            </MemberCard>
          ))}
        </CardGrid>
      ) : (
        <Stack>
          <EmptyState
            description={
              data.memberships.length > 0 ? t.noMatchHint : t.emptyHint
            }
            title={data.memberships.length > 0 ? t.noMatch : t.empty}
          />
          {(search || category) && (
            <ActionButton onClick={clear} type="button">
              {t.clear}
            </ActionButton>
          )}
        </Stack>
      )}
    </Section>
  );
};
export default Memberships;
