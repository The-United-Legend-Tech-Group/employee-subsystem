import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

/**
 * DTO for creating expense reimbursement claims
 * 
 * Fulfills: REQ-PY-17 - Submit expense reimbursement claims
 * 
 * This DTO captures the essential information needed when an employee
 * submits an expense claim for reimbursement. The claim will be created
 * with status "under review" and will go through the approval workflow.
 */
export class CreateExpenseClaimDto {
  @IsString()
  @IsOptional()
  claim_id?: string; // Unique claim identifier (e.g., CLAIM-0001) - auto-generated if not provided

  @IsString()
  description: string; // Description of the expense being claimed

  @IsString()
  claimType: string; // Type of expense (e.g., medical, travel, office supplies)

  @IsNumber()
  @Min(0)
  amount: number; // Amount being claimed for reimbursement
}