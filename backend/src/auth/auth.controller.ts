import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Role } from '../enums';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new fleet user account. Role must be one of: DRIVER, MECHANIC, MAINTENANCE_ADMIN, FLEET_MANAGER.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email', 'password', 'role'],
      properties: {
        name:     { type: 'string', example: 'John Smith' },
        email:    { type: 'string', example: 'john@fleet.com' },
        password: { type: 'string', example: 'password123' },
        role:     { type: 'string', enum: ['DRIVER', 'MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'], example: 'DRIVER' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
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
  @ApiOperation({
    summary: 'Login and obtain a JWT',
    description: 'Authenticates with email + password. Returns a Bearer JWT token to use in all subsequent requests.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email:    { type: 'string', example: 'manager@fleet.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful — returns access_token and user object',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiJ9...',
        user: { id: 'u1', name: 'Sarah Manager', email: 'manager@fleet.com', role: 'FLEET_MANAGER' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body('email') email: string, @Body('password') pass: string) {
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Get current user profile', description: 'Returns the authenticated user decoded from the JWT.' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token' })
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'List all users', description: 'Returns all registered fleet users. Requires authentication.' })
  @ApiResponse({ status: 200, description: 'Array of user objects' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUsers() {
    return this.authService.findAllUsers();
  }
}
