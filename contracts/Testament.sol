// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract Testament {
    address payable public owner;
    address public notary;
    address payable[] public beneficiaries;

    constructor(
        address _notary,
        address payable[] memory _beneficiaries
    ) payable {
        owner = payable(msg.sender);
        notary = _notary;
        beneficiaries = _beneficiaries;
    }

    modifier isOwner() {
        require(msg.sender == owner, "you should be the owner");
        _;
    }

    modifier isNotary() {
        require(msg.sender == notary, "you should be the notary");
        _;
    }

    function withdraw(uint256 amount) public isOwner {
        require(
            address(this).balance >= amount,
            "testament contract has not enough tokens"
        );
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Withdraw failed.");
    }

    function ownerDied() public isNotary {
        require(msg.sender == notary, "you should be the notary");
        uint256 amount = address(this).balance / beneficiaries.length;
        uint256 amountNotary = address(this).balance % beneficiaries.length;
        for (uint i = 0; i < beneficiaries.length; i++) {
            (bool success, ) = beneficiaries[i].call{value: amount}("");
            require(success, "transfer to beneficiary failed.");
        }
        if (amountNotary > 0) {
            (bool success, ) = notary.call{value: amountNotary}("");
            require(success, "transfer to notary failed.");
        }
    }
}
