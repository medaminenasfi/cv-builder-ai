import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserEntity } from '../../modules/users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest<Request & { user: UserEntity }>();
    return request.user;
  },
);
