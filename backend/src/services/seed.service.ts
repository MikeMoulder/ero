import { seedCatalogApis } from '../config/api-catalog';
import { stellarService } from './stellar.service';

export async function seedApis(): Promise<void> {
  await seedCatalogApis(stellarService.getAgentPublicKey());
}
