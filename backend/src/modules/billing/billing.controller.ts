import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { BillingService } from './billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('webhook')
  webhook(
    @Headers('stripe-signature') _sig: string,
    @Body() body: { type: string; data: { object: { client_reference_id?: string; customer_email?: string } } },
  ) {
    return this.billingService.handleWebhook(body);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createCheckout(@CurrentUser() user: UserEntity) {
    return this.billingService.createCheckoutSession(user.id, user.email);
  }
}
