import { createZodDto } from '../common/zod-dto';
import {
  assignRolesSchema,
  createRoleSchema,
  updateRoleSchema,
} from '@phonologic/shared-types';

export class CreateRoleDto extends createZodDto(createRoleSchema) {}
export class UpdateRoleDto extends createZodDto(updateRoleSchema) {}
export class AssignRolesDto extends createZodDto(assignRolesSchema) {}
