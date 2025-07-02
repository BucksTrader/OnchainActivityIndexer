import { EvmBatchProcessor } from '@subsquid/evm-processor';
import { ethers } from 'ethers';

// PumpKek Marketplace address - update after deployment
const MARKETPLACE_ADDRESS = '0x219f94b7E449260a96A812E3CA2ba5853D193955'.toLowerCase();

// Event signatures for marketplace
const PROJECT_CREATED_EVENT = ethers.id('ProjectCreated(address,address,string,string)');
const CREATION_FEE_UPDATED_EVENT = ethers.id('CreationFeeUpdated(uint256)');
const FEE_PERCENTAGE_UPDATED_EVENT = ethers.id('FeePercentageUpdated(uint256)');
const FEES_WITHDRAWN_EVENT = ethers.id('FeesWithdrawn(address,uint256)');
const PROJECT_DEPOSIT_CORRECTED_EVENT = ethers.id('ProjectDepositCorrected(address,uint256)');

// Event signatures for project tokens
const TOKEN_BOUGHT_EVENT = ethers.id('Bought(address,uint256,uint256)');
const TOKEN_SOLD_EVENT = ethers.id('Sold(address,uint256,uint256,uint256)');
const GRADUATED_EVENT = ethers.id('Graduated(address,uint256)');
const LIQUIDITY_WITHDRAWN_EVENT = ethers.id('LiquidityWithdrawn(address,uint256)');
const TOKENS_WITHDRAWN_EVENT = ethers.id('TokensWithdrawn(address,uint256)');

export const processor = new EvmBatchProcessor()
  .setRpcEndpoint({
    url: process.env.RPC_HTTP || 'https://mainnet.basedaibridge.com/rpc',
    rateLimit: 50,
  })
  .setFinalityConfirmation(75)
  .setFields({
    block: {
      height: true,
      timestamp: true,
    },
    transaction: {
      from: true,
      to: true,
      hash: true,
      input: true,
      value: true,
      nonce: true,
    },
    log: {
      address: true,
      topics: true,
      data: true,
    },
  })
  // Track basic transactions for transfers
  .addTransaction({})
  // Track marketplace events
  .addLog({
    address: [MARKETPLACE_ADDRESS],
    topic0: [
      PROJECT_CREATED_EVENT,
      CREATION_FEE_UPDATED_EVENT,
      FEE_PERCENTAGE_UPDATED_EVENT,
      FEES_WITHDRAWN_EVENT,
      PROJECT_DEPOSIT_CORRECTED_EVENT
    ],
  })
  // Track project token events - dynamic addresses will be handled in the processor
  .addLog({
    topic0: [
      TOKEN_BOUGHT_EVENT,
      TOKEN_SOLD_EVENT,
      GRADUATED_EVENT,
      LIQUIDITY_WITHDRAWN_EVENT,
      TOKENS_WITHDRAWN_EVENT
    ],
  })
  // Start from recent block to get data faster
  .setBlockRange({ from: 690000 })