import { type ReactNode, useEffect, useState } from "react";
import {
  type DashboardLocale,
  type Server,
  type Service,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  Field,
  localize,
  Notice,
  Split,
  Toolbar,
} from "components/apps/Dashboard/shared";
import {
  categories,
  messages,
} from "components/apps/Dashboard/views/Services/messages";
import { ServiceForm } from "components/apps/Dashboard/views/Services/styles";

export type ServiceDraft = Pick<
  Service,
  "category" | "description" | "name" | "serverId" | "visibility"
>;

const getDraft = ({
  category,
  description,
  name,
  serverId,
  visibility,
}: Service): ServiceDraft => ({
  category,
  description: { ...description },
  name: { ...name },
  serverId,
  visibility,
});

const Editor = ({
  locale,
  onCancel,
  onDirtyChange,
  onSave,
  servers,
  service,
}: {
  locale: DashboardLocale;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSave: (draft: ServiceDraft) => void;
  servers: Server[];
  service: Service;
}): ReactNode => {
  const t = messages[locale];
  const baseline = getDraft(service);
  const [draft, setDraft] = useState(baseline);
  const [invalid, setInvalid] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  return (
    <ServiceForm
      aria-label={t.editTitle}
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.name.zh.trim() || !draft.name.en.trim()) {
          setInvalid(true);
          return;
        }
        onDirtyChange?.(false);
        onSave({
          ...draft,
          description: {
            en: draft.description.en.trim(),
            zh: draft.description.zh.trim(),
          },
          name: { en: draft.name.en.trim(), zh: draft.name.zh.trim() },
        });
      }}
    >
      <h3>{t.editTitle}</h3>
      <Notice>{t.editHint}</Notice>
      <Split>
        <Field>
          {t.nameZh}
          <input
            maxLength={80}
            onChange={({ target }) =>
              setDraft({ ...draft, name: { ...draft.name, zh: target.value } })
            }
            value={draft.name.zh}
            required
          />
        </Field>
        <Field>
          {t.nameEn}
          <input
            maxLength={80}
            onChange={({ target }) =>
              setDraft({ ...draft, name: { ...draft.name, en: target.value } })
            }
            value={draft.name.en}
            required
          />
        </Field>
        <Field>
          {t.descriptionZh}
          <textarea
            maxLength={300}
            onChange={({ target }) =>
              setDraft({
                ...draft,
                description: { ...draft.description, zh: target.value },
              })
            }
            value={draft.description.zh}
          />
        </Field>
        <Field>
          {t.descriptionEn}
          <textarea
            maxLength={300}
            onChange={({ target }) =>
              setDraft({
                ...draft,
                description: { ...draft.description, en: target.value },
              })
            }
            value={draft.description.en}
          />
        </Field>
        <Field>
          {t.category}
          <select
            onChange={({ target }) =>
              setDraft({
                ...draft,
                category: target.value as Service["category"],
              })
            }
            value={draft.category}
          >
            {Object.entries(categories).map(([value, label]) => (
              <option key={value} value={value}>
                {localize(label, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          {t.server}
          <select
            onChange={({ target }) => {
              // eslint-disable-next-line unicorn/no-null -- 共享模型用 null 表示未关联服务器。
              const serverId = target.value || null;

              setDraft({ ...draft, serverId });
            }}
            value={draft.serverId || ""}
          >
            <option value="">{t.noServer}</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {localize(server.name, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          {t.previewScope}
          <select
            onChange={({ target }) =>
              setDraft({
                ...draft,
                visibility: target.value as Service["visibility"],
              })
            }
            value={draft.visibility}
          >
            <option value="public">{t.previewPublic}</option>
            <option value="private">{t.previewPrivate}</option>
          </select>
        </Field>
      </Split>
      <Notice>{t.previewScopeHint}</Notice>
      {invalid && <Notice role="alert">{t.validation}</Notice>}
      {discardPrompt ? (
        <div role="alert">
          <Notice>{t.discardPrompt}</Notice>
          <Toolbar>
            <ActionButton onClick={onCancel} type="button">
              {t.discard}
            </ActionButton>
            <ActionButton onClick={() => setDiscardPrompt(false)} type="button">
              {t.continueEditing}
            </ActionButton>
          </Toolbar>
        </div>
      ) : (
        <Toolbar>
          <button disabled={!dirty} type="submit">
            {t.save}
          </button>
          <ActionButton
            onClick={() => (dirty ? setDiscardPrompt(true) : onCancel())}
            type="button"
          >
            {t.cancel}
          </ActionButton>
        </Toolbar>
      )}
    </ServiceForm>
  );
};

export default Editor;
