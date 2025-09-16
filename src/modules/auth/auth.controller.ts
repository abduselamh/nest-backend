// src/modules/auth/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginSchema } from './auth.schema';
import type { LoginDto } from './dto/login.dto';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*@Post('login')
  login(
    @Body(new ZodValidationPipe<LoginDto>(LoginSchema))
    body: LoginDto,
  ) {
    return this.authService.findByUserId('some-user'); // placeholder
  }

  @Post('login')
  forgetpassword(
    @Body(new ZodValidationPipe<LoginDto>(LoginSchema))
    body: LoginDto,
  ) {
    return this.authService.findByUserId('some-user'); // placeholder
  }

  @Post('login')
  verify(
    @Body(new ZodValidationPipe<LoginDto>(LoginSchema))
    body: LoginDto,
  ) {
    return this.authService.findByUserId('some-user'); // placeholder
  }

  @Post('login')
  sendcode(
    @Body(new ZodValidationPipe<LoginDto>(LoginSchema))
    body: LoginDto,
  ) {
    return this.authService.findByUserId('some-user'); // placeholder
  }
*/
}
