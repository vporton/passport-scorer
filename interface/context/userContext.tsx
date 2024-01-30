import { createContext, useEffect, useState } from "react";

import { useConnectWallet, useWallets } from "@web3-onboard/react";
import { WalletState } from "@web3-onboard/core";
import { AuthClient } from "@dfinity/auth-client";
import "../utils/onboard";

import { initiateSIWE, initiateSIWIC } from "../utils/siwe";
import { authenticate, verifyToken } from "../utils/account-requests";
import {
  headerInterceptor,
  isServerOnMaintenance,
} from "../utils/interceptors";

export interface UserState {
  connected: boolean;
  readyEth: boolean;
  readyIC: boolean;
  connectedEth: boolean;
  connectedIC: boolean;
  authenticationError: boolean;
  authenticatingEth: boolean;
  authenticatingIC: boolean;
  loginComplete: boolean;
  icPrincipal?: string;
  loginEth: () => Promise<void>;
  logoutEth: () => Promise<void>;
  loginIC: () => Promise<void>;
  logoutIC: () => Promise<void>;
  logout: () => Promise<void>;
  userWarning?: string;
  setUserWarning: (warning?: string) => void;
}

export const initialState: UserState = {
  connected: false,
  readyEth: false,
  readyIC: false,
  connectedEth: false,
  connectedIC: false,
  authenticationError: false,
  authenticatingEth: false,
  authenticatingIC: false,
  loginComplete: false,
  icPrincipal: undefined,
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
  const [readyEth, setReadyEth] = useState(false);
  const [readyIC, setReadyIC] = useState(false);
  const [authenticatingEth, setAuthenticatingEth] = useState(false);
  const [authenticatingIC, setAuthenticatingIC] = useState(false);
  const [loginCompleteEth, setLoginCompleteEth] = useState(false);
  const [loginCompleteIC, setLoginCompleteIC] = useState(false);
  const [loginComplete, setLoginComplete] = useState(false);
  const [authenticationError, setAuthenticationError] = useState(false);
  const [userWarning, setUserWarning] = useState<string | undefined>();
  const [icPrincipal, setICPrincipal] = useState<string | undefined>();

  useEffect(() => {
    setConnected(connectedEth || connectedIC);
  }, [connectedEth, connectedIC]);

  useEffect(() => {
    setLoginComplete(loginCompleteEth || loginCompleteIC);
  }, [loginCompleteEth, loginCompleteIC]);

  const loginEth = async () => {
    connect()
      .then((wallets) => {
        const firstWallet = wallets[0];
        authenticateEthWithScorerApi(firstWallet);
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
    const authClient: AuthClient = await AuthClient.create({});
    authClient.login({
      // identityProvider:
      //   process.env.DFX_NETWORK === "ic"
      //   ? "https://identity.ic0.app/#authorize"
      //   : `http://localhost:4943?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}#authorize`,
      onSuccess: async () => {
        authenticateICWithScorerApi(authClient);
        // setConnectedIC(true);
        // setReadyIC(true);
        setICPrincipal(authClient.getIdentity().getPrincipal());
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

  const authenticateEthWithScorerApi = async (wallet: WalletState) => {
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

  const authenticateICWithScorerApi = async (authClient: AuthClient) => {
    try {
      setAuthenticatingIC(true);
      const { message, signature } = await initiateSIWIC(authClient);
      const tokens = await authenticate(message, signature);

      window.localStorage.setItem(
        "connectedWallets",
        JSON.stringify([authClient.getIdentity().getPrincipal().toString()])
      );

      // store JWT access token in LocalStorage
      localStorage.setItem("access-token", tokens.access);
      headerInterceptor();

      setConnectedIC(true);
      setAuthenticatingIC(false);
      setLoginCompleteIC(true);
    } catch (e) {
      setAuthenticationError(true);
      setAuthenticatingIC(false);
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
          setReadyEth(false);
          setReadyIC(false);
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

    if (!wallet && connectedEth) {
      logout();
    }
  }, [wallet, connectedEth]);

  return (
    <UserContext.Provider
      value={{
        connected,
        readyEth,
        readyIC,
        connectedEth,
        connectedIC,
        authenticatingEth,
        authenticatingIC,
        loginComplete,
        authenticationError,
        icPrincipal,
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
