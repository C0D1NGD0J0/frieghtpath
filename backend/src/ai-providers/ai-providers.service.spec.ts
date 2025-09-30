import { Test, TestingModule } from '@nestjs/testing';
import { AiProvidersService } from './ai-providers.service';
import { GoogleProvider } from './providers/google.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { AIProviderName } from './interface/index';

describe('AiProvidersService', () => {
  let service: AiProvidersService;

  const mockGoogleProvider = {
    providerName: AIProviderName.GOOGLE,
    modelName: 'gemini-2.0-flash-exp',
    streamCompletion: jest.fn(),
    calculateCost: jest.fn(),
  };

  const mockAnthropicProvider = {
    providerName: AIProviderName.ANTHROPIC,
    modelName: 'claude-sonnet-4-5-20250929',
    streamCompletion: jest.fn(),
    calculateCost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiProvidersService,
        {
          provide: GoogleProvider,
          useValue: mockGoogleProvider,
        },
        {
          provide: AnthropicProvider,
          useValue: mockAnthropicProvider,
        },
      ],
    }).compile();

    service = module.get<AiProvidersService>(AiProvidersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get all providers', () => {
    const providers = service.getAllProviders();
    expect(providers).toBeDefined();
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBe(2);
  });

  it('should include google and anthropic providers', () => {
    const providers = service.getAllProviders();
    expect(providers).toContain(AIProviderName.GOOGLE);
    expect(providers).toContain(AIProviderName.ANTHROPIC);
  });

  it('should validate provider exists', () => {
    expect(service.hasProvider(AIProviderName.GOOGLE)).toBe(true);
    expect(service.hasProvider(AIProviderName.ANTHROPIC)).toBe(true);
  });

  it('should return provider instance', () => {
    const googleProvider = service.getProvider(AIProviderName.GOOGLE);
    expect(googleProvider).toBeDefined();
    expect(googleProvider!.providerName).toBe(AIProviderName.GOOGLE);
  });

  it('should return undefined for invalid provider', () => {
    const invalidProvider = service.getProvider('invalid' as AIProviderName);
    expect(invalidProvider).toBeUndefined();
  });
});
