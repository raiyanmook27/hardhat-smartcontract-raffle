const { network, ethers } = require("hardhat");
const {
    developmentChains,
    verify,
    networkConfig,
    deploymentChains,
} = require("../helper-hardhat-config");
const VRF_SUB_AMOUNT = ethers.utils.parseEther("2");

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordinatorV2Address, subscriptionId;
    const name = network.name;
    const chains = deploymentChains;
    const boolCh = chains.includes(name);
    if (boolCh) {
        //for deploying local
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const transRespnse = await vrfCoordinatorV2Mock.createSubscription();
        const transRec = await transRespnse.wait(1);
        //create subcriptionId
        subscriptionId = transRec.events[0].args.subId;
        // fund the subs
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_AMOUNT);
    } else {
        //for deploying on testnets
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    const entranceFee = networkConfig[chainId]["entranceFee"];
    const gasLane = networkConfig[chainId]["gasLane"];
    const callBackGasLimit = networkConfig[chainId]["callBackGasLimit"];
    const interval = networkConfig[chainId]["interval"];
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: [
            vrfCoordinatorV2Address,
            entranceFee,
            gasLane,
            subscriptionId,
            callBackGasLimit,
            interval,
        ],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying.......");
        await verify(raffle.address, args);
    }
    log("--------------------------------------");
};

module.exports.tags = ["all", "raffle"];
