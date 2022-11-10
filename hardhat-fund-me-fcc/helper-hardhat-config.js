const networkConfig = {

    31337: {
        name: "hardhat",
    },
    
    5: {
        name: "Goerli",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"
    },

}

const developmentChains = ["hardhat", "Goerli"];

module.exports = {
    networkConfig,
    developmentChains
};