import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdOrFail(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateMe(
    userId: string,
    data: {
      avatarUrl?: string;
    },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: data.avatarUrl,
      },
    });
    return updated;
  }
}
