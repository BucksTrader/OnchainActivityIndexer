import { DataHandlerContext, BlockData, Log } from '@subsquid/evm-processor';
import { ethers } from 'ethers';
import { Store } from '@subsquid/typeorm-store';
import { projectRegistry } from '../projectRegistry';
import { 
  BasedBondingCurveProject, 
  BasedBondingCurveBuy, 
  BasedBondingCurveSell, 
  BasedBondingCurveGraduation, 
  BasedBondingCurveLiquidityAdded,
  BasedBondingCurveLP
} from '../model/generated/index';

// Contract addresses - update these after deployment
const KNOWN_BASED_BONDING_CURVE_ADDRESSES = [
  '0xDe6e2b1197bA62a72BFcC60a0985F3DA863a3d14'.toLowerCase(),
  // Add more addresses if you have multiple contracts
];

// Known LP pair addresses (optional, can be detected from events)
const KNOWN_LP_ADDRESSES = [
  '0x14B9f4CCF35bb8e4F65f6e6e27cbCEe85A659432'.toLowerCase(),
  // Add more addresses if you have multiple pairs
];

// Event signatures for BasedBondingCurve
const BOUGHT_EVENT = ethers.id('Bought(address,uint256,uint256)');
const SOLD_EVENT = ethers.id('Sold(address,uint256,uint256,uint256)');
const GRADUATED_EVENT = ethers.id('Graduated(address,uint256)');
const LIQUIDITY_ADDED_EVENT = ethers.id('LiquidityAdded(address,uint256,uint256,uint256)');
const LIQUIDITY_WITHDRAWN_EVENT = ethers.id('LiquidityWithdrawn(address,uint256)');
const TOKENS_WITHDRAWN_EVENT = ethers.id('TokensWithdrawn(address,uint256)');
const LP_TOKENS_WITHDRAWN_EVENT = ethers.id('LpTokensWithdrawn(address,uint256)');

// Register event signatures to identify BasedBondingCurve projects
projectRegistry.registerProjectType('BasedBondingCurve', [
  BOUGHT_EVENT,
  SOLD_EVENT, 
  GRADUATED_EVENT,
  LIQUIDITY_ADDED_EVENT
]);

// Initialize the registry with known addresses
export async function initializeBasedBondingCurveRegistry() {
  for (const address of KNOWN_BASED_BONDING_CURVE_ADDRESSES) {
    projectRegistry.addProject(address, 'BasedBondingCurve');
  }
  console.log(`[BasedBondingCurve] Registered ${KNOWN_BASED_BONDING_CURVE_ADDRESSES.length} known addresses`);
}

export async function handleBasedBondingCurveEvents(ctx: DataHandlerContext<Store>, block: BlockData, log: Log): Promise<void> {
  try {
    // Check if this is a known BasedBondingCurve address
    const isKnownAddress = KNOWN_BASED_BONDING_CURVE_ADDRESSES.includes(log.address.toLowerCase());
    if (isKnownAddress) {
      // Always register these addresses if not already registered
      if (!projectRegistry.isProject(log.address)) {
        console.log(`[BasedBondingCurve] Registering known contract at ${log.address}`);
        projectRegistry.addProject(log.address, 'BasedBondingCurve');
      }
    }
    
    // Check if this is a BasedBondingCurve project
    const isKnownProject = projectRegistry.isProject(log.address);
    const isBasedProject = projectRegistry.isProjectType(log.address, 'BasedBondingCurve');
    const hasBasedSignature = [BOUGHT_EVENT, SOLD_EVENT, GRADUATED_EVENT, LIQUIDITY_ADDED_EVENT].includes(log.topics[0]);
    
    // Skip processing if not a BasedBondingCurve event
    if (!isBasedProject && !hasBasedSignature && !isKnownAddress) {
      return;
    }
    
    // If we detect a BasedBondingCurve event from a new address, register it
    if (hasBasedSignature && !isKnownProject) {
      console.log(`[BasedBondingCurve] Detected new BasedBondingCurve project at ${log.address}`);
      projectRegistry.addProject(log.address, 'BasedBondingCurve');
    }

    const contractAddress = log.address.toLowerCase();
    const { topics, data } = log;
    const blockNumber = block.header.height;
    const timestamp = new Date(block.header.timestamp);
    const txHash = log.transaction?.hash || `unknown-${log.logIndex}`;
    const eventId = `${txHash}-${log.logIndex}`;

    // Get or create the project entity
    let project = await ctx.store.get(BasedBondingCurveProject, contractAddress);
    if (!project) {
      console.log(`[BasedBondingCurve] Creating new project record for ${contractAddress}`);
      project = new BasedBondingCurveProject({
        id: contractAddress,
        totalBasedDeposited: 0n,
        tokensSold: 0n,
        isGraduated: false,
        creationTimestamp: timestamp,
        blockNumber: blockNumber,
        pairAddress: '',
        routerAddress: ''
      });
      await ctx.store.save(project);
    }

    // Handle different events
    if (topics[0] === BOUGHT_EVENT) {
      await handleBuyEvent(ctx, eventId, contractAddress, project, topics, data, blockNumber, timestamp);
    } 
    else if (topics[0] === SOLD_EVENT) {
      await handleSellEvent(ctx, eventId, contractAddress, project, topics, data, blockNumber, timestamp);
    } 
    else if (topics[0] === GRADUATED_EVENT) {
      await handleGraduationEvent(ctx, eventId, contractAddress, project, topics, data, blockNumber, timestamp);
    }
    else if (topics[0] === LIQUIDITY_ADDED_EVENT) {
      await handleLiquidityAddedEvent(ctx, eventId, contractAddress, project, topics, data, blockNumber, timestamp);
    }
    
    // Update project state with latest data
    await ctx.store.save(project);
  } catch (error) {
    console.error(`[BasedBondingCurve] Error processing event:`, error);
  }
}

async function handleBuyEvent(
  ctx: DataHandlerContext<Store>, 
  eventId: string, 
  contractAddress: string,
  project: BasedBondingCurveProject, 
  topics: string[], 
  data: string,
  blockNumber: number,
  timestamp: Date
): Promise<void> {
  try {
    // Decode the event data
    const iface = new ethers.Interface([
      'event Bought(address indexed buyer, uint256 basedAmount, uint256 tokenAmount)'
    ]);
    const event = iface.parseLog({ topics, data }) as ethers.LogDescription;
    
    // Extract values
    const buyer = event.args[0].toLowerCase();
    const basedAmount = BigInt(event.args[1].toString());
    const tokenAmount = BigInt(event.args[2].toString());
    
    // Create buy event entity
    const buyEvent = new BasedBondingCurveBuy({
      id: eventId,
      project,
      buyer,
      basedAmount,
      tokenAmount,
      timestamp,
      blockNumber
    });
    
    // Update project stats
    project.totalBasedDeposited = (project.totalBasedDeposited || 0n) + basedAmount;
    project.tokensSold = (project.tokensSold || 0n) + tokenAmount;
    
    await ctx.store.save(buyEvent);
    console.log(`[BasedBondingCurve] Recorded buy event: ${buyer} bought ${tokenAmount} tokens for ${basedAmount} BASED`);
  } catch (error) {
    console.error(`[BasedBondingCurve] Error processing buy event:`, error);
  }
}

async function handleSellEvent(
  ctx: DataHandlerContext<Store>, 
  eventId: string, 
  contractAddress: string,
  project: BasedBondingCurveProject, 
  topics: string[], 
  data: string,
  blockNumber: number,
  timestamp: Date
): Promise<void> {
  try {
    // Decode the event data
    const iface = new ethers.Interface([
      'event Sold(address indexed seller, uint256 tokenAmount, uint256 basedAmount, uint256 netAmount)'
    ]);
    const event = iface.parseLog({ topics, data }) as ethers.LogDescription;
    
    // Extract values
    const seller = event.args[0].toLowerCase();
    const tokenAmount = BigInt(event.args[1].toString());
    const basedAmount = BigInt(event.args[2].toString()); 
    const netAmount = BigInt(event.args[3].toString());
    
    // Create sell event entity
    const sellEvent = new BasedBondingCurveSell({
      id: eventId,
      project,
      seller,
      tokenAmount,
      basedAmount,
      netAmount,
      timestamp,
      blockNumber
    });
    
    // Update project stats
    project.totalBasedDeposited = (project.totalBasedDeposited || 0n) - basedAmount;
    project.tokensSold = (project.tokensSold || 0n) - tokenAmount;
    
    await ctx.store.save(sellEvent);
    console.log(`[BasedBondingCurve] Recorded sell event: ${seller} sold ${tokenAmount} tokens for ${netAmount} BASED`);
  } catch (error) {
    console.error(`[BasedBondingCurve] Error processing sell event:`, error);
  }
}

async function handleGraduationEvent(
  ctx: DataHandlerContext<Store>, 
  eventId: string, 
  contractAddress: string,
  project: BasedBondingCurveProject, 
  topics: string[], 
  data: string,
  blockNumber: number,
  timestamp: Date
): Promise<void> {
  try {
    // Decode the event data
    const iface = new ethers.Interface([
      'event Graduated(address indexed project, uint256 liquidity)'
    ]);
    const event = iface.parseLog({ topics, data }) as ethers.LogDescription;
    
    // Extract values
    const projectAddress = event.args[0].toLowerCase();
    const liquidity = BigInt(event.args[1].toString());
    
    // Create graduation event entity
    const graduationEvent = new BasedBondingCurveGraduation({
      id: eventId,
      project,
      liquidity,
      timestamp,
      blockNumber
    });
    
    // Update project state
    project.isGraduated = true;
    project.graduationTimestamp = timestamp;
    
    await ctx.store.save(graduationEvent);
    console.log(`[BasedBondingCurve] Project graduated: ${projectAddress} with ${liquidity} BASED liquidity`);
  } catch (error) {
    console.error(`[BasedBondingCurve] Error processing graduation event:`, error);
  }
}

async function handleLiquidityAddedEvent(
  ctx: DataHandlerContext<Store>, 
  eventId: string, 
  contractAddress: string,
  project: BasedBondingCurveProject, 
  topics: string[], 
  data: string,
  blockNumber: number,
  timestamp: Date
): Promise<void> {
  try {
    // Decode the event data
    const iface = new ethers.Interface([
      'event LiquidityAdded(address pair, uint256 basedAmount, uint256 tokenAmount, uint256 lpTokens)'
    ]);
    const event = iface.parseLog({ topics, data }) as ethers.LogDescription;
    
    // Extract values
    const pairAddress = event.args[0].toLowerCase();
    const basedAmount = BigInt(event.args[1].toString());
    const tokenAmount = BigInt(event.args[2].toString());
    const lpTokens = BigInt(event.args[3].toString());
    
    // Create liquidity added event entity
    const liquidityEvent = new BasedBondingCurveLiquidityAdded({
      id: eventId,
      project,
      pairAddress,
      basedAmount,
      tokenAmount,
      lpTokens,
      timestamp,
      blockNumber
    });
    
    // Update project with LP information
    project.pairAddress = pairAddress;
    
    // Create or update LP entity
    let lp = await ctx.store.get(BasedBondingCurveLP, pairAddress);
    if (!lp) {
      lp = new BasedBondingCurveLP({
        id: pairAddress,
        project,
        basedReserve: basedAmount,
        tokenReserve: tokenAmount,
        lpTokens: lpTokens,
        creationTimestamp: timestamp
      });
    } else {
      lp.basedReserve = basedAmount;
      lp.tokenReserve = tokenAmount;
      lp.lpTokens = lpTokens;
    }
    
    await ctx.store.save(liquidityEvent);
    await ctx.store.save(lp);
    console.log(`[BasedBondingCurve] Liquidity added to pair ${pairAddress}: ${basedAmount} BASED, ${tokenAmount} tokens`);
  } catch (error) {
    console.error(`[BasedBondingCurve] Error processing liquidity added event:`, error);
  }
}