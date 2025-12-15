import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, OauthLoginDto, AuthResponse } from './dtos';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: AuthResponse,
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'User login successful',
    type: AuthResponse,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('oauth')
  @ApiOperation({ summary: 'Login with OAuth provider' })
  @ApiResponse({
    status: 200,
    description: 'OAuth login successful',
    type: AuthResponse,
  })
  async oauthLogin(@Body() oauthLoginDto: OauthLoginDto) {
    return this.authService.oauthLogin(oauthLoginDto);
  }
}
