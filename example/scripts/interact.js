// Demonstrates non-deployment contract calls routed through SafeheronProvider.
// Run with:
//   npm run interact
// or:
//   truffle exec --network sepolia scripts/interact.js
//
// Each write call (transfer / approve) goes through the plugin's signing path
// and must be approved in the Safeheron mobile app before broadcast. Reads
// after the writes are only there to confirm the on-chain effect.

const ExampleToken = artifacts.require("ExampleToken");

module.exports = async function (callback) {
  try {
    const [from] = await web3.eth.getAccounts();

    const token = await ExampleToken.deployed();
    console.log(`token: ${token.address}`);
    console.log(`from:  ${from}`);

    // 1. transfer the smallest possible amount (1 wei of EXT) to self.
    console.log("\n[1/2] transfer 1 EXT-wei — approve in Safeheron app...");
    const transferTx = await token.transfer(from, "1", { from });
    console.log(`      tx: ${transferTx.tx}`);

    // 2. approve the smallest possible amount to self, then read the allowance.
    console.log("\n[2/2] approve 1 EXT-wei — approve in Safeheron app...");
    const approveTx = await token.approve(from, "1", { from });
    console.log(`      tx: ${approveTx.tx}`);

    const allowance = await token.allowance(from, from);
    console.log(`      allowance(from, from) = ${allowance.toString()}`);

    callback();
  } catch (err) {
    console.error("interact failed:", err);
    if (err && err.data) console.error("data:", err.data);
    if (err && err.cause) console.error("cause:", err.cause);
    callback(err);
  }
};
