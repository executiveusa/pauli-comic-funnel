import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useCavemen } from '../contexts/CavemenContext';

interface WikiNode {
  id: string;
  title: string;
  content: string;
  category: 'agent' | 'project' | 'skill' | 'code' | 'architecture';
  tags: string[];
  path?: string;
}

export const LLMWiki: React.FC = () => {
  const { compress } = useCavemen();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [wikiData, setWikiData] = useState<WikiNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wiki data from LLM.txt files and knowledge graph
  useEffect(() => {
    const loadWikiData = async () => {
      try {
        // Fetch knowledge graph from public assets
        const graphResponse = await fetch('/public/KNOWLEDGE_GRAPH.json');
        if (!graphResponse.ok) throw new Error('Failed to load knowledge graph');
        const graph = await graphResponse.json();

        // Transform graph into wiki nodes
        const nodes: WikiNode[] = [];

        // Add agents
        Object.entries(graph.nodes.agents || {}).forEach(([key, agent]: [string, any]) => {
          nodes.push({
            id: `agent-${key}`,
            title: agent.name,
            content: `${agent.role}. Uses model: ${agent.model}. Skills: ${agent.skills?.join(', ')}`,
            category: 'agent',
            tags: ['agent', agent.type],
            path: agent.location,
          });
        });

        // Add projects
        Object.entries(graph.nodes.projects || {}).forEach(([key, project]: [string, any]) => {
          nodes.push({
            id: `project-${key}`,
            title: project.name,
            content: project.description,
            category: 'project',
            tags: ['project', project.type, ...project.tags],
          });
        });

        // Add skills
        Object.entries(graph.nodes.skills || {}).forEach(([key, skill]: [string, any]) => {
          nodes.push({
            id: `skill-${key}`,
            title: skill.name,
            content: skill.description,
            category: 'skill',
            tags: ['skill', ...skill.tools],
          });
        });

        setWikiData(nodes);
      } catch (error) {
        console.error('Failed to load wiki data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWikiData();
  }, []);

  // Filter and search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return wikiData;
    const query = searchQuery.toLowerCase();
    return wikiData.filter(
      (node) =>
        node.title.toLowerCase().includes(query) ||
        node.content.toLowerCase().includes(query) ||
        node.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [wikiData, searchQuery]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const getCategoryColor = (category: WikiNode['category']) => {
    const colors: Record<WikiNode['category'], string> = {
      agent: 'bg-blue-100 text-blue-800',
      project: 'bg-green-100 text-green-800',
      skill: 'bg-purple-100 text-purple-800',
      code: 'bg-gray-100 text-gray-800',
      architecture: 'bg-orange-100 text-orange-800',
    };
    return colors[category];
  };

  if (loading) {
    return <div className="p-4">Loading LLM Wiki...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">LLM Wiki — Knowledge Base</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search agents, projects, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Found {filteredNodes.length} results
        </p>
      </div>

      <div className="space-y-2">
        {filteredNodes.map((node) => (
          <div key={node.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(node.id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                {expandedNodes.has(node.id) ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
                <div>
                  <h3 className="font-semibold">{node.title}</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getCategoryColor(node.category)}`}>
                    {node.category}
                  </span>
                </div>
              </div>
            </button>

            {expandedNodes.has(node.id) && (
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                <p className="text-sm text-gray-700 mb-3">
                  {compress(node.content)}
                </p>
                {node.path && (
                  <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                    📁 {node.path}
                  </p>
                )}
                {node.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {node.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredNodes.length === 0 && searchQuery && (
        <div className="text-center py-8 text-gray-500">
          No results found for "{searchQuery}". Try other keywords or browse all items.
        </div>
      )}
    </div>
  );
};
