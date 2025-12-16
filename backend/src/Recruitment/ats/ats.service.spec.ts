import { Test, TestingModule } from '@nestjs/testing';
import { AtsService } from './services/ats.service';
import { GeminiService } from './services/gemini.service';
import { TextExtractionService } from './services/text-extraction.service';
import { CVRecordRepository } from './repository/cv-record.repository';

describe('AtsModule Integration Test', () => {
  let atsService: AtsService;
  let geminiService: GeminiService;
  let textExtractionService: TextExtractionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtsService,
        {
          provide: CVRecordRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn(),
            updateAnalysis: jest.fn(),
          },
        },
        {
          provide: GeminiService,
          useValue: {
            analyzeCV: jest.fn(),
          },
        },
        {
          provide: TextExtractionService,
          useValue: {
            extractText: jest.fn(),
          },
        },
      ],
    }).compile();

    atsService = module.get<AtsService>(AtsService);
    geminiService = module.get<GeminiService>(GeminiService);
    textExtractionService = module.get<TextExtractionService>(
      TextExtractionService,
    );
  });

  it('should be defined', () => {
    expect(atsService).toBeDefined();
    expect(geminiService).toBeDefined();
    expect(textExtractionService).toBeDefined();
  });

  it('should create ATS service instance', () => {
    expect(atsService).toBeInstanceOf(AtsService);
  });
});
