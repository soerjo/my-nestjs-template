import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users/users.repository.js';
import { EmailService } from '../email/email.service.js';
import * as bcrypt from 'bcryptjs';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface.js';
import type { AuthUser } from '../../common/interfaces/auth-user.interface.js';
import type { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.usersRepository.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return { id: user.id, email: user.email };
    }
    return null;
  }

  async validateUserById(id: string): Promise<AuthUser | null> {
    const user = await this.usersRepository.findById(id);
    if (user) {
      return { id: user.id, email: user.email };
    }
    return null;
  }

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async validateGoogleUser(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<AuthUser> {
    let user = await this.usersRepository.findByEmail(email);
    if (!user) {
      user = await this.usersRepository.create({
        email,
        password: '',
        firstName,
        lastName,
      });
    }
    return { id: user.id, email: user.email };
  }

  login(user: AuthUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: this.configService
          .get<string>('JWT_REFRESH_EXPIRATION')!
          .replace(/\D/g, '') as unknown as number,
      }),
    };
  }

  async setPassword(userId: string, newPassword: string) {
    const user = await this.usersRepository.findByEmail(
      (await this.usersRepository.findById(userId)).email,
    );
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.password) {
      throw new BadRequestException(
        'Password already set. Use change password instead.',
      );
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.updatePassword(userId, hashedPassword);
    return { message: 'Password set successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepository.findByEmail(
      (await this.usersRepository.findById(userId)).email,
    );
    if (!user || !user.password) {
      throw new BadRequestException(
        'No password set. Use set password instead.',
      );
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.updatePassword(userId, hashedPassword);
    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a reset link will be sent' };
    }
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const resetToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
      expiresIn: '1h',
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    await this.emailService.sendMail({
      to: email,
      subject: 'Reset your password',
      template: 'forgot-password',
      context: { resetUrl },
    });

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    const user = await this.usersRepository.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.updatePassword(user.id, hashedPassword);
    return { message: 'Password reset successfully' };
  }
}
