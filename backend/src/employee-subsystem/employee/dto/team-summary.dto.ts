export class TeamSummaryItemDto {
  positionId?: string;
  positionTitle?: string;
  departmentId?: string;
  departmentName?: string;
  count: number;
}

export class TeamSummaryDto {
  managerId: string;
  items: TeamSummaryItemDto[];
}
