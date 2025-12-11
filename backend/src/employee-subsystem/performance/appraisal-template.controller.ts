import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    // UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppraisalTemplateService } from './appraisal-template.service';
import { CreateAppraisalTemplateDto } from './dto/create-appraisal-template.dto';
import { UpdateAppraisalTemplateDto } from './dto/update-appraisal-template.dto';
// import { AuthGuard } from '../../common/guards/authentication.guard';
// import { authorizationGuard } from '../../common/guards/authorization.guard';
// import { Roles } from '../../common/decorators/roles.decorator';
// import { SystemRole } from '../employee/enums/employee-profile.enums';


@ApiTags('Performance')
@Controller('performance/templates')
export class AppraisalTemplateController {
    constructor(private readonly appraisalTemplateService: AppraisalTemplateService) { }

    @Post()
    //@UseGuards(AuthGuard, authorizationGuard)
    //@Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Create a new appraisal template' })
    @ApiResponse({ status: 201, description: 'The template has been successfully created.' })
    create(@Body() createAppraisalTemplateDto: CreateAppraisalTemplateDto) {
        return this.appraisalTemplateService.create(createAppraisalTemplateDto);
    }

    @Get()
    //@UseGuards(AuthGuard, authorizationGuard)
    //@Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Get all appraisal templates' })
    @ApiResponse({ status: 200, description: 'Return all appraisal templates.' })
    findAll() {
        return this.appraisalTemplateService.findAll();
    }

    @Get(':id')
    //@UseGuards(AuthGuard, authorizationGuard)
    //@Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Get an appraisal template by id' })
    @ApiResponse({ status: 200, description: 'Return the appraisal template.' })
    @ApiResponse({ status: 404, description: 'Template not found.' })
    findOne(@Param('id') id: string) {
        return this.appraisalTemplateService.findOne(id);
    }

    @Patch(':id')
    //@UseGuards(AuthGuard, authorizationGuard)
    //@Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Update an appraisal template' })
    @ApiResponse({ status: 200, description: 'The template has been successfully updated.' })
    @ApiResponse({ status: 404, description: 'Template not found.' })
    update(
        @Param('id') id: string,
        @Body() updateAppraisalTemplateDto: UpdateAppraisalTemplateDto,
    ) {
        return this.appraisalTemplateService.update(id, updateAppraisalTemplateDto);
    }

    @Delete(':id')
    //@UseGuards(AuthGuard, authorizationGuard)
    //@Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Delete an appraisal template' })
    @ApiResponse({ status: 200, description: 'The template has been successfully deleted.' })
    @ApiResponse({ status: 404, description: 'Template not found.' })
    remove(@Param('id') id: string) {
        return this.appraisalTemplateService.remove(id);
    }
}
