import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OrganizationsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.organization.findMany({
      include: {
        // roles: {
        //   select: {
        //     id: true,
        //     name: true,
        //     createdAt: true,
        //     updatedAt: true,
        //   },
        // },
        userOrganizations: {
          select: {
            id: true,
            userId: true,
            roleId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        // roles: {
        //   select: {
        //     id: true,
        //     name: true,
        //     createdAt: true,
        //     updatedAt: true,
        //   },
        // },
        userOrganizations: {
          select: {
            id: true,
            userId: true,
            roleId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    if (!organization) {
      throw new NotFoundException(`Organization with slug ${slug} not found`);
    }
    return organization;
  }

  async findById(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        // roles: {
        //   select: {
        //     id: true,
        //     name: true,
        //     createdAt: true,
        //     updatedAt: true,
        //   },
        // },
        userOrganizations: {
          select: {
            id: true,
            userId: true,
            roleId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    if (!organization) {
      throw new NotFoundException(`Organization with id ${id} not found`);
    }
    return organization;
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    website?: string;
    logoUrl?: string;
  }) {
    return this.prisma.organization.create({
      data,
      include: {
        // roles: {
        //   select: {
        //     id: true,
        //     name: true,
        //     createdAt: true,
        //     updatedAt: true,
        //   },
        // },
        userOrganizations: {
          select: {
            id: true,
            userId: true,
            roleId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async update(id: string, data: { [key: string]: unknown }) {
    await this.findById(id);
    return this.prisma.organization.update({
      where: { id },
      data,
      include: {
        // roles: {
        //   select: {
        //     id: true,
        //     name: true,
        //     createdAt: true,
        //     updatedAt: true,
        //   },
        // },
        userOrganizations: {
          select: {
            id: true,
            userId: true,
            roleId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.organization.delete({ where: { id } });
  }
}
