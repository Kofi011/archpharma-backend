import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier' | 'storekeeper' | 'accountant';
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    try {
      const userCount = await this.userRepository.count();
      if (userCount === 0) {
        this.logger.log('No users found in database. Initializing default admin...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = this.userRepository.create({
          name: 'Super Admin',
          email: 'admin@archpharma.com',
          phone: '0596549541',
          password_hash: hashedPassword,
          role: 'admin',
          status: 'active',
        });
        await this.userRepository.save(adminUser);
        this.logger.log('Default admin seeded: admin@archpharma.com / admin123');
      }
    } catch (err) {
      this.logger.warn(`Could not verify or seed admin user: ${err.message}`);
    }
  }

  async validateUser(email: string, pass: string): Promise<UserPayload> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (user) {
      const isMatch = await bcrypt.compare(pass, user.password_hash);
      if (isMatch) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    }
    throw new UnauthorizedException('Invalid email or password');
  }

  async login(user: UserPayload) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const payload = { sub: decoded.sub, email: decoded.email, role: decoded.role, name: decoded.name };
      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
