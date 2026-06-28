import {
  Injectable,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserPlan } from '../../common/enums/user.enum';

@Injectable()
export class BillingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  private getStripeSecret(): string | null {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    return key?.trim() && !key.includes('placeholder') ? key : null;
  }

  async createCheckoutSession(userId: string, email: string) {
    const secret = this.getStripeSecret();
    const frontend = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const priceId = this.configService.get<string>('STRIPE_PRO_PRICE_ID');

    if (!secret) {
      return {
        url: null,
        message: 'Add STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID to backend/.env',
        configured: false,
      };
    }

    if (!priceId) {
      throw new BadRequestException('STRIPE_PRO_PRICE_ID is not configured');
    }

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('customer_email', email);
    params.set('client_reference_id', userId);
    params.set('success_url', `${frontend}/settings?upgraded=1`);
    params.set('cancel_url', `${frontend}/settings?tab=plan`);
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('metadata[userId]', userId);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const body = (await response.json()) as { url?: string; error?: { message?: string } };
    if (!response.ok || !body.url) {
      throw new ServiceUnavailableException(
        body.error?.message ?? 'Stripe checkout failed',
      );
    }

    return { url: body.url, configured: true };
  }

  async handleWebhook(payload: {
    type: string;
    data: { object: { client_reference_id?: string; customer_email?: string } };
  }) {
    if (payload.type === 'checkout.session.completed') {
      const userId = payload.data?.object?.client_reference_id;
      const email = payload.data?.object?.customer_email;
      if (userId) {
        await this.usersService.updatePlan(userId, UserPlan.PRO);
        return { received: true, upgraded: true, userId };
      }
      if (email) {
        const user = await this.usersService.findByEmail(email);
        if (user) {
          await this.usersService.updatePlan(user.id, UserPlan.PRO);
          return { received: true, upgraded: true, userId: user.id };
        }
      }
    }
    return { received: true, upgraded: false };
  }
}
