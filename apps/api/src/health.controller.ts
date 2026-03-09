import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Verification de sante de l\'API' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'batigest-api',
    };
  }
}
