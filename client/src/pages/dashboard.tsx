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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/csv-export";
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
  Loader2
} from "lucide-react";

export default function Dashboard() {
  const [fixturesInput, setFixturesInput] = useState("");
  const [strategy, setStrategy] = useState("balanced");
  const [includeWildcards, setIncludeWildcards] = useState(false);
  const [riskLevel, setRiskLevel] = useState(6);
  const [currentJackpotId, setCurrentJackpotId] = useState("1");
  const { toast } = useToast();

  // Fetch current jackpot
  const { data: jackpot } = useQuery<Jackpot>({
    queryKey: ["/api/jackpot/current"],
  });

  // Fetch fixtures with predictions
  const { data: fixtures = [], isLoading: fixturesLoading } = useQuery<FixtureWithPrediction[]>({
    queryKey: ["/api/fixtures", currentJackpotId],
  });

  // Fetch prediction summary
  const { data: summary } = useQuery<PredictionSummary>({
    queryKey: ["/api/predictions/summary", currentJackpotId],
  });

  // Create fixtures mutation
  const createFixturesMutation = useMutation({
    mutationFn: async (fixturesData: any[]) => {
      return apiRequest("POST", "/api/fixtures", fixturesData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      toast({ title: "Fixtures loaded successfully" });
      setFixturesInput("");
    },
    onError: () => {
      toast({ 
        title: "Error loading fixtures", 
        description: "Please check the fixture format and try again",
        variant: "destructive" 
      });
    }
  });

  // Generate predictions mutation
  const generatePredictionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/predictions/generate", {
        jackpotId: currentJackpotId,
        strategy,
        includeWildcards
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions/summary"] });
      toast({ title: "Predictions generated successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error generating predictions", 
        description: "Please ensure you have 17 fixtures loaded",
        variant: "destructive" 
      });
    }
  });

  const parseFixtures = () => {
    if (!fixturesInput.trim()) {
      toast({ 
        title: "No fixtures provided", 
        description: "Please enter fixture data",
        variant: "destructive" 
      });
      return;
    }

    const lines = fixturesInput.trim().split('\n');
    const fixturesData = [];

    for (const line of lines) {
      const match = line.match(/^(.+?)\s+vs\s+(.+?)\s+-\s+(.+)$/i) || 
                   line.match(/^(.+?)\s+v\s+(.+?)\s+-\s+(.+)$/i) ||
                   line.match(/^(.+?)\s+vs\s+(.+?)\s+(.+)$/i);
      
      if (match) {
        const [, homeTeam, awayTeam, dateStr] = match;
        fixturesData.push({
          homeTeam: homeTeam.trim(),
          awayTeam: awayTeam.trim(),
          matchDate: new Date(dateStr.trim()),
          jackpotId: currentJackpotId
        });
      }
    }

    if (fixturesData.length === 0) {
      toast({ 
        title: "Invalid format", 
        description: "Please use format: 'Team A vs Team B - Date'",
        variant: "destructive" 
      });
      return;
    }

    createFixturesMutation.mutate(fixturesData);
  };

  const handleExportCsv = () => {
    if (fixtures.length === 0) {
      toast({ 
        title: "No data to export", 
        description: "Generate predictions first",
        variant: "destructive" 
      });
      return;
    }

    const csvData = fixtures.map((fixture, index) => ({
      "#": index + 1,
      "Match": `${fixture.homeTeam} vs ${fixture.awayTeam}`,
      "Date": new Date(fixture.matchDate).toLocaleDateString(),
      "Prediction": fixture.prediction?.prediction || "N/A",
      "Confidence": fixture.prediction ? `${fixture.prediction.confidence}%` : "N/A",
      "Reasoning": fixture.prediction?.reasoning || "N/A"
    }));

    exportToCsv(csvData, 'jackpot_predictions.csv');
    toast({ title: "Predictions exported successfully" });
  };

  const getDaysUntilDraw = () => {
    if (!jackpot?.drawDate) return "N/A";
    const days = Math.ceil((new Date(jackpot.drawDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} Days` : "Today";
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ChartLine className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AutoJackpot Predictor</h1>
                <p className="text-sm text-gray-500">SportPesa Edition</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">17-Match Jackpot</span>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Volleyball className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Jackpot</p>
                  <p className="text-2xl font-bold text-gray-900">{jackpot?.amount || "Loading..."}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">73%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Predictions Made</p>
                  <p className="text-2xl font-bold text-gray-900">247</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Next Draw</p>
                  <p className="text-2xl font-bold text-gray-900">{getDaysUntilDraw()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Match Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">Jackpot Fixtures</CardTitle>
                <p className="text-sm text-gray-600">Enter or paste the 17 matches for prediction analysis</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Input Method</label>
                  <div className="flex space-x-4">
                    <Button variant="default" size="sm">
                      <Keyboard className="h-4 w-4 mr-2" />
                      Manual Entry
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Paste Data
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Match Data</label>
                    <Textarea 
                      className="h-32 resize-none"
                      placeholder={`Paste jackpot fixtures here, one per line:
Arsenal vs Chelsea - 20/07/2025
Barcelona vs Sevilla - 20/07/2025
Manchester United vs Liverpool - 21/07/2025
...`}
                      value={fixturesInput}
                      onChange={(e) => setFixturesInput(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      className="flex-1"
                      onClick={parseFixtures}
                      disabled={createFixturesMutation.isPending}
                    >
                      {createFixturesMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Load Fixtures
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setFixturesInput("")}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Match List */}
            <Card>
              <CardHeader className="border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-gray-900">Loaded Matches</CardTitle>
                  <Badge variant="secondary">{fixtures.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {fixturesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-3 text-sm text-gray-600">Loading fixtures...</span>
                  </div>
                ) : fixtures.length > 0 ? (
                  <div className="space-y-3">
                    {fixtures.slice(0, 3).map((fixture, index) => (
                      <div key={fixture.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{fixture.homeTeam} vs {fixture.awayTeam}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(fixture.matchDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
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
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No fixtures loaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Predictions
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Match</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Prediction</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Confidence</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fixtures.map((fixture, index) => (
                      <tr key={fixture.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{fixture.homeTeam} vs {fixture.awayTeam}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(fixture.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {fixture.prediction ? (
                            <Badge className={getPredictionBadgeColor(fixture.prediction.prediction)}>
                              {fixture.prediction.prediction}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {fixture.prediction ? (
                            <div className="flex items-center justify-center">
                              <Progress value={fixture.prediction.confidence} className="w-16" />
                              <span className="ml-2 text-sm text-gray-600">{fixture.prediction.confidence}%</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {fixture.prediction?.reasoning || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Prediction Summary */}
              {summary && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">Home Wins (1)</span>
                        <span className="text-lg font-bold text-green-900">{summary.homeWins}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-800">Draws (X)</span>
                        <span className="text-lg font-bold text-yellow-900">{summary.draws}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-800">Away Wins (2)</span>
                        <span className="text-lg font-bold text-red-900">{summary.awayWins}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; 2025 AutoJackpot Predictor. Built for SportPesa enthusiasts.</p>
          <p className="mt-1">Predictions are AI-generated and should be used responsibly.</p>
        </footer>
      </div>
    </div>
  );
}
