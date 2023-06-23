import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private user: UserService) {}
  @Get('me')
  getMe(@GetUser() userId: User['id']) {
    return this.user.getCurrentUser(userId);
  }
}
