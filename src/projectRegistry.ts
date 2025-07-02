import { Store } from '@subsquid/typeorm-store';
import { PumpKekProject } from './model/generated/pumpKekProject.model';
import { ethers } from 'ethers';

// Event signatures for project identification
const knownEventSignatures = new Map<string, string>();

/**
 * Centralized registry for tracking projects
 */
class ProjectRegistry {
  private knownProjects = new Set<string>();
  private projectTypes = new Map<string, Set<string>>();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  public _instanceId = Math.random().toString(36).substring(2, 15);

  constructor() {
    console.log(`[ProjectRegistry] Created instance with ID: ${this._instanceId}`);
    // Initialize project type sets
    this.projectTypes.set('PumpKek', new Set<string>());
    this.projectTypes.set('BasedBondingCurve', new Set<string>());
  }

  /**
   * Register event signatures for a project type
   */
  registerProjectType(projectType: string, eventSignatures: string[]): void {
    console.log(`[ProjectRegistry] Registering ${eventSignatures.length} event signatures for ${projectType}`);
    for (const signature of eventSignatures) {
      knownEventSignatures.set(signature, projectType);
    }
    
    // Ensure the project type set exists
    if (!this.projectTypes.has(projectType)) {
      this.projectTypes.set(projectType, new Set<string>());
    }
  }

  /**
   * Check if a project has been registered
   */
  isProject(address: string): boolean {
    if (!address) {
      console.error('[ProjectRegistry] Called isProject with null/undefined address');
      return false;
    }
    
    const normalized = address.toLowerCase();
    const result = this.knownProjects.has(normalized);
    console.log(`[ProjectRegistry] Checking if ${normalized} is a known project: ${result}`);
    return result;
  }

  /**
   * Check if address is a specific project type
   */
  isProjectType(address: string, type: string): boolean {
    if (!address) return false;
    
    const normalized = address.toLowerCase();
    const typeSet = this.projectTypes.get(type);
    if (!typeSet) return false;
    
    return typeSet.has(normalized);
  }

  /**
   * Add a project to the registry
   */
  addProject(address: string, type: string = 'unknown'): void {
    if (!address) {
      console.error('[ProjectRegistry] Called addProject with null/undefined address');
      return;
    }
    
    const normalized = address.toLowerCase();
    if (!this.knownProjects.has(normalized)) {
      this.knownProjects.add(normalized);
      
      // Add to type-specific set if the type is known
      const typeSet = this.projectTypes.get(type);
      if (typeSet) {
        typeSet.add(normalized);
      }
      
      console.log(`[ProjectRegistry] Added ${type} project: ${normalized}`);
      console.log(`[ProjectRegistry] Total projects: ${this.knownProjects.size}`);
    } else {
      console.log(`[ProjectRegistry] Project ${normalized} already exists in registry`);
      
      // If the project already exists but type is specified, ensure it's in the right type set
      if (type !== 'unknown') {
        const typeSet = this.projectTypes.get(type);
        if (typeSet && !typeSet.has(normalized)) {
          typeSet.add(normalized);
          console.log(`[ProjectRegistry] Added existing project to ${type} type set`);
        }
      }
    }
  }

  /**
   * Get all known projects
   */
  getAllProjects(): string[] {
    return Array.from(this.knownProjects);
  }

  /**
   * Get all projects of a specific type
   */
  getProjectsByType(type: string): string[] {
    const typeSet = this.projectTypes.get(type);
    if (!typeSet) return [];
    return Array.from(typeSet);
  }

  /**
   * Clear the registry (for testing)
   */
  clear(): void {
    this.knownProjects.clear();
    for (const typeSet of this.projectTypes.values()) {
      typeSet.clear();
    }
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Initialize registry from database
   * Uses a promise to ensure initialization happens only once
   */
  async initialize(store: Store): Promise<void> {
    if (this.isInitialized) {
      console.log('[ProjectRegistry] Already initialized');
      return;
    }

    if (this.initPromise) {
      console.log('[ProjectRegistry] Initialization in progress, waiting...');
      return this.initPromise;
    }

    console.log('[ProjectRegistry] Starting initialization...');
    this.initPromise = this.doInitialize(store);
    await this.initPromise;
    this.isInitialized = true;
    this.initPromise = null;
  }

  private async doInitialize(store: Store): Promise<void> {
    try {
      // Load PumpKek projects
      const projects = await store.find(PumpKekProject);
      console.log(`[ProjectRegistry] Loading ${projects.length} PumpKek projects from database`);
      
      for (const project of projects) {
        if (project.id) {
          const normalized = project.id.toLowerCase();
          this.knownProjects.add(normalized);
          const pumpKekSet = this.projectTypes.get('PumpKek');
          if (pumpKekSet) {
            pumpKekSet.add(normalized);
          }
        }
      }
      
      // Load BasedBondingCurve projects - this will be added when the entity exists
      try {
        // Once the model is generated, this will work:
        // const basedProjects = await store.find(BasedBondingCurveProject);
        // console.log(`[ProjectRegistry] Loading ${basedProjects.length} BasedBondingCurve projects from database`);
        
        // for (const project of basedProjects) {
        //   if (project.id) {
        //     const normalized = project.id.toLowerCase();
        //     this.knownProjects.add(normalized);
        //     const basedSet = this.projectTypes.get('BasedBondingCurve');
        //     if (basedSet) {
        //       basedSet.add(normalized);
        //     }
        //   }
        // }
      } catch (error) {
        // Entity might not exist yet - we'll just log a note
        console.log("[ProjectRegistry] Note: BasedBondingCurve projects not loaded (entity might not exist yet)");
      }
      
      console.log(`[ProjectRegistry] Loaded projects: ${Array.from(this.knownProjects).join(', ')}`);
    } catch (error) {
      console.error('[ProjectRegistry] Error loading projects:', error);
      throw error; // Re-throw to signal initialization failure
    }
  }

  /**
   * Determine project type from event signatures
   */
  getProjectTypeFromEvent(topics: string[]): string | null {
    if (!topics || topics.length === 0) return null;
    
    const eventSignature = topics[0];
    return knownEventSignatures.get(eventSignature) || null;
  }
}

// Export a singleton instance
export const projectRegistry = new ProjectRegistry();

// Register PumpKek event signatures
projectRegistry.registerProjectType('PumpKek', [
  ethers.id('Bought(address,uint256,uint256)'),
  ethers.id('Sold(address,uint256,uint256,uint256)'),
  ethers.id('Graduated(address,uint256)')
]);

// Database verification helper
export async function verifyDatabaseProjects(store: Store): Promise<void> {
  try {
    const projects = await store.find(PumpKekProject);
    console.log(`[DB Verification] Found ${projects.length} PumpKek projects in database:`);
    
    for (const project of projects) {
      console.log(`[DB Verification] Project: ${project.id}, Name: ${project.name}`);
    }
    
    // BasedBondingCurve projects will be verified later when the entity exists
    try {
      // const basedProjects = await store.find(BasedBondingCurveProject);
      // console.log(`[DB Verification] Found ${basedProjects.length} BasedBondingCurve projects in database`);
    } catch (error) {
      // Entity might not exist yet, ignore
    }
  } catch (error) {
    console.error('[DB Verification] Error querying database:', error);
  }
}