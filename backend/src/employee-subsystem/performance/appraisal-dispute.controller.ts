import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppraisalDisputeService } from './appraisal-dispute.service';
import { CreateAppraisalDisputeDto } from './dto/create-appraisal-dispute.dto';
import { UpdateAppraisalDisputeDto } from './dto/update-appraisal-dispute.dto';
import { AppraisalDispute } from './models/appraisal-dispute.schema';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { ResolveAppraisalDisputeDto } from './dto/resolve-appraisal-dispute.dto';

@ApiTags('Performance - Appraisal Disputes')
@Controller('performance/disputes')
export class AppraisalDisputeController {
  constructor(private readonly disputeService: AppraisalDisputeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appraisal dispute' })
  @ApiResponse({ status: 201, description: 'The created dispute', type: AppraisalDispute })
  async create(@Body() dto: CreateAppraisalDisputeDto) {
    return this.disputeService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by ID' })
  @ApiResponse({ status: 200, description: 'The dispute', type: AppraisalDispute })
  async findOne(@Param('id') id: string) {
    return this.disputeService.findOne(id);
  }

  @Get('record/:appraisalId')
  @ApiOperation({ summary: 'List disputes for an appraisal record' })
  async findByAppraisal(@Param('appraisalId') appraisalId: string) {
    return this.disputeService.findByAppraisalId(appraisalId);
  }

  @Get('cycle/:cycleId')
  @ApiOperation({ summary: 'List disputes for a cycle' })
  async findByCycle(@Param('cycleId') cycleId: string) {
    return this.disputeService.findByCycleId(cycleId);
  }

  @Get('open')
  @ApiOperation({ summary: 'List open disputes' })
  @ApiResponse({ status: 200, description: 'Open disputes', type: [AppraisalDispute] })
  async findOpen() {
    return this.disputeService.findOpen();
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign a reviewer to a dispute and mark under review' })
  @ApiResponse({ status: 200, description: 'The updated dispute', type: AppraisalDispute })
  async assignReviewer(@Param('id') id: string, @Body() dto: AssignReviewerDto) {
    return this.disputeService.assignReviewer(id, dto);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute with summary and status' })
  @ApiResponse({ status: 200, description: 'The resolved dispute', type: AppraisalDispute })
  async resolve(@Param('id') id: string, @Body() dto: ResolveAppraisalDisputeDto) {
    return this.disputeService.resolve(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dispute (status / resolution)' })
  async update(@Param('id') id: string, @Body() dto: UpdateAppraisalDisputeDto) {
    return this.disputeService.update(id, dto);
  }
}
