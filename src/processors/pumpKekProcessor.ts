import { Store } from '@subsquid/typeorm-store';
import { 
  PumpKekProject 
} from '../model/generated/pumpKekProject.model';
import { 
  PROJECT_CREATED_EVENT,
  extractBigInt,
  logEventData
} from '../helpers/contracts';
import { projectRegistry } from '../projectRegistry';

// Log registry instance ID to check for duplicates
console.log(`[PumpKekProcessor] Using registry instance: ${projectRegistry._instanceId}`);

// Marketplace contract address
const MARKETPLACE_ADDRESS = '0x219f94b7E449260a96A812E3CA2ba5853D193955'.toLowerCase();

/**
 * Extract address from data at specific position
 */
function extractAddressFromData(data: string, position: number): string {
  if (!data || data.length < position + 64) {
    return '0x0000000000000000000000000000000000000000';
  }
  return '0x' + data.slice(position + 24, position + 64).toLowerCase();
}

/**
 * Extract string from data - safe version for PostgreSQL
 */
function extractStringFromData(data: string, position: number): string {
  try {
    // Get string data starting from the specified position + offset
    const offset = parseInt(data.slice(position, position + 64), 16) * 2;
    const stringLengthHex = data.slice(position + offset, position + offset + 64);
    const stringLength = parseInt(stringLengthHex, 16) * 2;
    
    // Get the actual string data
    const stringData = data.slice(position + offset + 64, position + offset + 64 + stringLength);
    
    // Convert the hex string to ASCII, filtering out non-printable characters
    let result = '';
    for (let i = 0; i < stringData.length; i += 2) {
      const charCode = parseInt(stringData.slice(i, i + 2), 16);
      if (charCode > 0 && charCode < 128) { // Only include printable ASCII
        result += String.fromCharCode(charCode);
      }
    }
    
    return result.trim();
  } catch (error) {
    console.error(`Error extracting string from data:`, error);
    return 'UnknownToken'; // Safe fallback value
  }
}

/**
 * Process PumpKek marketplace and token events
 */
export async function handlePumpKekEvents(ctx: any, block: any, log: any): Promise<void> {
  try {
    const contractAddress = log.address?.toLowerCase();
    if (!contractAddress) {
      console.warn('[PumpKekProcessor] Log missing address, skipping');
      return;
    }
    
    const topic0 = log.topics?.[0];
    if (!topic0) {
      console.warn('[PumpKekProcessor] Log missing topics, skipping');
      return;
    }
    
    const transactionHash = log.transaction?.hash ?? 'unknown_tx';
    const blockNumber = block.header.height;
    const timestamp = new Date(block.header.timestamp);

    // Process Marketplace events
    if (contractAddress === MARKETPLACE_ADDRESS) {
      console.log(`[PumpKekProcessor] Processing marketplace event: ${topic0}`);
      
      if (topic0 === PROJECT_CREATED_EVENT) {
        console.log('[PumpKekProcessor] --------------------------------');
        console.log('[PumpKekProcessor] ProjectCreated event detected');
        console.log('[PumpKekProcessor] Contract Address:', contractAddress);
        console.log('[PumpKekProcessor] Transaction Hash:', transactionHash);
        logEventData(log);
        
        if (!log.data || log.data.length < 2) {
          console.error('[PumpKekProcessor] ProjectCreated event has no data');
          return;
        }
        
        // Extract parameters from data
        const data = log.data.slice(2); // Remove '0x' prefix
        
        const projectAddress = extractAddressFromData(data, 0);
        const creatorAddress = extractAddressFromData(data, 64);
        
        // Extract name and symbol
        const name = extractStringFromData(data, 128);
        const symbol = extractStringFromData(data, 192);
        
        console.log(`[PumpKekProcessor] New project details:`);
        console.log(`[PumpKekProcessor] - Address: ${projectAddress}`);
        console.log(`[PumpKekProcessor] - Creator: ${creatorAddress}`);
        console.log(`[PumpKekProcessor] - Name: ${name}`);
        console.log(`[PumpKekProcessor] - Symbol: ${symbol}`);
        
        // Add to centralized registry
        console.log('[PumpKekProcessor] Adding project to registry...');
        projectRegistry.addProject(projectAddress);
        
        // Create project entity
        console.log('[PumpKekProcessor] Creating database entity...');
        const project = new PumpKekProject({
          id: projectAddress,
          creator: creatorAddress,
          name: name || "PumpKek Project", // Fallback if extraction fails
          symbol: symbol || "PKP", // Fallback if extraction fails
          creationTimestamp: timestamp,
          blockNumber: blockNumber,
          totalDeposited: BigInt(0),
          tokensSold: BigInt(0),
          isGraduated: false
        });
        
        try {
          await ctx.store.save(project);
          console.log(`[PumpKekProcessor] Successfully saved project to database: ${projectAddress}`);
        } catch (error) {
          console.error(`[PumpKekProcessor] Failed to save project:`, error);
        }
        console.log('[PumpKekProcessor] --------------------------------');
      }
      
      // Handle other marketplace events here
    }
    
    // We no longer need to check for token events here
    // Those are handled exclusively in the tokenKekProcessor
  } catch (error) {
    console.error(`[PumpKekProcessor] Error processing event in tx ${log.transaction?.hash}:`, error);
  }
}