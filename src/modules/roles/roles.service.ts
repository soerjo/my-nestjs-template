import { Injectable } from '@nestjs/common';
import { RolesRepository } from './roles.repository.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

@Injectable()
export class RolesService {
  constructor(private rolesRepository: RolesRepository) {}

  async findAll() {
    return this.rolesRepository.findAll();
  }

  async findById(id: string) {
    return this.rolesRepository.findById(id);
  }

  async create(dto: CreateRoleDto) {
    return this.rolesRepository.create(dto);
  }

  async update(id: string, dto: UpdateRoleDto) {
    return this.rolesRepository.update(id, dto as { [key: string]: unknown });
  }

  async remove(id: string) {
    return this.rolesRepository.remove(id);
  }
}
