// contracts/MockDAI.sol

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockDAI is ERC20 {
    constructor() ERC20("MockDAI", "mDAI") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
