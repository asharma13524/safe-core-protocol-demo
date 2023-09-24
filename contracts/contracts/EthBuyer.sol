// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafe} from "@safe-global/safe-core-protocol/contracts/interfaces/Accounts.sol";
import {ISafeProtocolPlugin} from "@safe-global/safe-core-protocol/contracts/interfaces/Integrations.sol";
import {ISafeProtocolManager} from "@safe-global/safe-core-protocol/contracts/interfaces/Manager.sol";
import {BasePluginWithEventMetadata, PluginMetadata} from "./Base.sol";
import {SafeTransaction, SafeRootAccess, SafeProtocolAction} from "@safe-global/safe-core-protocol/contracts/DataTypes.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import "hardhat/console.sol";

/**
 * @title RecoveryWithDelayPlugin - A contract compatible with Safe{Core} Protocol that replaces a specified owner for a Safe by a non-owner account.
 * @notice This contract should be listed in a Registry and enabled as a Plugin for an account through a Manager to be able to intiate recovery mechanism.
 * @dev The recovery process is initiated by a recoverer account. The recoverer account is set during the contract deployment in the constructor and cannot be updated.
 *      The recoverer account can initiate the recovery process by calling the createAnnouncement function and later when the delay is over, any account can execute
 *      complete the recovery process by calling the executeFromPlugin function.
 * @author Akshay Patel - @akshay-ap
 */
contract EthBuyer is BasePluginWithEventMetadata {
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    uint24 public constant poolFee = 3000;

    ISwapRouter public immutable swapRouter;
    address public immutable trustedOrigin;
    bytes4 public immutable relayMethod;

    constructor(
        ISwapRouter _swapRouter,
        address _trustedOrigin,
        bytes4 _relayMethod
    )
        BasePluginWithEventMetadata(
            PluginMetadata({
                name: "EthBuyer Plugin",
                version: "1.0.0",
                requiresRootAccess: true,
                iconUrl: "",
                appUrl: "https://5afe.github.io/safe-core-protocol-demo/#/relay/${plugin}"
            })
        )
    {
        swapRouter = _swapRouter;
        trustedOrigin = _trustedOrigin;
        relayMethod = _relayMethod;
    }

    function returnBlockHeight () external view returns (uint) {
        return block.number;
    }

    function executeFromPlugin(
        ISafeProtocolManager manager,
        ISafe safe,
        SafeTransaction calldata,
        uint256 amountIn
    ) external payable returns (bytes memory data) {
        // bytes32 txHash = getTransactionHash(address(manager), address(safe), prevOwner, oldOwner, newOwner, nonce);
        // Announcement memory announcement = announcements[txHash];

        // if (announcement.executed) {
        //     revert TransactionAlreadyExecuted(txHash);
        // }

        // if (block.timestamp < uint256(announcement.executionTime)) {
        //     revert TransactionExecutionNotAllowedYet(txHash);
        // }

        // if (
        //     announcement.validityDuration != 0 &&
        //     block.timestamp > uint256(announcement.executionTime) + uint256(announcement.validityDuration)
        // ) {
        //     revert TransactionExecutionValidityExpired(txHash);
        // }

        // announcements[txHash].executed = true;
        console.log("inside execute from plugin");

        bytes memory txData = abi.encodeWithSignature("swapExactInputSingle(uint256)", amountIn);

        SafeProtocolAction memory safeProtocolAction = SafeProtocolAction(payable(address(safe)), 0, txData);
        SafeRootAccess memory safeTx = SafeRootAccess(safeProtocolAction, 0, "");
        (data) = manager.executeRootAccess(safe, safeTx);

        // emit OwnerReplaced(address(safe), oldOwner, newOwner);
    }

    /// @notice swapExactInputSingle swaps a fixed amount of USDC for a maximum possible amount of WETH9
    /// using the USDC/WETH9 0.3% pool by calling `exactInputSingle` in the swap router.
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its DAI for this function to succeed.
    /// @param amountIn The exact amount of USDC that will be swapped for WETH9.
    /// @return amountOut The amount of WETH9 received.
    function swapExactInputSingle(
        // ISafeProtocolManager manager,
        // ISafe safe,
        uint256 amountIn) external payable returns (uint256 amountOut) {

        console.log("inside swap");
        // msg.sender must approve this contract

        // Transfer the specified amount of USDC to this contract.

        console.log("after transfer from");

        // Approve the router to spend USDC.
        TransferHelper.safeApprove(DAI, address(swapRouter), amountIn);

        console.log("after safeApprove");

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: DAI,
                tokenOut: WETH9,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        console.log("after params");
        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);

        console.log("SWAPPING");
    }

}
