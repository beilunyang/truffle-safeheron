# Safeheron Truffle Plugin Example

A minimal, runnable Truffle project that deploys a standard OpenZeppelin ERC20 token (`ExampleToken`, symbol `EXT`, initial supply 1,000,000) to Sepolia using `@safeheron/truffle-safeheron`.

> **WARNING — for reference only. Do not use this example directly in production.**
>
> It is intentionally minimal to illustrate plugin wiring. Before any production use, review at least:
> - **Secret management.** `.env` is fine for a demo; production should use a real secrets manager and never load private keys from a working tree.
> - **Network config.** Sepolia values here (RPC, `network_id`, `skipDryRun`) are demo-grade; verify gas, timeouts, and dry-run policy for your real network.
> - **Contract code.** The OZ ERC20 used here is unaudited as deployed by this example; treat any token minted from it as a demo asset.
> - **Signing policy.** Each transaction requires a manual approval in the Safeheron mobile app — ensure that matches your operational model.

## Prerequisites

- Node.js (`>16 <=18.18`)
- A Safeheron Open API key, RSA key pair, and a Web3 wallet — see https://safeheron.com
- A Sepolia RPC endpoint (Infura / Alchemy / your own node)

## Quick start

From this directory:

```bash
npm start
```

`scripts/run.js` will, in order:

1. Build the plugin in the repo root if `../dist` is missing.
2. Install this project's dependencies if `node_modules/` is missing.
3. Bootstrap `.env` from `.env.example` and exit so you can fill in credentials.
4. Run `truffle migrate --network sepolia` once `.env` is populated.

So a typical first-time flow is `npm start` → fill in `.env` → `npm start` again. The migration triggers a signing request that you must approve in the Safeheron mobile app before the deployment broadcasts.

## Manual steps (equivalent)

If you prefer to run each step yourself:

1. Build the plugin from the repo root (the example references it via `file:..`):

   ```bash
   cd ..
   npm install
   npm run build
   ```

2. Install example dependencies:

   ```bash
   cd example
   npm install
   ```

3. Copy the environment template and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

4. Run the migration:

   ```bash
   npm run migrate
   ```

## Interact with the deployed contract

After `migrate` succeeds, run:

```bash
npm run interact
```

This executes [scripts/interact.js](scripts/interact.js) via `truffle exec --network sepolia`, which routes every state-changing call through `SafeheronProvider` — the same signing path used during deployment. The demo issues:

1. `transfer(from, 1)` — smallest possible unit (1 wei of EXT), transferred to self.
2. `approve(from, 1)` followed by an `allowance` read to confirm the change landed.

Each write triggers a Safeheron mobile-app approval. Self-transfer / self-approve still exercises the full signing path, so no extra configuration is needed beyond the deployment credentials.

## Files

| Path | Purpose |
| --- | --- |
| `truffle-config.js` | Network configuration using `SafeheronProvider`, env-driven |
| `contracts/ExampleToken.sol` | OpenZeppelin-based ERC20 token |
| `migrations/1_deploy_example_token.js` | Truffle migration script |
| `.env.example` | Environment variable template (copy to `.env`) |
| `scripts/run.js` | One-shot setup + migrate driver invoked by `npm start` |
| `scripts/interact.js` | Post-deploy demo of non-deployment contract calls (`npm run interact`) |
