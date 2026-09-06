import { Test, TestingModule } from '@nestjs/testing';
import { ReservasiService } from './reservasi.service';

describe('ReservasiService', () => {
  let service: ReservasiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReservasiService],
    }).compile();

    service = module.get<ReservasiService>(ReservasiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
