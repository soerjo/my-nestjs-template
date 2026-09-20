import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
// import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface.js';
import { AuthService } from '../auth.service.js';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const userId = payload.sub ?? payload.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.authService.validateUserById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
