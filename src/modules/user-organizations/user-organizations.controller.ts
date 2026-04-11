import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserOrganizationsService } from './user-organizations.service.js';
import { CreateUserOrganizationDto } from './dto/create-user-organization.dto.js';
import { UpdateUserOrganizationDto } from './dto/update-user-organization.dto.js';
import { Roles as RolesDecorator } from '../../common/decorators/roles.decorator.js';

@ApiTags('UserOrganizations')
@ApiBearerAuth()
@Controller('user-organizations')
export class UserOrganizationsController {
  constructor(
    private readonly userOrganizationsService: UserOrganizationsService,
  ) {}

  @Get()
  @RolesDecorator('ADMIN')
  async findAll() {
    return this.userOrganizationsService.findAll();
  }

  @Get('user/:userId')
  @RolesDecorator('ADMIN')
  async findByUser(@Param('userId') userId: string) {
    return this.userOrganizationsService.findByUser(userId);
  }

  @Get('organization/:organizationId')
  @RolesDecorator('ADMIN')
  async findByOrganization(@Param('organizationId') organizationId: string) {
    return this.userOrganizationsService.findByOrganization(organizationId);
  }

  @Get(':id')
  @RolesDecorator('ADMIN')
  async findOne(@Param('id') id: string) {
    return this.userOrganizationsService.findById(id);
  }

  @Post()
  @RolesDecorator('ADMIN')
  async create(@Body() dto: CreateUserOrganizationDto) {
    return this.userOrganizationsService.create(dto);
  }

  @Patch(':id')
  @RolesDecorator('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserOrganizationDto,
  ) {
    return this.userOrganizationsService.update(id, dto);
  }

  @Delete(':id')
  @RolesDecorator('ADMIN')
  async remove(@Param('id') id: string) {
    return this.userOrganizationsService.remove(id);
  }
}
