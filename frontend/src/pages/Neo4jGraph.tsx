import { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import api from '../api';

interface GraphNode {
  id: string;
  label: string;
  type: 'user' | 'skill' | 'role' | 'project';
  size: number;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const NODE_CONFIG: Record<string, { color: string; emoji: string; glow: string }> = {
  user:    { color: '#F7C948', emoji: '', glow: 'rgba(247,201,72,0.4)' },
  skill:   { color: '#22C55E', emoji: '', glow: 'rgba(34,197,94,0.4)' },
  role:    { color: '#3B82F6', emoji: '', glow: 'rgba(59,130,246,0.4)' },
  project: { color: '#EF4444', emoji: '', glow: 'rgba(239,68,68,0.4)' },
};

const Neo4jGraph = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const graphRef = useRef<any>(null);
  const angleRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    api.get('/v1/admin/neo4j/graph')
      .then(({ data }) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Graph data fetch failed:', err);
        setLoading(false);
      });
  }, []);

  // 자동 회전 + 카메라 세팅
  useEffect(() => {
    if (!graphRef.current || graphData.nodes.length === 0) return;

    const distance = 350;
    const rotate = () => {
      if (!graphRef.current) return;
      angleRef.current += 0.002;
      graphRef.current.cameraPosition({
        x: distance * Math.sin(angleRef.current),
        y: 50,
        z: distance * Math.cos(angleRef.current),
      });
      animFrameRef.current = requestAnimationFrame(rotate);
    };

    setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(rotate);
    }, 1000);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [graphData]);

  // 블룸 포스트프로세싱
  useEffect(() => {
    if (!graphRef.current) return;
    const renderer = graphRef.current.renderer();
    if (renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
    }
  }, [graphData]);

  const handleNodeClick = useCallback((node: any) => {
    if (graphRef.current) {
      // 클릭하면 자동회전 멈추고 줌인
      cancelAnimationFrame(animFrameRef.current);
      const distance = 100;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      graphRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        1500,
      );
    }
  }, []);

  const createNodeObject = useCallback((node: any) => {
    const config = NODE_CONFIG[node.type] || NODE_CONFIG.skill;
    const group = new THREE.Group();

    // 글로우 구체 (바깥)
    const glowGeo = new THREE.SphereGeometry(node.type === 'user' ? 10 : 6, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.15,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    group.add(glowMesh);

    // 코어 구체 (안쪽)
    const coreSize = node.type === 'user' ? 6 : 3.5;
    const coreGeo = new THREE.SphereGeometry(coreSize, 32, 32);
    const coreMat = new THREE.MeshPhongMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 0.6,
      shininess: 100,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // 텍스트 라벨
    const sprite = new SpriteText(node.label);
    sprite.color = '#ffffff';
    sprite.textHeight = node.type === 'user' ? 5 : 3;
    sprite.fontWeight = '700';
    sprite.backgroundColor = 'rgba(0,0,0,0.5)';
    sprite.padding = 2;
    sprite.borderRadius = 3;
    sprite.position.y = node.type === 'user' ? 14 : 9;
    group.add(sprite);

    return group;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#060613]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#F7C948]/30 border-t-[#F7C948] rounded-full animate-spin" />
          <div className="text-white/80 text-xl font-bold tracking-wider">LOADING GRAPH</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#060613] overflow-hidden">
      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-5">
        {/* 범례 */}
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-6">
          <h2 className="text-white font-bold text-base tracking-wide">Neo4j Knowledge Graph</h2>
          <div className="w-px h-6 bg-white/20" />
          {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shadow-lg" style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
              <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">{type}</span>
            </div>
          ))}
        </div>

        {/* 통계 */}
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs font-medium">NODES</span>
            <span className="text-[#F7C948] font-bold text-lg">{graphData.nodes.length}</span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs font-medium">EDGES</span>
            <span className="text-[#3B82F6] font-bold text-lg">{graphData.links.length}</span>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-5 py-2">
        <span className="text-white/40 text-xs font-medium tracking-wide">Click node to zoom in / Drag to rotate / Scroll to zoom</span>
      </div>

      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeThreeObject={createNodeObject}
        nodeLabel={() => ''}
        linkColor={(link: any) => {
          if (link.label === 'HAS_SKILL') return 'rgba(34,197,94,0.25)';
          if (link.label === 'WANTS_ROLE') return 'rgba(59,130,246,0.25)';
          if (link.label === 'REQUIRES_SKILL') return 'rgba(239,68,68,0.2)';
          if (link.label === 'REQUIRES_ROLE') return 'rgba(168,85,247,0.2)';
          return 'rgba(255,255,255,0.1)';
        }}
        linkWidth={1}
        linkOpacity={0.6}
        linkDirectionalParticles={3}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleColor={(link: any) => {
          if (link.label === 'HAS_SKILL') return '#22C55E';
          if (link.label === 'WANTS_ROLE') return '#3B82F6';
          return '#ffffff';
        }}
        backgroundColor="#060613"
        onNodeClick={handleNodeClick}
        warmupTicks={80}
        cooldownTime={3000}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  );
};

export default Neo4jGraph;
