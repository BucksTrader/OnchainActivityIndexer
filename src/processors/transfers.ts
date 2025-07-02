import { Store } from '@subsquid/typeorm-store';
import { Transfer } from '../model/generated/transfer.model';

/**
 * Process transactions for value transfers (native token)
 */
export async function handleTransfers(ctx: any, block: any, tx: any): Promise<void> {
  try {
    // Skip transactions with no value
    if (!tx.value || tx.value <= 0n) {
      return;
    }

    console.log(`Found transfer in tx ${tx.hash}: ${tx.from} -> ${tx.to || 'contract creation'} [${tx.value.toString()}]`);
    
    // Create a new transfer entity
    const transfer = new Transfer({
      id: tx.hash,
      from: tx.from,
      to: tx.to || '0x0000000000000000000000000000000000000000', // Handle contract creation
      value: tx.value,
      txHash: tx.hash,
      blockNumber: block.header.height,
      timestamp: new Date(block.header.timestamp),
      contractAddress: null, // Not applicable for native transfers
      tokenId: null, // Not applicable for native transfers
    });

    // Save to database
    await ctx.store.save(transfer);
    console.log(`Saved transfer: ${transfer.id}`);
  } catch (error) {
    console.error(`Error processing transfer in tx ${tx.hash}:`, error);
  }
}