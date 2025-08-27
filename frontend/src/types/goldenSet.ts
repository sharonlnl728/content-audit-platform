// Golden Set core data structure
export interface GoldenSet {
  id: string;
  templateId: string;
  name: string;
  description: string;
  samples: GoldenSample[];
  createdAt: string;
  updatedAt?: string;
  version: string;
  category: 'content_moderation' | 'spam_detection' | 'quality_check' | 'custom';
}

// Golden Set sample
export interface GoldenSample {
  id: string;
  content: string;
  expectedResult: 'PASS' | 'BLOCK' | 'REVIEW';
  category: 'common_violation' | 'compliance' | 'edge_case' | 'boundary_test';
  notes?: string;
  severity?: 'low' | 'medium' | 'high';
}

// Golden Set validation result
export interface GoldenSetValidationResult {
  sampleId: string;
  content: string;
  expectedResult: 'PASS' | 'BLOCK' | 'REVIEW';
  actualResult: 'PASS' | 'BLOCK' | 'REVIEW';
  isCorrect: boolean;
  confidence?: number;
  processingTime?: number;
  aiReasoning?: string;
  ruleMatched?: string[];
}

// Golden Set test report
export interface GoldenSetReport {
  id: string;
  templateId: string;
  goldenSetId: string;
  runAt: string;
  summary: {
    totalSamples: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    correctCount: number;
    incorrectCount: number;
    falsePositives: number;
    falseNegatives: number;
  };
  detailedResults: GoldenSetValidationResult[];
  recommendations: {
    type: 'rule_optimization' | 'prompt_improvement' | 'boundary_handling' | 'general';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    suggestedActions: string[];
  }[];
  performance: {
    totalProcessingTime: number;
    averageProcessingTime: number;
    throughput: number;
  };
}

// Golden Set run status
export interface GoldenSetRunStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  currentSample: number;
  totalSamples: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

// Golden Set comparison result
export interface GoldenSetComparison {
  templateA: {
    id: string;
    name: string;
    report: GoldenSetReport;
  };
  templateB: {
    id: string;
    name: string;
    report: GoldenSetReport;
  };
  comparison: {
    accuracyDifference: number;
    precisionDifference: number;
    recallDifference: number;
    f1ScoreDifference: number;
    winner: 'templateA' | 'templateB' | 'tie';
    keyInsights: string[];
  };
}
