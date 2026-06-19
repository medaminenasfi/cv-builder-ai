import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
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
}
