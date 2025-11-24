import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TimeService } from './time.service';
import { CreateTimeDto } from './dto/create-time.dto';

@ApiTags('time')
@Controller('time')
export class TimeController {
  constructor(private readonly service: TimeService) {}

  @Get('ping')
  @ApiOperation({ summary: 'Health check for time subsystem' })
  @ApiResponse({ status: 200, description: 'pong' })
  ping() {
    return { pong: true };
  }

  @Post('records')
  @ApiOperation({ summary: 'Create a dummy time record' })
  @ApiResponse({ status: 201, description: 'Created' })
  create(@Body() dto: CreateTimeDto) {
    return this.service.create(dto);
  }
}
