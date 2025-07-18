import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Database,
  Brain,
  Target,
  Sparkles
} from "lucide-react";

interface AutomatedResult {
  jackpotId: string;
  fixtures: number;
  predictions: number;
  strategy: string;
  confidence: number;
  summary: {
    homeWins: number;
    draws: number;
    awayWins: number;
  };
}

export default function AutomatedPredictor() {
  const [result, setResult] = useState<AutomatedResult | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const automatedMutation = useMutation({
    mutationFn: async () => {
      // Simulate progress updates during generation
      const progressSteps = [
        { step: 1, message: "Fetching SportPesa jackpot data...", progress: 20 },
        { step: 2, message: "Analyzing team statistics...", progress: 40 },
        { step: 3, message: "Processing AI predictions...", progress: 60 },
        { step: 4, message: "Optimizing for historical patterns...", progress: 80 },
        { step: 5, message: "Finalizing predictions...", progress: 95 }
      ];

      for (const step of progressSteps) {
        setProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return apiRequest("POST", "/api/predictions/automated", {});
    },
    onSuccess: (data: AutomatedResult) => {
      setProgress(100);
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jackpot/current"] });
      
      toast({ 
        title: "Automated predictions generated successfully!",
        description: `Generated ${data.predictions} predictions with ${data.confidence}% average confidence`
      });
    },
    onError: (error: any) => {
      setProgress(0);
      toast({ 
        title: "Automated prediction failed", 
        description: error.message || "Failed to generate automated predictions",
        variant: "destructive" 
      });
    }
  });

  const handleGenerateAutomated = () => {
    setResult(null);
    setProgress(0);
    automatedMutation.mutate();
  };

  const getStrategyColor = (strategy: string) => {
    if (!strategy) return 'bg-gray-100 text-gray-800';
    switch (strategy.toLowerCase()) {
      case 'conservative': return 'bg-green-100 text-green-800';
      case 'aggressive': return 'bg-red-100 text-red-800';
      case 'balanced': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Automated Prediction Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="border-b border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white text-lg" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-blue-900">Fully Automated Predictions</CardTitle>
              <p className="text-sm text-blue-700">Real data • AI analysis • Historical patterns</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Features List */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Live SportPesa scraping</span>
              </div>
              <div className="flex items-center space-x-3">
                <Brain className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">AI-powered analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Real team statistics</span>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Historical optimization</span>
              </div>
            </div>

            {/* Progress Bar */}
            {automatedMutation.isPending && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Processing...</span>
                  <span className="text-sm text-gray-500">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Generate Button */}
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
              onClick={handleGenerateAutomated}
              disabled={automatedMutation.isPending}
              size="lg"
            >
              {automatedMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Generating Automated Predictions...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-3" />
                  Generate Automated Predictions
                </>
              )}
            </Button>

            {/* Result Display */}
            {result && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-start space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">Automated Predictions Generated</h4>
                    <p className="text-sm text-green-700">Real data analysis completed successfully</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{result.fixtures}</div>
                    <div className="text-sm text-gray-600">Fixtures Analyzed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{result.predictions}</div>
                    <div className="text-sm text-gray-600">Predictions Made</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Strategy:</span>
                    <Badge className={getStrategyColor(result.strategy)}>
                      {result.strategy ? result.strategy.charAt(0).toUpperCase() + result.strategy.slice(1) : 'Unknown'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Average Confidence:</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getConfidenceColor(result.confidence)}`}></div>
                      <span className="text-sm font-semibold">{result.confidence}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Distribution:</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {result.summary ? `${result.summary.homeWins}-${result.summary.draws}-${result.summary.awayWins}` : '0-0-0'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-amber-900">How It Works</h5>
                  <p className="text-sm text-amber-800 mt-1">
                    The automated system fetches live SportPesa fixtures, analyzes real team statistics, 
                    applies AI-powered prediction models, and optimizes selections based on historical 
                    jackpot winning patterns to maximize your chances of success.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}