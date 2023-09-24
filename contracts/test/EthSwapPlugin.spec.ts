import hre, { deployments, ethers } from "hardhat";
import { expect } from "chai";
import { getProtocolManagerAddress } from "../src/utils/protocol";
import { getEthSwapPlugin } from "../src/utils/contracts";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ISafeProtocolManager__factory, ISafeProtocolPlugin__factory, ISafe__factory } from "../typechain-types";
import { SafeProtocolAction, SafeRootAccess } from "../src/utils/dataTypes";
import { MaxUint256, ZeroHash } from "ethers";
import { buildSingleTx, buildTransferDAITx } from "../src/utils/builder";
const ERC20ABI = require("./erc20abi.json");


describe("EthBuyer", () => {
    let deployer: SignerWithAddress,
        recoverer: SignerWithAddress,
        user1: SignerWithAddress,
        user2: SignerWithAddress,
        user3: SignerWithAddress;

    const validityDuration = 60 * 60 * 24 * 100; // 100 days

    before(async () => {
        [deployer, recoverer, user1, user2, user3] = await hre.ethers.getSigners();
    });

    const setup = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();

        const DAI_ADDRESS = "0x9f62EE65a8395824Ee0821eF2Dc4C947a23F0f25";
        const manager = await ethers.getContractAt("MockContract", await getProtocolManagerAddress(hre));
        const signer = await ethers.provider.getSigner();
        const DAI = new ethers.Contract(DAI_ADDRESS, ERC20ABI, signer);
        const daiCode = await ethers.provider.getCode(DAI);
        // console.log("dai code", daiCode);
        const manager_address = await manager.getAddress();
        console.log("MANAGER ADDR", manager_address);
        await DAI.mint(manager_address, ethers.parseEther("10"));
        const managerBalance = await DAI.balanceOf(manager_address);
        console.log("-----------");
        console.log("MANAGER BALANCE", managerBalance);
        const account = await(await ethers.getContractFactory("ExecutableMockContract")).deploy();
        await DAI.mint(account, ethers.parseEther("10"));
        const accountBalance = await DAI.balanceOf(account);
        console.log("SAFE ADDR", accountBalance);
        // mint dai to the safe
        const plugin = await getEthSwapPlugin(hre);
        return {
            account,
            plugin,
            manager,
        };
    });

    it.only("Should call buyEth on a Safe account", async () => {
        const { account, plugin, manager } = await setup();

        const safeAddress = await account.getAddress();
        // need to enable module from safe
        // then can call module

        const pluginAddr = await plugin.getAddress();

        console.log(pluginAddr, "PLUGIN ADDR");

        const safeInterface = ISafe__factory.createInterface();

        const managerInterface = ISafeProtocolManager__factory.createInterface();
        const pluginInterface = ISafeProtocolPlugin__factory.createInterface();

        // enable the plugin on the safe
        // const data = safeInterface.encodeFunctionData("enablePlugin", [pluginAddr, true]);

        // const safeProtocolAction: SafeProtocolAction = {
        //     to: account.target,
        //     value: 0n,
        //     data: data,
        // };

        // const safeRootAccessTx: SafeRootAccess = { action: safeProtocolAction, nonce: 0n, metadataHash: ZeroHash };

        // const callData = managerInterface.encodeFunctionData("executeRootAccess", [account.target, safeRootAccessTx]);

        // expect(await manager.invocationCount()).to.equal(1);
        // expect(await manager.invocationCountForCalldata(callData)).to.equal(1);

        // executeTransaction from the plugin

        const swapAmount = hre.ethers.parseEther("1");

        const swapData = plugin.interface.encodeFunctionData("swapExactInputSingle", [swapAmount]);

        await account.executeCallViaMock(await plugin.getAddress(), swapAmount, swapData, MaxUint256);

        // const tx = (await plugin.executeFromPlugin.populateTransaction(await manager.getAddress(), account, "0x6a761202")).data;

        console.log("executed call via mock");

        const transferFunctionSig = "0xa9059cbb";
        const data = transferFunctionSig + safeAddress.slice(2).padStart(64, '0') + swapAmount.toString(16).padStart(64, '0'); // encode the recipient
//
        const safeTx = buildTransferDAITx(safeAddress, 100n, 0n, ZeroHash, data);
        // const safeTx = buildSingleTx(safeAddress, 1n, "0x", 0n, ZeroHash);

        console.log("built tx", safeTx);
        const signer = await ethers.provider.getSigner();
        const DAI_ADDRESS = "0x9f62EE65a8395824Ee0821eF2Dc4C947a23F0f25";
        const DAI = new ethers.Contract(DAI_ADDRESS, ERC20ABI, signer);
        const safeBal = await DAI.balanceOf(safeAddress);
        console.log("SAFE ADDR", safeAddress);
        console.log("SAFE DAI BAL", safeBal);
        const manBal = await DAI.balanceOf(manager);
        console.log("MANAGER BAL", manBal);

        expect(await plugin.connect(signer).executeFromPlugin(manager.target, safeAddress, safeTx, swapAmount));

        console.log("executed from plugin");

        const expectedData = managerInterface.encodeFunctionData("executeTransaction", [await account.getAddress(), safeTx]);

        console.log(expectedData, "EXPECTED DATA");

        const invoc = await manager.invocationCount();
        const contractBalance = await ethers.provider.getBalance(safeAddress);

        const wethAddr = 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2;
        const WETH = new ethers.Contract(DAI_ADDRESS, ERC20ABI, signer);

        const safeWethBal = await WETH.balanceOf(safeAddress);
        const managerBal = await WETH.balanceOf(safeAddress);
        const managerBalDai = await DAI.balanceOf(safeAddress);
        // expect(await manager.invocationCount()).to.be.eq(1);

        // expect(await manager.invocationCountForMethod(expectedData)).to.be.eq(1);
    });
});
