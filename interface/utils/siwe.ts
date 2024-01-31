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
    console.log("X1")
    const address = authClient.getIdentity().getPrincipal();
    console.log("X2")
    const pubkey = authClient.getIdentity().getPublicKey();
    console.log("X3")
    const addressStr = address.toString();
    console.log("X4")
    const buf = new Uint8Array(20);
    console.log("X5")
    crypto.getRandomValues(buf);
    console.log("X6")
    const nonce = Buffer.from(buf);
    console.log("X7")
    const nonceStr = nonce.toString("hex");
    console.log("X8")
    const message = `${addressStr}\nNonce: ${nonceStr}`
    console.log("X9")
    const enc = new TextEncoder(); // always utf-8
    console.log("X10")

    const signature = await authClient.getIdentity().sign(enc.encode(message));
    console.log("X11", pubkey, "|", pubkey)
    console.log("X12", { pubkey: Buffer.from(pubkey.toDer()), signature, nonce })
    return { pubkey: Buffer.from(pubkey.toDer()), signature, nonce };
  } catch (error) {
    throw error;
  }
};
