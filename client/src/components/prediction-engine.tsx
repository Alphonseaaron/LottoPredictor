import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WandSparkles, Loader2, Check, Scale, TrendingUp } from "lucide-react";

interface PredictionEngineProps {
  jackpotId: string;
  fixtureCount: number;
  onPredictionGenerated?: () => void;
}

export default function PredictionEngine({ 
  jackpotId, 
  fixtureCount, 
  onPredictionGenerated 
}: PredictionEngineProps) {
  const [strategy, setStrategy] = useState("balanced");
  const [includeWildcards, setIncludeWildcards] = useState(false);
  const [riskLevel, setRiskLevel] = useState(6);
  const { toast } = useToast();

  // Generate predictions mutation
  const generatePredictionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/predictions/generate", {
        jackpotId,
        strategy,
        includeWildcards,
        riskLevel
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions/summary"] });
      toast({ title: "Predictions generated successfully" });
      onPredictionGenerated?.();
    },
    onError: () => {
      toast({ 
        title: "Error generating predictions", 
        description: "Please ensure you have 17 fixtures loaded",
        variant: "destructive" 
      });
    }
  });

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case "balanced":
        return "Balanced approach with even distribution (5-6-6)";
      case "conservative":
        return "Conservative approach favoring home wins (8-5-4)";
      case "aggressive":
        return "Aggressive approach with more draws/away wins (3-7-7)";
      default:
        return "";
    }
  };

  const getRiskLevelDescription = (level: number) => {
    if (level <= 3) return "Low risk - Conservative selections";
    if (level <= 7) return "Medium risk - Balanced approach";
    return "High risk - Bold predictions";
  };

  return (
    <div className="space-y-6">
      {/* Prediction Engine */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Prediction Engine</CardTitle>
          <p className="text-sm text-gray-600">AI-powered analysis for optimal jackpot predictions</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-4">
            {/* Strategy Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Prediction Strategy</label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanced (5-6-6)</SelectItem>
                  <SelectItem value="conservative">Conservative (8-5-4)</SelectItem>
                  <SelectItem value="aggressive">Aggressive (3-7-7)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">{getStrategyDescription(strategy)}</p>
            </div>
            
            {/* Risk Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Risk Level</label>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500">Low</span>
                <Input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(Number(e.target.value))}
                  className="flex-1 h-2" 
                />
                <span className="text-xs text-gray-500">High</span>
                <span className="text-sm font-medium text-gray-700 min-w-[2rem]">{riskLevel}</span>
              </div>
              <p className="text-xs text-gray-500">{getRiskLevelDescription(riskLevel)}</p>
            </div>
            
            {/* Wildcard Option */}
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="include-wildcards"
                checked={includeWildcards}
                onCheckedChange={setIncludeWildcards}
              />
              <label htmlFor="include-wildcards" className="text-sm text-gray-700">
                Include wildcard picks for higher payouts
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            onClick={() => generatePredictionsMutation.mutate()}
            disabled={generatePredictionsMutation.isPending || fixtureCount !== 17}
          >
            {generatePredictionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <WandSparkles className="h-4 w-4 mr-2" />
            )}
            Generate Predictions
          </Button>

          {/* Status Messages */}
          {fixtureCount !== 17 && (
            <p className="text-sm text-amber-600 text-center">
              {fixtureCount === 0 
                ? "Please load 17 fixtures to generate predictions" 
                : `${fixtureCount}/17 fixtures loaded`}
            </p>
          )}

          {generatePredictionsMutation.isPending && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-3 text-sm text-gray-600">Analyzing matches...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Insights */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Analysis Insights</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Algorithm Ready</p>
              <p className="text-xs text-gray-600">Advanced prediction model loaded</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Scale className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Strategy Analysis</p>
              <p className="text-xs text-gray-600">
                {strategy === "balanced" && "Optimized for consistent results"}
                {strategy === "conservative" && "Prioritizing safer home wins"}
                {strategy === "aggressive" && "Targeting higher-risk opportunities"}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Risk Assessment</p>
              <p className="text-xs text-gray-600">
                Level {riskLevel} - {getRiskLevelDescription(riskLevel).split(" - ")[1]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
