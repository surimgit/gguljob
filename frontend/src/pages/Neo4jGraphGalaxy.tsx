import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
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
  __linkCount?: number;
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

// 갤럭시 컬러: 따뜻한 흰색 ~ 핑크/오렌지 그라데이션
const GALAXY_COLORS: Record<string, number> = {
  user:    0xFFFFFF,
  skill:   0xFFDDAA,
  role:    0xFFAACC,
  project: 0xDDAAFF,
};

const Neo4jGraphGalaxy = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<any>(null);
  const angleRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const rotatingRef = useRef(true);

  // ── 데이터 fetch + 링크 카운트 계산 ──
  useEffect(() => {
    api.get('/v1/admin/neo4j/graph')
      .then(({ data }) => {
        const linkCount: Record<string, number> = {};
        data.links.forEach((l: GraphLink) => {
          linkCount[l.source] = (linkCount[l.source] || 0) + 1;
          linkCount[l.target] = (linkCount[l.target] || 0) + 1;
        });
        data.nodes.forEach((n: GraphNode) => {
          n.__linkCount = linkCount[n.id] || 0;
        });
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Graph fetch failed:', err);
        setLoading(false);
      });
  }, []);

  // ── 검색 필터 ──
  const highlightIds = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const set = new Set<string>();
    graphData.nodes.forEach((n) => {
      if (n.label.toLowerCase().includes(q)) set.add(n.id);
    });
    return set.size > 0 ? set : null;
  }, [search, graphData.nodes]);

  // ── 호버 시 연결 노드 ──
  const connectedIds = useMemo(() => {
    if (!hoverNode) return null;
    const set = new Set<string>();
    set.add(hoverNode.id);
    graphData.links.forEach((link) => {
      const src = typeof link.source === 'object' ? link.source.id : link.source;
      const tgt = typeof link.target === 'object' ? link.target.id : link.target;
      if (src === hoverNode.id) set.add(tgt);
      if (tgt === hoverNode.id) set.add(src);
    });
    return set;
  }, [hoverNode, graphData.links]);

  // ── 자동 회전 ──
  useEffect(() => {
    if (!graphRef.current || graphData.nodes.length === 0) return;
    const dist = 500;
    const rotate = () => {
      if (!graphRef.current || !rotatingRef.current) {
        animFrameRef.current = requestAnimationFrame(rotate);
        return;
      }
      angleRef.current += 0.001;
      graphRef.current.cameraPosition({
        x: dist * Math.sin(angleRef.current),
        y: 80 * Math.sin(angleRef.current * 0.3),
        z: dist * Math.cos(angleRef.current),
      });
      animFrameRef.current = requestAnimationFrame(rotate);
    };
    setTimeout(() => { animFrameRef.current = requestAnimationFrame(rotate); }, 1000);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [graphData]);

  // ── 렌더러 세팅 ──
  useEffect(() => {
    if (!graphRef.current) return;
    const renderer = graphRef.current.renderer();
    if (renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.8;
    }
  }, [graphData]);

  // ── 노드 클릭 ──
  const handleNodeClick = useCallback((node: any) => {
    if (!graphRef.current) return;
    rotatingRef.current = false;
    const d = 60;
    const ratio = 1 + d / Math.hypot(node.x, node.y, node.z);
    graphRef.current.cameraPosition(
      { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
      node,
      2000,
    );
  }, []);

  // ── 별(Star) 노드 오브젝트 ──
  const createStarNode = useCallback((node: any) => {
    const links = node.__linkCount || 0;
    const color = GALAXY_COLORS[node.type] || 0xFFFFFF;

    // 허브 노드일수록 크게
    const baseSize = node.type === 'user' ? 1.2 : 0.8;
    const starSize = baseSize + Math.min(links * 0.15, 4);

    // 하이라이트 여부
    const isSearched = highlightIds ? highlightIds.has(node.id) : true;
    const isConnected = connectedIds ? connectedIds.has(node.id) : true;
    const isVisible = isSearched && isConnected;

    const group = new THREE.Group();

    // 코어 (밝은 점)
    const coreGeo = new THREE.SphereGeometry(starSize, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: isVisible ? 1 : 0.03,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    // 글로우 (허브 노드만 - 밝은 후광)
    if (links > 5 && isVisible) {
      const glowGeo = new THREE.SphereGeometry(starSize * 3, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: Math.min(links * 0.008, 0.15),
      });
      group.add(new THREE.Mesh(glowGeo, glowMat));
    }

    return group;
  }, [highlightIds, connectedIds]);

  // ── 링크 색상 ──
  const getLinkColor = useCallback((link: any) => {
    if (!connectedIds) return 'rgba(255,255,255,0.04)';
    const src = typeof link.source === 'object' ? link.source.id : link.source;
    const tgt = typeof link.target === 'object' ? link.target.id : link.target;
    if (connectedIds.has(src) && connectedIds.has(tgt)) return 'rgba(255,200,160,0.3)';
    return 'rgba(255,255,255,0.01)';
  }, [connectedIds]);

  const getLinkWidth = useCallback((link: any) => {
    if (!connectedIds) return 0.2;
    const src = typeof link.source === 'object' ? link.source.id : link.source;
    const tgt = typeof link.target === 'object' ? link.target.id : link.target;
    return (connectedIds.has(src) && connectedIds.has(tgt)) ? 1.5 : 0.1;
  }, [connectedIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-3 h-3 bg-white rounded-full animate-ping" />
          <span className="text-white/30 text-xs font-mono tracking-[0.3em]">MAPPING GALAXY</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">

      {/* ── 검색바 (좌상단, 극도로 미니멀) ── */}
      <div className="absolute top-5 left-5 z-10">
        <div className="flex items-center bg-[#111] border border-white/10 rounded-md overflow-hidden">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="enter a search term"
            className="bg-transparent text-white/80 text-xs font-mono px-3 py-2 w-56 outline-none placeholder:text-white/25"
          />
          <button className="px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors">
            <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 호버 시 노드 정보 (우하단) ── */}
      {hoverNode && (
        <div className="absolute bottom-8 right-8 z-10">
          <div className="text-right">
            <div className="text-white font-mono text-sm font-bold">{hoverNode.label}</div>
            <div className="text-white/30 font-mono text-[10px] uppercase tracking-wider">
              {hoverNode.type} &middot; {hoverNode.__linkCount || 0} links
            </div>
          </div>
        </div>
      )}

      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeThreeObject={createStarNode}
        nodeLabel={() => ''}
        onNodeHover={(node: any) => {
          setHoverNode(node || null);
          rotatingRef.current = !node;
        }}
        onNodeClick={handleNodeClick}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkOpacity={1}
        linkDirectionalParticles={(link: any) => {
          if (!connectedIds) return 0;
          const src = typeof link.source === 'object' ? link.source.id : link.source;
          const tgt = typeof link.target === 'object' ? link.target.id : link.target;
          return (connectedIds.has(src) && connectedIds.has(tgt)) ? 2 : 0;
        }}
        linkDirectionalParticleWidth={1}
        linkDirectionalParticleSpeed={0.003}
        linkDirectionalParticleColor={() => '#FFDDAA'}
        backgroundColor="#000000"
        showNavInfo={false}
        warmupTicks={100}
        cooldownTime={5000}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
      />
    </div>
  );
};

export default Neo4jGraphGalaxy;
