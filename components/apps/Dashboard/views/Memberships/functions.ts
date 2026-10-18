import {
  type DashboardLocale,
  type Membership,
} from "components/apps/Dashboard/model";

export type MembershipSort = "date" | "name" | "price";
export const filterMemberships = (
  memberships: Membership[],
  search: string,
  category: "" | Membership["category"],
  sort: MembershipSort,
  locale: DashboardLocale
): Membership[] =>
  memberships
    .filter(
      (item) =>
        (!category || item.category === category) &&
        `${item.name.zh} ${item.name.en} ${item.planName.zh} ${item.planName.en}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
    )
    .sort((first, second) => {
      if (sort === "date") {
        const firstAt =
          first.renewal.status === "active"
            ? first.renewal.cancelBy || first.renewal.nextAt
            : first.entitlement.endsAt;
        const secondAt =
          second.renewal.status === "active"
            ? second.renewal.cancelBy || second.renewal.nextAt
            : second.entitlement.endsAt;
        return (firstAt || "9999").localeCompare(secondAt || "9999");
      }
      if (sort === "price") {
        if (!first.amount) return second.amount ? 1 : 0;
        if (!second.amount) return -1;
        const currency = first.amount.currency.localeCompare(
          second.amount.currency
        );
        if (currency) return currency;
        return second.amount.minor - first.amount.minor;
      }
      return first.name[locale].localeCompare(second.name[locale], locale);
    });
