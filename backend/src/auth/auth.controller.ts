import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Role } from '../enums';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') passwordHash: string,
    @Body('role') role: Role,
  ) {
    return this.authService.register({ name, email, passwordHash, role });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body('email') email: string, @Body('password') pass: string) {
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  getUsers() {
    return this.authService.findAllUsers();
  }
}
