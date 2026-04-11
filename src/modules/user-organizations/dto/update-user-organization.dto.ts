import { PartialType } from '@nestjs/swagger';
import { CreateUserOrganizationDto } from './create-user-organization.dto.js';

export class UpdateUserOrganizationDto extends PartialType(
  CreateUserOrganizationDto,
) {}
