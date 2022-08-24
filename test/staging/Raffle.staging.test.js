const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

//staging test runs on the test net
developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle, raffleEntranceFee, deployer;

          beforeEach(async function () {
              deployer = (await ethers.getSigners()).deployer; // could also do with getNamedAccounts
              raffle = await ethers.getContract("Raffle", deployer);
              raffleEntranceFee = await raffle.getEntranceFee();
          });

          describe("fulfillRandomWords", function () {
              it("works with live chainlink keepers and VRF, we get a random winner", async function () {
                  //enter raffle
                  const startingTimeStamp = await raffle.getLatestTimeStamp();
                  const accounts = await ethers.getSigners();

                  //setup listener before we enter the raffle
                  await new Promise(async (resolve, reject) => {
                      raffle.once("winnerPicked", async () => {
                          console.log("winner Picked event fired!");

                          try {
                              //get recent winner
                              const recentWinner = await raffle.getRecentWinner();
                              const raffleState = await raffle.getRaffleState();
                              const winnerEndingBalance = await accounts[0].getBalance();
                              const endingTimeStamp = await raffle.getLatestTimeStamp();

                              //asserts
                              await expect(raffle.getPlayer(0)).to.be.reverted;
                              assert.equal(recentWinner.toString(), accounts[0].toString());
                              assert.equal(raffleState, 0);
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              );
                              assert(endingTimeStamp > startingTimeStamp);
                              resolve();
                          } catch (error) {
                              console.log(error);
                              reject(e);
                          }
                      });
                  });
                  //waits
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  const winnerStartingBalance = await accounts[0].getBalance();
                  //just incase the blockchain moves really fast

                  //
              });
          });
      });
