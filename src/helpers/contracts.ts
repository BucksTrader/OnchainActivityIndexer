import { ethers } from 'ethers';

// Export the marketplace address so it can be imported by other modules
export const MARKETPLACE_ADDRESS = '0x219f94b7E449260a96A812E3CA2ba5853D193955'.toLowerCase();

// Basic ABI fragments for common functions
export const BASIC_ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

// PumpKek Project ABI fragments (customize as needed)
export const PUMPKEK_PROJECT_ABI = [
  'function marketplace() view returns (address)',
  'function creator() view returns (address)',
  'function roomToken() view returns (address)',
  'function feePercentage() view returns (uint256)',
  'function graduated() view returns (bool)',
  'function tokensSold() view returns (uint256)',
  'function totalRoomDeposited() view returns (uint256)',
  'function getBalanceInfo() view returns (uint256 trackedDeposits, uint256 actualRoomBalance, uint256 trackedTokensSold, uint256 remainingTokens)'
];

// PumpKek Marketplace ABI fragments
export const PUMPKEK_MARKETPLACE_ABI = [
  'function roomToken() view returns (address)',
  'function creationFee() view returns (uint256)',
  'function feePercentage() view returns (uint256)',
  'function projects(address) view returns (address)',
  'function isProject(address) view returns (bool)',
  'function getProjectDetails(address) view returns (address, uint256, uint256, uint256, bool)'
];

// Event signatures for the marketplace
export const PROJECT_CREATED_EVENT = ethers.id('ProjectCreated(address,address,string,string)');
export const CREATION_FEE_UPDATED_EVENT = ethers.id('CreationFeeUpdated(uint256)');
export const FEE_PERCENTAGE_UPDATED_EVENT = ethers.id('FeePercentageUpdated(uint256)');
export const FEES_WITHDRAWN_EVENT = ethers.id('FeesWithdrawn(address,uint256)');
export const PROJECT_DEPOSIT_CORRECTED_EVENT = ethers.id('ProjectDepositCorrected(address,uint256)');

// Event signatures for the project tokens
export const TOKEN_BOUGHT_EVENT = ethers.id('Bought(address,uint256,uint256)');
export const TOKEN_SOLD_EVENT = ethers.id('Sold(address,uint256,uint256,uint256)');
export const GRADUATED_EVENT = ethers.id('Graduated(address,uint256)');
export const LIQUIDITY_WITHDRAWN_EVENT = ethers.id('LiquidityWithdrawn(address,uint256)');
export const TOKENS_WITHDRAWN_EVENT = ethers.id('TokensWithdrawn(address,uint256)');

// Helper function to decode event parameters
export function decodeEventData(log: any, abiFragment: string): any {
  try {
    const iface = new ethers.Interface([abiFragment]);
    return iface.parseLog({
      topics: log.topics,
      data: log.data
    });
  } catch (error) {
    console.error('Failed to decode event data:', error);
    return null;
  }
}

// Helper to safely extract address from topic
export function extractAddress(topic?: string): string {
  if (!topic) {
    console.warn('Undefined topic passed to extractAddress');
    return '0x0000000000000000000000000000000000000000';
  }
  
  try {
    // Make sure topic is at least 66 chars (0x + 64 hex chars)
    if (topic.length < 66) {
      console.warn(`Topic too short to extract address: ${topic}`);
      return '0x0000000000000000000000000000000000000000';
    }
    
    // Standard extraction of address from topic
    return '0x' + topic.slice(26).toLowerCase();
  } catch (error) {
    console.error(`Error extracting address from topic ${topic}:`, error);
    return '0x0000000000000000000000000000000000000000';
  }
}

// Helper to safely extract BigInt from hex data
export function extractBigInt(hexData?: string, startPos: number = 2): bigint {
  if (!hexData) {
    console.warn('Undefined hex data passed to extractBigInt');
    return BigInt(0);
  }
  
  try {
    // Make sure hexData is long enough
    if (hexData.length < startPos + 64) {
      console.warn(`Hex data too short to extract BigInt at position ${startPos}: ${hexData}`);
      return BigInt(0);
    }
    
    return BigInt('0x' + hexData.slice(startPos, startPos + 64));
  } catch (error) {
    console.error(`Error extracting BigInt from hex data ${hexData}:`, error);
    return BigInt(0);
  }
}

// Helper to log event data for debugging
export function logEventData(log: any): void {
  console.log('Event Data:');
  console.log('- Address:', log.address);
  console.log('- Topics:', log.topics);
  console.log('- Data:', log.data);
  console.log('- Transaction Hash:', log.transaction?.hash);
}