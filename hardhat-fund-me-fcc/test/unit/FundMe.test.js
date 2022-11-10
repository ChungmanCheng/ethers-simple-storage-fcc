
const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("FundMe", async function(){
    let fundMe;
    let deployer;
    let mockV3Aggregator;
    const sendValue = ethers.utils.parseEther("1");
    beforeEach( async function(){
        // deploy our fundMe contract
        // using Hardhat-deploy
        // const accounts = await ethers.getSigners();
        // const accountOne = accounts[0];

        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    });

    describe("Constructor", async function(){
        it("sets the aggregator addresses correctly", async function(){
            const response = await fundMe.getPriceFeed();
            assert.equal(response, mockV3Aggregator.address);
        })
    }),

    describe("Fund", async function(){
        it("Fails if you don't snend enough ETH", async function(){
            await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!");
        });
    } );

    describe("Adds funder to array of funders", async function(){
        await fundMe.fund({value: sendValue});
        const funder = await fundMe.funders(0);
        assert.equal(funder, deployer);
    });

    describe("withdraw", async function(){
        beforeEach(async () =>{
            await fundMe.fund({value: sendValue});
        });

        it("Withdraw ETH from a single founder", async ()=>{
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );
            
            // Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );

            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal( startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString() );

        });

        it("Withdraw ETH from a single founder with cheaper withdrawal", async ()=>{
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );
            
            // Act
            const transactionResponse = await fundMe.cheaperWithdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );

            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal( startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString() );

        });

        it("Allow us to withdraw with multiple funders", async function(){
            // Arrange
            const accounts = await ethers.getSigners();
            for (let i = 1; i < 6; i++){
                const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                await fundMeConnectedContract.fund({value: sendValue});
            }

            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
            
            // Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString());

            // Make sure that the funders are reset properly
            await expect(fundMe.getFunder(0)).to.be.reverted;

            for (let i = 1; i < 6; i++){
                assert.equal( await fundMe.getAddressToAmountFunded(accounts[i].address), 0 );
            }

        });

        it("Allow us to withdraw with multiple funders with cheaper withdrawal", async function(){
            // Arrange
            const accounts = await ethers.getSigners();
            for (let i = 1; i < 6; i++){
                const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                await fundMeConnectedContract.fund({value: sendValue});
            }

            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Act
            const transactionResponse = await fundMe.cheaperWithdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
            
            // Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString());

            // Make sure that the funders are reset properly
            await expect(fundMe.getFunder(0)).to.be.reverted;

            for (let i = 1; i < 6; i++){
                assert.equal( await fundMe.getAddressToAmountFunded(accounts[i].address), 0 );
            }

        });

        it("Only allows the owner to withdraw", async ()=>{
            const accounts = await ethers.getSigners();
            const attacker = accounts[1];
            const attackerConnectedContract = await fundMe.connect(attacker);
            await expect(attackerConnectedContract.withdraw()).to.be.reverted;
        });
    });

});
