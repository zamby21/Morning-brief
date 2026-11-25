import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  X,
  Network,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Layers,
  Newspaper,
  Info,
} from 'lucide-react';
import type { NewsStory, ClusterOutletItem } from '../types/news';

interface SimilarityNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: NewsStory[];
  focusedStory?: NewsStory | null;
  onOpenArticleModal: (story: NewsStory) => void;
}

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  nodeType: 'issue' | 'outlet';
  outletCount?: number;
  similarityScore?: number;
  topic?: string;
  storyRef?: NewsStory;
  clusterItem?: ClusterOutletItem;
  headline?: string;
  stance?: string;
  radius: number;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  id: string;
  weight: number; // 0..100
  sharedTokens: string[];
  linkKind: 'issue-outlet' | 'outlet-outlet';
}

function tokenizeKorean(text: string): Set<string> {
  const tokens = (text || '')
    .toLowerCase()
    .replace(/[^0-9a-z가-힣\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  return new Set(tokens);
}

function computePairSimilarity(aText: string, bText: string, baseScore: number): {
  score: number;
  shared: string[];
} {
  const setA = tokenizeKorean(aText);
  const setB = tokenizeKorean(bText);
  const shared: string[] = [];
  for (const tok of setA) {
    if (setB.has(tok)) shared.push(tok);
  }
  const unionSize = setA.size + setB.size - shared.length;
  const jaccard = unionSize > 0 ? Math.round((shared.length / unionSize) * 100) : 0;
  const blended = Math.max(
    Math.min(98, Math.round(baseScore * 0.65 + jaccard * 0.6)),
    Math.min(95, baseScore || 50)
  );
  return {
    score: blended,
    shared: shared.slice(0, 4),
  };
}

export const SimilarityNetworkModal: React.FC<SimilarityNetworkModalProps> = ({
  isOpen,
  onClose,
  stories,
  focusedStory = null,
  onOpenArticleModal,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeClusterId, setActiveClusterId] = useState<string>(
    focusedStory?.id || 'ALL'
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setActiveClusterId(focusedStory?.id || 'ALL');
      setSelectedNodeId(null);
    }
  }, [isOpen, focusedStory]);

  const targetStories = useMemo(() => {
    if (activeClusterId !== 'ALL') {
      const match = stories.find((s) => s.id === activeClusterId);
      if (match) return [match];
    }
    return stories.slice(0, 8);
  }, [stories, activeClusterId]);

  const graphData = useMemo<{ nodes: NetworkNode[]; links: NetworkLink[] }>(() => {
    const nodesMap = new Map<string, NetworkNode>();
    const links: NetworkLink[] = [];
    const singleClusterMode = targetStories.length === 1;

    targetStories.forEach((story, idx) => {
      const issueId = `issue:${story.id}`;
      const outletsList: ClusterOutletItem[] =
        story.clusterOutlets && story.clusterOutlets.length > 0
          ? story.clusterOutlets
          : (story.coveredOutlets || []).map((name, oIdx) => ({
              outletName: name,
              outletId: `${story.id}-outlet-${oIdx}`,
              category: story.topic || '종합',
              headline: story.title,
              stance: `${name} 보도 시각`,
              leadSummary: story.leadSummary || [],
              originalUrl: story.originalUrl,
            }));

      const count = Math.max(outletsList.length, story.coveredOutlets?.length || 0);
      nodesMap.set(issueId, {
        id: issueId,
        label:
          story.title.length > 26
            ? `${story.title.slice(0, 25).trim()}…`
            : story.title,
        nodeType: 'issue',
        outletCount: count,
        similarityScore: story.similarityScore || 50,
        topic: story.topic || '공통 어젠다',
        storyRef: story,
        headline: story.title,
        radius: singleClusterMode ? 32 : Math.min(34, Math.max(20, 15 + count * 2)),
      });

      const issueText = `${story.title} ${(story.keywords || []).join(' ')}`;

      outletsList.forEach((item) => {
        const outletKey = `outlet:${item.outletName}`;
        if (!nodesMap.has(outletKey)) {
          nodesMap.set(outletKey, {
            id: outletKey,
            label: item.outletName,
            nodeType: 'outlet',
            outletCount: 1,
            storyRef: story,
            clusterItem: item,
            headline: item.headline,
            stance: item.stance,
            radius: singleClusterMode ? 20 : 14,
          });
        } else {
          const existing = nodesMap.get(outletKey)!;
          existing.outletCount = (existing.outletCount || 1) + 1;
          if (!singleClusterMode) {
            existing.radius = Math.min(24, 12 + existing.outletCount * 2.5);
          }
        }

        const sim = computePairSimilarity(
          issueText,
          `${item.headline} ${item.stance}`,
          story.similarityScore || 50
        );

        links.push({
          id: `${issueId}__${outletKey}__${idx}`,
          source: issueId,
          target: outletKey,
          weight: sim.score,
          sharedTokens:
            sim.shared.length > 0 ? sim.shared : (story.keywords || []).slice(0, 3),
          linkKind: 'issue-outlet',
        });
      });

      // In single cluster focus mode, add outlet-to-outlet lexical similarity edges too
      if (singleClusterMode && outletsList.length >= 2) {
        const capped = outletsList.slice(0, 12);
        for (let i = 0; i < capped.length; i += 1) {
          for (let j = i + 1; j < capped.length; j += 1) {
            const a = capped[i];
            const b = capped[j];
            const pair = computePairSimilarity(
              `${a.headline} ${(a.leadSummary || []).slice(0, 2).join(' ')}`,
              `${b.headline} ${(b.leadSummary || []).slice(0, 2).join(' ')}`,
              story.similarityScore || 45
            );
            if (pair.shared.length > 0) {
              links.push({
                id: `peer:${a.outletName}__${b.outletName}`,
                source: `outlet:${a.outletName}`,
                target: `outlet:${b.outletName}`,
                weight: pair.score,
                sharedTokens: pair.shared,
                linkKind: 'outlet-outlet',
              });
            }
          }
        }
      }
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links,
    };
  }, [targetStories]);

  const selectedNode = useMemo(
    () => graphData.nodes.find((n) => n.id === selectedNodeId) || null,
    [graphData.nodes, selectedNodeId]
  );

  const selectedNodeConnections = useMemo(() => {
    if (!selectedNode) return [];
    return graphData.links
      .filter((l) => {
        const sId = typeof l.source === 'string' ? l.source : (l.source as NetworkNode).id;
        const tId = typeof l.target === 'string' ? l.target : (l.target as NetworkNode).id;
        return sId === selectedNode.id || tId === selectedNode.id;
      })
      .map((l) => {
        const sId = typeof l.source === 'string' ? l.source : (l.source as NetworkNode).id;
        const tId = typeof l.target === 'string' ? l.target : (l.target as NetworkNode).id;
        const peerId = sId === selectedNode.id ? tId : sId;
        const peerNode = graphData.nodes.find((n) => n.id === peerId);
        return {
          peerLabel: peerNode?.label || peerId,
          weight: l.weight,
          sharedTokens: l.sharedTokens,
        };
      });
  }, [selectedNode, graphData]);

  useEffect(() => {
    if (!isOpen || !svgRef.current) return;

    const width = 860;
    const height = 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes: NetworkNode[] = graphData.nodes.map((n) => ({ ...n }));
    const links: NetworkLink[] = graphData.links.map((l) => ({ ...l }));

    if (nodes.length === 0) return;

    const rootGroup = svg.append('g');

    // Zoom & pan support
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.45, 2.5])
      .on('zoom', (event) => {
        rootGroup.attr('transform', event.transform.toString());
      });
    svg.call(zoom);

    const simulation = d3
      .forceSimulation<NetworkNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<NetworkNode, NetworkLink>(links)
          .id((d) => d.id)
          .distance((l) => (l.linkKind === 'outlet-outlet' ? 145 : 120))
          .strength((l) => (l.linkKind === 'outlet-outlet' ? 0.25 : 0.7))
      )
      .force('charge', d3.forceManyBody().strength(-340))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<NetworkNode>().radius((d) => d.radius + 16)
      );

    // Draw edges
    const linkSelection = rootGroup
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => (d.linkKind === 'issue-outlet' ? '#9333ea' : '#10b981'))
      .attr('stroke-opacity', (d) => (d.linkKind === 'issue-outlet' ? 0.45 : 0.28))
      .attr('stroke-dasharray', (d) => (d.linkKind === 'outlet-outlet' ? '4,3' : null))
      .attr('stroke-width', (d) =>
        d.linkKind === 'issue-outlet' ? Math.max(1.5, d.weight / 28) : 1.2
      );

    // Edge percentage labels (only for primary issue-outlet links when readable)
    const linkLabels = rootGroup
      .append('g')
      .selectAll('text')
      .data(links.filter((l) => l.linkKind === 'issue-outlet'))
      .enter()
      .append('text')
      .text((d) => `${d.weight}%`)
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none');

    // Draw nodes
    const nodeGroup = rootGroup
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedNodeId(d.id);
      })
      .call(
        d3
          .drag<SVGGElement, NetworkNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    nodeGroup
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => (d.nodeType === 'issue' ? '#7c3aed' : '#2563eb'))
      .attr('fill-opacity', (d) => (d.nodeType === 'issue' ? 0.92 : 0.88))
      .attr('stroke', (d) => (d.nodeType === 'issue' ? '#ddd6fe' : '#bfdbfe'))
      .attr('stroke-width', 2.5);

    // Inner count badge for issue nodes
    nodeGroup
      .filter((d) => d.nodeType === 'issue')
      .append('text')
      .text((d) => `${d.outletCount || 0}사`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .style('pointer-events', 'none');

    // Node labels below circle
    nodeGroup
      .append('text')
      .text((d) => d.label)
      .attr('dy', (d) => d.radius + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', (d) => (d.nodeType === 'issue' ? '11.5px' : '10.5px'))
      .attr('font-weight', (d) => (d.nodeType === 'issue' ? '800' : '700'))
      .attr('class', 'fill-slate-800 dark:fill-slate-100')
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (d) => (d.source as NetworkNode).x ?? 0)
        .attr('y1', (d) => (d.source as NetworkNode).y ?? 0)
        .attr('x2', (d) => (d.target as NetworkNode).x ?? 0)
        .attr('y2', (d) => (d.target as NetworkNode).y ?? 0);

      linkLabels
        .attr(
          'x',
          (d) => (((d.source as NetworkNode).x ?? 0) + ((d.target as NetworkNode).x ?? 0)) / 2
        )
        .attr(
          'y',
          (d) => (((d.source as NetworkNode).y ?? 0) + ((d.target as NetworkNode).y ?? 0)) / 2 - 4
        );

      nodeGroup.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [isOpen, graphData, layoutVersion]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-slate-50 dark:from-purple-950/50 dark:via-indigo-950/30 dark:to-slate-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  공통 이슈 유사도 네트워크 맵
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  D3 Force Graph · 이슈 파급력
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                수집 기사 간 텍스트 유사도와 참여 언론사 연결 관계를 시각화합니다. 노드를 드래그하거나 클릭해 세부 논조를 확인하세요.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cluster Selector Bar */}
        <div className="px-5 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
            <button
              type="button"
              onClick={() => {
                setActiveClusterId('ALL');
                setSelectedNodeId(null);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition ${
                activeClusterId === 'ALL'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700'
              }`}
            >
              전체 어젠다 파급력 ({stories.length}개 군집)
            </button>
            {stories.slice(0, 6).map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveClusterId(s.id);
                  setSelectedNodeId(`issue:${s.id}`);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 max-w-[200px] truncate cursor-pointer transition ${
                  activeClusterId === s.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700'
                }`}
                title={s.title}
              >
                {idx + 1}. {s.title}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLayoutVersion((v) => v + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0"
            title="네트워크 레이아웃 재배치"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>배치 초기화</span>
          </button>
        </div>

        {/* Body: SVG Network + Right Inspector */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 min-h-[420px]">
          {/* Graph Canvas */}
          <div className="lg:col-span-2 relative bg-slate-50/70 dark:bg-slate-950/70 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800/70">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  이슈 군집 (크기 = 참여 매체 수)
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  보도 언론사
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <span className="w-4 border-t-2 border-emerald-500 border-dashed inline-block" />
                  매체 간 키워드 연결
                </span>
              </div>
              <span className="hidden sm:inline font-mono">드래그·휠 확대 가능</span>
            </div>

            {graphData.nodes.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-500">
                시각화할 공통 이슈 군집이 없습니다.
              </div>
            ) : (
              <svg
                ref={svgRef}
                viewBox="0 0 860 500"
                className="w-full h-[380px] sm:h-[460px] select-none touch-none"
                role="img"
                aria-label="공통 이슈 유사도 네트워크 그래프"
              />
            )}
          </div>

          {/* Side Detail Panel */}
          <div className="p-4 sm:p-5 space-y-4 bg-white dark:bg-slate-900 overflow-y-auto">
            {selectedNode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      selectedNode.nodeType === 'issue'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {selectedNode.nodeType === 'issue' ? (
                      <>
                        <Layers className="w-3 h-3" />
                        <span>공통 이슈 군집</span>
                      </>
                    ) : (
                      <>
                        <Newspaper className="w-3 h-3" />
                        <span>참여 언론사</span>
                      </>
                    )}
                  </span>
                  {selectedNode.similarityScore !== undefined && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      유사도 {selectedNode.similarityScore}%
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                  {selectedNode.headline || selectedNode.label}
                </h4>

                {selectedNode.stance && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    {selectedNode.stance}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>연결 노드 및 텍스트 유사도 ({selectedNodeConnections.length}건)</span>
                  </div>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {selectedNodeConnections.map((conn, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {conn.peerLabel}
                          </span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                            {conn.weight}%
                          </span>
                        </div>
                        {conn.sharedTokens.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {conn.sharedTokens.map((tok, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                #{tok}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedNode.storyRef && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenArticleModal(selectedNode.storyRef!);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>기사 교차 비교 원문 보기</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Info className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>파급력 네트워크 요약</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  왼쪽 그래프에서 보라색 이슈 허브 또는 파란색 언론사 노드를 클릭하면 연결된 매체 목록, 텍스트 유사도 점수, 공통 핵심 단어를 확인할 수 있습니다.
                </p>
                <div className="space-y-2 pt-1">
                  {targetStories.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedNodeId(`issue:${s.id}`)}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-slate-200/80 dark:border-slate-700/70 transition cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-purple-700 dark:text-purple-300">
                          {s.coveredOutlets?.length || 0}개 매체
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          텍스트 유사도 {s.similarityScore || 0}%
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                        {s.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
