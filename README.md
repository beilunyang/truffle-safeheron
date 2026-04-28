# Safeheron Truffle Plugin

This is a [Truffle](https://archive.trufflesuite.com/docs/truffle/) plugin for integrating with [Safeheron](https://www.safeheron.com).

This plugin will help you to seamlessly integrate Safeheron into your Truffle development stack.

You can use it to deploy contracts and sign transactions.

## Installation 

```bash
npm install @safeheron/truffle-safeheron
```

## Usage

Configure your `truffle-config.js` in your truffle project. Load every secret
from environment variables — never paste an RSA private key (or any other
credential) into a config file that is tracked by git.

```javascript
require("dotenv").config();
const SafeheronProvider = require("@safeheron/truffle-safeheron");

module.exports = {
  // ...
  networks: {
    sepolia: {
      provider: () => new SafeheronProvider(process.env.SEPOLIA_RPC_URL, {
        baseUrl: process.env.SAFEHERON_BASE_URL,
        apiKey: process.env.SAFEHERON_API_KEY,
        // Load RSA keys from files outside the working tree. The `file:`
        // prefix tells the SDK to read the PEM from disk.
        rsaPrivateKey: `file:${process.env.SAFEHERON_RSA_PRIVATE_KEY_PATH}`,
        safeheronRsaPublicKey: `file:${process.env.SAFEHERON_RSA_PUBLIC_KEY_PATH}`,
        requestTimeout: 10000,
        web3WalletAccountKey: process.env.SAFEHERON_WEB3_ACCOUNT_KEY,
        web3WalletEVMAddress: process.env.SAFEHERON_WEB3_EVM_ADDRESS,
      }),
      network_id: "11155111",
      networkCheckTimeout: 5000,
      // This field must be set to true!
      skipDryRun: true
    }
  },

  // ...

};
```

`rsaPrivateKey` and `safeheronRsaPublicKey` also accept a raw PEM string
(`-----BEGIN ...-----\n...\n-----END ...-----`) for ad-hoc local debugging.
Do not use that form in any file that may be committed — paste a PEM into a
tracked config and it lives in git history forever. For production, prefer a
real secrets manager over `.env`.

## Example

A complete, runnable Truffle project lives in [example/](./example). It demonstrates an end-to-end Sepolia deployment with environment-driven configuration. See [example/README.md](./example/README.md) for setup steps.

## QA

1. How to get `web3WalletAccountKey` and `web3WalletEVMAddress` ?

Please open [Safeheron Web Console](https://console.safeheron.com/wallet), choose an Web3 wallet which you want to use, 
click to go to wallet detail page,
then you will see a link like https://console.safeheron.com/wallet/account58xxxxcbf34_web3 in your browser address bar,
the `account58xxxxcbf34` string without `_web3` suffix is your web3 account key. 
And you can also copy your Web3 EVM address at the top of this page.

