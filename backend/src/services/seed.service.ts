import { seedCatalogApis } from '../config/api-catalog';
import { stellarService } from './stellar.service';

export function seedApis(): void {
  seedCatalogApis(stellarService.getAgentPublicKey());
}
