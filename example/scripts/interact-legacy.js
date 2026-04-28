// Forces the legacy (type 0) gas branch in SafeheronProvider.createTransaction
// by passing `gasPrice` explicitly and omitting `maxFeePerGas` /
// `maxPriorityFeePerGas`. The default `interact.js` exercises the EIP-1559
// branch; this script covers the other half.
//
// Run with:
//   npm run interact:legacy
// or:
//   truffle exec --network sepolia scripts/interact-legacy.js

const ExampleToken = artifacts.require("ExampleToken");

module.exports = async function (callback) {
  try {
    const [from] = await web3.eth.getAccounts();

    const token = await ExampleToken.deployed();
    const gasPrice = await web3.eth.getGasPrice();

    console.log(`token:    ${token.address}`);
    console.log(`from:     ${from}`);
    console.log(`gasPrice: ${gasPrice} wei (legacy tx)`);

    console.log("\n[1/1] transfer 1 EXT-wei (legacy gas) — approve in Safeheron app...");
    const tx = await token.transfer(from, "1", { from, gasPrice });
    console.log(`      tx: ${tx.tx}`);

    callback();
  } catch (err) {
    console.error("interact-legacy failed:", err);
    if (err && err.data) console.error("data:", err.data);
    if (err && err.cause) console.error("cause:", err.cause);
    callback(err);
  }
};
