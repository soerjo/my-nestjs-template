import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { $Enums } from '@prisma/client';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { PrismaService } from '../../prisma/prisma.service.js';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let repository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    findByEmail: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let prisma: {
    user: { findUnique: jest.Mock };
    organization: { findUnique: jest.Mock };
  };

  const dto = {
    email: 'john@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    organizationId: 'org-1',
  };

  const createdUser = {
    id: 'user-1',
    email: 'john@example.com',
    password: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    role: $Enums.RoleName.USER,
    organizationId: 'org-1',
  };

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    prisma = {
      user: { findUnique: jest.fn() },
      organization: { findUnique: jest.fn() },
    };
    service = new UsersService(
      repository as unknown as UsersRepository,
      prisma as unknown as PrismaService,
    );
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws ConflictException when the email already exists', async () => {
      repository.findByEmail.mockResolvedValue(createdUser);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);

      expect(repository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the organization is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: dto.organizationId },
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('hashes the password with 10 rounds before creating the user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      repository.create.mockResolvedValue(createdUser);

      await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    });

    it('creates the user with the organizationId and default role USER', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      repository.create.mockResolvedValue(createdUser);

      await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        email: dto.email,
        password: 'hashed-password',
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: $Enums.RoleName.USER,
        organizationId: dto.organizationId,
      });
    });

    it('keeps a provided role instead of the default', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      repository.create.mockResolvedValue({
        ...createdUser,
        role: $Enums.RoleName.ADMIN,
      });

      await service.create({ ...dto, role: $Enums.RoleName.ADMIN });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: $Enums.RoleName.ADMIN }),
      );
    });

    it('returns the created user with the password stripped', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      repository.create.mockResolvedValue(createdUser);

      const result = await service.create(dto);

      expect(result).toEqual({
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: $Enums.RoleName.USER,
        organizationId: 'org-1',
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findAll', () => {
    it('returns all users from the repository', async () => {
      repository.findAll.mockResolvedValue([createdUser]);

      await expect(service.findAll()).resolves.toEqual([createdUser]);
    });
  });

  describe('findById', () => {
    it('returns a mapped user without sensitive info', async () => {
      repository.findById.mockResolvedValue({
        ...createdUser,
        organization: { id: 'org-1', name: 'Acme' },
      });

      const result = await service.findById('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'john@example.com',
        userName: 'John Doe',
        organizationName: 'Acme',
        role: $Enums.RoleName.USER,
        organizationId: 'org-1',
      });
      expect(repository.findById).toHaveBeenCalledWith('user-1');
    });
  });

  describe('update', () => {
    it('delegates to the repository', async () => {
      repository.update.mockResolvedValue(createdUser);
      const updateDto = { firstName: 'Jane' };

      const result = await service.update('user-1', updateDto);

      expect(repository.update).toHaveBeenCalledWith('user-1', updateDto);
      expect(result).toEqual(createdUser);
    });
  });

  describe('remove', () => {
    it('delegates to the repository', async () => {
      repository.remove.mockResolvedValue(createdUser);

      await expect(service.remove('user-1')).resolves.toEqual(createdUser);
      expect(repository.remove).toHaveBeenCalledWith('user-1');
    });
  });
});
