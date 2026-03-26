import { TokenPresale__factory } from "@/contracts/typechain/factories/TokenPresale__factory";
import type { Address } from "viem";

const rawAddress = import.meta.env.VITE_TOKEN_PRESALE_ADDRESS;

export const tokenPresaleAddress = rawAddress?.startsWith("0x")
  ? (rawAddress as Address)
  : undefined;

export const tokenPresaleAbi = TokenPresale__factory.abi;

export const tokenPresaleConfig = tokenPresaleAddress
  ? { address: tokenPresaleAddress, abi: tokenPresaleAbi } as const
  : undefined;


