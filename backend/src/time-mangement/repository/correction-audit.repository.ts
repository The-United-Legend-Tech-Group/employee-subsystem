import { Injectable } from '@nestjs/common';

@Injectable()
export class CorrectionAuditRepository {
  // Deprecated: audits are now ephemeral (logged).
  // Repository retained for historical reasons but no longer performs persistent operations.
}
