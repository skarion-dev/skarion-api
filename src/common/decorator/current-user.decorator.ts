import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const { sub, ...rest } = req.user || {};

    return {
      ...rest,
      id: sub,
    };
  },
);
