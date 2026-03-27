import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import api from '../api';

// ── 타입 ──
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
  source: any;
  target: any;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ── 사이버펑크 컬러 팔레트 ──
const CYBER_PALETTE: Record<string, { core: string; glow: string; neon: number }> = {
  user:    { core: '#00F0FF', glow: 'rgba(0,240,255,0.6)',   neon: 0x00F0FF },  // 형광 시안
  skill:   { core: '#FAFF00', glow: 'rgba(250,255,0,0.5)',   neon: 0xFAFF00 },  // 사이버 옐로우
  role:    { core: '#FF003C', glow: 'rgba(255,0,60,0.5)',    neon: 0xFF003C },  // 핫 핑크
  project: { core: '#BF00FF', glow: 'rgba(191,0,255,0.6)',   neon: 0xBF00FF },  // 네온 퍼플
};

const LINK_COLORS: Record<string, string> = {
  HAS_SKILL:      'rgba(0,240,255,0.15)',
  WANTS_ROLE:     'rgba(255,0,60,0.15)',
  REQUIRES_SKILL: 'rgba(191,0,255,0.12)',
  REQUIRES_ROLE:  'rgba(191,0,255,0.12)',
};

const PARTICLE_COLORS: Record<string, string> = {
  HAS_SKILL:      '#00F0FF',
  WANTS_ROLE:     '#FF003C',
  REQUIRES_SKILL: '#BF00FF',
  REQUIRES_ROLE:  '#BF00FF',
};

const Neo4jGraphCyber = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<any>(null);
  const angleRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  // ── 데이터 fetch ──
  useEffect(() => {
    api.get('/v1/admin/neo4j/graph')
      .then(({ data }) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Graph fetch failed:', err);
        setLoading(false);
      });
  }, []);

  // ── 호버 시 연결된 노드 ID Set ──
  const connectedNodes = useMemo(() => {
    if (!hoverNode) return null;
    const set = new Set<string>();
    set.add(hoverNode.id);
    graphData.links.forEach((link) => {
      const srcId = typeof link.source === 'object' ? link.source.id : link.source;
      const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
      if (srcId === hoverNode.id) set.add(tgtId);
      if (tgtId === hoverNode.id) set.add(srcId);
    });
    return set;
  }, [hoverNode, graphData.links]);

  // ── 자동 회전 ──
  useEffect(() => {
    if (!graphRef.current || graphData.nodes.length === 0) return;
    const dist = 400;
    const rotate = () => {
      if (!graphRef.current) return;
      angleRef.current += 0.0015;
      graphRef.current.cameraPosition({
        x: dist * Math.sin(angleRef.current),
        y: 60,
        z: dist * Math.cos(angleRef.current),
      });
      animFrameRef.current = requestAnimationFrame(rotate);
    };
    setTimeout(() => { animFrameRef.current = requestAnimationFrame(rotate); }, 1500);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [graphData]);

  // ── 톤매핑 ──
  useEffect(() => {
    if (!graphRef.current) return;
    const renderer = graphRef.current.renderer();
    if (renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.5;
    }
  }, [graphData]);

  // ── 노드 클릭 → 줌인 ──
  const handleNodeClick = useCallback((node: any) => {
    if (!graphRef.current) return;
    cancelAnimationFrame(animFrameRef.current);
    const d = 80;
    const ratio = 1 + d / Math.hypot(node.x, node.y, node.z);
    graphRef.current.cameraPosition(
      { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
      node,
      1500,
    );
  }, []);

  // ── 커스텀 노드 오브젝트 (글로우 + 코어 + 라벨) ──
  const createNodeObject = useCallback((node: any) => {
    const palette = CYBER_PALETTE[node.type] || CYBER_PALETTE.skill;
    const isHighlighted = !connectedNodes || connectedNodes.has(node.id);
    const opacity = isHighlighted ? 1 : 0.08;
    const group = new THREE.Group();

    // 코어 (글로우 구체 제거, 코어만)
    const coreSize = node.type === 'user' ? 7 : node.type === 'project' ? 5.5 : 3.5;
    const coreGeo = new THREE.SphereGeometry(coreSize, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: palette.neon,
      emissive: palette.neon,
      emissiveIntensity: isHighlighted ? 0.8 : 0.1,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    // 라벨
    if (isHighlighted) {
      const sprite = new SpriteText(node.label);
      sprite.color = palette.core;
      sprite.textHeight = node.type === 'user' ? 4.5 : 3;
      sprite.fontWeight = '800';
      sprite.backgroundColor = 'rgba(0,0,0,0.65)';
      sprite.padding = 1.5;
      sprite.borderRadius = 2;
      sprite.position.y = node.type === 'user' ? 15 : 10;
      group.add(sprite);
    }

    return group;
  }, [connectedNodes]);

  // ── 링크 색상 (호버 시 관련 없는 링크 dim) ──
  const getLinkColor = useCallback((link: any) => {
    if (!connectedNodes) return LINK_COLORS[link.label] || 'rgba(255,255,255,0.08)';
    const srcId = typeof link.source === 'object' ? link.source.id : link.source;
    const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
    if (connectedNodes.has(srcId) && connectedNodes.has(tgtId)) {
      return PARTICLE_COLORS[link.label] || '#ffffff';
    }
    return 'rgba(255,255,255,0.02)';
  }, [connectedNodes]);

  const getLinkWidth = useCallback((link: any) => {
    if (!connectedNodes) return 0.8;
    const srcId = typeof link.source === 'object' ? link.source.id : link.source;
    const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
    return (connectedNodes.has(srcId) && connectedNodes.has(tgtId)) ? 2.5 : 0.3;
  }, [connectedNodes]);

  // ── 로딩 ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0A0A0A' }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-2 border-[#00F0FF]/20 rounded-full animate-ping" />
            <div className="absolute inset-2 border-2 border-[#BF00FF]/30 rounded-full animate-spin" />
            <div className="absolute inset-4 border-2 border-t-[#00F0FF] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '0.8s' }} />
          </div>
          <div className="text-[#00F0FF] text-sm font-mono tracking-[0.3em] uppercase animate-pulse">
            Initializing Neural Graph...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#0A0A0A' }}>

      {/* ── 좌상단: 타이틀 + 범례 ── */}
      <div className="absolute top-6 left-6 z-10">
        <div className="border border-[#00F0FF]/20 rounded-xl px-5 py-4" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
            <h2 className="text-[#00F0FF] font-mono text-sm font-bold tracking-[0.15em] uppercase">
              Neural Network Visualizer
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(CYBER_PALETTE).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: cfg.core, boxShadow: `0 0 10px ${cfg.core}, 0 0 20px ${cfg.glow}` }}
                />
                <span className="text-white/60 text-[11px] font-mono uppercase tracking-wider">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 우상단: 통계 ── */}
      <div className="absolute top-6 right-6 z-10">
        <div className="border border-[#BF00FF]/20 rounded-xl px-5 py-4" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-[#00F0FF] font-mono text-2xl font-black" style={{ textShadow: '0 0 15px rgba(0,240,255,0.5)' }}>
                {graphData.nodes.length}
              </div>
              <div className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Nodes</div>
            </div>
            <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,240,255,0.3), transparent)' }} />
            <div className="text-center">
              <div className="text-[#BF00FF] font-mono text-2xl font-black" style={{ textShadow: '0 0 15px rgba(191,0,255,0.5)' }}>
                {graphData.links.length}
              </div>
              <div className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Edges</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 호버 중인 노드 정보 ── */}
      {hoverNode && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
          <div
            className="border rounded-xl px-6 py-3 flex items-center gap-4"
            style={{
              background: 'rgba(10,10,10,0.9)',
              backdropFilter: 'blur(16px)',
              borderColor: CYBER_PALETTE[hoverNode.type]?.core || '#fff',
              boxShadow: `0 0 30px ${CYBER_PALETTE[hoverNode.type]?.glow || 'transparent'}`,
            }}
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{
                background: CYBER_PALETTE[hoverNode.type]?.core,
                boxShadow: `0 0 12px ${CYBER_PALETTE[hoverNode.type]?.core}`,
              }}
            />
            <div>
              <div className="text-white font-mono font-bold text-sm">{hoverNode.label}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: CYBER_PALETTE[hoverNode.type]?.core }}>
                {hoverNode.type} &middot; {connectedNodes ? connectedNodes.size - 1 : 0} connections
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 하단 안내 ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <span className="text-white/20 text-[10px] font-mono tracking-[0.2em] uppercase">
          Hover to explore &middot; Click to focus &middot; Scroll to zoom
        </span>
      </div>

      {/* ── 3D 그래프 ── */}
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeThreeObject={createNodeObject}
        nodeLabel={() => ''}
        onNodeHover={(node: any) => {
          setHoverNode(node || null);
          if (node) {
            cancelAnimationFrame(animFrameRef.current);
          } else {
            const dist = 400;
            const rotate = () => {
              if (!graphRef.current) return;
              angleRef.current += 0.0015;
              graphRef.current.cameraPosition({
                x: dist * Math.sin(angleRef.current),
                y: 60,
                z: dist * Math.cos(angleRef.current),
              });
              animFrameRef.current = requestAnimationFrame(rotate);
            };
            animFrameRef.current = requestAnimationFrame(rotate);
          }
        }}
        onNodeClick={handleNodeClick}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkOpacity={0.8}
        linkDirectionalParticles={3}
        linkDirectionalParticleWidth={(link: any) => {
          if (!connectedNodes) return 1.5;
          const srcId = typeof link.source === 'object' ? link.source.id : link.source;
          const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
          return (connectedNodes.has(srcId) && connectedNodes.has(tgtId)) ? 3 : 0;
        }}
        linkDirectionalParticleSpeed={0.003}
        linkDirectionalParticleColor={(link: any) => PARTICLE_COLORS[link.label] || '#ffffff'}
        backgroundColor="#0A0A0A"
        warmupTicks={80}
        cooldownTime={3000}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  );
};

export default Neo4jGraphCyber;
