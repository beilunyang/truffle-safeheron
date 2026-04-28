/*
 * WARNING: Reference example only. Do not use this configuration in
 * production as-is. Review secret management, network parameters, gas
 * controls, and signing policy for your deployment before going live.
 */
require("dotenv").config();
const SafeheronProvider = require("@safeheron/truffle-safeheron");

const {
  SAFEHERON_BASE_URL,
  SAFEHERON_API_KEY,
  SAFEHERON_RSA_PRIVATE_KEY_PATH,
  SAFEHERON_RSA_PUBLIC_KEY_PATH,
  SAFEHERON_WEB3_ACCOUNT_KEY,
  SAFEHERON_WEB3_EVM_ADDRESS,
  SEPOLIA_RPC_URL,
} = process.env;

module.exports = {
  networks: {
    sepolia: {
      provider: () =>
        new SafeheronProvider(SEPOLIA_RPC_URL, {
          baseUrl: SAFEHERON_BASE_URL,
          apiKey: SAFEHERON_API_KEY,
          // Two ways to provide RSA keys:
          //   1. file path with `file:` prefix (loaded by the SDK)
          //   2. raw PEM string starting with "-----BEGIN ...-----"
          rsaPrivateKey: `file:${SAFEHERON_RSA_PRIVATE_KEY_PATH}`,
          safeheronRsaPublicKey: `file:${SAFEHERON_RSA_PUBLIC_KEY_PATH}`,
          requestTimeout: 10000,
          web3WalletAccountKey: SAFEHERON_WEB3_ACCOUNT_KEY,
          web3WalletEVMAddress: SAFEHERON_WEB3_EVM_ADDRESS,
        }),
      network_id: "11155111",
      networkCheckTimeout: 5000,
      // Required: signing happens remotely on Safeheron, so Truffle's local
      // dry-run cannot be performed.
      skipDryRun: true,
    },
  },
  compilers: {
    solc: {
      version: "0.8.21",
    },
  },
};
