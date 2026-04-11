import { Module } from '@nestjs/common';
import { UserOrganizationsController } from './user-organizations.controller.js';
import { UserOrganizationsService } from './user-organizations.service.js';
import { UserOrganizationsRepository } from './user-organizations.repository.js';

@Module({
  controllers: [UserOrganizationsController],
  providers: [UserOrganizationsService, UserOrganizationsRepository],
  exports: [UserOrganizationsService, UserOrganizationsRepository],
})
export class UserOrganizationsModule {}
