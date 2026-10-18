import { useEffect, useState } from "react";
import {
  type Currency,
  type DashboardLocale,
  type Membership,
  type PaymentRecord,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  Field,
  formatDate,
  formatMoney,
  Notice,
  SectionHeading,
  Toolbar,
} from "components/apps/Dashboard/shared";
import {
  dateInput,
  moneyInput,
  parseAmount,
  parseDateInput,
} from "components/apps/Dashboard/views/Memberships/functions";
import { messages } from "components/apps/Dashboard/views/Memberships/messages";
import {
  Fields,
  Form,
} from "components/apps/Dashboard/views/Memberships/styles";

const PaymentEditor = ({
  item,
  locale,
  now,
  onClose,
  onConfirm,
  onDirtyChange,
}: {
  item: Membership;
  locale: DashboardLocale;
  now: string;
  onClose: () => void;
  onConfirm: (payment: PaymentRecord) => boolean;
  onDirtyChange?: (dirty: boolean) => void;
}): React.ReactNode => {
  const t = messages[locale];
  const [amount, setAmount] = useState(() => moneyInput(item.amount));
  const [currency, setCurrency] = useState<Currency>(
    item.amount?.currency || "CNY"
  );
  const [paidOn, setPaidOn] = useState(() => dateInput(now));
  const [payment, setPayment] = useState<PaymentRecord>();
  const [error, setError] = useState<"" | "invalidTotal" | "paymentError">("");
  const [discarding, setDiscarding] = useState(false);
  const dirty =
    amount !== moneyInput(item.amount) ||
    currency !== (item.amount?.currency || "CNY") ||
    paidOn !== dateInput(now) ||
    Boolean(payment);
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);
  return (
    <Form
      aria-label={t.payment}
      onSubmit={(event) => {
        event.preventDefault();
        try {
          const value = parseAmount(amount, currency);
          const paidAt = parseDateInput(paidOn);
          if (!value || !paidAt || Date.parse(paidAt) > Date.parse(now)) {
            setError("paymentError");
            return;
          }
          setPayment({
            amount: value,
            id: `demo-payment-${crypto.randomUUID()}`,
            note: { en: messages.en.paidRecord, zh: messages.zh.paidRecord },
            paidAt,
          });
          setError("");
        } catch {
          setError("paymentError");
        }
      }}
      noValidate
    >
      <SectionHeading>
        <h2>{t.payment}</h2>
      </SectionHeading>
      <p>{item.name[locale]}</p>
      <Notice>{t.paymentHint}</Notice>
      {payment ? (
        <div role="status">
          <p>
            {formatMoney(payment.amount, locale)} ·{" "}
            {formatDate(payment.paidAt, locale, "UTC")}
          </p>
          <Toolbar>
            <ActionButton
              onClick={() => {
                if (onConfirm(payment)) onDirtyChange?.(false);
                else setError("invalidTotal");
              }}
              type="button"
            >
              {t.confirmPayment}
            </ActionButton>
            <ActionButton onClick={() => setPayment(undefined)} type="button">
              {t.continue}
            </ActionButton>
          </Toolbar>
        </div>
      ) : (
        <>
          <Fields>
            <Field>
              {t.amount}
              <input
                inputMode="decimal"
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
                value={amount}
              />
            </Field>
            <Field>
              {t.currency}
              <select
                onChange={(event) => {
                  setCurrency(event.target.value as Currency);
                  setError("");
                }}
                value={currency}
              >
                {["CNY", "USD", "EUR", "JPY"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field>
              {t.paidOn}
              <input
                max={dateInput(now)}
                onChange={(event) => {
                  setPaidOn(event.target.value);
                  setError("");
                }}
                type="date"
                value={paidOn}
              />
            </Field>
          </Fields>
          <button type="submit">{t.paymentReview}</button>
        </>
      )}
      {error && <Notice role="alert">{t[error]}</Notice>}
      <Toolbar>
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
export default PaymentEditor;
