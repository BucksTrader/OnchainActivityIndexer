import { processor } from './processor';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { handleTransfers } from './processors/transfers';
import { handlePumpKekEvents } from './processors/pumpKekProcessor';
import { handleTokenEvents } from './processors/tokenKekProcessor';
import { handleBasedBondingCurveEvents, initializeBasedBondingCurveRegistry } from './processors/basedBondingCurveProcessor';
import { projectRegistry, verifyDatabaseProjects } from './projectRegistry';

async function run() {
  const db = new TypeormDatabase();
  let blockCounter = 0;
  
  await processor.run(db, async (ctx) => {
    // Initialize the project registry at the beginning of processing
    console.log('[Main] Starting project registry initialization...');
    try {
      await projectRegistry.initialize(ctx.store);
      console.log('[Main] Project registry successfully initialized');
      
      // Initialize BasedBondingCurve registry with known addresses
      await initializeBasedBondingCurveRegistry();
    } catch (error) {
      console.error('[Main] Failed to initialize project registry:', error);
      // Continue processing anyway
    }
    
    // Process each block
    for (let block of ctx.blocks) {
      blockCounter++;
      console.log(`Processing block ${block.header.height} with ${block.transactions.length} transactions and ${block.logs.length} logs`);
      
      // Process transactions for value transfers
      for (let tx of block.transactions) {
        await handleTransfers(ctx, block, tx);
      }
      
      // Process logs for events
      for (let log of block.logs) {
        // Handle marketplace events (project creation, etc.)
        await handlePumpKekEvents(ctx, block, log);
        
        // Handle token events (buys, sells, graduations)
        await handleTokenEvents(ctx, block, log);

        // Handle BasedBondingCurve events
        await handleBasedBondingCurveEvents(ctx, block, log);
      }
      
      // Periodically verify database projects
      if (blockCounter % 100 === 0) {
        console.log(`[Main] Verifying database projects after ${blockCounter} blocks`);
        await verifyDatabaseProjects(ctx.store);
      }
    }
  });
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});