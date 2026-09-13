import { Test, TestingModule } from '@nestjs/testing';
import { MakerService } from './maker.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('MakerService', () => {
  let service: MakerService;
  let prisma: any;
  let jwt: any;

  beforeEach(async () => {
    prisma = {
      maker: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      member: { count: jest.fn().mockResolvedValue(10) },
      space: { count: jest.fn().mockResolvedValue(5) },
      diskon: { count: jest.fn().mockResolvedValue(2) },
      reservasi: { count: jest.fn().mockResolvedValue(8) },
      detailReservasi: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalBayar: 500000 } }),
      },
    };

    jwt = {
      sign: jest.fn().mockReturnValue('mock_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakerService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<MakerService>(MakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if username exists', async () => {
      prisma.maker.findUnique.mockResolvedValueOnce({ id: 1 });
      await expect(
        service.register({
          name: 'Maker',
          username: 'maker1',
          email: 'm@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email exists', async () => {
      prisma.maker.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 });
      await expect(
        service.register({
          name: 'Maker',
          username: 'maker1',
          email: 'm@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register a maker', async () => {
      prisma.maker.findUnique.mockResolvedValue(null);
      prisma.maker.create.mockResolvedValue({
        id: 1,
        name: 'Maker Test',
        username: 'maker_test',
        email: 'maker@test.com',
        appKey: 'mk_1234567890abcdef',
        createdAt: new Date(),
      });

      const res = await service.register({
        name: 'Maker Test',
        username: 'maker_test',
        email: 'maker@test.com',
        password: 'password123',
      });

      expect(res.id).toBe(1);
      expect(res.app_key).toBe('mk_1234567890abcdef');
      expect(res.access_token).toBe('mock_token');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if maker not found', async () => {
      prisma.maker.findFirst.mockResolvedValue(null);
      await expect(
        service.login({ usernameOrEmail: 'unknown', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      prisma.maker.findFirst.mockResolvedValue({
        id: 1,
        username: 'maker1',
        email: 'm@test.com',
        password: hashed,
      });

      await expect(
        service.login({ usernameOrEmail: 'maker1', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully login with valid credentials', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      prisma.maker.findFirst.mockResolvedValue({
        id: 1,
        name: 'Maker 1',
        username: 'maker1',
        email: 'm@test.com',
        password: hashed,
        appKey: 'mk_abc',
        createdAt: new Date(),
      });

      const res = await service.login({
        usernameOrEmail: 'maker1',
        password: 'secret123',
      });

      expect(res.id).toBe(1);
      expect(res.access_token).toBe('mock_token');
      expect(res.app_key).toBe('mk_abc');
    });
  });

  describe('getStats', () => {
    it('should return system stats', async () => {
      const stats = await service.getStats();
      expect(stats.total_members).toBe(10);
      expect(stats.total_spaces).toBe(5);
      expect(stats.total_diskon).toBe(2);
      expect(stats.total_reservasi).toBe(8);
      expect(stats.total_pendapatan).toBe(500000);
    });
  });

  describe('findAll', () => {
    it('should return list of makers without password', async () => {
      prisma.maker.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'M1',
          username: 'u1',
          email: 'e1@test.com',
          appKey: 'mk_1',
          createdAt: new Date(),
          password: 'hashedpassword',
        },
      ]);

      const list = await service.findAll();
      expect(list.length).toBe(1);
      expect(list[0]).not.toHaveProperty('password');
      expect(list[0].app_key).toBe('mk_1');
    });
  });
});
