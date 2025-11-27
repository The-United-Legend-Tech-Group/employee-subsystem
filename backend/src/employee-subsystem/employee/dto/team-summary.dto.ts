import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeamSummaryItemDto {
  @ApiPropertyOptional()
  positionId?: string;

  @ApiPropertyOptional()
  positionTitle?: string;

  @ApiPropertyOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  departmentName?: string;

  @ApiProperty()
  count: number;
}

export class TeamSummaryDto {
  @ApiProperty()
  managerId: string;

  @ApiProperty({ type: [TeamSummaryItemDto] })
  items: TeamSummaryItemDto[];
}
