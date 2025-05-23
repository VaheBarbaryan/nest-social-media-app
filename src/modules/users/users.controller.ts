import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '@common/decorators/currentUser.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';

export const USERS_CONTROLLER = 'users' as const;

export const USERS_ROUTES = {
  GET_USERS: '',
  GET_PENDING_REQUESTS: 'friends/requests/pending',
  SEND_FRIEND_REQUEST: 'friends/requests/:id',
  GET_FRIENDS: 'friends',
  ACCEPT_FRIEND_REQUEST: 'friends/requests/:id/accept',
  DECLINE_FRIEND_REQUEST: 'friends/requests/:id/decline'
} as const;

@ApiTags('Users')
@Controller(USERS_CONTROLLER)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(USERS_ROUTES.GET_USERS)
  @ApiOperation({ summary: 'Get users' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'string', default: '1' } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'string', default: '10' } })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('page') page: string = "1",
    @Query('limit') limit: string = "10",
  ) {
    return await this.usersService.getUsers(user.id, search, Number(page), Number(limit));
  }

  @Get(USERS_ROUTES.GET_PENDING_REQUESTS)
  @ApiOperation({ summary: 'Get pending friend requests' })
  @ApiResponse({ status: 200, description: 'List of pending requests' })
  async getPendingRequests(@CurrentUser() user: any) {
    return await this.usersService.getPendingRequests(user.id);
  }

  @Get(USERS_ROUTES.GET_FRIENDS)
  @ApiOperation({ summary: 'Get friends' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'string', default: '1' } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'string', default: '10' } })
  @ApiResponse({ status: 200, description: 'List of friends' })
  async getFriends(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('page') page: string = "1",
    @Query('limit') limit: string = "10"
  ) {
    return await this.usersService.getFriends(user.id, search,  Number(page), Number(limit));
  }

  @Post(USERS_ROUTES.SEND_FRIEND_REQUEST)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Friend request sent' })
  async addFriend(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) receiverId: number
  ): Promise<void> {
    await this.usersService.addFriend(user.id, receiverId);
  }

  @Post(USERS_ROUTES.ACCEPT_FRIEND_REQUEST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Friend request accepted' })
  async acceptFriendRequest(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) requestId: number
  ): Promise<void> {
    await this.usersService.acceptFriendRequest(user.id, requestId);
  }

  @Post(USERS_ROUTES.DECLINE_FRIEND_REQUEST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a friend request' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Friend request declined' })
  async declineFriendRequest(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) requestId: number
  ): Promise<void> {
    await this.usersService.declineFriendRequest(user.id, requestId);
  }
}
