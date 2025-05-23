import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { PaginationUtil } from '@common/utils/pagination.util';
import { User } from '@common/interfaces/user.interface';
import { PaginationResult } from '@common/interfaces/paginationResult.interface';
import { PendingRequest } from '@common/interfaces/pendingRequest.interface';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getUsers(userId: number, search?: string, page = 1, limit = 10) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }

    const offset = (page - 1) * limit;

    const query = this.databaseService.db('users').where('id', '<>', userId).select(
      'id',
      'email',
      'first_name',
      'last_name',
      'age',
      'created_at',
    );

    const countQuery = this.databaseService.db('users')
      .where('id', '<>', userId)
      .count('* as total')
      .first();

    if (search) {
      const searchAsNumber = Number(search);
      const isNumericSearch = !isNaN(searchAsNumber) && search.trim() !== '';

      query.where((builder) => {
        builder
          .where('email', 'ilike', `%${search}%`)
          .orWhere('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`);
        if (isNumericSearch) {
          builder.orWhere('age', '=', searchAsNumber);
        }
      });

      countQuery.where((builder) => {
        builder
          .where('email', 'ilike', `%${search}%`)
          .orWhere('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`);
        if (isNumericSearch) {
          builder.orWhere('age', '=', searchAsNumber);
        }
      });
    }

    const [users, { total }] = await Promise.all([
      query.offset(offset).limit(limit),
      countQuery,
    ]);

    return PaginationUtil.createPaginationResult(
      users,
      Number(total),
      page,
      limit, 
    );
  }

  async getFriends(userId: number, search?: string, page = 1, limit = 10): Promise<PaginationResult<User>> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }

    const offset = (page - 1) * limit;

    const friendsSubquery = this.databaseService.db('friends')
      .select(
        this.databaseService.db.raw(`CASE 
        WHEN user_id_1 = ? THEN user_id_2 
        ELSE user_id_1 
      END`, [userId])
          .wrap('(', ') as friend_id')
      )
      .where((builder) => {
        builder.where('user_id_1', userId).orWhere('user_id_2', userId);
      });

    const baseQuery = this.databaseService.db('users')
      .whereIn('id', friendsSubquery)
      .select('id', 'email', 'first_name', 'last_name', 'age', 'created_at');

    const countQuery = this.databaseService.db('users')
      .whereIn('id', friendsSubquery)
      .count('* as total')
      .first();

    if (search) {
      const searchAsNumber = Number(search);
      const isNumericSearch = !isNaN(searchAsNumber) && search.trim() !== '';

      baseQuery.andWhere((builder) => {
        builder
          .where('email', 'ilike', `%${search}%`)
          .orWhere('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`);
        if (isNumericSearch) {
          builder.orWhere('age', '=', searchAsNumber);
        }
      });

      countQuery.andWhere((builder) => {
        builder
          .where('email', 'ilike', `%${search}%`)
          .orWhere('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`);
        if (isNumericSearch) {
          builder.orWhere('age', '=', searchAsNumber);
        }
      });
    }

    const [friends, { total }] = await Promise.all([
      baseQuery.offset(offset).limit(limit),
      countQuery,
    ]);

    return PaginationUtil.createPaginationResult(friends, Number(total), page, limit);
  }

  async getPendingRequests(userId: number): Promise<PendingRequest[]> {
    return await this.databaseService
      .db('friend_requests')
      .join('users', 'friend_requests.sender_id', 'users.id')
      .select(
        'friend_requests.id as request_id',
        'friend_requests.sender_id',
        'friend_requests.created_at',
        'users.email',
        'users.first_name',
        'users.last_name',
      )
      .where('friend_requests.receiver_id', userId);
  }


  async addFriend(senderId: number, receiverId: number): Promise<void> {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const receiver = await this.databaseService
      .db('users')
      .where('id', receiverId)
      .first();
    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    const existingRequest = await this.databaseService
      .db('friend_requests')
      .where({ sender_id: senderId, receiver_id: receiverId })
      .orWhere({ sender_id: receiverId, receiver_id: senderId })
      .first();
    if (existingRequest) {
      throw new BadRequestException('Friend request already exists');
    }

    const existingFriendship = await this.databaseService
      .db('friends')
      .where({ user_id_1: senderId, user_id_2: receiverId })
      .orWhere({ user_id_1: receiverId, user_id_2: senderId })
      .first();
    if (existingFriendship) {
      throw new BadRequestException('You are already friends');
    }

    await this.databaseService.db('friend_requests').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      created_at: new Date(),
    });
  }

  async acceptFriendRequest(userId: number, requestId: number): Promise<void> {
    const request = await this.databaseService
      .db('friend_requests')
      .where({ id: requestId, receiver_id: userId })
      .first();

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    await this.databaseService.db.transaction(async (trx) => {
      await trx('friends').insert({
        user_id_1: request.sender_id,
        user_id_2: request.receiver_id,
        created_at: new Date(),
      });

      await trx('friend_requests').where('id', requestId).del();
    });
  }

  async declineFriendRequest(userId: number, requestId: number): Promise<void> {
    const deleted = await this.databaseService
      .db('friend_requests')
      .where({ id: requestId, receiver_id: userId })
      .del();

    if (!deleted) {
      throw new NotFoundException('Friend request not found');
    }
  }
}