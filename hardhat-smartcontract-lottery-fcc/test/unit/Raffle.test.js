
const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", async function(){
        let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval, accounts;
        const chainId = network.config.chainId;

        beforeEach(async function(){
            accounts = await ethers.getSigners();
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);
            raffle = await ethers.getContract("Raffle", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            raffleEntranceFee = await raffle.getEntranceFee();
            interval = await raffle.getInterval();
        });

        describe("constructor", function(){

            it("initializes the raffle correctly", async function(){
                // Ideally we make our tests have just 1 assert per "it"
                const raffleState = (await raffle.getRaffleState()).toString();
                const interval = await raffle.getInterval();
                assert.equal(raffleState.toString(), "0");
                assert.equal(interval.toString(), networkConfig[chainId]["keepersUpdateInterval"]);
            });
        
        });

        describe("enterRaffle", function(){

            it("reverts when you don't pay enough", async function(){
                await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(raffle, 'Raffle__SendMoreToEnterRaffle');
            });

            it("records players when they enter", async function(){
                // raffleEntranceFee
                await raffle.enterRaffle({value: raffleEntranceFee});
                const playerFromContract = await raffle.getPlayer(0);
                assert.equal(playerFromContract, deployer);
            });

            it("emits event on enter", async function(){
                await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.emit(raffle, "RaffleEnter");
            });

            it("doesn't allow entrance when raffle is caulating", async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                // We pretend to be a Chainlink Keeper
                await raffle.performUpkeep([]);
                await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.be.revertedWithCustomError(raffle, "Raffle__RaffleNotOpen");
            });

        });

        describe("checkUpkeep", function(){

            it ("returns false if people haven't sent any ETH", async function(){
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x");
                assert(!upkeepNeeded);
            });

            it("returns false if raffle isn't open", async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                await raffle.performUpkeep([]);
                const raffleState = await raffle.getRaffleState();
                const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x");
                assert.equal(raffleState.toString(), "1");
                assert.equal(upkeepNeeded, false);
            });

            it("returns false if enough time hasn't passed", async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() - 2]);
                await network.provider.send("evm_mine", []);
                const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x");
                assert.equal(upkeepNeeded, false);
            });

            it("returns true if enough time has passed, has players, eth, and is open", async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
                assert.equal(upkeepNeeded, true);
            });

        });

        describe("performUpkeep", function () {
            it("can only run if checkupkeep is true", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
                const tx = await raffle.performUpkeep("0x");
                assert(tx);
            });

            it("reverts if checkup is false", async () => {
                await expect(raffle.performUpkeep("0x")).to.be.revertedWithCustomError( 
                    raffle, "Raffle__UpkeepNotNeeded"
                )
            });

            it("updates the raffle state and emits a requestId", async () => {
                // Too many asserts in this test!
                await raffle.enterRaffle({ value: raffleEntranceFee });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
                const txResponse = await raffle.performUpkeep("0x"); // emits requestId
                const txReceipt = await txResponse.wait(1); // waits 1 block
                const raffleState = await raffle.getRaffleState(); // updates state
                const requestId = txReceipt.events[1].args.requestId;
                assert(requestId.toNumber() > 0);
                assert(raffleState == 1); // 0 = open, 1 = calculating
            });
        });

        describe("fulfullRandomWords", function(){

            beforeEach(async function(){
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.request({ method: "evm_mine", params: [] });
            });

            it("can only be called after performUpkeep", async function(){
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request");
            });

            it("picks a winner, resets, and sends money", async () => {
                const additionalEntrances = 3; // to test
                const startingIndex = 2;
                for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) { // i = 2; i < 5; i=i+1
                    raffle = raffle.connect(accounts[i]); // Returns a new instance of the Raffle contract connected to player
                    await raffle.enterRaffle({ value: raffleEntranceFee });
                }
                const startingTimeStamp = await raffle.getLastTimeStamp(); // stores starting timestamp (before we fire our event)

                // This will be more important for our staging tests...
                await new Promise(async (resolve, reject) => {
                    raffle.once("WinnerPicked", async () => { // event listener for WinnerPicked
                        console.log("WinnerPicked event fired!");
                        // assert throws an error if it fails, so we need to wrap
                        // it in a try/catch so that the promise returns event
                        // if it fails.
                        try {
                            // Now lets get the ending values...
                            const recentWinner = await raffle.getRecentWinner();
                            const raffleState = await raffle.getRaffleState();
                            const winnerBalance = await accounts[2].getBalance();
                            const endingTimeStamp = await raffle.getLastTimeStamp();
                            await expect(raffle.getPlayer(0)).to.be.reverted;
                            // Comparisons to check if our ending values are correct:
                            assert.equal(recentWinner.toString(), accounts[2].address);
                            assert.equal(raffleState, 0);
                            assert.equal(
                                winnerBalance.toString(), 
                                startingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                                    .add(
                                        raffleEntranceFee
                                            .mul(additionalEntrances)
                                            .add(raffleEntranceFee)
                                    )
                                    .toString()
                            )
                            assert(endingTimeStamp > startingTimeStamp);
                            resolve(); // if try passes, resolves the promise 
                        } catch (e) { 
                            reject(e) // if try fails, rejects the promise
                        }
                    })

                    // kicking off the event by mocking the chainlink keepers and vrf coordinator
                    const tx = await raffle.performUpkeep("0x");
                    const txReceipt = await tx.wait(1);
                    const startingBalance = await accounts[2].getBalance();
                    await vrfCoordinatorV2Mock.fulfillRandomWords(
                        txReceipt.events[1].args.requestId,
                        raffle.address
                    );
                })
            });
        })

    });
