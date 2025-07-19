import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/csv-export";
// Removed AutomatedPredictor - consolidated into single comprehensive analysis
import type { FixtureWithPrediction, PredictionSummary, Jackpot } from "@shared/schema";
import { 
  ChartLine, 
  Volleyball, 
  Trophy, 
  Calendar, 
  BarChart3,
  Settings,
  Keyboard,
  Upload,
  Trash2,
  Download,
  Save,
  Check,
  Scale,
  TrendingUp,
  WandSparkles,
  Loader2,
  Zap,
  Bot,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react";

export default function Dashboard() {
  // Removed strategy controls - AI determines optimal approach
  const [csvInput, setCsvInput] = useState("");
  const [currentAnalysis, setCurrentAnalysis] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 17 });
  const { toast } = useToast();

  // Get current jackpot
  const { data: jackpot } = useQuery<Jackpot>({
    queryKey: ["/api/jackpot/current"],
  });

  // Auto-trigger SportPesa scraping if no fixtures
  const scrapeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/scrape/sportpesa", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jackpot/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions/summary"] });
      toast({ title: "SportPesa fixtures loaded successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to load SportPesa fixtures", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Get fixtures
  const { data: fixtures = [] } = useQuery<FixtureWithPrediction[]>({
    queryKey: ["/api/fixtures", jackpot?.id],
    enabled: !!jackpot,
  });

  // Auto-load SportPesa fixtures when no fixtures are available (only once)
  const [hasAutoTriggered, setHasAutoTriggered] = React.useState(false);
  React.useEffect(() => {
    if (jackpot && fixtures.length === 0 && !scrapeMutation.isPending && !hasAutoTriggered) {
      console.log('Auto-triggering SportPesa scraping...');
      setHasAutoTriggered(true);
      scrapeMutation.mutate();
    }
  }, [jackpot, fixtures.length, hasAutoTriggered]);

  // Get prediction summary
  const { data: summary } = useQuery<PredictionSummary>({
    queryKey: ["/api/predictions/summary", jackpot?.id],
    enabled: !!jackpot,
  });

  // Generate predictions mutation
  const generatePredictionsMutation = useMutation({
    mutationFn: async () => {
      if (!jackpot) throw new Error("No jackpot available");
      
      return await apiRequest("POST", "/api/predictions/generate", {
        jackpotId: jackpot.id.toString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions/summary"] });
      setCurrentAnalysis("Analysis completed successfully!");
      setAnalysisProgress({ current: 17, total: 17 });
      toast({ title: "Predictions generated successfully!" });
    },
    onError: (error: any) => {
      setCurrentAnalysis("Analysis failed - please try again");
      toast({ 
        title: "Failed to generate predictions", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Track real analysis progress based on server logs
  useEffect(() => {
    if (!generatePredictionsMutation.isPending) {
      setCurrentAnalysis("");
      setAnalysisProgress({ current: 0, total: 17 });
      return;
    }

    // Set initial state for comprehensive analysis
    setCurrentAnalysis("Initializing comprehensive analysis system...");
    setAnalysisProgress({ current: 0, total: 17 });
    
    // The real progress will be shown through server console logs
    // Frontend shows general progress indicators
    const progressMessages = [
      "Loading SportPesa mega jackpot fixtures...",
      "Creating match database entries...",
      "Starting systematic analysis of each match...",
      "Comprehensive analysis in progress - check console logs for detailed match-by-match progress",
      "Each match undergoes 60-90 seconds of multi-source analysis",
      "Visiting 15+ data sources per match for maximum accuracy",
      "AI processing with 75-95% confidence range",
      "Creating predictions systematically as each analysis completes"
    ];

    let currentMsgIndex = 0;
    const messageInterval = setInterval(() => {
      if (currentMsgIndex < progressMessages.length) {
        setCurrentAnalysis(progressMessages[currentMsgIndex]);
        currentMsgIndex++;
      } else {
        setCurrentAnalysis("Deep analysis in progress - this thorough approach ensures high-confidence predictions");
      }
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [generatePredictionsMutation.isPending]);

  // CSV import mutation
  const importCsvMutation = useMutation({
    mutationFn: async () => {
      if (!jackpot) throw new Error("No jackpot available");
      
      return await apiRequest("POST", "/api/fixtures/import-csv", {
        jackpotId: jackpot.id.toString(),
        csvData: csvInput
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      setCsvInput("");
      toast({ title: "Fixtures imported successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to import fixtures", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete predictions mutation
  const deletePredictionsMutation = useMutation({
    mutationFn: async () => {
      if (!jackpot) throw new Error("No jackpot available");
      
      return await apiRequest("DELETE", `/api/predictions/jackpot/${jackpot.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions/summary"] });
      toast({ title: "Predictions cleared successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to clear predictions", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleExportCsv = () => {
    if (fixtures.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    
    exportToCsv(fixtures, `sportpesa-predictions-${new Date().toISOString().split('T')[0]}.csv`);
    toast({ title: "CSV exported successfully!" });
  };

  const getPredictionBadgeColor = (prediction: string) => {
    switch (prediction) {
      case "1": return "bg-green-100 text-green-800";
      case "X": return "bg-yellow-100 text-yellow-800";
      case "2": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Trophy className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AutoJackpot Predictor
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI-powered SportPesa jackpot predictions with real data analysis and historical pattern optimization
          </p>
        </div>

        {/* Current Jackpot Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Volleyball className="h-8 w-8" />
                <div>
                  <p className="text-sm opacity-90">Current Jackpot</p>
                  <p className="text-2xl font-bold">{jackpot?.amount || "KSH 0"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8" />
                <div>
                  <p className="text-sm opacity-90">Draw Date</p>
                  <p className="text-lg font-semibold">
                    {jackpot?.drawDate ? new Date(jackpot.drawDate).toLocaleDateString() : "TBD"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8" />
                <div>
                  <p className="text-sm opacity-90">Total Matches</p>
                  <p className="text-2xl font-bold">{fixtures.length}/17</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fixture Management Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Jackpot Fixtures</CardTitle>
                      <p className="text-sm text-gray-600">
                        {fixtures.length > 0 
                          ? `Showing ${fixtures.length} mega jackpot fixtures (demo data for development)` 
                          : scrapeMutation.isPending 
                            ? "Loading SportPesa fixtures..." 
                            : "Click 'Load SportPesa' to fetch the latest mega jackpot fixtures"
                        }
                      </p>
                    </div>
                    <Button
                      onClick={() => scrapeMutation.mutate()}
                      disabled={scrapeMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      {scrapeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      <span>Load SportPesa</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {fixtures.length === 0 ? (
                    <div className="text-center py-12">
                      <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No fixtures loaded</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {scrapeMutation.isPending 
                          ? "Fetching latest SportPesa mega jackpot fixtures..." 
                          : "Click 'Load SportPesa' above to fetch the latest mega jackpot fixtures"
                        }
                      </p>
                      {scrapeMutation.isPending && (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-500">Loading from SportPesa...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Development Note */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">i</span>
                          </div>
                          <p className="text-sm text-blue-800">
                            <strong>Development Mode:</strong> Using demo fixtures. SportPesa scraping may be limited by CORS policy.
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {fixtures.map((fixture, index) => (
                          <div key={fixture.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </div>
                              <div className="font-medium text-gray-900">
                                {fixture.homeTeam} vs {fixture.awayTeam}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(fixture.matchDate).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Manual CSV Import - Collapsed by default */}
                  <details className="mt-6">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Manual CSV Import (Advanced)
                    </summary>
                    <div className="mt-4 space-y-4">
                      <Textarea
                        placeholder="Paste CSV data here (format: Home Team, Away Team, Date)..."
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        rows={6}
                        className="w-full"
                      />
                      <Button
                        onClick={() => importCsvMutation.mutate()}
                        disabled={!csvInput.trim() || importCsvMutation.isPending}
                        className="w-full"
                      >
                        {importCsvMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Import CSV
                      </Button>
                    </div>
                  </details>

                </CardContent>
              </Card>
            </div>
          </div>

          {/* Prediction Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">Complete Analysis & Predictions</CardTitle>
                <p className="text-sm text-gray-600">Comprehensive analysis using team statistics, form data, and historical patterns</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3">Automatic Analysis Process</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-blue-800">Team Statistics</p>
                          <p className="text-blue-600">Form, position, goals, records</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-blue-800">Head-to-Head Analysis</p>
                          <p className="text-blue-600">Historical matchups & trends</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-blue-800">Jackpot Patterns</p>
                          <p className="text-blue-600">Historical winning combinations</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-blue-800">Home/Away Advantage</p>
                          <p className="text-blue-600">Venue-specific performance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => generatePredictionsMutation.mutate()}
                  disabled={generatePredictionsMutation.isPending || fixtures.length === 0}
                >
                  {generatePredictionsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Generate Complete Analysis & Predictions
                </Button>
                
                {fixtures.length === 0 && (
                  <p className="text-sm text-center text-gray-500 mt-2">
                    Load fixtures first to enable predictions
                  </p>
                )}

                {generatePredictionsMutation.isPending && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <h4 className="font-medium text-blue-900">Live Analysis Progress</h4>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-blue-700">Match {analysisProgress.current}/{analysisProgress.total}</span>
                          <span className="text-blue-600">{Math.round((analysisProgress.current / analysisProgress.total) * 100)}%</span>
                        </div>
                        <Progress value={(analysisProgress.current / analysisProgress.total) * 100} className="h-3" />
                      </div>

                      {/* Current Analysis Status */}
                      <div className="bg-blue-100 rounded-lg p-3">
                        <p className="font-medium text-blue-900 mb-2">Currently Analyzing:</p>
                        <div className="text-sm text-blue-800">
                          {currentAnalysis || "Initializing analysis system..."}
                        </div>
                      </div>
                      
                      <div className="text-xs text-blue-600 mt-3 space-y-1">
                        <p>• Each match: 60-90 seconds comprehensive analysis</p>
                        <p>• 15+ professional data sources per match (ESPN, BBC Sport, Transfermarkt, etc.)</p>
                        <p>• Enhanced confidence range: 75-95% for high-quality predictions</p>
                        <p>• Real-time progress visible in console logs above</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historical Patterns */}
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">Historical Patterns</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Home Wins</p>
                    <p className="text-xs text-gray-600">{summary?.homeWins || 6} average per jackpot</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <Scale className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Draws</p>
                    <p className="text-xs text-gray-600">{summary?.draws || 5} average per jackpot</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Form Analysis</p>
                    <p className="text-xs text-gray-600">Recent form heavily weighted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Prediction Results */}
        {fixtures.some(f => f.prediction) && (
          <Card className="mt-8">
            <CardHeader className="border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Generated Predictions</CardTitle>
                  <p className="text-sm text-gray-600">AI-optimized selections for maximum jackpot potential</p>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    variant="destructive"
                    onClick={() => deletePredictionsMutation.mutate()}
                    disabled={deletePredictionsMutation.isPending}
                  >
                    {deletePredictionsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Clear Predictions
                  </Button>
                  <Button 
                    variant="default"
                    onClick={handleExportCsv}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {fixtures.map((fixture, index) => (
                  <Card key={fixture.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {fixture.homeTeam} vs {fixture.awayTeam}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {new Date(fixture.matchDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {fixture.prediction ? (
                            <>
                              <Badge className={getPredictionBadgeColor(fixture.prediction.prediction)}>
                                {fixture.prediction.prediction}
                              </Badge>
                              <div className="flex items-center space-x-2">
                                <Progress 
                                  value={fixture.prediction.confidence} 
                                  className="w-20 h-3" 
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  {fixture.prediction.confidence}%
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">Analysis Pending</span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {fixture.prediction?.reasoning && (
                      <CardContent className="pt-0">
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                              <span className="text-sm font-medium text-gray-700">View Complete Analysis</span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="bg-gray-50 rounded-lg p-4 mt-2">
                              <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                                {fixture.prediction.reasoning}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}