import {
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { CreateRoomDto } from './create-room-dto';

export class UpdateRoomDto extends IntersectionType(
  // optional
  PartialType(OmitType(CreateRoomDto, ['id'] as const)),
  // assential
  PickType(CreateRoomDto, ['id'] as const),
) {}
