// --- React Methods
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Context
import { UserContext } from "../context/userContext";

const SIWEButton = ({
  className,
  login,
  testId,
  disabled,
}: {
  className?: string;
  login: () => void;
  testId: string;
  disabled?: boolean;
}) => {
  return (
    <button
      data-testid={testId}
      className={`rounded bg-purple-gitcoinpurple px-8 py-3 text-lg text-white disabled:cursor-not-allowed disabled:bg-purple-softpurple disabled:text-black ${className}`}
      onClick={login}
      disabled={disabled}
    >
      <img
        src="/assets/ethLogo.svg"
        alt="Ethereum Logo"
        className={`mr-3 inline h-auto w-4 ${disabled ? "invert" : ""}`}
      />
      <span className="inline">
        {disabled ? "Loading..." : "Sign-in with Ethereum"}
      </span>
    </button>
  );
};

const SIWICButton = ({
  className,
  login,
  testId,
  disabled,
}: {
  className?: string;
  login: () => void;
  testId: string;
  disabled?: boolean;
}) => {
  return (
    <button
      data-testid={testId}
      className={`rounded bg-purple-gitcoinpurple px-8 py-3 text-lg text-white disabled:cursor-not-allowed disabled:bg-purple-softpurple disabled:text-black ${className}`}
      onClick={login}
      disabled={disabled}
    >
      <img
        src="/assets/icp-logo.svg"
        alt="DFINITY Logo"
        className={`mr-3 inline h-auto w-4 ${disabled ? "invert" : ""}`}
      />
      <span className="inline">
        {disabled ? "Loading..." : "Sign-in with DFINITY"}
      </span>
    </button>
  );
};

const LandingPage = () => {
  const { connectedEth, connected, readyEth, authenticatingEth, loginEth, loginIC } = useContext(UserContext);

  const [ready, setReady] = useState(readyEth);
  const [authenticating, setAuthenticating] = useState(authenticatingEth);
  useEffect(() => {
    setReady(readyEth)
  }, [readyEth]);
  useEffect(() => {
    setAuthenticating(authenticatingEth)
  }, [authenticatingEth]);

  const navigate = useNavigate();

  useEffect(() => {
    if (connected) {
      navigate("dashboard/scorer");
    }
  }, [connected]);

  const authenticationOverlay = authenticating && (
    <div className="absolute top-0 left-0 z-10 h-screen w-full bg-black bg-opacity-60" />
  );

  const mainContent = (
    <div className="bg-purple-darkpurple">
      <div className="font-miriam-libre text-white">
        <img src="/assets/gitcoinWordLogo.svg" alt="Gitcoin Logo" />
        <p className="md:text-7xl my-2 -ml-1 text-5xl">Passport Scorer</p>
      </div>
      <div>
        Gitcoin Passport is a Sybil defense tool that makes it easy to protect
        your web3 community from bots and bad actors. Connect your wallet below
        to access the Passport Scorer app, which helps you create a
        &quot;Scorer&quot; for the application you want to protect from Sybil
        attackers.
      </div>
      <SIWEButton
        className="mt-10 hidden md:block"
        login={loginEth}
        testId="connectWalletButtonDesktop"
        disabled={!ready}
      />
      <SIWICButton
        className="mt-10 hidden md:block"
        login={loginIC}
        testId="connectWalletButtonDesktop"
        disabled={!ready}
      />
    </div>
  );

  return (
    <>
      {authenticationOverlay}
      <div className="col-span-4 mb-14 justify-self-center md:self-center xl:col-span-6">
        {mainContent}
      </div>
      <div className="col-span-4 grid h-full grid-rows-[1fr_auto] md:hidden">
        <div></div>
        <SIWEButton
          className="col-span-4 block md:hidden"
          login={loginEth}
          disabled={!ready}
          testId="connectWalletButtonMobile"
        />
        <SIWICButton
          className="col-span-4 block md:hidden"
          login={loginIC}
          disabled={!ready}
          testId="connectWalletButtonMobile"
        />
      </div>
    </>
  );
};

export default LandingPage;
