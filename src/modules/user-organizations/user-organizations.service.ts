import { Injectable } from '@nestjs/common';
import { UserOrganizationsRepository } from './user-organizations.repository.js';
import { CreateUserOrganizationDto } from './dto/create-user-organization.dto.js';
import { UpdateUserOrganizationDto } from './dto/update-user-organization.dto.js';

@Injectable()
export class UserOrganizationsService {
  constructor(
    private userOrganizationsRepository: UserOrganizationsRepository,
  ) {}

  async findAll() {
    return this.userOrganizationsRepository.findAll();
  }

  async findByUser(userId: string) {
    return this.userOrganizationsRepository.findByUser(userId);
  }

  async findByOrganization(organizationId: string) {
    return this.userOrganizationsRepository.findByOrganization(organizationId);
  }

  async findById(id: string) {
    return this.userOrganizationsRepository.findById(id);
  }

  async create(dto: CreateUserOrganizationDto) {
    return this.userOrganizationsRepository.create(dto);
  }

  async update(id: string, dto: UpdateUserOrganizationDto) {
    return this.userOrganizationsRepository.update(
      id,
      dto as { [key: string]: unknown },
    );
  }

  async remove(id: string) {
    return this.userOrganizationsRepository.remove(id);
  }
}
