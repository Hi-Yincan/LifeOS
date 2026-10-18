import {
  BASE_RW_RELAYS,
  UNKNOWN_PUBLIC_KEY,
  USE_EXTENSION_IDB_NAME,
} from "components/apps/Messenger/constants";
import {
  copyKeyMenuItems,
  getSigner,
  getWebSocketStatusIcon,
  importSecretKey,
} from "components/apps/Messenger/functions";
import { useHistoryContext } from "components/apps/Messenger/HistoryContext";
import {
  useNostrProfile,
  useUpdateProfile,
} from "components/apps/Messenger/hooks";
import { Back, Write } from "components/apps/Messenger/Icons";
import { useNostr } from "components/apps/Messenger/NostrContext";
import Profile, { PROFILE } from "components/apps/Messenger/Profile";
import StyledProfileBanner from "components/apps/Messenger/StyledProfileBanner";
import { type ProfileData, type Signer } from "components/apps/Messenger/types";
import { useLifeOS } from "components/system/LifeOS/context";
import { useMenu, useMenuActions } from "contexts/menu";
import Button from "styles/common/Button";
import { MENU_SEPERATOR } from "utils/constants";
import { haltEvent, toSorted } from "utils/functions";

const GRADIENT = "linear-gradient(rgba(0, 0, 0, 0.10), rgba(0, 0, 0, 0.5))";
const STYLING =
  "center center / cover no-repeat local border-box border-box #000";

type ProfileBannerProps = {
  block: (key: string) => void;
  deleteChat: (key: string) => void;
  editBanner: () => void;
  editPicture: () => void;
  goBack?: () => void;
  hideReadMessages: boolean;
  newChat: () => void;
  selectedRecipientKey: string;
  setHideReadMessages: React.Dispatch<React.SetStateAction<boolean>>;
  setSigner: (signer: Signer) => void;
};

const ProfileBanner: FC<ProfileBannerProps> = ({
  block,
  deleteChat,
  editBanner,
  editPicture,
  goBack,
  hideReadMessages,
  newChat,
  selectedRecipientKey,
  setHideReadMessages,
  setSigner,
}) => {
  const { connectToRelay, relayStatus, signer } = useNostr();
  const { locale } = useLifeOS();
  const saveProfile = useUpdateProfile();
  const { publicKey, secretKey } = signer;
  const isOwnProfile = !selectedRecipientKey;
  const pubkey =
    selectedRecipientKey === UNKNOWN_PUBLIC_KEY
      ? ""
      : selectedRecipientKey || publicKey;
  const {
    banner,
    nip05,
    picture,
    userName = "New message",
  } = useNostrProfile(pubkey);
  const style = banner
    ? { background: `${GRADIENT}, url(${banner}) ${STYLING}` }
    : {};
  const { contextMenu } = useMenuActions();
  const { label: openMenu } = useMenu();
  const { blockedKeys, setBlockedKeys } = useHistoryContext();
  /* eslint-disable no-alert */
  const updateProfile = async (
    newProfile: Partial<ProfileData>
  ): Promise<void> => {
    if (Object.values(newProfile).filter(Boolean).length === 0) return;

    try {
      await saveProfile(newProfile);
    } catch {
      alert(
        locale === "zh"
          ? "资料保存失败，请检查中继连接后重试。"
          : "Profile could not be saved. Check your relay connection and try again."
      );
    }
  };
  const switchSigner = (useExtension: boolean): void => {
    if (useExtension) {
      localStorage.setItem(USE_EXTENSION_IDB_NAME, "true");
    } else {
      localStorage.removeItem(USE_EXTENSION_IDB_NAME);
    }

    getSigner().then(setSigner);
  };
  const { onContextMenuCapture } = contextMenu(() => {
    if (!pubkey) return [];
    if (!isOwnProfile) {
      return [
        ...copyKeyMenuItems(pubkey),
        MENU_SEPERATOR,
        { action: () => deleteChat(pubkey), label: "Delete Chat" },
        { action: () => block(pubkey), label: "Block" },
      ];
    }

    return [
      ...copyKeyMenuItems(pubkey, secretKey),
      MENU_SEPERATOR,
      {
        action: () => {
          const name = prompt("Username", userName);

          updateProfile({ display_name: name || "", name: name || "" });
        },
        label: "Edit Username",
      },
      MENU_SEPERATOR,
      {
        action: editPicture,
        label: locale === "zh" ? "修改头像" : "Edit Picture",
      },
      {
        action: editBanner,
        label: locale === "zh" ? "修改背景图" : "Edit Banner",
      },
      MENU_SEPERATOR,
      {
        action: () => setHideReadMessages(!hideReadMessages),
        label: `${hideReadMessages ? "Show" : "Hide"} Read Messages`,
      },
      ...(blockedKeys.length > 0
        ? [
            {
              action: () => setBlockedKeys([]),
              label: `Unblock All (${blockedKeys.length})`,
            },
          ]
        : []),
      MENU_SEPERATOR,
      ...(secretKey
        ? [
            ...(window.nostr
              ? [
                  {
                    action: () => {
                      if (window.nostr?.nip44) switchSigner(true);
                      else {
                        alert(
                          "This extension doesn't support NIP-44 encryption, which private messages need."
                        );
                      }
                    },
                    label: "Sign In with Extension",
                  },
                ]
              : []),
            {
              action: () => {
                const key = prompt(
                  "Paste the nsec to use in this browser. Copy the current nsec first if you want to keep it."
                );

                if (!key) return;

                const newSigner = importSecretKey(key);

                if (newSigner) setSigner(newSigner);
                else alert("That isn't a valid nsec.");
              },
              label: "Use Existing Key...",
            },
          ]
        : [{ action: () => switchSigner(false), label: "Sign Out" }]),
    ];
  }, PROFILE);
  /* eslint-enable no-alert */

  return (
    <StyledProfileBanner onContextMenuCapture={haltEvent} style={style}>
      <Button
        aria-label={goBack ? "Back" : "New message"}
        onClick={goBack || newChat}
      >
        {goBack ? <Back /> : <Write />}
      </Button>
      {isOwnProfile && (
        <div className="relays">
          <ol>
            {toSorted(BASE_RW_RELAYS).map((relayUrl) => (
              <li key={relayUrl}>
                <button
                  // aria-disabled keeps the tooltip and connected status
                  // reachable, unlike a natively disabled button
                  aria-disabled={relayStatus[relayUrl] ? true : undefined}
                  aria-label={`${relayUrl} (${
                    relayStatus[relayUrl] || "disconnected"
                  })`}
                  onClick={
                    relayStatus[relayUrl]
                      ? undefined
                      : () => connectToRelay(relayUrl)
                  }
                  title={relayUrl}
                  type="button"
                >
                  {getWebSocketStatusIcon(relayStatus[relayUrl])}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
      <Profile
        expanded={openMenu === PROFILE}
        nip05={nip05}
        onClick={onContextMenuCapture}
        picture={picture}
        pubkey={pubkey}
        userName={userName}
      />
    </StyledProfileBanner>
  );
};

export default ProfileBanner;
