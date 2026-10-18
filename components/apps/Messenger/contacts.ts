import site from "lifeos.json";
import {
  dataToProfile,
  decodePublicKey,
} from "components/apps/Messenger/functions";
import { type NostrProfile } from "components/apps/Messenger/types";

export const SITE_CONTACT_PUBLIC_KEY = decodePublicKey(
  site.messenger.publicKey
);

if (!SITE_CONTACT_PUBLIC_KEY) {
  throw new Error("Invalid site Messenger public key");
}

export const contactProfile = (
  publicKey: string,
  profile = dataToProfile(publicKey),
  ownPublicKey?: string
): NostrProfile =>
  publicKey === SITE_CONTACT_PUBLIC_KEY
    ? {
        ...profile,
        picture: profile.picture || site.icon,
        userName:
          publicKey === ownPublicKey && profile.data
            ? profile.userName
            : site.name,
      }
    : profile;
