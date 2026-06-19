import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { UserPlan } from '../../common/enums/user.enum';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly usersService: UsersService) {}

  @Post('webhook')
  webhook(
    @Headers('stripe-signature') _sig: string,
    @Body() body: { type: string; data: { object: { customer_email?: string } } },
  ) {
    if (body.type === 'checkout.session.completed' && body.data?.object?.customer_email) {
      return { received: true, note: 'Upgrade user plan via admin or implement email lookup' };
    }
    return { received: true };
  }

  @Post('checkout')
  createCheckout() {
    return {
      url: 'https://checkout.stripe.com/pay/cs_test_placeholder',
      message: 'Configure STRIPE_SECRET_KEY for production checkout',
    };
  }
}
