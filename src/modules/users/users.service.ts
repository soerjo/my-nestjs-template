import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { $Enums, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UsersRepository } from './users.repository.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private prisma: PrismaService,
  ) {}

  async findAll() {
    return this.usersRepository.findAll();
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    return {
      id: user.id,
      email: user.email,
      userName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
      organizationName: user.organization.name,
      role: user.role,
      organizationId: user.organization.id,
    };
  }

  async create(dto: CreateUserDto) {
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const data: Prisma.UserUncheckedCreateInput = {
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role ?? $Enums.RoleName.USER,
      organizationId: dto.organizationId,
    };

    const user = await this.usersRepository.create(data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.usersRepository.update(id, dto as { [key: string]: unknown });
  }

  async remove(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = await this.usersRepository.remove(id);
    return result;
  }
}
