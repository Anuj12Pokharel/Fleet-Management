import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '../enums';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: { name: string; email: string; passwordHash: string; role: Role }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(data.passwordHash, salt);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hash,
        role: data.role,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (user && bcrypt.compareSync(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
