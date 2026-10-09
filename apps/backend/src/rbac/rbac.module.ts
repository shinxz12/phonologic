import { Global, Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from './permissions.guard';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Global()
@Module({
  controllers: [RolesController],
  providers: [PermissionsService, PermissionsGuard, RolesService],
  exports: [PermissionsService, PermissionsGuard, RolesService],
})
export class RbacModule {}
