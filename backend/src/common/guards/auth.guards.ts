import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../enums/user.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserEntity } from '../../modules/users/entities/user.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = UserEntity>(
    err: Error | null,
    user: TUser | false,
  ): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: UserEntity }>();

    if (!user || !requiredRoles.includes(user.role)) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    return true;
  }
}
