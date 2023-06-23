import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataService } from 'src/data/data.service';

@Injectable()
export class UserService {
  constructor(private data: DataService) {}
  async getCurrentUser(id: any) {
    try {
      const user = await this.data.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ForbiddenException();
      }
      throw error;
    }
  }
}
