import { useState } from "react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/csv-export";
import AutomatedPredictor from "@/components/automated-predictor";
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
  Bot
} from "lucide-react";

export default function Dashboard() {
  const [strategy, setStrategy] = useState<"balanced" | "conservative" | "aggressive">("balanced");
  const [riskLevel, setRiskLevel] = useState(5);
  const [includeWildcards, setIncludeWildcards] = useState(false);
  const [csvInput, setCsvInput] = useState("");
  const { toast } = useToast();

  // Get current jackpot
  const { data: jackpot } = useQuery<Jackpot>({
    queryKey: ["/api/jackpot/current"],
  });

  // Get fixtures
  const { data: fixtures = [] } = useQuery<FixtureWithPrediction[]>({
    queryKey: ["/api/fixtures", jackpot?.id],
    enabled: !!jackpot,
  });

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
        jackpotId: jackpot.id.toString(),
        strategy,
        riskLevel,
        includeWildcards
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions/summary"] });
      toast({ title: "Predictions generated successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate predictions", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

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

  // Clear predictions
  const clearPredictions = async () => {
    if (!jackpot) return;
    
    try {
      await apiRequest("DELETE", `/api/predictions/jackpot/${jackpot.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions/summary"] });
      toast({ title: "Predictions cleared" });
    } catch (error: any) {
      toast({ 
        title: "Failed to clear predictions", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

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
            {/* Tabs for different input methods */}
            <Tabs defaultValue="automated" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="automated" className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <span>Fully Automated</span>
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center space-x-2">
                  <Keyboard className="h-4 w-4" />
                  <span>Manual Entry</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="automated" className="space-y-6">
                <AutomatedPredictor />
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-6">
                <Card>
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-semibold text-gray-900">Jackpot Fixtures</CardTitle>
                    <p className="text-sm text-gray-600">Import fixtures manually or load from CSV</p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Import from CSV
                        </label>
                        <Textarea
                          placeholder="Paste CSV data here (format: Home Team, Away Team, Date)..."
                          value={csvInput}
                          onChange={(e) => setCsvInput(e.target.value)}
                          rows={6}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button 
                          onClick={() => importCsvMutation.mutate()}
                          disabled={!csvInput.trim() || importCsvMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {importCsvMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Import Fixtures
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={clearPredictions}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      </div>
                    </div>

                    {fixtures.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-3">Loaded Fixtures ({fixtures.length})</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {fixtures.slice(0, 3).map((fixture, index) => (
                            <div key={fixture.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{fixture.homeTeam} vs {fixture.awayTeam}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(fixture.matchDate).toLocaleDateString()} • {
                                    fixture.prediction ? `Predicted: ${fixture.prediction.prediction}` : "No prediction"
                                  }
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-sm text-gray-600">Ready</span>
                              </div>
                            </div>
                          ))}
                          {fixtures.length > 3 && (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500">+ {fixtures.length - 3} more matches loaded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Prediction Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">Prediction Engine</CardTitle>
                <p className="text-sm text-gray-600">AI-powered analysis for optimal jackpot predictions</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Prediction Strategy</span>
                    <Select value={strategy} onValueChange={setStrategy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balanced">Balanced (5-6-6)</SelectItem>
                        <SelectItem value="conservative">Conservative (8-5-4)</SelectItem>
                        <SelectItem value="aggressive">Aggressive (3-7-7)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Risk Level</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Low</span>
                      <Input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={riskLevel}
                        onChange={(e) => setRiskLevel(Number(e.target.value))}
                        className="w-20 h-2" 
                      />
                      <span className="text-xs text-gray-500">High</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="include-wildcards"
                      checked={includeWildcards}
                      onCheckedChange={setIncludeWildcards}
                    />
                    <label htmlFor="include-wildcards" className="text-sm text-gray-700">
                      Include wildcard picks
                    </label>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  onClick={() => generatePredictionsMutation.mutate()}
                  disabled={generatePredictionsMutation.isPending || fixtures.length !== 17}
                >
                  {generatePredictionsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <WandSparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Predictions
                </Button>

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
                    <p className="text-sm font-medium text-gray-900">Strong Home Teams</p>
                    <p className="text-xs text-gray-600">{summary?.homeWins || 0} matches favor home advantage</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <Scale className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Close Matches</p>
                    <p className="text-xs text-gray-600">{summary?.draws || 0} games predicted as draws</p>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">#</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Match</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Prediction</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Confidence</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixtures.map((fixture, index) => (
                      <tr key={fixture.id} className="border-b border-gray-100">
                        <td className="py-3 px-2 text-sm text-gray-600">{index + 1}</td>
                        <td className="py-3 px-2">
                          <div className="text-sm font-medium text-gray-900">
                            {fixture.homeTeam} vs {fixture.awayTeam}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(fixture.matchDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {fixture.prediction ? (
                            <Badge className={getPredictionBadgeColor(fixture.prediction.prediction)}>
                              {fixture.prediction.prediction}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {fixture.prediction ? (
                            <div className="flex items-center space-x-2">
                              <Progress 
                                value={fixture.prediction.confidence} 
                                className="w-16 h-2" 
                              />
                              <span className="text-xs font-medium">{fixture.prediction.confidence}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-600 max-w-xs truncate">
                          {fixture.prediction?.reasoning || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}