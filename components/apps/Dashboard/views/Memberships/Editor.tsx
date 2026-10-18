import { useEffect, useState } from "react";
import {
  type DashboardLocale,
  type Membership,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  Field,
  Notice,
  SectionHeading,
  Toolbar,
} from "components/apps/Dashboard/shared";
import {
  draftMembership,
  type MembershipDraft,
  saveMembershipDraft,
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
  Fields,
  Form,
} from "components/apps/Dashboard/views/Memberships/styles";

const Editor = ({
  item,
  itemId,
  locale,
  onClose,
  onDirtyChange,
  onSave,
}: {
  item?: Membership;
  itemId: string;
  locale: DashboardLocale;
  onClose: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSave: (value: Membership) => boolean;
}): React.ReactNode => {
  const t = messages[locale];
  const [draft, setDraft] = useState(() => draftMembership(item));
  const [error, setError] = useState<
    "" | "amountError" | "datesError" | "invalidTotal" | "nameError"
  >("");
  const [discarding, setDiscarding] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftMembership(item));
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);
  const change = <K extends keyof MembershipDraft>(
    key: K,
    value: MembershipDraft[K]
  ): void => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setError("");
    setDiscarding(false);
  };
  const textField = (
    key: "nameEn" | "nameZh" | "planEn" | "planZh"
  ): React.ReactNode => (
    <Field>
      {t[key]}
      <input
        maxLength={100}
        onChange={(event) => change(key, event.target.value)}
        value={draft[key]}
      />
    </Field>
  );
  const dateField = (
    key: "cancelOn" | "endsOn" | "nextOn" | "startsOn",
    label: string,
    disabled = false
  ): React.ReactNode => (
    <Field>
      {label}
      <input
        disabled={disabled}
        onChange={(event) => change(key, event.target.value)}
        type="date"
        value={draft[key]}
      />
    </Field>
  );
  const noRenewal =
    draft.cycle === "oneTime" || draft.renewalStatus === "cancelled";
  return (
    <Form
      aria-label={item ? t.editTitle : t.add}
      onSubmit={(event) => {
        event.preventDefault();
        const result = saveMembershipDraft(draft, itemId, item);
        if ("error" in result) {
          setError(`${result.error}Error`);
          return;
        }
        if (onSave(result.item)) onDirtyChange?.(false);
        else setError("invalidTotal");
      }}
      noValidate
    >
      <SectionHeading>
        <h2>{item ? t.editTitle : t.add}</h2>
      </SectionHeading>
      <Fields>
        {textField("nameZh")}
        {textField("nameEn")}
        {textField("planZh")}
        {textField("planEn")}
        <Field>
          {t.category}
          <select
            onChange={(event) =>
              change("category", event.target.value as Membership["category"])
            }
            value={draft.category}
          >
            {Object.entries(categories).map(([key, label]) => (
              <option key={key} value={key}>
                {label[locale]}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          {t.cycle}
          <select
            onChange={(event) =>
              change("cycle", event.target.value as Membership["cycle"])
            }
            value={draft.cycle}
          >
            {Object.entries(cycles).map(([key, label]) => (
              <option key={key} value={key}>
                {label[locale]}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          {t.amount}
          <input
            inputMode="decimal"
            onChange={(event) => change("amount", event.target.value)}
            placeholder={t.unknown}
            value={draft.amount}
          />
        </Field>
        <Field>
          {t.currency}
          <select
            onChange={(event) =>
              change(
                "currency",
                event.target.value as MembershipDraft["currency"]
              )
            }
            value={draft.currency}
          >
            {["CNY", "USD", "EUR", "JPY"].map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </Field>
      </Fields>
      <Notice>{t.amountHint}</Notice>
      <Fields>
        <Field>
          {t.entitlement}
          <select
            onChange={(event) =>
              change(
                "entitlementStatus",
                event.target.value as MembershipDraft["entitlementStatus"]
              )
            }
            value={draft.entitlementStatus}
          >
            {Object.entries(entitlements).map(([key, label]) => (
              <option key={key} value={key}>
                {label[locale]}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          {t.plan}
          <select
            disabled={draft.cycle === "oneTime"}
            onChange={(event) =>
              change(
                "renewalStatus",
                event.target.value as MembershipDraft["renewalStatus"]
              )
            }
            value={
              draft.cycle === "oneTime" ? "cancelled" : draft.renewalStatus
            }
          >
            {Object.entries(renewals).map(([key, label]) => (
              <option key={key} value={key}>
                {label[locale]}
              </option>
            ))}
          </select>
        </Field>
        {dateField("startsOn", t.start)}
        {dateField("endsOn", t.end)}
        {dateField("nextOn", t.next, noRenewal)}
        {dateField("cancelOn", t.cancelBy, noRenewal)}
        <Field>
          {t.autoRenew}
          <select
            disabled={noRenewal}
            onChange={(event) =>
              change(
                "autoRenew",
                event.target.value as MembershipDraft["autoRenew"]
              )
            }
            value={noRenewal ? "off" : draft.autoRenew}
          >
            {Object.entries(autopay).map(([key, label]) => (
              <option key={key} value={key}>
                {label[locale]}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          {t.visibility}
          <select
            onChange={(event) =>
              change(
                "visibility",
                event.target.value as Membership["visibility"]
              )
            }
            value={draft.visibility}
          >
            <option value="private">{t.private}</option>
            <option value="public">{t.public}</option>
          </select>
        </Field>
        <Field>
          {t.noteZh}
          <textarea
            maxLength={1000}
            onChange={(event) => change("noteZh", event.target.value)}
            value={draft.noteZh}
          />
        </Field>
        <Field>
          {t.noteEn}
          <textarea
            maxLength={1000}
            onChange={(event) => change("noteEn", event.target.value)}
            value={draft.noteEn}
          />
        </Field>
      </Fields>
      <Notice>
        {t.dateHint} {t.publicHint}
      </Notice>
      {error && <Notice role="alert">{t[error]}</Notice>}
      <Toolbar>
        <button type="submit">{t.save}</button>
        <ActionButton
          onClick={() => (dirty ? setDiscarding(true) : onClose())}
          type="button"
        >
          {t.cancel}
        </ActionButton>
      </Toolbar>
      {discarding && (
        <div role="alert">
          <p>{t.unsaved}</p>
          <Toolbar>
            <ActionButton onClick={onClose} type="button">
              {t.discard}
            </ActionButton>
            <ActionButton onClick={() => setDiscarding(false)} type="button">
              {t.continue}
            </ActionButton>
          </Toolbar>
        </div>
      )}
    </Form>
  );
};
export default Editor;
