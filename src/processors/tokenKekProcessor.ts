import { Store } from '@subsquid/typeorm-store';
import { 
  PumpKekProject 
} from '../model/generated/pumpKekProject.model';
import { 
  PumpKekBuy 
} from '../model/generated/pumpKekBuy.model';
import { 
  PumpKekSell 
} from '../model/generated/pumpKekSell.model';
import { 
  PumpKekGraduation 
} from '../model/generated/pumpKekGraduation.model';
import { 
  TOKEN_BOUGHT_EVENT,
  TOKEN_SOLD_EVENT,
  GRADUATED_EVENT,
  LIQUIDITY_WITHDRAWN_EVENT,
  TOKENS_WITHDRAWN_EVENT,
  logEventData
} from '../helpers/contracts';
import { projectRegistry } from '../projectRegistry';

// Log registry instance ID to check for duplicates
console.log(`[TokenProcessor] Using registry instance: ${projectRegistry._instanceId}`);

// Fee constants from the contract
const FEE_PERCENTAGE = 10; // 1%
const FEE_DENOMINATOR = 1000;

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
 * Extract bigint from data at specific position
 */
function extractBigIntFromData(data: string, position: number): bigint {
  if (!data || data.length < position + 64) {
    return BigInt(0);
  }
  return BigInt('0x' + data.slice(position, position + 64));
}

/**
 * Calculate net amount after fee
 */
function calculateNetAfterFee(amount: bigint): bigint {
  const fee = (amount * BigInt(FEE_PERCENTAGE)) / BigInt(FEE_DENOMINATOR);
  return amount - fee;
}

/**
 * Process Token events from PumpKek projects
 */
export async function handleTokenEvents(ctx: any, block: any, log: any): Promise<void> {
  try {
    const contractAddress = log.address?.toLowerCase();
    if (!contractAddress) {
      return; // Skip if no address
    }
    
    const topic0 = log.topics?.[0];
    if (!topic0) {
      return; // Skip if no topics
    }
    
    // Enhanced debugging for important events
    if ([TOKEN_BOUGHT_EVENT, TOKEN_SOLD_EVENT, GRADUATED_EVENT].includes(topic0)) {
      console.log('[TokenProcessor] --------------------------------');
      console.log(`[TokenProcessor] Potential token event detected`);
      console.log(`[TokenProcessor] - Contract: ${contractAddress}`);
      console.log(`[TokenProcessor] - Topic: ${topic0}`);
      console.log(`[TokenProcessor] - Transaction: ${log.transaction?.hash}`);
      
      // Check if it's a known project
      const isKnownProject = projectRegistry.isProject(contractAddress);
      console.log(`[TokenProcessor] Is known project? ${isKnownProject}`);
      
      if (!isKnownProject) {
        console.log('[TokenProcessor] Event from unknown project, skipping');
        console.log('[TokenProcessor] --------------------------------');
        return;
      }
      
      console.log('[TokenProcessor] Processing event from known project...');
    } else {
      // For other events, do a simpler check
      if (!projectRegistry.isProject(contractAddress)) {
        return;
      }
    }
    
    const transactionHash = log.transaction?.hash ?? 'unknown_tx';
    const blockNumber = block.header.height;
    const timestamp = new Date(block.header.timestamp);
    
    console.log(`[TokenProcessor] Processing token event from project ${contractAddress}: ${topic0}`);
    logEventData(log);
    
    // Handle buy event
    if (topic0 === TOKEN_BOUGHT_EVENT) {
      console.log('[TokenProcessor] Bought event detected');
      
      // Extract buyer address - might be in topics or data depending on if indexed
      let buyer;
      if (log.topics && log.topics.length > 1) {
        // If buyer is indexed, it's in topics
        buyer = '0x' + log.topics[1].slice(26).toLowerCase();
        console.log(`[TokenProcessor] Buyer from topics: ${buyer}`);
      } else if (log.data && log.data.length > 2) {
        // If not indexed, extract from data
        const data = log.data.slice(2);
        buyer = extractAddressFromData(data, 0);
        console.log(`[TokenProcessor] Buyer from data: ${buyer}`);
      } else {
        console.error('[TokenProcessor] Buy event has insufficient data');
        return;
      }
      
      // Extract roomAmount and tokenAmount from data
      if (!log.data || log.data.length < 130) {
        console.error('[TokenProcessor] Buy event has insufficient data');
        return;
      }
      
      const data = log.data.slice(2);
      
      // Extract amounts based on the contract event definition:
      // Bought(address buyer, uint256 roomAmount, uint256 tokenAmount)
      const roomAmount = extractBigIntFromData(data, 64);
      const tokenAmount = extractBigIntFromData(data, 128);
      
      // Calculate the net amount after fee
      const netRoomAmount = calculateNetAfterFee(roomAmount);
      
      console.log(`[TokenProcessor] Buy: ${buyer} bought ${tokenAmount.toString()} tokens for ${roomAmount.toString()} ROOM (net: ${netRoomAmount.toString()})`);
      
      // Fetch the project entity
      const project = await ctx.store.get(PumpKekProject, contractAddress);
      if (!project) {
        console.error(`[TokenProcessor] Project ${contractAddress} not found in database`);
        return;
      }

      // Create buy entity
      const buy = new PumpKekBuy({
        id: `${transactionHash}-${log.logIndex}`,
        project: project,
        buyer: buyer,
        roomAmount: roomAmount,
        tokenAmount: tokenAmount,
        blockNumber: blockNumber,
        timestamp: timestamp
      });
      
      try {
        await ctx.store.save(buy);
        console.log(`[TokenProcessor] Indexed PumpKek buy: ${buy.id}`);
      } catch (error) {
        console.error(`[TokenProcessor] Failed to save buy:`, error);
        return;
      }
      
      // Update project stats - use the NET amount after fee
      project.totalDeposited = project.totalDeposited + netRoomAmount;
      project.tokensSold = project.tokensSold + tokenAmount;
      try {
        await ctx.store.save(project);
        console.log(`[TokenProcessor] Updated project stats for ${contractAddress}`);
      } catch (error) {
        console.error(`[TokenProcessor] Failed to update project stats:`, error);
      }
    }
    
    // Handle sell event
    else if (topic0 === TOKEN_SOLD_EVENT) {
      console.log('[TokenProcessor] Sold event detected');
      
      // Extract seller address
      let seller;
      if (log.topics && log.topics.length > 1) {
        // If seller is indexed, it's in topics
        seller = '0x' + log.topics[1].slice(26).toLowerCase();
        console.log(`[TokenProcessor] Seller from topics: ${seller}`);
      } else if (log.data && log.data.length > 2) {
        // If not indexed, extract from data
        const data = log.data.slice(2);
        seller = extractAddressFromData(data, 0);
        console.log(`[TokenProcessor] Seller from data: ${seller}`);
      } else {
        console.error('[TokenProcessor] Sell event has insufficient data');
        return;
      }
      
      // Extract amounts from data
      if (!log.data || log.data.length < 194) {
        console.error('[TokenProcessor] Sell event has insufficient data');
        return;
      }
      
      const data = log.data.slice(2);
      
      // Extract amounts based on the contract event definition:
      // Sold(address seller, uint256 tokenAmount, uint256 roomAmount, uint256 netAmount)
      const tokenAmount = extractBigIntFromData(data, 64);
      const roomAmount = extractBigIntFromData(data, 128);
      const netAmount = extractBigIntFromData(data, 192);
      
      console.log(`[TokenProcessor] Sell: ${seller} sold ${tokenAmount.toString()} tokens for ${netAmount.toString()} ROOM (gross ${roomAmount.toString()})`);
      
      // Fetch the project entity
      const project = await ctx.store.get(PumpKekProject, contractAddress);
      if (!project) {
        console.error(`[TokenProcessor] Project ${contractAddress} not found in database`);
        return;
      }

      // Create sell entity
      const sell = new PumpKekSell({
        id: `${transactionHash}-${log.logIndex}`,
        project: project,
        seller: seller,
        tokenAmount: tokenAmount,
        roomAmount: roomAmount,
        netAmount: netAmount,
        blockNumber: blockNumber,
        timestamp: timestamp
      });
      
      try {
        await ctx.store.save(sell);
        console.log(`[TokenProcessor] Indexed PumpKek sell: ${sell.id}`);
      } catch (error) {
        console.error(`[TokenProcessor] Failed to save sell:`, error);
        return;
      }
      
      // Update project stats
      project.totalDeposited = project.totalDeposited - roomAmount;
      project.tokensSold = project.tokensSold - tokenAmount;
      try {
        await ctx.store.save(project);
        console.log(`[TokenProcessor] Updated project stats for ${contractAddress}`);
      } catch (error) {
        console.error(`[TokenProcessor] Failed to update project stats:`, error);
      }
    }
    
    // Handle graduation event
    else if (topic0 === GRADUATED_EVENT) {
      console.log('[TokenProcessor] Graduated event detected');
      
      if (!log.data || log.data.length < 66) {
        console.error('[TokenProcessor] Graduation event has insufficient data');
        return;
      }
      
      const data = log.data.slice(2);
      const liquidity = extractBigIntFromData(data, 0);
      
      console.log(`[TokenProcessor] Graduation: Project ${contractAddress} graduated with ${liquidity.toString()} liquidity`);
      
      // Fetch the project entity
      const project = await ctx.store.get(PumpKekProject, contractAddress);
      if (!project) {
        console.error(`[TokenProcessor] Project ${contractAddress} not found in database`);
        return;
      }

      // Create graduation entity
      const graduation = new PumpKekGraduation({
        id: `${transactionHash}-${log.logIndex}`,
        project: project,
        liquidity: liquidity,
        blockNumber: blockNumber,
        timestamp: timestamp
      });
      
      try {
        await ctx.store.save(graduation);
        console.log(`[TokenProcessor] Indexed PumpKek graduation: ${graduation.id}`);
      } catch (error) {
        console.error(`[TokenProcessor] Failed to save graduation:`, error);
        return;
      }
      
      // Update project graduated status
      project.isGraduated = true;
      try {
        await ctx.store.save(project);
        console.log(`[TokenProcessor] Updated graduation status for ${contractAddress}`);
      } catch (error) {
        console.error(`[TokenProcessor] Failed to update graduation status:`, error);
      }
    }
    
    // Handle other events if needed
    console.log('[TokenProcessor] --------------------------------');
  } catch (error) {
    console.error(`[TokenProcessor] Error processing token event in tx ${log.transaction?.hash}:`, error);
  }
}