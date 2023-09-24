// scripts/deployMockDAI.js

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying MockDAI with the account:", deployer.address);
    const dai = await ethers.deployContract("MockDAI");
    console.log("Token address:", await dai.getAddress());
    // const MockDAI = await ethers.getContractFactory("MockDAI");
    // const mockDAI = await MockDAI.deploy();

    // console.log(mockDAI);

    // console.log("MockDAI deployed to:", mockDAI.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
