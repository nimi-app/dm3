import { ethers } from 'ethers';

export async function prersonalSign(
    provider: ethers.providers.JsonRpcProvider,
    account: string,
    message: string,
) {
    return await provider.send('personal_sign', [account, message]);
}

export async function requestAccounts(
    provider: ethers.providers.JsonRpcProvider,
): Promise<string> {
    return (await provider.send('eth_requestAccounts', []))[0];
}

export async function lookupAddress(
    provider: ethers.providers.JsonRpcProvider,
    accountAddress: string,
): Promise<string | null> {
    return provider.lookupAddress(accountAddress);
}

export async function resolveName(
    provider: ethers.providers.JsonRpcProvider,
    name: string,
): Promise<string | null> {
    return provider.resolveName(name);
}