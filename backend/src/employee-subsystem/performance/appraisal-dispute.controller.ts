import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppraisalDisputeService } from './appraisal-dispute.service';
import { CreateAppraisalDisputeDto } from './dto/create-appraisal-dispute.dto';
import { UpdateAppraisalDisputeDto } from './dto/update-appraisal-dispute.dto';
import { AppraisalDispute } from './models/appraisal-dispute.schema';

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

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dispute (status / resolution)' })
  async update(@Param('id') id: string, @Body() dto: UpdateAppraisalDisputeDto) {
    return this.disputeService.update(id, dto);
  }
}
