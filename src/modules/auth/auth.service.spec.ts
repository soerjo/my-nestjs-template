import { $Enums } from '@prisma/client';
import { AuthService } from './auth.service.js';

describe('AuthService JWT payloads', () => {
  it('includes role and organizationId in access and refresh tokens', () => {
    const sign = jest.fn().mockReturnValue('token');
    const service = new AuthService(
      {} as never,
      { sign } as never,
      { get: jest.fn().mockReturnValue('1d') } as never,
      {} as never,
      {} as never,
    );
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Example',
      role: $Enums.RoleName.ADMIN,
      organizationId: 'org-1',
    };

    service.login(user);

    expect(sign).toHaveBeenNthCalledWith(1, {
      sub: 'user-1',
      email: 'user@example.com',
      role: $Enums.RoleName.ADMIN,
      organizationId: 'org-1',
    });
    expect(sign).toHaveBeenNthCalledWith(
      2,
      {
        sub: 'user-1',
        email: 'user@example.com',
        role: $Enums.RoleName.ADMIN,
        organizationId: 'org-1',
      },
      expect.objectContaining({ secret: '1d' }),
    );
  });
});
