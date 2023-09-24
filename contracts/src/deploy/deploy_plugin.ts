import { DeployFunction } from "hardhat-deploy/types";
import hre, { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getGelatoAddress } from "@gelatonetwork/relay-context";
import { ZeroAddress } from "ethers";
// import { ISwapRouter } from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";


const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deployer, recoverer } = await getNamedAccounts();
    const { deploy } = deployments;

    console.log(deployer, "DEPLOYER");

    const uniswapAddr = "0xe592427a0aece92de3edee1f18e0157c05861564";

    // .get

    // const SwapRouter = await ethers.getContractFactory("ISwapRouter");
    // const swapRouter = await SwapRouter.deploy(/* constructor arguments if any */)
    // await swapRouter.deployed();
    // console.log("SwapRouter deployed to:", swapRouter.address);

    // console.log("SwapRouter deployed to:", swapRouter.address);

    // execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)
    // https://www.4byte.directory/signatures/?bytes4_signature=0x6a761202
    const relayMethod = "0x6a761202"
    // We don't use a trusted origin right now to make it easier to test.
    // For production networks it is strongly recommended to set one to avoid potential fee extraction.
    const trustedOrigin = ZeroAddress // hre.network.name === "hardhat" ? ZeroAddress : getGelatoAddress(hre.network.name)
    // const uniswapRouter = await deploy("RelayPlugin", {
    //     from: deployer,
    //     args: [trustedOrigin, relayMethod],
    //     log: true,
    //     deterministicDeployment: true,
    // })

    await deploy("RelayPlugin", {
        from: deployer,
        args: [trustedOrigin, relayMethod],
        log: true,
        deterministicDeployment: true,
    });

    await deploy("WhitelistPlugin", {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: true,
    });

    await deploy("RecoveryWithDelayPlugin", {
        from: deployer,
        args: [deployer],
        log: true,
        deterministicDeployment: true,
    });

    await deploy("EthBuyer", {
        from: deployer,
        args: [uniswapAddr, trustedOrigin, relayMethod], // Passing the deployed SwapRouter's address
        log: true,
        deterministicDeployment: true,
    });

    // await deploy("MockDAI", {
    //     from: deployer,
    //     args: [],
    //     log: true,
    //     deterministicDeployment: true,
    // });

};

deploy.tags = ["plugins"];
export default deploy;