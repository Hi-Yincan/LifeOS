import { useState } from "react";
import {
  type DashboardViewProps,
  type Membership,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  Card,
  DataTable,
  EmptyState,
  Field,
  formatDate,
  formatMoney,
  Muted,
  Notice,
  safeExternalUrl,
  Section,
  SectionHeading,
  Split,
  StatusBadge,
  summarizeMemberships,
  Toolbar,
} from "components/apps/Dashboard/shared";
import {
  convertDisplayMoney,
  type DisplayCurrency,
  estimateMonthlyCost,
  sumDisplayMoney,
} from "components/apps/Dashboard/views/Memberships/currency";
import {
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
import {
  CurrencyOptions,
  Facts,
  ListControls,
  MembershipTable,
  ResultCount,
  RowLink,
  RowMeta,
  RowStates,
  SummaryStrip,
  TableRegion,
} from "components/apps/Dashboard/views/Memberships/styles";

type MembershipContentProps = DashboardViewProps & {
  category: "" | Membership["category"];
  displayCurrency: DisplayCurrency;
  onCategoryChange: (category: "" | Membership["category"]) => void;
  onCurrencyChange: (currency: DisplayCurrency) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: MembershipSort) => void;
  search: string;
  sort: MembershipSort;
};

const MembershipContent = ({
  category,
  data,
  displayCurrency,
  locale,
  onCategoryChange,
  onCurrencyChange,
  onNavigate,
  onSearchChange,
  onSortChange,
  search,
  selectedId,
  sort,
}: MembershipContentProps): React.ReactNode => {
  const t = messages[locale];
  const selected = data.memberships.find(({ id }) => id === selectedId);
  const summary = summarizeMemberships(data.memberships, data.now);
  const visible = filterMemberships(
    data.memberships,
    search,
    category,
    sort,
    locale,
    displayCurrency
  );
  const estimate = estimateMonthlyCost(data.memberships, displayCurrency);
  const currencyOptions = (
    <CurrencyOptions aria-label={t.currency} role="group">
      {(["CNY", "USD"] as const).map((currency) => (
        <ActionButton
          key={currency}
          aria-pressed={displayCurrency === currency}
          onClick={() => onCurrencyChange(currency)}
          type="button"
        >
          {currency}
        </ActionButton>
      ))}
    </CurrencyOptions>
  );
  const displayMoney = (amount: Membership["amount"]): string =>
    amount
      ? formatMoney(convertDisplayMoney(amount, displayCurrency), locale)
      : t.unknown;
  const back = (): void => {
    onNavigate("memberships");
  };
  const viewDate = (value: null | string): string =>
    value ? formatDate(value, locale, "UTC") : t.unknown;
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
    const paid = sumDisplayMoney(
      selected.payments.map(({ amount }) => amount),
      displayCurrency
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
          {currencyOptions}
        </SectionHeading>
        <Muted>{t.exchangeHint}</Muted>
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
            </Facts>
          </Card>
          <Card>
            <h3>{t.plan}</h3>
            <Facts>
              <dt>{t.price}</dt>
              <dd>
                {displayMoney(selected.amount)} ·{" "}
                {cycles[selected.cycle][locale]}
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
        <SectionHeading>
          <h3>{t.paymentsTitle}</h3>
        </SectionHeading>
        <Muted>{t.paidHint}</Muted>
        {selected.payments.length > 0 ? (
          <>
            <p>{formatMoney(paid, locale)}</p>
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
                      <td>{displayMoney(payment.amount)}</td>
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
        {currencyOptions}
      </SectionHeading>
      <Muted>{t.exchangeHint}</Muted>
      <SummaryStrip
        aria-label={locale === "zh" ? "会员摘要" : "Membership summary"}
      >
        <div>
          <dt>{t.remaining}</dt>
          <dd>
            {summary.activeCount}
            <small> / {data.memberships.length}</small>
          </dd>
        </div>
        <div>
          <dt>{t.estimate}</dt>
          <dd>{estimate ? formatMoney(estimate, locale) : t.noPlan}</dd>
        </div>
        <div>
          <dt>{t.paid}</dt>
          <dd>
            {summary.confirmedPayments.length > 0
              ? formatMoney(
                  sumDisplayMoney(summary.confirmedPayments, displayCurrency),
                  locale
                )
              : t.noPayments}
          </dd>
        </div>
      </SummaryStrip>
      <ListControls>
        <Field>
          {t.search}
          <input
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t.search}
            type="search"
            value={search}
          />
        </Field>
        <Field>
          {t.category}
          <select
            onChange={(event) =>
              onCategoryChange(event.target.value as typeof category)
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
            onChange={(event) =>
              onSortChange(event.target.value as MembershipSort)
            }
            value={sort}
          >
            <option value="date">{t.sortDate}</option>
            <option value="name">{t.sortName}</option>
            <option value="price">{t.priceSort}</option>
          </select>
        </Field>
        <ResultCount role="status">
          {visible.length} / {data.memberships.length} {t.total}
        </ResultCount>
      </ListControls>
      {visible.length > 0 ? (
        <TableRegion>
          <MembershipTable
            aria-label={locale === "zh" ? "会员列表" : "Membership list"}
          >
            <thead>
              <tr>
                <th scope="col">{t.title}</th>
                <th className="membership-price" scope="col">
                  {t.price}
                </th>
                <th className="membership-date" scope="col">
                  {t.next}
                </th>
                <th scope="col">
                  {locale === "zh" ? "权益与计划" : "Access & plan"}
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <th scope="row">
                    <RowLink
                      aria-label={`${t.details}: ${item.name[locale]}`}
                      onClick={() => onNavigate("memberships", item.id)}
                      type="button"
                    >
                      {item.name[locale]}
                    </RowLink>
                    <RowMeta>
                      {categories[item.category][locale]}
                      {item.planName[locale] && ` · ${item.planName[locale]}`}
                    </RowMeta>
                  </th>
                  <td className="membership-price">
                    {displayMoney(item.amount)}
                    <RowMeta>{cycles[item.cycle][locale]}</RowMeta>
                  </td>
                  <td className="membership-date">
                    {item.renewal.status === "cancelled" ||
                    item.cycle === "oneTime"
                      ? t.noRenewal
                      : viewDate(item.renewal.nextAt)}
                    {item.renewal.status === "active" &&
                      item.renewal.cancelBy && (
                        <RowMeta>
                          {t.cancelBy}: {viewDate(item.renewal.cancelBy)}
                        </RowMeta>
                      )}
                  </td>
                  <td>
                    <RowStates>
                      <StatusBadge
                        label={entitlements[item.entitlement.status][locale]}
                        tone={
                          item.entitlement.status === "active"
                            ? "success"
                            : "neutral"
                        }
                      />
                      <RowMeta>
                        {item.cycle === "oneTime"
                          ? t.noRenewal
                          : renewals[item.renewal.status][locale]}
                      </RowMeta>
                      {summary.overdue.some(({ id }) => id === item.id) && (
                        <StatusBadge label={t.overdue} tone="warning" />
                      )}
                    </RowStates>
                  </td>
                </tr>
              ))}
            </tbody>
          </MembershipTable>
        </TableRegion>
      ) : (
        <EmptyState
          description={
            data.memberships.length > 0 ? t.noMatchHint : t.emptyHint
          }
          title={data.memberships.length > 0 ? t.noMatch : t.empty}
        />
      )}
      <RowMeta>
        {t.estimateHint} {t.paidHint}
        {summary.unknownAmountCount > 0 &&
          ` ${summary.unknownAmountCount} ${t.unknownAmounts}`}
      </RowMeta>
    </Section>
  );
};

const Memberships = (props: DashboardViewProps): React.ReactNode => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"" | Membership["category"]>("");
  const [sort, setSort] = useState<MembershipSort>("date");
  const [displayCurrency, setDisplayCurrency] =
    useState<DisplayCurrency>("CNY");

  // 实体详情切换不重置列表筛选。
  return (
    <MembershipContent
      key={props.selectedId || "list"}
      {...props}
      category={category}
      displayCurrency={displayCurrency}
      onCategoryChange={setCategory}
      onCurrencyChange={setDisplayCurrency}
      onSearchChange={setSearch}
      onSortChange={setSort}
      search={search}
      sort={sort}
    />
  );
};
export default Memberships;
