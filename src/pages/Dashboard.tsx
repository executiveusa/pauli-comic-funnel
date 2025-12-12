import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Cpu, 
  Globe, 
  Search, 
  Palette, 
  Server, 
  Users,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Zap,
  Shield,
  DollarSign
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'loading';
  port: number;
  url: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'offline';
  icon: React.ReactNode;
  color: string;
}

const Dashboard = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'LibreChat', status: 'loading', port: 3000, url: 'http://localhost:3000' },
    { name: 'LiteLLM API', status: 'loading', port: 4000, url: 'http://localhost:4000' },
    { name: 'PostgreSQL', status: 'loading', port: 5432, url: '' },
    { name: 'MongoDB', status: 'loading', port: 27017, url: '' },
    { name: 'Redis', status: 'loading', port: 6379, url: '' },
    { name: 'Meilisearch', status: 'loading', port: 7700, url: 'http://localhost:7700' },
  ]);

  const [stats, setStats] = useState({
    totalRequests: 0,
    totalCost: 0,
    activeAgents: 6,
    uptime: '99.9%'
  });

  const agents: Agent[] = [
    { 
      id: 'pauli', 
      name: 'PAULI', 
      role: 'Master Orchestrator', 
      status: 'active',
      icon: <Bot className="h-6 w-6" />,
      color: 'bg-purple-500'
    },
    { 
      id: 'lux', 
      name: 'Lux', 
      role: 'Computer Use Agent', 
      status: 'active',
      icon: <Cpu className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    { 
      id: 'browser', 
      name: 'BrowserOps', 
      role: 'Browser Automation', 
      status: 'active',
      icon: <Globe className="h-6 w-6" />,
      color: 'bg-green-500'
    },
    { 
      id: 'researcher', 
      name: 'Researcher', 
      role: 'Web Intelligence', 
      status: 'active',
      icon: <Search className="h-6 w-6" />,
      color: 'bg-yellow-500'
    },
    { 
      id: 'designer', 
      name: 'Designer', 
      role: 'UI/UX Design', 
      status: 'idle',
      icon: <Palette className="h-6 w-6" />,
      color: 'bg-pink-500'
    },
    { 
      id: 'devops', 
      name: 'DevOps', 
      role: 'Infrastructure', 
      status: 'idle',
      icon: <Server className="h-6 w-6" />,
      color: 'bg-orange-500'
    },
    { 
      id: 'crm', 
      name: 'CRM', 
      role: 'Customer Management', 
      status: 'idle',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-cyan-500'
    },
  ];

  const checkServices = async () => {
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        if (service.url) {
          try {
            const response = await fetch(service.url, { 
              method: 'HEAD',
              mode: 'no-cors'
            });
            return { ...service, status: 'online' as const };
          } catch {
            return { ...service, status: 'offline' as const };
          }
        }
        return { ...service, status: 'online' as const };
      })
    );
    setServices(updatedServices);
  };

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'online' || status === 'active') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Online</Badge>;
    }
    if (status === 'idle') {
      return <Badge className="bg-yellow-500"><Activity className="h-3 w-3 mr-1" /> Idle</Badge>;
    }
    if (status === 'loading') {
      return <Badge className="bg-gray-500"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Checking</Badge>;
    }
    return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Offline</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            THE PAULI EFFECT
          </h1>
          <p className="text-gray-400 mt-1">Autonomous AI Agency Dashboard</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={checkServices}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => window.open('http://localhost:3000', '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Open Chat
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Agents</p>
                <p className="text-3xl font-bold text-white">{stats.activeAgents}</p>
              </div>
              <Bot className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Requests</p>
                <p className="text-3xl font-bold text-white">{stats.totalRequests}</p>
              </div>
              <Zap className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Est. Cost Today</p>
                <p className="text-3xl font-bold text-white">${stats.totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Uptime</p>
                <p className="text-3xl font-bold text-white">{stats.uptime}</p>
              </div>
              <Shield className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${agent.color}`}>
                      {agent.icon}
                    </div>
                    <StatusBadge status={agent.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-white">{agent.name}</CardTitle>
                  <CardDescription className="text-gray-400">{agent.role}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card key={service.name} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{service.name}</CardTitle>
                    <StatusBadge status={service.status} />
                  </div>
                  <CardDescription className="text-gray-400">
                    Port: {service.port}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {service.url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(service.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> Open
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Claude Sonnet 4', provider: 'Anthropic', best: 'Coding, Writing', cost: '$3/$15' },
              { name: 'Claude Haiku', provider: 'Anthropic', best: 'Fast responses', cost: '$0.25/$1.25' },
              { name: 'GPT-4o', provider: 'OpenAI', best: 'General tasks', cost: '$2.50/$10' },
              { name: 'GPT-4o Mini', provider: 'OpenAI', best: 'Quick tasks', cost: '$0.15/$0.60' },
              { name: 'Gemini Pro', provider: 'Google', best: 'Long context', cost: '$1.25/$5' },
              { name: 'Gemini Flash', provider: 'Google', best: 'Speed', cost: '$0.075/$0.30' },
              { name: 'Llama 70B', provider: 'Groq', best: 'Open source', cost: 'Free tier' },
              { name: 'Mixtral 8x7B', provider: 'Groq', best: 'Balanced', cost: 'Free tier' },
            ].map((model) => (
              <Card key={model.name} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{model.name}</CardTitle>
                  <CardDescription className="text-gray-400">{model.provider}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Best for:</span>
                      <span className="text-white">{model.best}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cost (in/out):</span>
                      <span className="text-green-400">{model.cost}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => window.open('http://localhost:3000', '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Chat with AI
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => window.open('http://localhost:4000/ui', '_blank')}
          >
            <Server className="h-4 w-4 mr-2" /> LiteLLM Admin
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => window.open('http://localhost:7700', '_blank')}
          >
            <Search className="h-4 w-4 mr-2" /> Search Console
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>The Pauli Effect v1.0.0 • Powered by Agent Lightning</p>
        <p className="mt-1">© 2025 The Pauli Effect Team</p>
      </div>
    </div>
  );
};

export default Dashboard;
