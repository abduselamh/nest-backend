import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import {
  CreateUserSchema,
  GetUserByEmailSchema,
  GetUserByIdSchema,
  GetUserByPhoneSchema,
  GetUserByUsernameSchema,
  UpdateUserSchema,
} from './user.schema';
import type { CreateUserDto } from './dto/create-user.dto';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { PipeTransform } from '@nestjs/common';
import { UserService } from './user.service';
import type { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post()
  createUser(
    @Body(
      (() => {
        const pipe = new ZodValidationPipe<CreateUserDto>(CreateUserSchema);
        return pipe as PipeTransform;
      })(),
    )
    body: CreateUserDto,
  ) {
    return this.userService.createUser(body);
  }

  @Get('all')
  async getUsers() {
    const users = await this.userService.getUsers();
    return { data: users };
  }

  @Get('id')
  async getUserById(
    @Query(new ZodValidationPipe(GetUserByIdSchema)) query: { id: string },
  ) {
    const users = await this.userService.getUserById(query.id);
    return { data: users };
  }

  @Get('mail')
  async getUserByEmail(
    @Query(new ZodValidationPipe(GetUserByEmailSchema))
    query: {
      email: string;
    },
  ) {
    const users = await this.userService.getUserByEmail(query.email);
    return { data: users };
  }

  @Get('username')
  async getUserByUsername(
    @Query(new ZodValidationPipe(GetUserByUsernameSchema))
    query: {
      username: string;
    },
  ) {
    console.log('retiving the user', query.username);
    const users = await this.userService.getUserByUsername(query.username);
    return { data: users };
  }

  @Get('phone')
  async getUserByPhoneNumber(
    @Body(new ZodValidationPipe(GetUserByPhoneSchema))
    query: {
      phone: string;
    },
  ) {
    const users = await this.userService.getUserByPhone(query.phone);
    return { data: users };
  }

  @Get('invite')
  async getUserByInviteToken() {
    const users = await this.userService.getUsers();
    return { data: users };
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateUserDto>(UpdateUserSchema))
    body: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, body);
  }

  @Delete(':id')
  async deleteUser(
    @Param(new ZodValidationPipe(GetUserByIdSchema))
    param: {
      id: string;
    },
  ) {
    return this.userService.deleteUser(param.id);
  }
}
