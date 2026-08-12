import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../auth/roles.guard';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get immutable audit log records (Admin only)' })
  async findAll() {
    return this.auditService.findAll();
  }
}
