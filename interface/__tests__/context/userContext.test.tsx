import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { UserProvider, UserContext } from "../../context/userContext";
import { useConnectWallet, useWallets } from "@web3-onboard/react";
import { EIP1193Provider, WalletState } from "@web3-onboard/core";
import { initiateSIWE } from "../../utils/siwe";
import { authenticateEth } from "../../utils/account-requests";

const mockWallet: WalletState = {
  accounts: [
    {
      address: "0xc79abb54e4824cdb65c71f2eeb2d7f2dasds1fb8",
      ens: null,
      uns: null,
      balance: {
        ETH: "0.000093861007065",
      },
    },
  ],
  chains: [
    {
      namespace: "evm",
      id: "0x1",
    },
  ],
  icon: "",
  label: "Meatmask",
  provider: {} as EIP1193Provider,
};

const secondAccount = {
  address: "0x2c79abb54e4824cdb65c71f2eeb2d7f2dasdasdfg",
  ens: null,
  uns: null,
  balance: {
    ETH: "0.000093861007065",
  },
}
const mockWallet2Accounts = {
  ...mockWallet,
  accounts: [
    ...mockWallet.accounts,
    secondAccount,
  ],
}

const connect = jest.fn();

jest.mock("@web3-onboard/react", () => ({
  useConnectWallet: jest.fn(),
  useWallets: jest.fn(),
  init: jest.fn(),
  connect: jest.fn(),
}));

jest.mock("../../utils/siwe");
jest.mock("../../utils/account-requests");

const mockComponent = () => (
  <UserProvider>
    <UserContext.Consumer>
      {(value) => (
        <div>
          <button onClick={value.login}>Login</button>
          <span data-testid="connected">{value.connectedEth.toString()}</span>
          <span data-testid="authenticationError">
            {value.authenticationError.toString()}
          </span>
          <span data-testid="authenticating">
            {value.authenticatingEth.toString()}
          </span>
          <span data-testid="loginComplete">
            {value.loginComplete.toString()}
          </span>
          <span data-testid="ready">{value.readyEth.toString()}</span>
        </div>
      )}
    </UserContext.Consumer>
  </UserProvider>
);

const disconnect = jest.fn();

describe("UserProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (initiateSIWE as jest.Mock).mockResolvedValue({
      siweMessage: {},
      signature: "signature",
    });
    (authenticateEth as jest.Mock).mockResolvedValue({
      access: "token",
    });
  });
  it("renders with initial state values", async () => {
    (useConnectWallet as jest.Mock).mockReturnValue([
      { wallet: null },
      connect,
    ]);
    render(mockComponent());

    expect(screen.getByTestId("connected")).toHaveTextContent("false");
    expect(screen.getByTestId("authenticationError")).toHaveTextContent(
      "false"
    );
    expect(screen.getByTestId("authenticating")).toHaveTextContent("false");
    expect(screen.getByTestId("loginComplete")).toHaveTextContent("false");
    await waitFor(() =>
      expect(screen.getByTestId("ready")).toHaveTextContent("true")
    );
  });

  it("logs in a user", async () => {
    const connect = jest.fn().mockResolvedValue([mockWallet]);
    (useConnectWallet as jest.Mock).mockReturnValue([
      { wallet: mockWallet },
      connect,
    ]);

    render(mockComponent());

    screen.getByText("Login").click();

    await waitFor(async () => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
      expect(screen.getByTestId("ready")).toHaveTextContent("true");
      expect(screen.getByTestId("authenticationError")).toHaveTextContent(
        "false"
      );
      expect(screen.getByTestId("authenticating")).toHaveTextContent("false");
      expect(screen.getByTestId("loginComplete")).toHaveTextContent("true");
    });
  });

  it("logs out a user", async () => {
    const connect = jest.fn().mockResolvedValue([mockWallet]);
    (useConnectWallet as jest.Mock).mockReturnValue([
      { wallet: mockWallet },
      connect,
      disconnect,
    ]);

    (useWallets as jest.Mock).mockReturnValue([
      { wallet: mockWallet },
    ]);

    const { rerender } = render(mockComponent());

    // click the login button
    screen.getByText("Login").click();

    await waitFor(async () => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    (useConnectWallet as jest.Mock).mockReturnValue([
      { wallet: null },
      connect,
      disconnect,
    ]);

    rerender(mockComponent());
    await waitFor(async () => {
      expect(screen.getByTestId("connected")).toHaveTextContent("false");
      expect(screen.getByTestId("authenticationError")).toHaveTextContent(
        "false"
      );
      expect(screen.getByTestId("loginComplete")).toHaveTextContent("false");
    });
  });

  it("logs out a user if they have two accounts connected", async () => {
    (initiateSIWE as jest.Mock).mockResolvedValue({
      siweMessage: {},
      signature: "signature",
    });
    const connect = jest.fn().mockResolvedValue([mockWallet]);
    (useConnectWallet as jest.Mock).mockReturnValue([
      { wallet: mockWallet },
      connect,
      disconnect,
    ]);

    const { rerender } = render(mockComponent());

    // click the login button
    screen.getByText("Login").click();

    await waitFor(async () => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    (useWallets as jest.Mock).mockReturnValue([
      { wallet: mockWallet },
      { wallet: mockWallet2Accounts },
    ]);

    rerender(mockComponent());
    await waitFor(async () => {
      expect(screen.getByTestId("connected")).toHaveTextContent("false");
      expect(screen.getByTestId("authenticationError")).toHaveTextContent(
        "false"
      );
      expect(screen.getByTestId("loginComplete")).toHaveTextContent("false");
    });
  });

  it("logs out a user if they have two wallets connected", async () => {
    (initiateSIWE as jest.Mock).mockResolvedValue({
      siweMessage: {},
      signature: "signature",
    });
    const connect = jest.fn().mockResolvedValue([mockWallet]);
    (useConnectWallet as jest.Mock).mockReturnValue([
      { wallet: mockWallet },
      connect,
      disconnect,
    ]);

    const { rerender } = render(mockComponent());

    // click the login button
    screen.getByText("Login").click();

    await waitFor(async () => {
      expect(screen.getByTestId("connected")).toHaveTextContent("true");
    });

    (useConnectWallet as jest.Mock).mockReturnValue([
      { wallet: mockWallet2Accounts },
      connect,
      disconnect,
    ]);

    rerender(mockComponent());
    await waitFor(async () => {
      expect(screen.getByTestId("connected")).toHaveTextContent("false");
      expect(screen.getByTestId("authenticationError")).toHaveTextContent(
        "false"
      );
      expect(screen.getByTestId("loginComplete")).toHaveTextContent("false");
    });
  });

  it("resets state if user rejects signature", async () => {
    const connect = jest.fn().mockResolvedValue([mockWallet]);
    (useConnectWallet as jest.Mock).mockReturnValue([
      { wallet: mockWallet },
      connect,
      disconnect
    ]);

    (initiateSIWE as jest.Mock).mockRejectedValue({
      detail: "User rejected signature",
    });

    render(mockComponent());

    // click the login button
    screen.getByText("Login").click();
    await waitFor(() =>
      expect(screen.getByTestId("ready")).toHaveTextContent("true")
    );
    expect(screen.getByTestId("connected")).toHaveTextContent("false");
    expect(screen.getByTestId("loginComplete")).toHaveTextContent("false");
  });
});
