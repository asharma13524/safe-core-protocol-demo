import { AddressLike } from "ethers";
import { SafeRootAccess, SafeTransaction } from "./dataTypes";

export const buildSingleTx = (address: AddressLike, value: bigint, data: string, nonce: bigint, metadataHash: Uint8Array | string): SafeTransaction => {
    return {
        actions: [
            {
                to: address,
                value: value,
                data: data,
            },
        ],
        nonce: nonce,
        metadataHash: metadataHash,
    };
};

export const buildRootTx = (address: AddressLike, value: bigint, data: string, nonce: bigint, metadataHash: Uint8Array | string): SafeRootAccess => {
    return {
        action: {
            to: address,
            value: value,
            data: data,
        },
        nonce: nonce,
        metadataHash: metadataHash,
    };
};

export const buildTransferDAITx = (recipient: AddressLike, amount: bigint, nonce: bigint, metadataHash: Uint8Array | string, data: string): SafeTransaction => {
    // DAI's transfer function signature: transfer(address,uint256)
    // const transferFunctionSig = "0xa9059cbb";
    // const data = transferFunctionSig + recipient.slice(2).padStart(64, '0') + amount.toString(16).padStart(64, '0'); // encode the recipient address and amount into the data
    return {
        actions: [
            {
                to: recipient,
                value: amount,
                data: data,
            },
        ],
        nonce: nonce,
        metadataHash: metadataHash,
    };
};

