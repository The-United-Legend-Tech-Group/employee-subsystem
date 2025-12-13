import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppraisalCycleService } from './appraisal-cycle.service';
import { CreateAppraisalCycleDto } from './dto/create-appraisal-cycle.dto';
import { UpdateAppraisalCycleDto } from './dto/update-appraisal-cycle.dto';

@ApiTags('Performance')
@Controller('performance/cycles')
export class AppraisalCycleController {
    constructor(private readonly appraisalCycleService: AppraisalCycleService) { }

    @Post()
    create(@Body() createAppraisalCycleDto: CreateAppraisalCycleDto) {
        return this.appraisalCycleService.create(createAppraisalCycleDto);
    }

    @Get()
    findAll() {
        return this.appraisalCycleService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.appraisalCycleService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateAppraisalCycleDto: UpdateAppraisalCycleDto,
    ) {
        return this.appraisalCycleService.update(id, updateAppraisalCycleDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.appraisalCycleService.remove(id);
    }
}
