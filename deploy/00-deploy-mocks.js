const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { network } = require("hardhat");
//parameters of mock contract
const BASE_FEE = ethers.utils.parseEther("0.25");
//calculated value based on gas price of the chain.
//chain link nodes pay gas price get 0.25 from users
const GAS_PRICE_LINK = 1e9;
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const args = [BASE_FEE, GAS_PRICE_LINK];

    if (developmentChains == network.name) {
        log("local network detected! Deploying mocks.....");
        //deploy mock vrfCoordinator
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        });
        log("Mocks Deployed");
        log("................................................");
    }
};

module.exports.tags = ["all", "mocks"];
