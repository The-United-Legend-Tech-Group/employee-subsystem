import { Injectable } from '@nestjs/common';
import { CreateTimeDto } from './dto/create-time.dto';

@Injectable()
export class TimeService {
  private items: any[] = [];

  create(dto: CreateTimeDto) {
    const item = { id: Date.now().toString(), ...dto };
    this.items.push(item);
    return item;
  }

  // simple list helper (not exposed)
  list() {
    return this.items;
  }
}
