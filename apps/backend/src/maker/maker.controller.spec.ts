import { Test, TestingModule } from '@nestjs/testing';
import { MakerController } from './maker.controller';
import { MakerService } from './maker.service';
import { MakerAuthGuard } from './guards/maker-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

describe('MakerController & MakerAuthGuard', () => {
  let controller: MakerController;
  let service: any;
  let guard: MakerAuthGuard;
  let prisma: any;
  let jwt: any;

  beforeEach(async () => {
    service = {
      register: jest.fn().mockResolvedValue({ id: 1, app_key: 'mk_123' }),
      login: jest.fn().mockResolvedValue({ id: 1, access_token: 'token123' }),
      getProfile: jest.fn().mockImplementation((m) => ({ id: m.id, name: m.name })),
      getStats: jest.fn().mockResolvedValue({ total_members: 10 }),
      findAll: jest.fn().mockResolvedValue([{ id: 1, name: 'Maker' }]),
    };

    prisma = {
      maker: {
        findUnique: jest.fn(),
      },
    };

    jwt = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MakerController],
      providers: [
        { provide: MakerService, useValue: service },
        MakerAuthGuard,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    controller = module.get<MakerController>(MakerController);
    guard = module.get<MakerAuthGuard>(MakerAuthGuard);
  });

  describe('Controller endpoints', () => {
    it('register calls service.register', async () => {
      const dto = { name: 'N', username: 'u', email: 'e@test.com', password: 'password123' };
      const res = await controller.register(dto);
      expect(service.register).toHaveBeenCalledWith(dto);
      expect(res.app_key).toBe('mk_123');
    });

    it('login calls service.login', async () => {
      const dto = { usernameOrEmail: 'u', password: 'password123' };
      const res = await controller.login(dto);
      expect(service.login).toHaveBeenCalledWith(dto);
      expect(res.access_token).toBe('token123');
    });

    it('getProfile returns profile for req.maker', async () => {
      const req = { maker: { id: 1, name: 'N' } };
      const res = await controller.getProfile(req);
      expect(service.getProfile).toHaveBeenCalledWith(req.maker);
      expect(res.id).toBe(1);
    });

    it('getStats calls service.getStats', async () => {
      const res = await controller.getStats();
      expect(service.getStats).toHaveBeenCalled();
      expect(res.total_members).toBe(10);
    });

    it('findAll calls service.findAll', async () => {
      const res = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(res.length).toBe(1);
    });
  });

  describe('MakerAuthGuard', () => {
    const createMockContext = (headers: Record<string, string>) => {
      const req: any = { headers };
      return {
        switchToHttp: () => ({
          getRequest: () => req,
        }),
        req,
      };
    };

    it('should authenticate with valid x-maker-key', async () => {
      const mockMaker = { id: 1, appKey: 'mk_valid', name: 'Maker' };
      prisma.maker.findUnique.mockResolvedValue(mockMaker);

      const ctx = createMockContext({ 'x-maker-key': 'mk_valid' });
      const canActivate = await guard.canActivate(ctx as unknown as ExecutionContext);

      expect(canActivate).toBe(true);
      expect(ctx.req.maker).toEqual(mockMaker);
    });

    it('should throw UnauthorizedException for invalid x-maker-key', async () => {
      prisma.maker.findUnique.mockResolvedValue(null);

      const ctx = createMockContext({ 'x-maker-key': 'mk_invalid' });
      await expect(guard.canActivate(ctx as unknown as ExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should authenticate with valid Bearer token of type maker', async () => {
      const mockMaker = { id: 1, appKey: 'mk_valid', name: 'Maker' };
      jwt.verify.mockReturnValue({ sub: 1, type: 'maker' });
      prisma.maker.findUnique.mockResolvedValue(mockMaker);

      const ctx = createMockContext({ authorization: 'Bearer valid_jwt_token' });
      const canActivate = await guard.canActivate(ctx as unknown as ExecutionContext);

      expect(canActivate).toBe(true);
      expect(ctx.req.maker).toEqual(mockMaker);
    });

    it('should throw UnauthorizedException if token type is not maker', async () => {
      jwt.verify.mockReturnValue({ sub: 1, type: 'member' });

      const ctx = createMockContext({ authorization: 'Bearer member_token' });
      await expect(guard.canActivate(ctx as unknown as ExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if neither header nor token provided', async () => {
      const ctx = createMockContext({});
      await expect(guard.canActivate(ctx as unknown as ExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
