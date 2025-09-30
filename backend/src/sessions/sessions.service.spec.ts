import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SessionsService } from './sessions.service';
import { Session } from './model/session.model';

describe('SessionsService', () => {
  let service: SessionsService;
  let mockSessionModel: any;

  const mockSession = {
    _id: 'mock-session-id',
    prompt: 'Test prompt',
    models: [
      { provider: 'google', modelName: 'gemini-2.0-flash-exp' },
      { provider: 'anthropic', modelName: 'claude-sonnet-4-5-20250929' },
    ],
    responses: {},
    status: 'active',
    userId: 'test-user-id',
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockSessionModel = {
      new: jest.fn().mockResolvedValue(mockSession),
      constructor: jest.fn().mockResolvedValue(mockSession),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockSession]),
          }),
        }),
      }),
      save: jest.fn().mockResolvedValue(mockSession),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getModelToken(Session.name),
          useValue: mockSessionModel,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error when getting session with invalid sessionId', async () => {
    await expect(service.getSession('')).rejects.toThrow(
      'sessionId is required',
    );
  });

  it('should throw error when getting user sessions with invalid userId', async () => {
    await expect(service.getUserSessions('')).rejects.toThrow(
      'userId is required',
    );
  });

  it('should throw error when appending content without sessionId', async () => {
    await expect(
      service.appendModelContent('', 'model', 'content'),
    ).rejects.toThrow('sessionId and modelName are required');
  });

  it('should throw error when appending content without modelName', async () => {
    await expect(
      service.appendModelContent('session-id', '', 'content'),
    ).rejects.toThrow('sessionId and modelName are required');
  });
});
