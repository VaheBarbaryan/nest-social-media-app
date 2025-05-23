import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus, Param, ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '@common/decorators/currentUser.decorator';
import { AcceptFriendRequestDto } from '@users/dto/acceptFriendRequest.dto';

export const USERS_CONTROLLER = 'users' as const

export const USERS_ROUTES = {
  GET_USERS: '',
  PENDING_REQUESTS: 'friend/requests',
  ADD_FRIEND: 'friend/:id',
  ACCEPT_REQUEST: 'friend/accept',
  DECLINE_REQUEST: 'friend/decline'
} as const

@Controller(USERS_CONTROLLER)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(USERS_ROUTES.GET_USERS)
  async getUsers(
      @Query('search') search?: string,
      @Query('page', ParseIntPipe) page: number = 1,
      @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.usersService.getUsers(search, page, limit);
  }

  @Get(USERS_ROUTES.PENDING_REQUESTS)
  async getPendingRequests(@CurrentUser() user: any): Promise<any[]> {
    return await this.usersService.getPendingRequests(user.id);
  }

  @Post(USERS_ROUTES.ADD_FRIEND)
  @HttpCode(HttpStatus.CREATED)
  async addFriend(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) receiverId: number
  ): Promise<void> {
    await this.usersService.addFriend(user.id, receiverId);
  }

  @Post(USERS_ROUTES.ACCEPT_REQUEST)
  @HttpCode(HttpStatus.OK)
  async acceptFriendRequest(
    @CurrentUser() user: any,
    @Body() { requestId }: AcceptFriendRequestDto,
  ): Promise<void> {
    await this.usersService.acceptFriendRequest(user.id, requestId);
  }

  @Post(USERS_ROUTES.DECLINE_REQUEST)
  @HttpCode(HttpStatus.OK)
  async declineFriendRequest(
    @CurrentUser() user: any,
    @Body() { requestId }: AcceptFriendRequestDto,
  ): Promise<void> {
    await this.usersService.declineFriendRequest(user.id, requestId);
  }
}