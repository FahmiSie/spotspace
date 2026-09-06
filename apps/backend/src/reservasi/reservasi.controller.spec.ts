import { Test, TestingModule } from '@nestjs/testing';
import { ReservasiController } from './reservasi.controller';

describe('ReservasiController', () => {
  let controller: ReservasiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservasiController],
    }).compile();

    controller = module.get<ReservasiController>(ReservasiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
