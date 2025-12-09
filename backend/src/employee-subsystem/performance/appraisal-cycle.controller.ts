import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppraisalCycleService } from './appraisal-cycle.service';
import { CreateAppraisalCycleDto } from './dto/create-appraisal-cycle.dto';
import { UpdateAppraisalCycleDto } from './dto/update-appraisal-cycle.dto';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../employee/enums/employee-profile.enums';

@ApiTags('Performance')
@Controller('performance/cycles')
export class AppraisalCycleController {
    constructor(private readonly appraisalCycleService: AppraisalCycleService) { }

    @Post()
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
    create(@Body() createAppraisalCycleDto: CreateAppraisalCycleDto) {
        return this.appraisalCycleService.create(createAppraisalCycleDto);
    }

    @Get()
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
    findAll() {
        return this.appraisalCycleService.findAll();
    }

    @Get(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
    findOne(@Param('id') id: string) {
        return this.appraisalCycleService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
    update(
        @Param('id') id: string,
        @Body() updateAppraisalCycleDto: UpdateAppraisalCycleDto,
    ) {
        return this.appraisalCycleService.update(id, updateAppraisalCycleDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
    remove(@Param('id') id: string) {
        return this.appraisalCycleService.remove(id);
    }
}
