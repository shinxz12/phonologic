import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../rbac/require-permissions.decorator';
import { LearningAdminService } from './learning-admin.service';
import { ContentBundleDto, PublishContentDto } from './learning.dto';
import type { AdminContentView } from '@phonologic/shared-types';

@Controller('learning/admin')
@RequirePermissions('rbac.manageRoles')
export class LearningAdminController {
  constructor(private readonly adminService: LearningAdminService) {}

  @Get()
  getAdminContent(): Promise<AdminContentView> {
    return this.adminService.getAdminContent();
  }

  @Put('draft')
  updateDraft(@Body() bundle: ContentBundleDto): Promise<AdminContentView> {
    return this.adminService.updateDraft(bundle);
  }

  @Post('publish')
  publishDraft(
    @CurrentUser() user: AuthUser,
    @Body() dto: PublishContentDto,
  ): Promise<AdminContentView> {
    return this.adminService.publishDraft(user.id, dto);
  }

  @Post('reports/:id/resolve')
  resolveReport(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.adminService.resolveReport(id);
  }
}
