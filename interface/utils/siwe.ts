import { WalletState } from "@web3-onboard/core";
import { ethers } from "ethers";
import { AuthClient } from "@dfinity/auth-client";
import { SiweMessage } from "siwe";
import { getNonce } from "./account-requests";

const getSiweMessage = async (wallet: WalletState, address: string) => {
  try {
    const nonce = await getNonce();

    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: `Welcome to Gitcoin Passport Scorer! This request will not trigger a blockchain transaction or cost any gas fees. Your authentication status will reset in 24 hours. Wallet Address: ${address}. Nonce: ${nonce}`,
      uri: window.location.origin,
      version: "1",
      chainId: Number(wallet.chains[0].id),
      nonce,
    });

    return message;
  } catch (error) {
    throw error;
  }
};

export const initiateSIWE = async (wallet: WalletState) => {
  try {
    const provider = new ethers.providers.Web3Provider(wallet.provider, "any");
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    const siweMessage = await getSiweMessage(wallet, address);
    const preparedMessage = siweMessage.prepareMessage();

    const signature = await signer.signMessage(preparedMessage);
    return { siweMessage, signature };
  } catch (error) {
    throw error;
  }
};

// TODO: Duplicate code with initiateSIWE
export const initiateSIWIC = async (authClient: AuthClient) => {
  try {
    const address = authClient.getIdentity().getPrincipal().toString();
    const buf = new Uint8Array(20);
    crypto.getRandomValues(buf);
    const nonce = Buffer.from(buf).toString("hex");
    const message = `${address}/${nonce}`;
    const enc = new TextEncoder(); // always utf-8

    const signature = await authClient.getIdentity().sign(enc.encode(message));
    return { message, signature: '0x' + Buffer.from(signature).toString("hex") }; // TODO: check
  } catch (error) {
    throw error;
  }
};
