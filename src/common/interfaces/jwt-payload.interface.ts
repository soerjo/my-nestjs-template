import { $Enums } from '@prisma/client';

export interface JwtPayload {
  sub?: string;
  id?: string;
  email: string;
  role?: $Enums.RoleName;
  organizationId?: string;
}
