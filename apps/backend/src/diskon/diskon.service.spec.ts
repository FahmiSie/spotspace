import { Test, TestingModule } from '@nestjs/testing';
import { DiskonService } from './diskon.service';

describe('DiskonService', () => {
  let service: DiskonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiskonService],
    }).compile();

    service = module.get<DiskonService>(DiskonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
