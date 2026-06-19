import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPlan, UserRole } from '../../common/enums/user.enum';
import { CVEntity } from '../cvs/entities/cv.entity';
import { TemplateEntity } from '../templates/entities/template.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(CVEntity)
    private readonly cvsRepository: Repository<CVEntity>,
    @InjectRepository(TemplateEntity)
    private readonly templatesRepository: Repository<TemplateEntity>,
  ) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  count(): Promise<number> {
    return this.usersRepository.count();
  }

  countByRole(role: UserRole): Promise<number> {
    return this.usersRepository.count({ where: { role } });
  }

  countByPlan(plan: UserPlan): Promise<number> {
    return this.usersRepository.count({ where: { plan } });
  }

  adminExists(): Promise<boolean> {
    return this.usersRepository
      .exist({ where: { role: UserRole.ADMIN } })
      .then(Boolean);
  }

  countCvs(): Promise<number> {
    return this.cvsRepository.count();
  }

  countActiveTemplates(): Promise<number> {
    return this.templatesRepository.count({ where: { isActive: true } });
  }

  async findAllPaginated(page = 1, limit = 20, plan?: UserPlan) {
    const [items, total] = await this.usersRepository.findAndCount({
      where: plan ? { plan } : undefined,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: [
        'id',
        'email',
        'role',
        'plan',
        'locale',
        'isBlocked',
        'createdAt',
        'updatedAt',
      ],
    });
    return { items, total, page, limit, plan: plan ?? null };
  }

  async updatePlan(id: string, plan: UserPlan): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.plan = plan;
    return this.usersRepository.save(user);
  }

  async updateRole(id: string, role: UserRole): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN && role === UserRole.USER) {
      const adminCount = await this.countByRole(UserRole.ADMIN);
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot demote the last admin');
      }
    }

    user.role = role;
    return this.usersRepository.save(user);
  }

  async updateBlocked(id: string, isBlocked: boolean): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.isBlocked = isBlocked;
    return this.usersRepository.save(user);
  }

  save(user: UserEntity): Promise<UserEntity> {
    return this.usersRepository.save(user);
  }

  async getUserCvCount(userId: string): Promise<number> {
    return this.cvsRepository.count({ where: { userId } });
  }
}
