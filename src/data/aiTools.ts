import { AITool } from '../types';

export const aiToolsData: AITool[] = [
  {
    id: 'ai-copy-architect',
    name: 'Branify Neural Copywriter',
    category: 'AI Writing',
    tagline: 'Brand-voice calibrated copy for high-conversion sales funnels and editorial prose.',
    description: 'Generates high-converting luxury marketing copy, positioning statements, and landing page wire-text calibrated to your brand ethos.',
    model: 'Branify-LLM v4.2 Pro',
    iconName: 'PenTool',
    metrics: '94% Copy Approval Rate',
    capabilities: ['Brand Tone Vector Calibration', 'Conversion Hook Matrix', 'Multilingual Luxury Localization', 'SEO Keyword Embedding'],
    badge: 'Enterprise AI'
  },
  {
    id: 'ai-visual-synthesizer',
    name: 'Spatial Texture & Asset Gen',
    category: 'AI Image Tools',
    tagline: 'Prompt-guided 3D textures, PBR maps, and futuristic backdrop generator.',
    description: 'Synthesize seamless dark metallic textures, ambient light maps, and atmospheric backgrounds in 8K resolution.',
    model: 'Neural Diffusion XL',
    iconName: 'Sparkles',
    metrics: '8K Lossless Render',
    capabilities: ['PBR Normal & Roughness Maps', 'Metallic Surface Synthesis', 'Cinematic Volumetric Lighting', 'Seamless Repeat Tiling'],
    badge: 'Hardware Accelerated'
  },
  {
    id: 'ai-workflow-orchestrator',
    name: 'Autonomous Task Mesh',
    category: 'AI Productivity',
    tagline: 'Self-healing workflow pipelines connecting Slack, Jira, Notion, and GitHub.',
    description: 'Intelligent multi-agent coordinator that summarizes client transcripts, builds execution milestones, and dispatches pull requests.',
    model: 'Branify AutoAgent-v3',
    iconName: 'Workflow',
    metrics: '6.4x Speedup in Sprint Ops',
    capabilities: ['Meeting Transcript Extraction', 'Autonomous Task Dispatch', 'Branch & PR Summaries', 'Client Update Generation'],
    badge: 'Real-Time Sync'
  },
  {
    id: 'ai-growth-intelligence',
    name: 'Predictive Audience Engine',
    category: 'AI Marketing',
    tagline: 'Simulates conversion likelihood across target personas before spending ad capital.',
    description: 'Forecasts customer acquisition costs, ad creative decay, and lifetime customer value with 92% predictive accuracy.',
    model: 'Predictive ROI Engine',
    iconName: 'LineChart',
    metrics: '92% Forecast Accuracy',
    capabilities: ['Creative Fatigue Modeling', 'High-Intent Persona Sim', 'Budget Allocation Optimization', 'Real-Time Bid Calibration'],
    badge: 'Proprietary Tech'
  },
  {
    id: 'ai-code-auditor',
    name: 'Syntactic Security & AST Sentinel',
    category: 'AI Development',
    tagline: 'Continuous security audit, memory leak detection, and AST code refactoring.',
    description: 'Scans TypeScript, Rust, and Go codebases for memory bottlenecks, SQL vulnerabilities, and unoptimized re-renders.',
    model: 'CodeSentinel Neural 2.0',
    iconName: 'Code2',
    metrics: '0 False Positives in 100k LoC',
    capabilities: ['Automated Vulnerability Patching', 'React Re-render Analysis', 'API Contract Validation', 'Edge Latency Benchmarking'],
    badge: 'Zero-Telemetry'
  },
  {
    id: 'ai-lead-concierge',
    name: 'Conversational Sales Concierge',
    category: 'AI Automation',
    tagline: 'High-touch AI brand concierge that qualifies enterprise leads 24/7.',
    description: 'Engages inbound enterprise buyers with deep industry comprehension, assesses budget fit, and schedules executive demos.',
    model: 'Branify Voice & Chat v5',
    iconName: 'Bot',
    metrics: '<1s Response Time',
    capabilities: ['Budget & Need Qualification', 'Calendar Integration', 'Custom Persona Tuning', 'Enterprise CRM Sync'],
    badge: '24/7 Available'
  }
];
