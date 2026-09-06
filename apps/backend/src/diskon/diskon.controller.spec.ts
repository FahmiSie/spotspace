import { Test, TestingModule } from '@nestjs/testing';
import { DiskonController } from './diskon.controller';

describe('DiskonController', () => {
  let controller: DiskonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiskonController],
    }).compile();

    controller = module.get<DiskonController>(DiskonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
