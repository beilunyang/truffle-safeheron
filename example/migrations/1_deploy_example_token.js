const ExampleToken = artifacts.require("ExampleToken");

module.exports = function (deployer) {
  // 1,000,000 EXT with 18 decimals
  const initialSupply = web3.utils.toWei("1000000", "ether");
  deployer.deploy(ExampleToken, initialSupply);
};
