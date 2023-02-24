/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-11-07 21:08:08
 * @LastEditors: cejay
 * @LastEditTime: 2023-02-24 17:32:20
 */

import { UserOperation } from "../entity/userOperation";
import { execFromEntryPoint, execBatchFromEntryPoint } from "../defines/ABI";
import { BigNumber, ethers } from "ethers";
import { NumberLike } from "../defines/numberLike";

/**
 * transcation interface
 * @interface ITransaction
 * @property {string} from the from address
 * @property {string} data the data
 * @property {string} to the to address
 * @property {string} value the value
 */
export interface ITransaction {
    from: string;
    data: string;
    to: string;
    value: string;
}


/**
 * converter class
 * @class Converter
 */
export class Converter {

    /**
     * @constructor
     */
    constructor() {
    }

    /**
     * convert transcations to userOperation
     * @param {ethers.providers.BaseProvider} etherProvider the ethers.js provider e.g. ethers.provider
     * @param {string} entryPointAddress the entry point address
     * @param {ITransaction[]} transcations the transcations
     * @param {NumberLike} nonce the nonce
     * @param {NumberLike} maxFeePerGas the max fee per gas
     * @param {NumberLike} maxPriorityFeePerGas the max priority fee per gas
     * @param {string?} paymasterAndData the paymaster and data
     * @returns {Promise<UserOperation | null>} the userOperation
     */
    public async fromTransaction(
        etherProvider: ethers.providers.BaseProvider,
        entryPointAddress: string,
        transcations: ITransaction[],
        nonce: NumberLike,
        maxFeePerGas: NumberLike,
        maxPriorityFeePerGas: NumberLike,
        paymasterAndData: string = "0x"
    ): Promise<UserOperation | null> {

        const op = new UserOperation();
        op.nonce = nonce;
        op.paymasterAndData = paymasterAndData;
        op.maxFeePerGas = maxFeePerGas;
        op.maxPriorityFeePerGas = maxPriorityFeePerGas;

        if (transcations.length === 0) {
            throw new Error("transcation is empty");
        }

        op.sender = (transcations[0].from).toLowerCase();

        // #TODO if gas is null


        //let _callGasLimit: BigNumber = BigNumber.from(transcations[0].gas);

        const _to: string[] = [transcations[0].to];
        const _value: string[] = [transcations[0].value];
        const _data: string[] = [transcations[0].data];

        if (transcations.length > 1) {
            for (let i = 1; i < transcations.length; i++) {
                // _callGasLimit.add(BigNumber.from(transcations[i]));
                _to.push(transcations[i].to);
                _value.push(transcations[i].value);
                _data.push(transcations[i].data);
                if (op.sender !== transcations[i].from.toLowerCase()) {
                    throw new Error("transcation sender is not same");
                }
            }
        }

        //op.callGasLimit = _callGasLimit.toHexString();

        if (transcations.length === 1) {
            op.callData = new ethers.utils.Interface(execFromEntryPoint)
                .encodeFunctionData("execFromEntryPoint",
                    [_to[0], _value[0], _data[0]]
                );
        } else {
            op.callData = new ethers.utils.Interface(execBatchFromEntryPoint)
                .encodeFunctionData("execFromEntryPoint",
                    [_to, _value, _data]
                );
        }


        let gasEstimated = await op.estimateGas(entryPointAddress,
            etherProvider
        );
        if (!gasEstimated) {
            return null;
        }

        return op;
    }
}