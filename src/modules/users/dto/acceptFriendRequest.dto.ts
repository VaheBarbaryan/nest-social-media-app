import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class AcceptFriendRequestDto {
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error('requestId must be a valid integer');
    }
    return parsed;
  })
  @Min(1)
  @IsInt()
  @IsNotEmpty()
  requestId: number;
}