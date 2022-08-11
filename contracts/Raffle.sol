//SPDX-License-Identifier:MIT

pragma solidity ^0.8.9;

//Enter the lottery
//Pick a random winer(verifiable random)
// Winner to be selected every X minutes
//Using chainlink Oracle ->Randomness(VRF), Automated Execution(Chainlink Keepers)
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

/*--------Errors----------*/
error Raffle__NotEnoughETH();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error RaffleUpKeepNotNeeded(uint256 balance, uint256 playersLength, uint256 state);

/**
 * @title A sample Raffle Contract
 * @author Raiyan Collins
 * @notice This is for creating untamperable Decentralized Smart contrcts
 * @dev This implements ChailinkVRFV2 and Chainlink Keepers
 */
contract Raffle is VRFConsumerBaseV2, KeeperCompatible {
    /*--------Enums------*/
    enum RaffleState {
        OPEN,
        CALCULATING
    }
    /*--------State Variables---------*/
    //minimum entrance fee
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;
    RaffleState private s_raffleState;

    //Raffle varaibles
    address private s_recentWinner;
    uint256 private s_timeStamp;
    uint256 private immutable i_interval;

    /*---------Events---------------- */
    event RaffleEntered(address indexed player);
    event RequestedRaffleWinner(uint256 requestId);
    event WinnerPicked(address _winner);

    modifier EnoughEth(uint256 value, uint256 _entranceFee) {
        if (value < _entranceFee) {
            revert Raffle__NotEnoughETH();
        }
        _;
    }

    /*------------Functions--------------------------*/

    constructor(
        address vrfCoordinatorV2, //contract
        uint256 _entranceFee,
        bytes32 _gasLane,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit,
        uint256 _interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = _entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = _gasLane;
        i_subscriptionId = _subscriptionId;
        i_callbackGasLimit = _callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_timeStamp = block.timestamp;
        i_interval = _interval;
    }

    //enter raffle
    function enterRaffle() public payable EnoughEth(msg.value, i_entranceFee) {
        if (s_raffleState != RaffleState.OPEN) revert Raffle__NotOpen();
        s_players.push(payable(msg.sender));
        emit RaffleEntered(msg.sender);
    }

    /**
     * @dev This is the function that chainlink keeper nodes call
     * they look for the upkeep to return true
     * followning should be true inorder to return true:
     * 1.Our time interval should have passed
     * 2. The raffle should have a least 1 player and hav some ETH
     * 3. subscription has to be funded with link
     * 4. The raffle should be in an open state
     */
    function checkUpkeep(
        bytes memory /*checkData*/
    )
        public
        view
        override
        returns (
            bool upkeep,
            bytes memory /*perfromData*/
        )
    {
        //if reaffle is open
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool timePassed = ((block.timestamp - s_timeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = address(this).balance > 0;

        upkeep = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    //pickRandom Winner
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upKeep, ) = checkUpkeep("");

        if (!upKeep) {
            revert RaffleUpKeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }

        //request random number
        //do something with it
        //2 transaction process to prevent atacks

        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, // gas lane (maximum price of gas you are willing to pay)
            i_subscriptionId,
            REQUEST_CONFIRMATIONS, // number of confirmations to wait before responding to request
            i_callbackGasLimit, // specify gas limit to be used
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    //What to do with the random number
    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        //pick random winner
        // random number requested maybe large so
        // we reduce it with the moudulo

        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffleState = RaffleState.OPEN;
        // reset players
        s_players = new address payable[](0);
        //reset timer
        s_timeStamp = 0;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");

        if (!success) revert Raffle__TransferFailed();
        emit WinnerPicked(recentWinner);
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 _index) public view returns (address) {
        return s_players[_index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getlastestTimeStamp() public view returns (uint256) {
        return s_timeStamp;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }
}
