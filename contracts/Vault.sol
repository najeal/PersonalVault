// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Vault {
    address payable public owner;

    constructor() payable {
        owner = payable(msg.sender);
    }

    modifier isOwner {
        require(msg.sender == owner, "you should be the owner");
        _;
    }

    function withdraw(uint256 amount) public isOwner {
        require(address(this).balance > amount, "vault has not enough token");
        //owner.transfer(amount);
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Payment failed.");
    }
}