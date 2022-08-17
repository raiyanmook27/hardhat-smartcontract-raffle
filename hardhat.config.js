/** @type import('hardhat/config').HardhatUserConfig */
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

const RINKEBY_URL = "https://eth-rinkeby.alchemyapi.io/v2/qHe54-rytGu8yNd0iCKHs175dNHfl3PN";
const PRIVATE_KEY = "a1a7b06aeba2ea6fb37c0a76723867cbec5a68e91cc44a0cca2f1eded7fac3b3";
const ETHERSCAN_API_KEY = "KKV1ZT8UYTSDK6H2M3S8ZX586RF6XGY6QE";
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        rinkeby: {
            chainId: 4,
            blockConfirmations: 6,
            url: RINKEBY_URL,
            accounts: [PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    solidity: "0.8.9",
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
};
