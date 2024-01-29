import { createContext, useEffect, useState } from "react";

import { useConnectWallet, useWallets } from "@web3-onboard/react";
import { WalletState } from "@web3-onboard/core";
import { AuthClient } from "@dfinity/auth-client";
import "../utils/onboard";

import { initiateSIWE } from "../utils/siwe";
import { authenticate, verifyToken } from "../utils/account-requests";
import {
  headerInterceptor,
  isServerOnMaintenance,
} from "../utils/interceptors";

export interface UserState {
  connected: boolean;
  readyEth: boolean;
  connectedEth: boolean;
  connectedIC: boolean;
  authenticationError: boolean;
  authenticatingEth: boolean;
  loginComplete: boolean;
  loginEth: () => Promise<void>;
  logoutEth: () => Promise<void>;
  loginIC: () => Promise<void>;
  logoutIC: () => Promise<void>;
  logout: () => Promise<void>;
  userWarning?: string;
  setUserWarning: (warning?: string) => void;
}

export const initialState: UserState = {
  connectedEth: false,
  connectedIC: false,
  readyEth: false,
  authenticationError: false,
  authenticatingEth: false,
  loginComplete: false,
  loginEth: async () => {},
  logoutEth: async () => {},
  loginIC: async () => {},
  logoutIC: async () => {},
  logout: async () => {},
  setUserWarning: (warning?: string) => {},
};

export const UserContext = createContext(initialState);

export const UserProvider = ({ children }: { children: any }) => {
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const allWalletState = useWallets();
  const [connectedEth, setConnectedEth] = useState(false);
  const [connectedIC, setConnectedIC] = useState(false);
  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);
  const [authenticatingEth, setAuthenticatingEth] = useState(false);
  const [loginCompleteEth, setLoginCompleteEth] = useState(false);
  const [authenticationError, setAuthenticationError] = useState(false);
  const [userWarning, setUserWarning] = useState<string | undefined>();

  useEffect(() => {
    setConnected(connectedEth || connectedIC);
  }, [connectedEth, connectedIC]);

  const loginEth = async () => {
    connect()
      .then((wallets) => {
        const firstWallet = wallets[0];
        authenticateWithScorerApi(firstWallet);
      })
      .catch((e) => {
        console.log("Error when logging in:", e);
        // Indicate error connecting?
      });
  };

  const logoutEth = async () => {
    localStorage.removeItem("access-token");
    localStorage.removeItem("connectedWallets");
    if (allWalletState.length > 0) {
      allWalletState.forEach((wallet) => {
        disconnect(wallet);
      });
    }
    setLoginCompleteEth(false);
    setConnectedEth(false);
  };

  const loginIC = async () => {
    // FIXME: Model after loginEth.
    const authClient = await AuthClient.create({});
    authClient.login({
      // identityProvider:
      //   process.env.DFX_NETWORK === "ic"
      //   ? "https://identity.ic0.app/#authorize"
      //   : `http://localhost:4943?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}#authorize`,
      onSuccess: async () => {
        setConnectedIC(true);
        setReady(true);
      },
    });
  };

  const logoutIC = async () => {
    // FIXME: Model after logoutEth.
    const authClient = await AuthClient.create({});
    authClient.logout();
  };

  const logout = async () => {
    logoutEth();
    logoutIC();
  };


  // Restore wallet connection from localStorage
  const setWalletFromLocalStorage = async (): Promise<void> => {
    const previouslyConnectedWallets = JSON.parse(
      // retrieve localstorage state
      window.localStorage.getItem("connectedWallets") || "[]"
    ) as string[];
    const accessToken = window.localStorage.getItem("access-token");
    if (accessToken) {
      try {
        const { expDate } = await verifyToken(accessToken);
        // We want the token to be valid for at least 6 hours
        const minExpirationData = new Date(Date.now() + 1000 * 60 * 60 * 6);
        if (expDate < minExpirationData) {
          window.localStorage.removeItem("access-token");
          return;
        }
      } catch (e) {
        window.localStorage.removeItem("access-token");
        return;
      }
    }
    if (previouslyConnectedWallets?.length) {
      try {
        await connect({
          autoSelect: {
            label: previouslyConnectedWallets[0],
            disableModals: true,
          },
        });

        setConnectedEth(true);
      } catch (e) {
        // remove localstorage state
        window.localStorage.removeItem("connectedWallets");
        localStorage.removeItem("access-token");
      }
    }
  };

  // FIXME
  const authenticateWithScorerApi = async (wallet: WalletState) => {
    try {
      setAuthenticatingEth(true);
      const { siweMessage, signature } = await initiateSIWE(wallet);
      const tokens = await authenticate(siweMessage, signature);

      window.localStorage.setItem(
        "connectedWallets",
        JSON.stringify([wallet.label])
      );

      // store JWT access token in LocalStorage
      localStorage.setItem("access-token", tokens.access);
      headerInterceptor();

      setConnectedEth(true);
      setAuthenticatingEth(false);
      setLoginCompleteEth(true);
    } catch (e) {
      setAuthenticationError(true);
      setAuthenticatingEth(false);
    }
  };

  if (!isServerOnMaintenance()) {
    // On load check localstorage for loggedin credentials
    useEffect(() => {
      (async () => {
        try {
          await setWalletFromLocalStorage();
        } catch (error) {
          console.log("Error: ", error);
        } finally {
          setReady(true);
        }
      })();
    }, []);
  }

  useEffect(() => {
    if (allWalletState && allWalletState.length > 1) {
      logout();
    }
  }, [allWalletState]);

  // Used to listen to disconnect event from web3Onboard widget
  useEffect(() => {
    if (wallet && wallet.accounts.length > 1) {
      logout();
    }

    if (!wallet && connected) {
      logout();
    }
  }, [wallet, connected]);

  return (
    <UserContext.Provider
      value={{
        connected,
        readyEth: ready,
        connectedIC,
        connectedEth: connected,
        authenticatingEth: authenticatingEth,
        loginComplete: loginCompleteEth,
        authenticationError,
        loginEth,
        logoutEth,
        loginIC,
        logoutIC,
        logout,
        userWarning,
        setUserWarning,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
