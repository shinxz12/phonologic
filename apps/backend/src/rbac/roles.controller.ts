import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { RequirePermissions } from './require-permissions.decorator';
import { RolesService } from './roles.service';
import {
  AssignRolesDto,
  CreateRoleDto,
  UpdateRoleDto,
} from './roles.dto';
import type { RoleResponse } from '@phonologic/shared-types';

@Controller('rbac')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  @RequirePermissions('rbac.manageRoles')
  listRoles(): Promise<RoleResponse[]> {
    return this.rolesService.listRoles();
  }

  @Get('permissions')
  @RequirePermissions('rbac.manageRoles')
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Post('roles')
  @RequirePermissions('rbac.manageRoles')
  createRole(@Body() dto: CreateRoleDto): Promise<RoleResponse> {
    return this.rolesService.createRole(dto);
  }

  @Put('roles/:id')
  @RequirePermissions('rbac.manageRoles')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponse> {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @RequirePermissions('rbac.manageRoles')
  async deleteRole(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.rolesService.deleteRole(id);
    return { success: true };
  }

  @Post('users/:userId/roles')
  @RequirePermissions('rbac.assignRoles')
  assignUserRoles(
    @Param('userId') userId: string,
    @Body() dto: AssignRolesDto,
  ): Promise<{ success: boolean; roleKeys: string[] }> {
    return this.rolesService.assignUserRoles(userId, dto);
  }
}
